// src/components/ContentSelection/ContentSelection.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/global.css';
import './ContentSelection.css';

const ContentSelection = ({ username }) => {
  const { t, i18n } = useTranslation(); // use i18n to access the current language
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch courses from the backend
    axios.get('/api/courses', { params: { username } })
      .then(response => {
        console.log("Response", response.data)
        const coursesWithTranslatedContent = response.data.map(course => {
          // Translate course title and description based on the user's language preference
          const translatedTitle = course.title && course.title[i18n.language]
            ? course.title[i18n.language]
            : course.title['en'];
          const translatedDescription = course.description && course.description[i18n.language]
            ? course.description[i18n.language]
            : course.description['en'];
          const translatedNotes = course.notes && course.notes[i18n.language]
              ? course.notes[i18n.language]
              : course.notes['en'];
          return { ...course, title: translatedTitle, description: translatedDescription, notes: translatedNotes };
        });
        console.log("coursesWithTranslatedContent", coursesWithTranslatedContent)
        setCourses(coursesWithTranslatedContent);
        setFilteredCourses(coursesWithTranslatedContent);
      })
      .catch(error => console.error('Error fetching courses:', error));
  }, [username, i18n.language]); // Trigger re-fetching when language changes

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleSelectCourse = (course) => {
    navigate('/video-player', { state: { course } });
  };

  return (
    <div className="content-selection">
      <h2>{t('select_course')}</h2>
      <input
        type="text"
        placeholder={t('search_courses') + '...'}
        value={searchTerm}
        onChange={handleSearch}
      />
      <br/>
      <br/>
      <div className="course-grid">
        {filteredCourses.map( (course, index) => (
          <div key={`course-${course.id || index}`} className="course-card" onClick={() => handleSelectCourse(course)}>
            <img src={course._doc.thumbnail} alt={course.title} className="course-thumbnail" />
            <h3>{course.title}</h3>
            <p><strong>{t('duration')}:</strong> {course._doc.duration}</p>
            <p><strong>{t('level')}:</strong> {course._doc.level}</p>
            <p><strong>{t('source')}:</strong> {course._doc.source}</p>
            <p><strong>{t('description')}:</strong> {course.description}</p>
            <div className="course-topics">
              {Array.isArray(course._doc.topics) && course._doc.topics.length > 0 ? (
                course._doc.topics.map( (topic, topicIndex) => (
                  <span key={`topic-${index}-${topicIndex}`} className="course-topic">{topic}</span>
                ))
              ) : (
                <span>No topics available</span>  // Optional: Handle the case where topics are missing or empty
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentSelection;
