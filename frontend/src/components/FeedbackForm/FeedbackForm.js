import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../../styles/global.css';
import './FeedbackForm.css';

const FeedbackForm = ({ videoId }) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/feedback', { videoId, feedback });
      console.log('Feedback submitted:', response);
      setSuccessMessage(t('feedback_submitted_successfully'));
      setErrorMessage('');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrorMessage(t('failed_to_submit_feedback'));
      setSuccessMessage('');
    }
  };

  return (
    <div className="feedback-form">
      <h2>{t('feedback')}</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t('your_feedback')}
          required
        />
        <button type="submit">{t('submit_feedback')}</button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default FeedbackForm;
