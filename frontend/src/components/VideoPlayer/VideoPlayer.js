import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import axios from 'axios';
import '../../styles/global.css';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {}; // Expect `state` to include course details'
  const [liveCaptions, setLiveCaptions] = useState([]);
  const [socket, setSocket] = useState(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioWorkletNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const isPlayingRef = useRef(false);


  useEffect(() => {
      // Initialize WebSocket connection
      const newSocket = io('http://34.57.196.213:5001');
      setSocket(newSocket);

      newSocket.on('caption', ({ text }) => {
        console.log('Caption received:', text);
        setLiveCaptions((prevCaptions) => [...prevCaptions, text]);
      });

      return () => {
        if (newSocket) newSocket.disconnect();
        stopAudioProcessing();
      };
    }, []);

    const stopAudioProcessing = async () => {
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current.port.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.disconnect();
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      console.log('Audio processing stopped.');
    };

    
    const handleVideoPlay = async () => {
      console.log('Video started playing');
      isPlayingRef.current = true;

      if (videoRef.current && socket) {
        try {
           // Initialize Web Audio API
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioContext;

	  const mediaStream = audioContext.createMediaElementSource(videoRef.current);
          mediaStreamRef.current = mediaStream;
          mediaStream.connect(audioContext.destination);

 	  if (!audioContext.audioWorklet) {
  		console.error('AudioWorklet is not supported. Using fallback.');

  		const processor = audioContext.createScriptProcessor(4096, 1, 1);
  		mediaStream.connect(processor);
  		processor.connect(audioContext.destination);

  		processor.onaudioprocess = (event) => {
    			const audioData = event.inputBuffer.getChannelData(0);
    			socket.emit('audioStream', {
      				audioBuffer: Array.from(audioData),
      				language: course._doc?.language || i18n.language,
    			});
  		};
  		return;
	  }


	  //if (!audioContext.audioWorklet) {
          //     throw new Error('AudioWorklet is not supported in this browser.');
          //}
	  //audioContextRef.current = audioContext;

          // Create MediaElementSource from video
          //const mediaStream = audioContext.createMediaElementSource(videoRef.current);
          //mediaStreamRef.current = mediaStream;

          // Load and register the audio worklet processor
          await audioContext.audioWorklet.addModule('/worklet-processor.js');
          const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
          audioWorkletNodeRef.current = audioWorkletNode;

          // Connect media stream to worklet and destination
          mediaStream.connect(audioWorkletNode);
          //mediaStream.connect(audioContext.destination); // Ensure audio is played
          console.log('Audio Worklet connected successfully');

          // Handle messages from the worklet
          audioWorkletNode.port.onmessage = (event) => {
            const audioData = event.data;
            if (isPlayingRef.current) {
              socket.emit('audioStream', {
                audioBuffer: Array.from(audioData), // Convert to array
                language: course._doc?.language || i18n.language,
              });
            }
          };
        } catch (error) {
          console.error('Error setting up AudioWorklet:', error);
        }
      }
    };

    const handleVideoPause = () => {
      console.log('Video paused');
      isPlayingRef.current = false;
    };

    const handleVideoEnded = () => {
      console.log('Video ended');
      isPlayingRef.current = false;
      stopAudioProcessing(); // Stop processing when video ends
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
