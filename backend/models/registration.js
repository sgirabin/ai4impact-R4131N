const mongoose = require('mongoose');

// Define the Registration schema
const registrationSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  language: String,
  preferences: {
    selectedTopics: Object,  // Store selected topics (e.g., Computer Science: ['AI', 'Python Programming'])
    difficultyLevelsPerTopic: Object // Store difficulty levels per topic
  }
});  // Explicitly set the collection name to 'registration'

// Register the Registration model with Mongoose
const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;  // Export the model
