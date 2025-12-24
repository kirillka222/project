// stellarum_ai_frontend/src/components/MainLayout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import ChatArea from '../ChatArea/ChatArea';
import './MainLayout.css';

const MainLayout = ({ user, onLogout }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);

  // Загружаем тему из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
  };

  // Загрузка чатов при монтировании
  useEffect(() => {
    if (user && user.tokens) {
      console.log('MainLayout: User authenticated', user.username);
    }
  }, [user]);

  return (
    <div className={`main-layout ${isDarkTheme ? 'dark-theme' : ''}`}>
      <Sidebar 
        isDarkTheme={isDarkTheme}
        onThemeToggle={handleThemeToggle}
        onChatSelect={handleChatSelect}
        currentChatId={currentChat?.id}
        onLogout={onLogout}
        user={user}
      />
      <ChatArea 
        isDarkTheme={isDarkTheme}
        currentChat={currentChat}
        user={user}
      />
    </div>
  );
};

export default MainLayout;