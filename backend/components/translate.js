const { Translate } = require('@google-cloud/translate').v2;
const axios = require('axios'); // Import axios
const translate = new Translate(); // Use the Google Cloud Translate API

async function fetchTextContent(url) {
  try {
    const response = await axios.get(url);
    return response.data; // Return the raw text content
  } catch (error) {
    console.error(`Error fetching text content from URL (${url}):`, error.message);
    return ''; // Return empty string if fetching fails
  }
}

async function translateCourseContent(course, targetLanguage) {
  if (course.language === targetLanguage) {
    return course; // No translation needed if already in the user's preferred language
  }

  try {
    console.log(`Translating course: ${course.title} to ${targetLanguage}`);
    console.log('Course to be translated', course);

    const descriptionUrl = course.description?.en || course.description || '';
    const descriptionContent = descriptionUrl ? await fetchTextContent(descriptionUrl) : '';

    const notesUrl = course.content?.text?.url || '';
    const notesContent = notesUrl ? await fetchTextContent(notesUrl || '') : '';

    const translatedTitle = course.title
      ? await translate.translate(course.title, targetLanguage)
      : course.title;

    const translatedDescription = descriptionContent
      ? await translate.translate(descriptionContent, targetLanguage)
      : descriptionContent;
    const translatedNotes = notesContent
      ? await translate.translate(notesContent, targetLanguage)
      : notesContent

    return {
      ...course,
      title: {
        en: course.title, // Original English title
        [targetLanguage]: translatedTitle[0] // Translated title
      },
      description: {
        en: course.description, // Original English description
        [targetLanguage]: translatedDescription[0] // Translated description
      },
      notes: {
        en: notesContent, // Original English Notes
        [targetLanguage]: translatedNotes[0]
      }
    };
  } catch (error) {
    console.error('Error translating course:', error.message);
    return course; // Return the original course if translation fails
  }
}

module.exports = { translateCourseContent };
