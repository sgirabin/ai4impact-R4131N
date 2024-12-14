const Course = require('../models/course');
const Registration = require('../models/registration');
const { translateCourseContent } = require('./translate');  // Importing the translation function
//const { generateCaptions } = require('./captions');

async function getCourses(req, res) {
  const { username } = req.query;
  const user = await Registration.findOne({ username });

  if (!user) {
    return res.status(404).send('User not found');
  }

  const { selectedTopics, difficultyLevelsPerTopic } = user.preferences;
  const selectedSubTopics = Object.values(selectedTopics).flat();
  const userLanguage = user.language || 'en';  // Default to 'en' if no language preference

  // Initialize query to filter by selected sub-topics
  let coursesQuery = {};
  if (selectedSubTopics.length > 0) {
    coursesQuery.topics = { $in: selectedSubTopics };  // Filter courses by selected sub-topics
  }

  try {
    // Fetch courses based on the query
    let courses = await Course.find(coursesQuery);

    // Apply difficulty filter if applicable
    if (Object.keys(difficultyLevelsPerTopic).length > 0) {
      courses = courses.filter(course => {
        return course.topics.some(topic => {
          return selectedSubTopics.includes(topic) && course.topics.some(subTopic => {
            const difficultyKey = `${topic}_${subTopic}`;
            const userDifficulty = difficultyLevelsPerTopic[difficultyKey];
            return userDifficulty ? course.level === userDifficulty : true;
          });
        });
      });
    }

    // Translate courses if necessary
    const translatedCourses = await Promise.all(
      courses.map(course => translateCourseContent(course, userLanguage))
    );

    console.log('translatedCourses', translatedCourses);

    res.json(translatedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).send('Error fetching courses');
  }
}

module.exports = { getCourses };
