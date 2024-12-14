import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../../styles/global.css';
import './LoginForm.css';

const LoginForm = ({ onLogin, onShowRegister }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { username, password };
    try {
      // Send login data to the backend
      const response = await axios.post('/api/login', userData);
      if (response.data.success) {
        onLogin(response.data.user);
      } else {
        alert(t('invalid_username_or_password'));
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert(t('login_failed'));
    }
  };

  return (
    <div className="login-form">
      <h2>{t('login')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('username')}</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">{t('login')}</button>
      </form>
      <p>{t('dont_have_account')} <a href="#" onClick={onShowRegister}>{t('register_here')}</a></p>
      <p><a href="#" onClick={() => window.location.href = '/'}>{t('back_to_homepage')}</a></p>
    </div>
  );
};

export default LoginForm;
