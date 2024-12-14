const { Storage } = require('@google-cloud/storage');
const { SpeechClient } = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;
const { TranscoderServiceClient } = require('@google-cloud/video-transcoder');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const storage = new Storage();
const speechClient = new SpeechClient();
const translate = new Translate();
const transcoderClient = new TranscoderServiceClient();

// Load supported languages from JSON file
function getSupportedLanguages() {
  const configPath = path.join(__dirname, '../configs/supported-languages.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.supportedLanguages || [];
  } else {
    console.error('Supported languages file not found.');
    return [];
  }
}

exports.processVideoUpload = async (event, context) => {
  const bucketName = event.bucket;
  const fileName = event.name;

  console.log(`Processing file: gs://${bucketName}/${fileName}`);

  try {
    // Fetch supported languages
    const languages = getSupportedLanguages();

    if (languages.length === 0) {
      console.error('No supported languages found. Aborting...');
      return;
    }

    console.log(`Supported languages: ${languages.join(', ')}`);

    // 1. Extract audio and transcribe it
    const audioContent = await extractAudio(bucketName, fileName);
    const transcription = await transcribeAudio(audioContent);

    // 2. Translate the transcription to target languages
    const translations = await Promise.all(
      languages.map((lang) => translate.translate(transcription, lang))
    );

    // 3. Generate subtitles
    const subtitleFiles = await generateSubtitles(translations, bucketName, fileName);

    // 4. Add subtitles to the video
    const outputVideoPath = await addSubtitlesToVideo(bucketName, fileName, subtitleFiles);

    console.log(`Processed video with subtitles stored at: ${outputVideoPath}`);
  } catch (error) {
    console.error('Error processing video:', error);
  }
};

async function extractAudio(bucketName, fileName) {
  const storage = new Storage();
  const tempVideoPath = path.join('/tmp', fileName);
  const tempAudioPath = path.join('/tmp', `${fileName}.wav`);

  // Download the video to a temporary location
  await storage.bucket(bucketName).file(fileName).download({ destination: tempVideoPath });

  // Extract audio using FFmpeg
  await new Promise((resolve, reject) => {
    exec(`ffmpeg -i ${tempVideoPath} -q:a 0 -map a ${tempAudioPath}`, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });

  // Read the audio content into memory
  const audioContent = fs.readFileSync(tempAudioPath).toString('base64');

  // Clean up temporary files
  fs.unlinkSync(tempVideoPath);
  fs.unlinkSync(tempAudioPath);

  return audioContent;
}

async function transcribeAudio(audioContent) {
  const [response] = await speechClient.recognize({
    config: { languageCode: 'en-US', enableAutomaticPunctuation: true },
    audio: { content: audioContent },
  });
  return response.results.map((result) => result.alternatives[0].transcript).join(' ');
}

async function generateSubtitles(translations, bucketName, fileName) {
  const storage = new Storage();
  const subtitleFiles = [];

  for (const [index, [language, translation]] of translations.entries()) {
    const subtitleFileName = `${fileName}-${language}.srt`;
    const subtitleFilePath = path.join('/tmp', subtitleFileName);

    // Generate SRT content
    const srtContent = `1
00:00:00,000 --> 00:00:10,000
${translation}`;

    // Save to a local temporary file
    fs.writeFileSync(subtitleFilePath, srtContent);

    // Upload to Cloud Storage
    await storage.bucket(bucketName).upload(subtitleFilePath, {
      destination: `subtitles/${subtitleFileName}`,
    });

    subtitleFiles.push(`gs://${bucketName}/subtitles/${subtitleFileName}`);
    fs.unlinkSync(subtitleFilePath); // Clean up temp file
  }

  return subtitleFiles;
}

async function addSubtitlesToVideo(bucketName, fileName, subtitleFiles) {
  const inputUri = `gs://${bucketName}/${fileName}`;
  const outputUri = `gs://${bucketName}/output/${fileName}`;
  const job = await transcoderClient.createJob({
    parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1`,
    job: {
      inputUri,
      outputUri,
      config: {
        elementaryStreams: [
          { key: 'video-stream0', videoStream: { codec: 'h264' } },
          { key: 'audio-stream0', audioStream: { codec: 'aac' } },
        ],
        muxStreams: [
          {
            key: 'sd',
            container: 'mp4',
            elementaryStreams: ['video-stream0', 'audio-stream0'],
          },
        ],
      },
    },
  });
  return outputUri;
}
