import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RegistrationForm from '../RegistrationForm/RegistrationForm';
import LoginForm from '../LoginForm/LoginForm';
import '../../styles/global.css';
import './Homepage.css';

const Homepage = ({ onRegister, onLogin }) => {
  const { t } = useTranslation();
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleShowRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  return (
    <div className="homepage">
      {!showRegister && !showLogin && (
        <div className="buttons">
          <button onClick={handleShowRegister}>{t('register')}</button>
          <button onClick={handleShowLogin}>{t('login')}</button>
        </div>
      )}
      {showRegister && <RegistrationForm onRegister={onRegister} onShowLogin={handleShowLogin} />}
      {showLogin && <LoginForm onLogin={onLogin} onShowRegister={handleShowRegister} />}
    </div>
  );
};

export default Homepage;
