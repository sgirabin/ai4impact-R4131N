const mongoose = require('mongoose');
const Course = require('../models/course');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/grow-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Helper function to generate thumbnail from URL (just a placeholder)
const getThumbnail = (url) => {
  if (url.includes('youtube.com')) {
    return `https://img.youtube.com/vi/${url.split('=')[1]}/0.jpg`;
  }
  return 'https://www.csr.gov.in/content/dam/csr/images/vediothumbnail.png'; // Placeholder for other sources
};

// Define the courses with only freely accessible content
const courses = [
    {
        id: '1',
        title: 'How AI Works',
        source: 'Code.org',
        type: ['video', 'text'],  // Array to specify multiple types of content
        content: {               // New property to group content types
            video: {
                url: 'https://storage.googleapis.com/vivo-learning-vidoes/1_1.mp4',
                duration: '15 minutes' // Specific to video
            },
            text: {
                url: 'https://storage.googleapis.com/vivo-learning-text/1_1.txt',  // Text content URL
            }
        },
        topics: ['Computer Science', 'Artificial Intelligence'],
        description: 'https://storage.googleapis.com/vivo-learning-description/1.txt',
        thumbnail: 'https://storage.googleapis.com/vivo-learning-thumbnails/1_1.jpg',
        duration: '15 minutes',
        level: 'Beginner',
        language: 'en',
        accessible: true
    }
];

async function populateCourses() {
  try {
    await Course.deleteMany({});
    await Course.insertMany(courses);  // Only inserting freely accessible courses
    console.log('Courses populated successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error populating courses:', error);
  }
}

populateCourses();
