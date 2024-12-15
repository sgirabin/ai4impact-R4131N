import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../../styles/global.css';
import './RegistrationForm.css';

const topics = {
  'Computer Science': ['Artificial Intelligence', 'Python Programming', 'Java Programming', 'Data Science'],
};

const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];

const RegistrationForm = ({ onRegister, onShowLogin }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('');
  const [selectedTopics, setSelectedTopics] = useState({});
  const [difficultyLevelsPerTopic, setDifficultyLevelsPerTopic] = useState({});

  // This effect ensures difficulty levels are set for all topics when the component is loaded
  useEffect(() => {
    const defaultDifficultyLevels = {};
    // Initialize difficultyLevelsPerTopic with default values for the selected topics
    Object.keys(selectedTopics).forEach(topic => {
      selectedTopics[topic].forEach(subTopic => {
        defaultDifficultyLevels[`${topic}_${subTopic}`] = 'Beginner';  // Default difficulty level
      });
    });
    setDifficultyLevelsPerTopic(defaultDifficultyLevels);
  }, [selectedTopics]);  // Run this effect when selectedTopics change

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('passwords_do_not_match'));
      return;
    }

    const userData = {
      name,
      email,
      username,
      password,
      language,
      preferences: { selectedTopics, difficultyLevelsPerTopic }
    };

    // Send data to backend
    await axios.post('/api/register', userData);
    onRegister(userData);
  };

  const handleTopicChange = (topic) => {
    const newSelectedTopics = { ...selectedTopics };
    if (!newSelectedTopics[topic]) {
      newSelectedTopics[topic] = topics[topic];
    } else {
      newSelectedTopics[topic] = [];
    }
    setSelectedTopics(newSelectedTopics);
  };

  const handleSubTopicChange = (topic, subTopic) => {
    const newSelectedTopics = { ...selectedTopics };
    if (!newSelectedTopics[topic]) {
      newSelectedTopics[topic] = [];
    }

    if (newSelectedTopics[topic].includes(subTopic)) {
      newSelectedTopics[topic] = newSelectedTopics[topic].filter(item => item !== subTopic);
    } else {
      newSelectedTopics[topic].push(subTopic);
    }

    if (newSelectedTopics[topic].length === topics[topic].length) {
      newSelectedTopics[topic] = topics[topic];
    }

    setSelectedTopics(newSelectedTopics);
  };

  const handleDifficultyChange = (topic, subTopic, level) => {
    const newDifficultyLevels = { ...difficultyLevelsPerTopic };
    newDifficultyLevels[`${topic}_${subTopic}`] = level;
    setDifficultyLevelsPerTopic(newDifficultyLevels);
  };

  return (
    <div className="registration-form">
      <h2>{t('register')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('username')}</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('confirm_password')}</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('preferred_language')}</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} required>
            <option value="">{t('select_language')}</option>
            <option value="id">Indonesian</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('interest_topics')}</label>
          <div className="topics-container">
            {Object.keys(topics).map((topic) => (
              <div key={topic} className="topic-section">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedTopics[topic] && selectedTopics[topic].length === topics[topic].length}
                    onChange={() => handleTopicChange(topic)}
                  />
                  <strong>{topic}</strong>
                </label>
                {topics[topic].map((subTopic) => (
                  <div key={subTopic} className="subtopic">
                    <input
                      type="checkbox"
                      checked={selectedTopics[topic] && selectedTopics[topic].includes(subTopic)}
                      onChange={() => handleSubTopicChange(topic, subTopic)}
                    />
                    <label>{subTopic}</label>
                    <select
                      value={difficultyLevelsPerTopic[`${topic}_${subTopic}`] || 'Beginner'}
                      onChange={(e) => handleDifficultyChange(topic, subTopic, e.target.value)}
                    >
                      {difficultyLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <button type="submit">{t('register')}</button>
      </form>
      <p>{t('already_have_account')} <a href="#" onClick={onShowLogin}>{t('login_here')}</a></p>
      <p><a href="#" onClick={() => window.location.href = '/'}>{t('back_to_homepage')}</a></p>
    </div>
  );
};

export default RegistrationForm;
