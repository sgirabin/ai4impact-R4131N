import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import '../../styles/global.css';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {}; // Expect `state` to include course details'
  const [liveCaptions, setLiveCaptions] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // State to track if audio is playing
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
    console.log('processing the audio', course._doc.id)
    const audioFileUri = `https://storage.googleapis.com/vivo-learning-vidoes/${course._doc.id}_${course._doc.id}.mp4`; // Use course.id for video path
    console.log(audioFileUri)
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


  if (!course) {
    return <div>{t('course_data_not_available')}</div>;
  }

  return (
    <div className="video-player">
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

      {/* Process audio button (optional for manual trigger) */}
      <div className="process-audio">
        <button onClick={handleProcessAudio} disabled={isAudioPlaying}>
          {isAudioPlaying ? t('processing_audio') : t('process_audio')}
        </button>
      </div>

        {/* Course description */}
        <div className="course-description">
            <h3>{t('description')}</h3>
            <p>{course.description || t('not_available')}</p>
              {/* Course details */}
              <div className="course-details">
                <p><strong>{t('duration')}:</strong> {course._doc?.content?.video?.duration || t('not_available')}</p>
                <p><strong>{t('level')}:</strong> {course._doc?.level}</p>
                <p><strong>{t('source')}:</strong> {course._doc?.source}</p>
                <p className="course-topics"><strong>{t('topic')}:</strong>
                  {course._doc?.topics.map((topic) => (
                    <span key={topic} className="course-topic">{topic}</span>
                  ))}
                </p>
              </div>
        </div>

      {/* Notes section */}
      <div className="course-notes">
        <h3>{t('notes')}</h3>
        <div className="notes-content">
            {course.notes.split('\n').map((line, index) => (
              <p key={index} style={{ marginBottom: '8px' }}>
                {line}
              </p>
            ))}
        </div>
      </div>

    </div>
  );
};

export default VideoPlayer;
