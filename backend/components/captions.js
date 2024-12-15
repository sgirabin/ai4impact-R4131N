const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { Translate } = require('@google-cloud/translate').v2;
const { Storage } = require('@google-cloud/storage');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const speechClient = new SpeechClient();
const ttsClient = new TextToSpeechClient();
const translateClient = new Translate();
const storage = new Storage();

// Bucket and folder configuration
const BUCKET_NAME = 'vivo-learning-vidoes';
const AUDIO_FOLDER = 'audio/';

io.on('connection', (socket) => {
  console.log('Client connected for live captioning and dubbing');

  socket.on('processAudioFile', async ({ courseId, targetLanguage }) => {
    try {
      const videoFileUri = `https://storage.googleapis.com/${BUCKET_NAME}/${courseId}_${courseId}.mp4`; // Video file in GCS
      const audioFileName = `${AUDIO_FOLDER}${courseId}_audio.wav`; // Audio file in the audio folder
      const audioFileUri = `gs://${BUCKET_NAME}/${audioFileName}`;

      console.log('Processing audio for video:', videoFileUri, 'Target language:', targetLanguage);

      // Step 1: Extract audio locally
      const localAudioPath = path.join('/tmp', `${courseId}_audio.wav`); // Temporary local file
      await extractAudio(videoFileUri, localAudioPath);

      // Step 2: Upload the extracted audio to GCS
      await uploadAudioToGCS(localAudioPath, audioFileName);

      console.log('Audio file uploaded to GCS:', audioFileUri);

      // Step 3: Transcribe audio to text
      const transcription = await transcribeAudio(audioFileUri);
      console.log('Transcription:', transcription);

      // Step 4: Translate text to target language
      const [translatedText] = await translateClient.translate(transcription, targetLanguage);
      console.log('Translated Text:', translatedText);

      // Step 5: Generate synthesized audio in target language
      const dubbedAudio = await synthesizeSpeech(translatedText, targetLanguage);
      console.log('Dubbed audio generated');

      // Step 6: Send caption and audio back to client
      socket.emit('captionAndAudio', {
        caption: translatedText,
        audioContent: dubbedAudio.toString('base64'),
      });

      // Cleanup local files
      fs.unlinkSync(localAudioPath);
      console.log('Temporary local audio file deleted');
    } catch (error) {
      console.error('Error processing audio:', error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper: Extract audio using FFmpeg
// Helper: Extract audio using FFmpeg and ensure mono channel
async function extractAudio(inputUri, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputUri)
      .output(outputPath)
      .audioCodec('pcm_s16le') // Use PCM encoding
      .audioFrequency(16000)   // Set sample rate to 16,000 Hz
      .audioChannels(1)        // Convert to single channel (mono)
      .on('end', () => {
        console.log('Audio extraction and mono conversion completed.');
        resolve();
      })
      .on('error', (error) => {
        console.error('Error extracting audio:', error.message);
        reject(error);
      })
      .run();
  });
}


// Helper: Upload audio to GCS
async function uploadAudioToGCS(localPath, gcsPath) {
  await storage.bucket(BUCKET_NAME).upload(localPath, {
    destination: gcsPath,
  });
  console.log(`Audio uploaded to GCS: gs://${BUCKET_NAME}/${gcsPath}`);
}

// Helper: Transcribe audio using Google Cloud Speech-to-Text
// Helper: Transcribe audio using Google Cloud Speech-to-Text (Long Running)
async function transcribeAudio(gcsUri) {
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    audio: {
      uri: gcsUri, // GCS URI of the audio file
    },
  };

  console.log('Starting longRunningRecognize for:', gcsUri);

  // Start longRunningRecognize
  const [operation] = await speechClient.longRunningRecognize(request);

  console.log('Waiting for operation to complete...');

  // Wait for operation to complete
  const [response] = await operation.promise();

  console.log('Long running operation completed.');

  return response.results
    .map((result) => result.alternatives[0].transcript)
    .join(' ');
}


// Helper: Synthesize speech using Google Cloud Text-to-Speech
async function synthesizeSpeech(text, language) {
  const request = {
    input: { text },
    voice: { languageCode: language, ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

const CAPTION_PORT = process.env.CAPTION_PORT || 5001;
server.listen(CAPTION_PORT, () => {
  console.log(`Captioning and Dubbing Server running on port ${CAPTION_PORT}`);
});

module.exports = server;
