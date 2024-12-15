const express = require('express');
const { Storage } = require('@google-cloud/storage');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Translate } = require('@google-cloud/translate').v2;
const dotenv = require('dotenv');
const cosineSimilarity = require('compute-cosine-similarity');

// Load environment variables
dotenv.config();

// Initialize Express Router
const router = express.Router();

// Google Cloud setup
const storage = new Storage();
const translateClient = new Translate();
const geminiApiKey = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(geminiApiKey);

// Gemini configuration
const geminiConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 1,
  maxOutputTokens: 1024,
};

// Vertex AI model setup
const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-pro',
  geminiConfig,
});

// Endpoint to handle chat queries
router.post('/', async (req, res) => {
  const { courseId, query, targetLanguage } = req.body;

  try {
    // Step 1: Fetch lecture notes from GCS
    const notes = await fetchNotesFromGCS(courseId);
    console.log(notes)

    // Step 2: Translate lecture notes (if necessary)
    const translatedNotes = await translateNotes(notes, targetLanguage);
    console.log(translatedNotes)

    // Step 3: Generate embeddings for lecture notes (optional step)
    const noteEmbeddings = await generateEmbeddings(translatedNotes);

    // Step 4: Pass user query and translated notes to Gemini model
    const geminiResponse = await queryGeminiModel(query, translatedNotes);
    console(query, translatedNotes)

    // Step 5: Send Gemini's response back to the client
    res.status(200).json({ response: geminiResponse });
  } catch (error) {
    console.error('Error during chat processing:', error.message);
    res.status(500).json({ error: 'Failed to process chat query.' });
  }
});

// Helper: Fetch lecture notes from GCS
async function fetchNotesFromGCS(courseId) {
  const bucketName = 'vivo-learning-text';
  const fileName = `${courseId}_${courseId}.txt`;
  const file = storage.bucket(bucketName).file(fileName);

  try {
    const [data] = await file.download();
    return data.toString().split('\n'); // Split notes into paragraphs
  } catch (error) {
    console.error('Error fetching notes from GCS:', error.message);
    throw new Error('Failed to fetch notes.');
  }
}

// Helper: Translate notes into the target language
async function translateNotes(notes, targetLanguage) {
  return Promise.all(
    notes.map(async (note) => {
      if (targetLanguage === 'en') return note; // Skip translation for English
      const [translatedText] = await translateClient.translate(note, targetLanguage);
      return translatedText;
    })
  );
}

// Helper: Query the Gemini model
async function queryGeminiModel(query, context) {
  try {
    // Construct the prompt with context (lecture notes)
    const prompt = `You are an AI assistant that provides responses based on the following lecture notes:\n\n${context.join(
      '\n'
    )}\n\nQuestion: ${query}\nAnswer:`;

    // Call Gemini model
    console.log(prompt);
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error querying Gemini model:', error.message);
    throw new Error('Failed to generate response using Gemini.');
  }
}

// Helper: Generate embeddings (Optional, based on use case)
async function generateEmbeddings(texts) {
  // Example: Use a local embedding method if necessary
  return texts.map((text) => ({
    text,
    embedding: Array(512).fill(0), // Placeholder embeddings
  }));
}

module.exports = router;
