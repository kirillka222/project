import React, { useState } from 'react';
import './Sidebar.css';
import logo from '../assets/logo.png';
import settings from '../assets/settings.png';
import profile from '../assets/profile.png';
import Settings from '../Settings/Settings';

const Sidebar = ({ isDarkTheme, onThemeToggle }) => {
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "Новый чат",
      preview: "Начните разговор...",
      time: "Точнее что",
      active: true
    },
    {
      id: 2,
      title: "Код для проектного практикума",
      preview: "Четкий подп.",
      time: "1 час назад",
      active: false
    },
    {
      id: 3,
      title: "Советы по дизайну",
      preview: "Обязательное посмотрение",
      time: "Попытка",
      active: false
    }
  ]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "Новый чат",
      preview: "Начните разговор...",
      time: "Только что",
      active: true
    };
    
    setChats(prevChats => 
      prevChats.map(chat => ({ ...chat, active: false }))
        .concat(newChat)
    );
  };

  const selectChat = (chatId) => {
    setChats(prevChats => 
      prevChats.map(chat => ({
        ...chat,
        active: chat.id === chatId
      }))
    );
  };

  return (
    <div className={`sidebar ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="sidebar-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
          <h1>STELLARUM AI</h1>
        </div>
        <div className="header-right">
          <img 
            src={settings} 
            alt="Settings" 
            className="header-icon" 
            onClick={() => setIsSettingsOpen(true)}
          />
          <img src={profile} alt="Profile" className="header-icon" />
        </div>
      </div>

      <div className="sidebar-content">
        <button className="new-chat-btn" onClick={handleNewChat}>
          <span>+</span> Новый чат
        </button>
        
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Поиск..."
          />
        </div>
        
        <div className="chat-history">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${chat.active ? 'active' : ''}`}
              onClick={() => selectChat(chat.id)}
            >
              <div className="chat-icon"></div>
              <div className="chat-info">
                <div className="chat-title">{chat.title}</div>
                <div className="chat-preview">{chat.preview}</div>
              </div>
              <div className="chat-time">{chat.time}</div>
            </div>
          ))}
        </div>
      </div>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isDarkTheme={isDarkTheme}
        onThemeToggle={onThemeToggle}
      />
    </div>
  );
};

export default Sidebar;