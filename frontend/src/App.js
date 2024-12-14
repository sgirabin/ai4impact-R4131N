// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Homepage from './components/Homepage/Homepage';
import ContentSelection from './components/ContentSelection/ContentSelection';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import './styles/global.css';
import './App.css';

const App = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);

  // Language options (English and the user's language preference)
  const languageOptions = ['en', user?.language].filter(Boolean);

  useEffect(() => {
    // Force language change for testing
    if (user && user.language) {
        i18n.changeLanguage(user.language);
    }
  }, [i18n, user?.language]);

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);  // Change language dynamically
  };

  return (
    <Router>
      <div>
        <header>
          <h1>{t('welcome')}</h1>
          <div>
              <div className="language-selector">
                <select onChange={handleLanguageChange} value={i18n.language} aria-label={t('select_language')}>
                  {languageOptions.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? 'English' : lang === 'id' ? 'Indonesian' : 'Hindi'}
                    </option>
                  ))}
                </select>
              </div>
              {user && (
                <div className="user-info">
                  <span>Welcome {user.username}</span>
                  <a href="#" onClick={handleLogout}>{t('logout')}</a>
                </div>
              )}
          </div>
        </header>
        <Routes>
          <Route path="/" element={!user ? <Homepage onRegister={handleRegister} onLogin={handleLogin} /> : <Navigate to="/courses" />} />
          <Route path="/courses" element={user ? <ContentSelection username={user.username} /> : <Navigate to="/" />} />
          <Route path="/video-player" element={user ? <VideoPlayer /> : <Navigate to="/" />} />
        </Routes>
        <footer>
          <p>Copyright ©2024 by Team R4131N. AI for Impact Hackathon</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
