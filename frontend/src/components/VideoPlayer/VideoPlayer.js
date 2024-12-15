import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import FeedbackForm from '../FeedbackForm/FeedbackForm'; // Import FeedbackForm
import '../../styles/global.css';
import './VideoPlayer.css';
import axios from 'axios';

const VideoPlayer = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {}; // Expect `state` to include course details'
  const [liveCaptions, setLiveCaptions] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // State to track if audio is playing
  const [activeTab, setActiveTab] = useState('description'); // For course description/feedback tabs
  const [rightTab, setRightTab] = useState('chat'); // For course notes/chatbox tabs
  const [chatInput, setChatInput] = useState(''); // User input in chatbox
  const [chatHistory, setChatHistory] = useState([]); // Chat messages
  const [isLoading, setIsLoading] = useState(false); // Loading state for chat API
  const videoRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5001'); // Update with your backend WebSocket server
    setSocket(newSocket);

    newSocket.on('captionAndAudio', ({ caption, audioContent }) => {
      console.log('Caption received:', caption);
      setLiveCaptions((prevCaptions) => [...prevCaptions, caption]);

      // Play the synthesized audio
      if (audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.play();
        setIsAudioPlaying(true);

        audio.onended = () => {
          setIsAudioPlaying(false);
        };
      }
    });

    newSocket.on('error', ({ message }) => {
      console.error('Error received:', message);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const handleProcessAudio = () => {
    if (socket && course) {
      console.log('Processing the audio', course._doc.id);
      const audioFileUri = `https://storage.googleapis.com/vivo-learning-vidoes/${course._doc.id}_${course._doc.id}.mp4`; // Use course.id for video path
      console.log(audioFileUri);
      const targetLanguage = i18n.language;

      socket.emit('processAudioFile', { courseId: course._doc.id, targetLanguage });
    }
  };

  const handleVideoPlay = () => {
    console.log('Video started playing');
    videoRef.current.muted = true; // Mute original audio
    handleProcessAudio();
  };

  const handleVideoPause = () => {
    console.log('Video paused');
    setIsAudioPlaying(false); // Stop playing synthesized audio
  };

  const handleVideoEnded = () => {
    console.log('Video ended');
    setIsAudioPlaying(false); // Stop playing synthesized audio
  };

  // Handle user chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return; // Skip empty messages

    // Add user message to chat history
    setChatHistory((prev) => [...prev, { author: 'user', content: chatInput }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        courseId: course._doc.id,
        query: chatInput,
        targetLanguage: i18n.language,
      });

      // Extract the AI response from the backend response
      const aiResponse = response.data.response || t('no_response_from_ai');
      setChatHistory((prev) => [...prev, { author: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory((prev) => [
        ...prev,
        { author: 'ai', content: t('error_chat_message') || 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setChatInput('');
    }
  };


  if (!course) {
    return <div>{t('course_data_not_available')}</div>;
  }

  return (
    <div className="video-player-container">
      <div className="left-column">
        <h3>{t('course_module')}</h3>
        {/* Placeholder for Course Modules */}
        <p>{t('no_module_available')}</p>
      </div>

      <div className="middle-column">
        <nav className="breadcrumb">
          <a href="#" onClick={() => navigate('/courses')}>
            {t('back_to_course_selection')}
          </a>
        </nav>
        <h2>{course.title}</h2>

        {/* Video container */}
        <div className="video-container">
          <video
            ref={videoRef}
            width="100%"
            height="480"
            controls
            src={course._doc?.content?.video?.url || ''}
            crossOrigin="anonymous"
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnded}
          >
            {t('your_browser_does_not_support_video')}
          </video>
        </div>

        {/* Live captions */}
        <div className="live-captions">
          <h3>{t('live_caption')}</h3>
          <div className="live-caption-box">
            {liveCaptions.map((caption, index) => (
              <p key={index}>{caption}</p>
            ))}
          </div>
        </div>

        {/* Tabs for Course Description, Notes and Feedback */}
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
                <p key={index} style={{ marginBottom: '8px' }}>
                  {line}
                </p>
              ))}
            </div>
            )}
          {activeTab === 'feedback' && (
            <div className="course-feedback">
              <FeedbackForm videoId={course._doc.id} />
            </div>
          )}
        </div>
      </div>

      <div className="right-column">
        {/* Tabs for  Chatbox */}
        <div className="tabs">
          <button
            className={rightTab === 'chat' ? 'active-tab' : ''}
            onClick={() => setRightTab('chat')}
          >
            {t('chat')}
          </button>
        </div>
        <div className="tab-content">
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
