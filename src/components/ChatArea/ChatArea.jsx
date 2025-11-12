import React, { useState } from 'react';
import ActionButtons from '../ActionButtons/ActionButtons';
import './ChatArea.css';
import logo from '../assets/logo.png';

const ChatArea = ({ isDarkTheme }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Отправка сообщения:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleActionSelect = (action) => {
    setMessage(`Помогите с: ${action}`);
  };

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
            placeholder="Введите запрос..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="send-button"
            onClick={handleSendMessage}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;