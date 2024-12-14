const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS middleware

const { register, login } = require('./components/auth');
const { getCourses } = require('./components/courses');
const { translateCourseContent } = require('./components/translate');
const { uploadToGcs } = require('./components/gcs');
const { getVideoId } = require('./components/utils');

const app = express();
app.use(bodyParser.json());

// Apply CORS middleware globally
app.use(cors({
  origin: '*', // Allow requests from your frontend
  methods: ['GET', 'POST'], // Specify allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/grow-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Routes
app.post('/api/register', register);
app.post('/api/login', login);
app.get('/api/courses', getCourses);
app.post('/api/translate-interface', translateCourseContent);


// Export app and server for backend index
module.exports = app;
