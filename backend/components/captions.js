const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const speechClient = new SpeechClient();
const translateClient = new Translate();

io.on('connection', (socket) => {
  console.log('Client connected for live captioning');

  socket.on('audioStream', async ({ audioBuffer, language }) => {
    try {
      console.log('Audio buffer received:', {
        length: audioBuffer.length,
        sample: audioBuffer.slice(0, 10), // Log the first few samples
        language,
      });

      // Convert the audioBuffer from floating-point to LINEAR16 format
      const int16Buffer = Int16Array.from(audioBuffer.map((n) => n * 32767));
      const audioBytes = Buffer.from(int16Buffer.buffer);

      console.log('Converted audio buffer length:', audioBytes.length);

      // Initialize streaming request
      const request = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
        },
        interimResults: true, // Provide interim transcription results
      };

      // Stream the audio to Google Speech-to-Text
      const recognizeStream = speechClient
        .streamingRecognize(request)
        .on('data', async (data) => {

          console.log('Speech-to-Text data received:', data)
          console.log('Speech-to-Text results:', data.results);

          if (!data.results || data.results.length === 0) {
            console.warn('No transcription results received.');
            return;
          }

          const transcription = data.results
            .map((result) => result.alternatives[0].transcript)
            .join(' ');

          console.log('Transcription:', transcription);

          if (transcription) {
            // Translate transcription to the user's language
            const [translatedText] = await translateClient.translate(transcription, language);

            console.log('Translated Text:', translatedText);

            // Emit caption back to frontend
            socket.emit('caption', { text: translatedText });
            console.log('Caption emitted:', translatedText);
          }
        })
        .on('error', (error) => {
          console.error('Error in streaming transcription:', error.message);
        })
        .on('end', () => {
          console.log('Streaming transcription ended.');
        });

      // Write audio bytes to the recognize stream
      recognizeStream.write(audioBytes);
      console.log('Audio data written to recognize stream.');
    } catch (error) {
      console.error('Error processing audio stream:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const CAPTION_PORT = process.env.CAPTION_PORT || 5001;
server.listen(CAPTION_PORT, () => {
  console.log(`Live Captioning Server is running on port ${CAPTION_PORT}`);
});

module.exports = server;
