import React, { useState, useEffect, useRef } from 'react';
import ActionButtons from '../ActionButtons/ActionButtons';
import './ChatArea.css';
import logo from '../assets/logo.png';

const ChatArea = ({ isDarkTheme, currentChat }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentChat) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  const loadChatHistory = async () => {
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChat) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:8000/api/chat/${currentChat.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          parent_id: null
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки сообщения');
      }

      const messageData = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: messageData.answer,
        timestamp: messageData.changed_at
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
      setError(err.message);
      
      // Показываем сообщение об ошибке
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionSelect = (action) => {
    setMessage(`Помогите с: ${action}`);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentChat) {
    return (
      <div className={`chat-area ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="welcome-section">
          <img src={logo} alt="Stellarum AI" className="center-logo" />
          
          <h1 className="welcome-title">Начните новый разговор</h1>
          <p className="welcome-subtitle">
            Задайте вопрос или выберите один из предложенных вариантов ниже
          </p>
          
          <ActionButtons onActionSelect={handleActionSelect} isDarkTheme={isDarkTheme} />
          
          <div className="input-container">
            <input 
              type="text" 
              className="message-input" 
              placeholder="Выберите чат для начала разговора..."
              disabled
            />
            <button className="send-button" disabled>
              ➤
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-area ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="chat-header">
        <h2 className="chat-title">{currentChat.title}</h2>
        <div className="chat-info">
          Создан: {new Date(currentChat.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <img src={logo} alt="Stellarum AI" className="empty-chat-logo" />
            <h3>Начните разговор с AI</h3>
            <p>Задайте вопрос или выберите действие из списка ниже</p>
            <ActionButtons onActionSelect={handleActionSelect} isDarkTheme={isDarkTheme} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'user' ? '👤' : msg.type === 'error' ? '⚠️' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-container">
        <input 
          type="text" 
          className="message-input" 
          placeholder="Введите запрос..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button 
          className={`send-button ${isLoading ? 'loading' : ''}`}
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
};

export default ChatArea;