const mongoose = require('mongoose');

// Define a schema and model for courses
const courseSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  description: String,
  source: String,
  type: [String],  // Update to allow an array of strings
  content: {
    video: {
      url: String,
      duration: String,
    },
    text: {
      url: String,
    },
  },
  duration: String,
  level: String,
  topics: [String],
  language: { type: String, required: true },
  thumbnail: String,
  accessible: Boolean,
});

courseSchema.index({ topics: 1 });
courseSchema.index({ level: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
