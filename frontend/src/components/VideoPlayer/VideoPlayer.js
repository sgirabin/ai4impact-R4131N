import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedbackForm from '../FeedbackForm/FeedbackForm';
import '../../styles/global.css';
import './VideoPlayer.css';
import axios from 'axios';

const VideoPlayer = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {};
  const [currentCaption, setCurrentCaption] = useState('');
  const [dubbedAudioUrl, setDubbedAudioUrl] = useState('');
  const [captionsList, setCaptionsList] = useState([]);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [rightTab, setRightTab] = useState('caption');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (course) {
      if (i18n.language === 'en') {
        setCaptionsList(course.originalCaptions?.split('\n') || []);
        setDubbedAudioUrl('');
      } else {
        fetchCaptionsAndAudio(course._doc.id, i18n.language);
      }
    }
  }, [course, i18n.language]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause(); // Stop audio playback
        audioRef.current.currentTime = 0; // Reset audio time
        audioRef.current = null; // Clear audio reference
      }
    };
  }, []);

  const fetchCaptionsAndAudio = async (courseId, language) => {
    try {
      const bucketUrl = 'https://storage.googleapis.com/vivo-learning-vidoes';
      const captionUrl = `${bucketUrl}/caption/${courseId}_${language}.txt`;
      const audioUrl = `${bucketUrl}/audio/${courseId}_${language}.mp3`;

      const response = await axios.get(captionUrl);
      setCaptionsList(response.data.split('\n'));
      setDubbedAudioUrl(audioUrl);
    } catch (error) {
      console.error('Error fetching captions or audio:', error.message);
      setCaptionsList([t('caption_not_available')]);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) videoRef.current.muted = true;
    playDubbedAudio();
    setCurrentCaptionIndex(0);
  };

  const playDubbedAudio = () => {
    if (dubbedAudioUrl) {
      const audio = new Audio(dubbedAudioUrl);
      audioRef.current = audio;

      audio.play();
      setIsAudioPlaying(true);

      audio.onended = () => setIsAudioPlaying(false);
    }
  };

  useEffect(() => {
    let timer;
    if (captionsList.length > 0 && currentCaptionIndex < captionsList.length) {
      timer = setTimeout(() => {
        setCurrentCaption(captionsList[currentCaptionIndex]);
        setCurrentCaptionIndex((prev) => prev + 1);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [currentCaptionIndex, captionsList]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatHistory((prev) => [...prev, { author: 'user', content: chatInput }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        courseId: course._doc.id,
        query: chatInput,
        targetLanguage: i18n.language,
      });

      const aiResponse = response.data.response || t('no_response_from_ai');
      setChatHistory((prev) => [...prev, { author: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory((prev) => [
        ...prev,
        { author: 'ai', content: t('error_chat_message') || 'Something went wrong.' },
      ]);
    } finally {
      setIsLoading(false);
      setChatInput('');
    }
  };

  return (
    <div className="video-player-container">
      <div className="left-column">
        <h3>{t('course_module')}</h3>
        <p>{t('no_module_available')}</p>
      </div>

      <div className="middle-column">
        <nav className="breadcrumb">
          <a href="#" onClick={() => navigate('/courses')}>
            {t('back_to_course_selection')}
          </a>
        </nav>
        <h2>{course.title}</h2>

        <div className="video-container">
          <video
            ref={videoRef}
            width="100%"
            height="480"
            controls
            src={course._doc?.content?.video?.url || ''}
            crossOrigin="anonymous"
            onPlay={handleVideoPlay}
          >
            {t('your_browser_does_not_support_video')}
          </video>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'description' ? 'active-tab' : ''}
            onClick={() => setActiveTab('description')}
          >
            {t('description')}
          </button>
          <button
            className={activeTab === 'notes' ? 'active-tab' : ''}
            onClick={() => setActiveTab('notes')}
          >
            {t('notes')}
          </button>
          <button
            className={activeTab === 'feedback' ? 'active-tab' : ''}
            onClick={() => setActiveTab('feedback')}
          >
            {t('feedback')}
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="course-description">
              <p>{course.description || t('not_available')}</p>
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="course-notes">
              {course.notes.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
          {activeTab === 'feedback' && <FeedbackForm videoId={course._doc.id} />}
        </div>
      </div>

      <div className="right-column">
        <div className="tabs">
          <button
            className={rightTab === 'caption' ? 'active-tab' : ''}
            onClick={() => setRightTab('caption')}
          >
            {t('live_caption')}
          </button>
          <button
            className={rightTab === 'chat' ? 'active-tab' : ''}
            onClick={() => setRightTab('chat')}
          >
            {t('chat')}
          </button>
        </div>
        <div className="tab-content">
          {rightTab === 'caption' && (
            <div className="live-captions">
              <h3>{t('live_caption')}</h3>
              <div className="live-caption-box">
                <p>{currentCaption}</p>
              </div>
            </div>
          )}
          {rightTab === 'chat' && (
            <div className="chat-box">
              <div className="chat-messages">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.author === 'user' ? 'user' : 'ai'}`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('type_your_message')}
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                  {isLoading ? t('sending') : t('send')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
