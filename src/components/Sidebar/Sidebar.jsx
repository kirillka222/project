import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import logo from '../assets/logo.png';
import settings from '../assets/settings.png';
import profile from '../assets/profile.png';
import Settings from '../Settings/Settings';

const Sidebar = ({ isDarkTheme, onThemeToggle, onChatSelect, currentChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Загрузка чатов при монтировании компонента
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch('/api/chats/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Попытка обновить токен
          await refreshToken();
          return loadChats(); // Повторяем запрос после обновления токена
        }
        throw new Error('Ошибка загрузки чатов');
      }

      const chatsData = await response.json();
      setChats(chatsData);
      
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('Refresh token не найден');
      }

      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления токена');
      }

      const tokenData = await response.json();
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      
    } catch (err) {
      console.error('Ошибка обновления токена:', err);
      // Перенаправление на страницу входа
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.reload();
    }
  };

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/chats/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Новый чат"
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания чата');
      }

      const newChat = await response.json();
      
      // Обновляем список чатов
      setChats(prevChats => [newChat, ...prevChats]);
      
      // Выбираем новый чат
      if (onChatSelect) {
        onChatSelect(newChat);
      }

    } catch (err) {
      console.error('Ошибка создания чата:', err);
      setError(err.message);
    }
  };

  const selectChat = (chat) => {
    if (onChatSelect) {
      onChatSelect(chat);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
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
        <button className="new-chat-btn" onClick={handleNewChat} disabled={loading}>
          <span>+</span> {loading ? 'Создание...' : 'Новый чат'}
        </button>
        
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadChats} className="retry-btn">Повторить</button>
          </div>
        )}

        <div className="chat-history">
          {loading ? (
            <div className="loading-chats">
              <div className="loading-spinner"></div>
              <span>Загрузка чатов...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="no-chats">
              {searchTerm ? 'Чаты не найдены' : 'Нет созданных чатов'}
            </div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id} 
                className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => selectChat(chat)}
              >
                <div className="chat-icon">💬</div>
                <div className="chat-info">
                  <div className="chat-title">{chat.title}</div>
                  <div className="chat-preview">Начните разговор...</div>
                </div>
                <div className="chat-time">{formatDate(chat.created_at)}</div>
              </div>
            ))
          )}
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