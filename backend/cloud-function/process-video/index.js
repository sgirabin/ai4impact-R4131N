const { Storage } = require('@google-cloud/storage');
const { SpeechClient } = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;

const storage = new Storage();
const speechClient = new SpeechClient();
const translateClient = new Translate();
const ttsClient = new TextToSpeechClient();

const bucketName = 'vivo-learning-vidoes';
const captionFolder = 'caption';
const audioFolder = 'audio';

// Entry point for the Cloud Function
exports.processVideoUpload = async (event, context) => {
  const file = event.data || event;
  const filePath = file.name;

  console.log(`Raw Event: ${JSON.stringify(event)}`);
  console.log(`File Name: ${file.name}`);
  console.log(`Processing file path: ${filePath}`);

  if (!filePath || !filePath.endsWith('.mp4')) {
    console.log('Not a valid video file or missing file path. Skipping...');
    return;
  }

  const courseId = filePath.split('/').pop().split('_')[0];
  const localVideoPath = `/tmp/${courseId}_video.mp4`;
  const localAudioPath = `/tmp/${courseId}_audio.wav`;
  const gcsAudioPath = `gs://${bucketName}/${audioFolder}/${courseId}_audio.wav`;

  try {
    // Step 1: Download video from GCS to a local path
    console.log(`Downloading video file from GCS: ${filePath}`);
    await storage.bucket(bucketName).file(filePath).download({ destination: localVideoPath });
    console.log(`Video file downloaded to: ${localVideoPath}`);

    // Step 2: Extract audio from the local video file
    console.log(`Extracting audio from video: ${localVideoPath}`);
    await extractAudio(localVideoPath, localAudioPath);
    console.log(`Audio extracted to: ${localAudioPath}`);

    // Step 3: Upload the extracted audio to GCS
    await storage.bucket(bucketName).upload(localAudioPath, { destination: `${audioFolder}/${courseId}_audio.wav` });
    console.log(`Audio uploaded to GCS: ${gcsAudioPath}`);

    // Step 4: Generate captions and audio for each supported language
    const supportedLanguages = ['en', 'id', 'hi'];
    for (const language of supportedLanguages) {
      console.log(`Processing language: ${language}`);

      // Transcribe audio to text
      const transcription = await transcribeAudio(gcsAudioPath);
      console.log(`Transcription: ${transcription}`);

      // Translate transcription to the target language
      const [translatedText] = await translateClient.translate(transcription, language);
      console.log(`Translated Text (${language}): ${translatedText}`);

      // Save captions to GCS
      const captionPath = `${captionFolder}/${courseId}_${language}.txt`;
      await storage.bucket(bucketName).file(captionPath).save(translatedText);
      console.log(`Caption saved to: ${captionPath}`);

      // Generate dubbed audio for the target language (excluding English)
      if (language !== 'en') {
        const dubbedAudio = await synthesizeSpeech(translatedText, language);
        const audioPath = `${audioFolder}/${courseId}_${language}.mp3`;
        await storage.bucket(bucketName).file(audioPath).save(dubbedAudio);
        console.log(`Dubbed audio saved to: ${audioPath}`);
      }
    }
  } catch (error) {
    console.error('Error processing video:', error.message);
    throw new Error(error.message);
  } finally {
    // Cleanup local files
    await cleanupLocalFiles([localVideoPath, localAudioPath]);
  }
};

// Helper: Extract audio using FFmpeg
async function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .audioChannels(1) // Convert audio to mono
      .audioCodec('pcm_s16le') // PCM 16-bit encoding
      .audioFrequency(16000) // Ensure compatibility with Google Speech-to-Text
      .on('end', resolve)
      .on('error', (err) => {
        console.error('Error during audio extraction:', err.message);
        reject(err);
      })
      .run();
  });
}

// Helper: Transcribe audio using Google Cloud Speech-to-Text (Long Running)
async function transcribeAudio(gcsUri) {
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    audio: {
      uri: gcsUri, // Correct GCS URI of the audio file
    },
  };

  console.log('Starting longRunningRecognize for:', gcsUri);

  const [operation] = await speechClient.longRunningRecognize(request);
  console.log('Waiting for operation to complete...');
  const [response] = await operation.promise();
  console.log('Transcription operation completed.');

  return response.results.map((result) => result.alternatives[0].transcript).join(' ');
}

// Helper: Synthesize speech to audio
async function synthesizeSpeech(text, language) {
  const request = {
    input: { text },
    voice: { languageCode: language, ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

// Helper: Cleanup local files
async function cleanupLocalFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      console.log(`Deleted local file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting local file (${filePath}):`, error.message);
    }
  }
}
