const mongoose = require('mongoose');
const Course = require('../models/course');  // Adjust the path if necessary

mongoose.connect('mongodb://localhost:27017/grow-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    // Fetch all courses
    const courses = await Course.find();

    // Loop through each course and set description to the title
    for (let course of courses) {
      course.description = course.title;  // Set description equal to title
      await course.save();  // Save the updated course
      console.log(`Updated description for course: ${course.id}`);
    }

    console.log('All courses have been updated with descriptions!');
    mongoose.connection.close();  // Close the connection
  })
  .catch((error) => {
    console.error('Error updating courses:', error);
    mongoose.connection.close();
  });
