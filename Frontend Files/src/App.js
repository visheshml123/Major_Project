import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import {
  Send, Moon, Sun, Plus, Image, Mic, FileText, Settings, X,
  Home, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Download, Volume2, VolumeX, Camera, File, Paperclip
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';


// Enhanced Image Modal Component
const ImageModal = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    console.log(`Downloading image ID: ${image.id}`);
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `textora_ai_image_${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Generated Image Viewer">
      <div className="image-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Image Viewer" tabIndex={0}>
          <X size={24} />
        </button>
        <img src={image.url} alt="Full view of the generated artwork" className="modal-image" />
        <button className="modal-download-btn" onClick={handleDownload} aria-label="Download Image" tabIndex={0}>
          <Download size={20} /> Download
        </button>
      </div>
    </div>
  );
};

const App = () => {
  // Logo paths helper - White logo for light theme, Black logo for dark theme
  const getLogoPath = (isDark) => {
    const basePath = process.env.PUBLIC_URL || '';
    // Use URL-encoded paths to handle spaces properly
    // WHITE logo for LIGHT theme, BLACK logo for DARK theme
    const logoName = isDark ? 'Textora%20AI%20Black.png' : 'Textora%20AI%20white.png';
    return `${basePath}/Images/${logoName}`;
  };

  const [theme, setTheme] = useState('dark');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const [particleConfigs] = useState(() =>
    Array.from({ length: 19 }, (_, index) => ({
      id: index,
      // Avoid top-left corner (0-20% left, 0-20% top)
      left: `${20 + Math.random() * 80}%`,
      delay: `${Math.random() * 20}s`,
      duration: `${15 + Math.random() * 10}s`
    }))
  );
  const [activeTab, setActiveTab] = useState('media');
  const messagesEndRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supportsVoiceInput, setSupportsVoiceInput] = useState(false);
  const [supportsVoiceOutput, setSupportsVoiceOutput] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messageFileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSpokenMessageId = useRef(null);
  const utteranceRef = useRef(null);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Voice Input Mode: ON');
    } catch (error) {
      console.error('Unable to start speech recognition:', error);
      setIsListening(false);
      setIsVoiceInput(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    console.log('Voice Input Mode: OFF');
  }, [isListening]);

  const toggleVoiceInput = () => {
    if (!supportsVoiceInput) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }
    setIsVoiceInput(prev => {
      const nextValue = !prev;
      if (nextValue) {
        startListening();
      } else {
        stopListening();
      }
      return nextValue;
    });
  };

  const speakText = useCallback((text) => {
    if (!supportsVoiceOutput || isMuted || !text) {
      console.log('Speech skipped:', { supportsVoiceOutput, isMuted, hasText: !!text });
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.9;
      
      utterance.onstart = () => {
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      console.log('Speaking:', text.substring(0, 50) + '...');
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  }, [supportsVoiceOutput, isMuted]);

  // Cursor effect with requestAnimationFrame
  useEffect(() => {
    let animationFrameId = null;
    let currentMousePos = { x: 0, y: 0 };

    const handleMouseMove = (e) => {
      currentMousePos = { x: e.clientX, y: e.clientY };
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateCursor);
      }
    };

    const updateCursor = () => {
      setMousePosition(currentMousePos);
      animationFrameId = null;
    };

    const handleClick = (e) => {
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Splash screen animation - SHOWS EVERY TIME ON REFRESH
  useEffect(() => {
    // Show splash for 6.5 seconds on every page load
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6500);

    return () => clearTimeout(splashTimer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join(' ');
        setInputValue(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        setIsVoiceInput(false);
      };

      recognition.onend = () => {
        stopListening();
        setIsVoiceInput(false);
      };

      recognitionRef.current = recognition;
      setSupportsVoiceInput(true);
    }

    if ('speechSynthesis' in window) {
      setSupportsVoiceOutput(true);
      console.log('Speech synthesis is supported');
    }

    return () => {
      recognitionRef.current?.stop();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  useEffect(() => {
    if (!supportsVoiceOutput || isMuted) {
      console.log('Voice output disabled:', { supportsVoiceOutput, isMuted });
      return;
    }

    const lastAiMessage = [...messages]
      .reverse()
      .find(message => message.sender === 'ai' && message.text && !message.isError);

    if (lastAiMessage && lastAiMessage.id !== lastSpokenMessageId.current) {
      console.log('Speaking new AI message:', lastAiMessage.id);
      speakText(lastAiMessage.text);
      lastSpokenMessageId.current = lastAiMessage.id;
    }
  }, [messages, supportsVoiceOutput, speakText, isMuted]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    const hasAttachments = pendingUploads.length > 0;
    const uploadsToSend = [...pendingUploads];

    if (!trimmedInput && !hasAttachments) return;

    setPendingUploads([]);

    if (hasAttachments) {
      uploadsToSend.forEach(upload => {
        const tempId = Date.now() + Math.random();
        const uploadingMessage = {
          id: tempId,
          sender: 'user',
          type: 'file_upload',
          timestamp: new Date().toLocaleTimeString(),
          fileName: upload.name,
          fileSize: upload.size,
          fileType: upload.type,
          previewUrl: upload.previewUrl,
          uploadStatus: 'completed',
          uploadedUrl: upload.previewUrl,
          isPdf: upload.isPdf
        };
        setMessages(prev => [...prev, uploadingMessage]);
      });
    }

    if (trimmedInput) {
      const userMessage = {
        id: Date.now(),
        text: trimmedInput,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      try {
        const formData = new FormData();
        formData.append('prompt', trimmedInput);

        if (uploadsToSend.length > 0) {
          const imageUploads = uploadsToSend.filter(upload => upload.type.startsWith('image/'));

          if (imageUploads.length > 0) {
            formData.append('image', imageUploads[0].file);
            console.log('Attached image file:', imageUploads[0].name);
          }
        }

        console.log('Sending request to backend with prompt:', trimmedInput.substring(0, 100));

        const response = await fetch('http://localhost:5000/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server response error:', response.status, errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received response from backend:', data);

        const aiMessage = {
          id: Date.now() + 1,
          text: data.response || data.message || "I received your message.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error.message || 'Unknown error occurred';
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${errorMessage}. Please ensure the backend server is running on http://localhost:5000`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        }]);
      } finally {
        setIsTyping(false);
      }
    } else if (hasAttachments) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I've received your file(s). Please add a message to tell me what you'd like me to do with them.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const startChat = (initialInput = '') => {
    setShowLanding(false);

    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Hi there, I am Textora AI. How can I help you today?",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    if (initialInput) {
      setInputValue(initialInput);
      setTimeout(async () => {
        const userMessage = {
          id: Date.now(),
          text: initialInput,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
          const formData = new FormData();
          formData.append('prompt', initialInput);

          const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response error:', response.status, errorData);
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          const data = await response.json();
          console.log('Received response from backend:', data);

          const aiMessage = {
            id: Date.now() + 1,
            text: data.response || data.message || "I received your message.",
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString()
          };

          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error('Error sending message:', error);
          const errorMessage = error.message || 'Unknown error occurred';
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: `Sorry, I encountered an error: ${errorMessage}. Please ensure the backend server is running on http://localhost:5000`,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString(),
            isError: true
          }]);
        } finally {
          setIsTyping(false);
        }
      }, 100);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('Speech cancelled due to mute');
    }
    
    console.log(`Sound Toggled: ${newMutedState ? 'Muted' : 'Unmuted'}`);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    console.log(`Theme changed to: ${theme === 'dark' ? 'light' : 'dark'}`);
  };

  const archiveCurrentChat = () => {
    if (messages.length > 0) {
      let summaryMessage = '';
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].text) {
          summaryMessage = messages[i].text;
          break;
        }
      }
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          preview: summaryMessage.slice(0, 80),
          count: messages.length
        }
      ]);
    }
  };

  const handleNewChat = () => {
    archiveCurrentChat();
    setMessages([]);
    setShowLanding(true);
    setInputValue('');
    setPendingUploads([]);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    console.log('Started new chat');
  };

  const handleChatHistory = () => {
    setShowChatHistory(prev => !prev);
    setShowSettings(false);
    setShowProfile(false);
    console.log('Toggling chat history panel');
  };

  const handleSettings = () => {
    setShowSettings(prev => !prev);
    setShowChatHistory(false);
    setShowProfile(false);
    console.log('Toggling settings panel');
  };

  const handleProfile = () => {
    setShowProfile(prev => !prev);
    setShowChatHistory(false);
    setShowSettings(false);
    console.log('Toggling profile panel');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const findImageDetails = (imageId) => {
    const carouselMessage = messages.find(m => m.type === 'image_carousel');
    if (carouselMessage) {
      return carouselMessage.images.find(img => img.id === imageId);
    }
    return null;
  };

  const openImageModal = (imageId) => {
    const image = findImageDetails(imageId);
    if (image) {
      setShowImageModal(image);
      console.log(`Opening image modal for ID: ${imageId}`);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(null);
  };

  const handleLike = (messageId) => {
    console.log(`Liked message ID: ${messageId}`);
    alert('Thanks for the positive feedback!');
  };

  const handleDislike = (messageId) => {
    console.log(`Disliked message ID: ${messageId}`);
    alert('We appreciate your feedback and will improve!');
  };

  const handleDownloadAll = (images) => {
    console.log("Downloading all images!");
    images.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `textora_ai_image_${img.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openUploadedFile = (message) => {
    if (!message.uploadedUrl) return;
    window.open(message.uploadedUrl, '_blank');
  };

  const downloadUploadedFile = (message) => {
    if (!message.uploadedUrl) return;
    const link = document.createElement('a');
    link.href = message.uploadedUrl;
    link.download = message.fileName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMessageUploadClick = () => {
    messageFileInputRef.current?.click();
  };

  const handleLandingSend = () => {
    startChat();
    handleSend();
  };

  const removePendingUpload = (uploadId) => {
    setPendingUploads(prev => {
      const upload = prev.find(item => item.id === uploadId);
      if (upload?.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter(item => item.id !== uploadId);
    });
  };

  const handleMessageFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const uploads = files.map(file => {
      const fileObj = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isPdf: file.type === 'application/pdf',
        previewUrl: null
      };

      if (file.type.startsWith('image/')) {
        fileObj.previewUrl = URL.createObjectURL(file);
      }

      return fileObj;
    });

    setPendingUploads(prev => [...prev, ...uploads]);
    console.log(`Queued ${uploads.length} attachment(s) for upload`);

    if (messageFileInputRef.current) {
      messageFileInputRef.current.value = '';
    }
  };

  const quickActions = [
    {
      icon: <Camera size={20} />,
      label: 'Upload Images',
      subtext: 'Next-Gen answers',
      ariaLabel: 'Upload images',
      action: () => startChat('Upload an image.')
    },
    {
      icon: <Mic size={20} />,
      label: 'Generate Voice-Response',
      subtext: 'Smart Voice Bot',
      ariaLabel: 'Generate voice-response',
      action: () => startChat('Generate a voice-response.')
    },
    {
      icon: <FileText size={20} />,
      label: 'Interact with AI',
      subtext: 'Intelligent Assistant',
      ariaLabel: 'Start AI interaction',
      action: () => startChat('Summarize the top news headlines.')
    },
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: <Home size={16} /> },
    { id: 'text', label: 'Text', icon: <FileText size={16} /> },
    { id: 'media', label: 'Text + Image', icon: <Image size={16} /> },
  ];

  const sidebarNavItems = [
    { label: 'New Chat', icon: <Plus size={20} />, action: handleNewChat },
    { label: 'Chat History', icon: <FileText size={20} />, action: handleChatHistory },
    { label: 'Settings', icon: <Settings size={20} />, action: handleSettings },
    { label: 'Theme Toggle', icon: theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />, action: toggleTheme },
    { label: 'Profile', icon: <Image size={20} />, action: handleProfile },
  ];

  const renderPendingUploads = () => (
    pendingUploads.length > 0 && (
      <div className="pending-uploads-bar">
        {pendingUploads.map(upload => (
          <div key={upload.id} className="pending-upload-chip">
            {upload.previewUrl && !upload.isPdf ? (
              <img src={upload.previewUrl} alt={upload.name} />
            ) : (
              <div className="chip-icon">
                <File size={16} />
              </div>
            )}
            <div className="chip-info">
              <span className="chip-name">{upload.name}</span>
              <span className="chip-size">{formatFileSize(upload.size)}</span>
            </div>
            <button
              className="chip-remove"
              onClick={() => removePendingUpload(upload.id)}
              aria-label="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )
  );

  const totalFileMessages = messages.filter(msg => msg.type === 'file_upload').length;

  return (
    <div className={`app-container ${theme}`}>
      {/* Splash Screen - FIXED */}
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-logo-container">
            <div className="splash-logo-orb">
              <img
                src={getLogoPath(theme === 'dark')}
                alt="Textora AI Logo"
                className="splash-logo"
                onError={(e) => {
                  console.error('Logo failed to load, trying alternative path');
                  e.target.src = theme === 'dark'
                    ? '/Images/Textora AI Black.png'
                    : '/Images/Textora AI white.png';
                }}
              />
            </div>
            <h1 className="splash-title">Textora AI</h1>
            <div className="splash-loader">
              <div className="loader-bar"></div>
            </div>
          </div>
        </div>
      )}

      <ImageModal image={showImageModal} onClose={closeImageModal} />

      {/* Custom Cursor & Ripples */}
      <div
        className="liquid-cursor"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      />
      {ripples.map(ripple => (
        <div key={ripple.id} className="ripple-effect" style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }} />
      ))}

      {/* Floating Particles */}
      <div className="particles-container">
        {particleConfigs.map(config => (
          <div
            key={config.id}
            className="floating-particle"
            style={{
              left: config.left,
              animationDelay: config.delay,
              animationDuration: config.duration
            }}
          />
        ))}
      </div>

      <input
        type="file"
        ref={messageFileInputRef}
        onChange={handleMessageFileUpload}
        accept="image/*,.pdf"
        multiple
        style={{ display: 'none' }}
      />

      {/* Fixed LEFT Sidebar */}
      <div className={`fixed-sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
        {sidebarOpen && (
          <>
            <button className="sidebar-logo" aria-label="Home - Start New Chat" tabIndex={0} onClick={handleNewChat}>
              <Home size={24} />
            </button>
            <button className="sidebar-toggle" aria-label="Collapse sidebar" tabIndex={0} onClick={toggleSidebar}>
              <ChevronLeft size={20} />
            </button>
          </>
        )}
        {!sidebarOpen && (
          <button className="sidebar-toggle-open" aria-label="Expand sidebar" tabIndex={0} onClick={toggleSidebar}>
            <ChevronRight size={20} />
          </button>
        )}
        {sidebarOpen && (
          <>
            <div className="sidebar-nav-main">
              {sidebarNavItems.slice(0, 3).map((item, index) => (
                <button key={index} className="nav-item" onClick={item.action} aria-label={item.label} tabIndex={0}>
                  {item.icon}
                </button>
              ))}
            </div>
            <div className="sidebar-nav-bottom">
              {sidebarNavItems.slice(3).map((item, index) => (
                <button key={index} className="nav-item" onClick={item.action} aria-label={item.label} tabIndex={0}>
                  {item.icon}
                </button>
              ))}
              <button className="user-profile-icon" aria-label="User Profile" tabIndex={0} onClick={handleProfile}>
                <img src="https://i.ibb.co/L5hYw4t/male-avatar-profile-icon.png" alt="User Profile" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Landing Page */}
        {showLanding && (
          <div className="landing-page">
            <div className="landing-content">
              <div className="logo-animation">
                <div className="logo-orb">
                  <div className="orb-inner">
                    <img 
                      src={getLogoPath(theme === 'dark')} 
                      alt="Textora AI Logo" 
                      className="landing-logo-img"
                      onError={(e) => {
                        e.target.src = theme === 'dark' 
                          ? '/Images/Textora AI white.png' 
                          : '/Images/Textora AI Black.png';
                      }}
                    />
                  </div>
                </div>
              </div>
              <h1 className="landing-title">
                Hi there, I am Textora AI
                <span className="title-gradient">How can I help you today?</span>
              </h1>

              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action-card"
                    onClick={action.action}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    aria-label={action.ariaLabel}
                    tabIndex={0}
                  >
                    <div className="card-3d-frame"></div>
                    <div className="action-icon">{action.icon}</div>
                    <div className="action-text">
                      <h3>{action.label}</h3>
                      <p>{action.subtext}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="landing-tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      console.log(`Switched to ${tab.label} tab`);
                    }}
                    aria-label={`Select ${tab.label} mode`}
                    tabIndex={0}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="input-area-landing">
                <button
                  className="voice-text-toggle-button"
                  onClick={toggleVoiceInput}
                  aria-label={isVoiceInput ? 'Switch to text input' : 'Switch to voice input'}
                  disabled={!supportsVoiceInput}
                  tabIndex={0}
                >
                  {isVoiceInput ? <FileText size={20} /> : <Mic size={20} />}
                </button>
                <button
                  className="voice-text-toggle-button"
                  onClick={handleMessageUploadClick}
                  aria-label="Attach files"
                  tabIndex={0}
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder={isVoiceInput ? "Listening..." : "Ask me anything..."}
                  className={`landing-input ${isVoiceInput ? 'voice-active' : ''}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLandingSend()}
                  aria-label="Ask me anything input"
                  tabIndex={0}
                />
                <button className="landing-send" onClick={handleLandingSend} aria-label="Send message or start chat" tabIndex={0}>
                  <Send size={20} />
                </button>
              </div>
              {renderPendingUploads()}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {!showLanding && (
          <div className="chat-interface">
            {/* Header */}
            <div className="chat-header">
              <button className="back-button" onClick={handleNewChat} aria-label="Go back or start new chat" tabIndex={0}>
                <ChevronLeft size={20} />
                <span className="new-chat-label">New Chat</span>
              </button>
              <div className="header-center">
                <div className="chat-version-tag">Textora AI v3.2</div>
              </div>
              <button className="mute-toggle-button" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} tabIndex={0}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button className="close-button" onClick={handleNewChat} aria-label="Close chat window" tabIndex={0}>
                <X size={20} />
              </button>
            </div>

            {/* Floating Quick Action Button */}
            <button className="floating-quick-action" onClick={() => startChat("Hi")} aria-label="Say Hi">
              Hi
            </button>

            {/* Messages Area */}
            <div className="messages-area custom-scrollbar">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`message ${message.sender}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="message-avatar-wrapper">
                    {message.sender === 'ai' && (
                      <div className="message-avatar ai-avatar-small">
                        {/* Sparkle emoji shown via CSS */}
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="message-avatar user-avatar-small">
                        <img src="https://i.ibb.co/L5hYw4t/male-avatar-profile-icon.png" alt="User Avatar" />
                      </div>
                    )}
                  </div>

                  {message.type === 'image_carousel' ? (
                    <div className="image-carousel-container message-bubble ai">
                      <div className="image-stack" role="group" aria-label="Generated Images">
                        {message.images.map((img, i) => (
                          <button
                            key={img.id}
                            className="carousel-image-wrapper"
                            style={{ '--i': i }}
                            onClick={() => openImageModal(img.id)}
                            aria-label={`View image ${i + 1}`}
                            tabIndex={0}
                          >
                            <img src={img.url} alt={`Pulsar ${i + 1}`} className="carousel-image" />
                          </button>
                        ))}
                      </div>
                      <div className="image-carousel-actions">
                        <button className="action-button" onClick={() => handleLike(message.id)} aria-label="Like response">
                          <ThumbsUp size={16} />
                        </button>
                        <button className="action-button" onClick={() => handleDislike(message.id)} aria-label="Dislike response">
                          <ThumbsDown size={16} />
                        </button>
                        <button className="action-button download-button" onClick={() => handleDownloadAll(message.images)} aria-label="Download all images">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ) : message.type === 'file_upload' ? (
                    <div className={`message-bubble file-upload-bubble ${message.sender}`}>
                      <div className="file-upload-preview">
                        {message.previewUrl && !message.isPdf ? (
                          <img src={message.previewUrl} alt={message.fileName} />
                        ) : (
                          <div className="file-icon-wrapper">
                            <File size={32} />
                            <span>{message.isPdf ? 'PDF' : 'FILE'}</span>
                          </div>
                        )}
                      </div>
                      <div className="file-upload-details">
                        <span className="file-upload-name">{message.fileName}</span>
                        <span className="file-upload-size">{formatFileSize(message.fileSize)}</span>
                        <div className={`upload-status ${message.uploadStatus}`}>
                          {message.uploadStatus === 'uploading' && <span className="status-dot" />}
                          {message.uploadStatus === 'uploading' && 'Uploading...'}
                          {message.uploadStatus === 'completed' && 'Uploaded'}
                          {message.uploadStatus === 'failed' && 'Failed'}
                        </div>
                      </div>
                      <div className="file-upload-actions">
                        <button className="file-action-button" onClick={() => openUploadedFile(message)} disabled={!message.uploadedUrl}>
                          View
                        </button>
                        <button className="file-action-button" onClick={() => downloadUploadedFile(message)} disabled={!message.uploadedUrl}>
                          Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`message-bubble ${message.isError ? 'error-message' : ''}`} aria-live="polite">
                      <span className="sender-name">
                        {message.sender === 'ai' ? 'Textora AI' : 'You'}
                      </span>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {message.text || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message ai typing">
                  <div className="message-avatar-wrapper">
                    <div className="message-avatar ai-avatar-small">
                      {/* Sparkle emoji shown via CSS */}
                    </div>
                  </div>
                  <div className="typing-indicator" aria-label="AI is typing...">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              {renderPendingUploads()}
              <div className="input-container">
                <button className="attach-button" onClick={handleMessageUploadClick} aria-label="Send file" tabIndex={0}>
                  <Paperclip size={20} />
                </button>

                <button
                  className="voice-text-toggle-button"
                  onClick={toggleVoiceInput}
                  aria-label={isVoiceInput ? 'Switch to text input' : 'Switch to voice input'}
                  disabled={!supportsVoiceInput}
                  tabIndex={0}
                >
                  {isVoiceInput ? <FileText size={20} /> : <Mic size={20} />}
                </button>

                <input
                  type="text"
                  placeholder={isVoiceInput ? "Listening for voice input..." : "Ask me anything..."}
                  className={`message-input ${isVoiceInput ? 'voice-active' : ''}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  aria-label="Text message input"
                  tabIndex={0}
                />
                <button className="send-button" onClick={handleSend} aria-label="Send message" tabIndex={0}>
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat History Panel */}
      {showChatHistory && (
        <div className="side-panel chat-history-panel">
          <div className="panel-header">
            <h3>Chat History</h3>
            <button onClick={handleChatHistory} aria-label="Close chat history">
              <X size={20} />
            </button>
          </div>
          <div className="panel-content">
            {chatHistory.length === 0 ? (
              <p className="empty-state">No chat history yet. Start a conversation!</p>
            ) : (
              <div className="chat-history-list">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="chat-history-item">
                    <FileText size={16} />
                    <div className="chat-history-details">
                      <span className="chat-history-title">{chat.date} · {chat.time}</span>
                      <span className="chat-history-preview">
                        {chat.preview || 'Conversation'}
                      </span>
                    </div>
                    <span className="chat-date">{chat.count} msgs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="side-panel settings-panel">
          <div className="panel-header">
            <h3>Settings</h3>
            <button onClick={handleSettings} aria-label="Close settings">
              <X size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="settings-section">
              <label>Theme</label>
              <button className="settings-button" onClick={toggleTheme}>
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
            <div className="settings-section">
              <label>Sound</label>
              <button className="settings-button" onClick={toggleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            <div className="settings-section">
              <label>Voice Input</label>
              <button
                className="settings-button"
                onClick={toggleVoiceInput}
                disabled={!supportsVoiceInput}
              >
                {supportsVoiceInput ? (isVoiceInput ? 'Disable' : 'Enable') : 'Not supported'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Panel */}
      {showProfile && (
        <div className="side-panel profile-panel">
          <div className="panel-header">
            <h3>Profile</h3>
            <button onClick={handleProfile} aria-label="Close profile">
              <X size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="profile-section">
              <img
                src="https://i.ibb.co/L5hYw4t/male-avatar-profile-icon.png"
                alt="Profile"
                className="profile-avatar-large"
              />
              <h4>Sam</h4>
              <p className="profile-email">sam@textora.ai</p>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Messages</span>
                <span className="stat-value">{messages.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Files</span>
                <span className="stat-value">{totalFileMessages}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;