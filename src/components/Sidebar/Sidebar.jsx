import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';

const Sidebar = ({ isDarkTheme, onThemeToggle, onChatSelect, currentChatId, onLogout, user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Импорт картинок
  let logoImg, settingsImg, profileImg, reloadImg;
  
  try {
    logoImg = require('../assets/logo.png');
  } catch {
    logoImg = null;
  }
  
  try {
    settingsImg = require('../assets/settings.png');
  } catch {
    settingsImg = null;
  }
  
  try {
    profileImg = require('../assets/profile.png');
  } catch {
    profileImg = null;
  }
  
  try {
    reloadImg = require('../assets/reload1.png');
  } catch {
    reloadImg = null;
    console.warn('Картинка reload1.png не найдена в папке assets');
  }

  // Получение токена
  const getAuthToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('Токен не найден в localStorage');
      return null;
    }
    return token;
  };

  // Заголовки с авторизацией
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Проверка токена
  const checkTokenAndRedirect = () => {
    const token = getAuthToken();
    if (!token) {
      console.log('Токен не найден, требуется авторизация');
      return false;
    }
    return true;
  };

  // Загрузка чатов из API
  const loadChats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Проверяем токен
      if (!checkTokenAndRedirect()) {
        console.log('Пользователь не авторизован, показываем демо чаты');
        loadDemoChats();
        return;
      }

      console.log('Загружаем чаты с API...');
      
      // Эндпоинт из спецификации: /api/chat/ (GET)
      const endpoint = `${API_BASE_URL}/api/chat/`;
      console.log('Запрос к эндпоинту:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      console.log('Статус ответа:', response.status);

      if (response.status === 401) {
        console.log('Токен истек или недействителен');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setError('Сессия истекла. Пожалуйста, войдите заново.');
        loadDemoChats();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Получены чаты от API:', data);

      // Спецификация возвращает массив ChatResponse
      let chatList = [];
      
      if (Array.isArray(data)) {
        chatList = data;
      } else if (data.results && Array.isArray(data.results)) {
        chatList = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        chatList = data.data;
      } else if (data.chats && Array.isArray(data.chats)) {
        chatList = data.chats;
      }

      // Форматируем чаты для фронтенда
      const formattedChats = chatList.map(chat => ({
        id: chat.id,
        title: chat.title || `Чат ${chat.id}`,
        created_at: chat.created_at || new Date().toISOString(),
        preview: 'Начните разговор...',
        user_id: chat.user_id,
        is_active: chat.is_active !== false
      }));

      console.log('Форматированные чаты:', formattedChats.length);
      setChats(formattedChats);

      // Автовыбор первого чата если нет текущего
      if (formattedChats.length > 0 && !currentChatId && onChatSelect) {
        onChatSelect(formattedChats[0]);
      } else if (formattedChats.length === 0) {
        console.log('У пользователя нет чатов');
      }

    } catch (err) {
      console.error('❌ Ошибка загрузки чатов:', err);
      setError('Не удалось загрузить чаты. Проверьте подключение к серверу.');
      loadDemoChats();
    } finally {
      setLoading(false);
    }
  };

  // Загрузка демо чатов (fallback)
  const loadDemoChats = () => {
    const savedChats = localStorage.getItem('stellarum_demo_chats');
    let demoChats = [];
    
    if (savedChats) {
      try {
        demoChats = JSON.parse(savedChats);
        console.log('Загружены демо чаты из localStorage:', demoChats.length);
      } catch (err) {
        console.log('Ошибка загрузки демо чатов из localStorage');
      }
    }
    
    if (demoChats.length === 0) {
      demoChats = [
        {
          id: Date.now(),
          title: "Пример чата",
          created_at: new Date().toISOString(),
          preview: "Начните разговор с AI",
          messages: [],
          user_id: 'demo'
        },
        {
          id: Date.now() + 1,
          title: "Вопросы по программированию",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          preview: "Обсуждение кода и алгоритмов",
          messages: [],
          user_id: 'demo'
        }
      ];
      localStorage.setItem('stellarum_demo_chats', JSON.stringify(demoChats));
    }
    
    setChats(demoChats);
    
    if (!currentChatId && demoChats.length > 0 && onChatSelect) {
      onChatSelect(demoChats[0]);
    }
  };

  // Создание нового чата через API
  const handleNewChat = async () => {
    try {
      setError('');
      
      // Проверяем токен
      if (!checkTokenAndRedirect()) {
        console.log('Пользователь не авторизован, создаем демо чат');
        createDemoChat();
        return;
      }

      const newChatTitle = `Новый чат ${new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;

      console.log('Создаем новый чат через API...');
      
      // Эндпоинт из спецификации: /api/chat/ (POST)
      const endpoint = `${API_BASE_URL}/api/chat/`;
      console.log('POST запрос к:', endpoint);

      const requestBody = {
        title: newChatTitle
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('Статус создания:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setError('Сессия истекла. Пожалуйста, войдите заново.');
        createDemoChat();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`Ошибка создания чата: ${response.status}`);
      }

      const createdChat = await response.json();
      console.log('✅ Чат создан через API:', createdChat);

      // Форматируем созданный чат
      const formattedChat = {
        id: createdChat.id,
        title: createdChat.title || newChatTitle,
        created_at: createdChat.created_at || new Date().toISOString(),
        preview: 'Начните разговор...',
        user_id: createdChat.user_id,
        is_active: true
      };

      // Добавляем в начало списка
      const updatedChats = [formattedChat, ...chats];
      setChats(updatedChats);

      // Выбираем новый чат
      if (onChatSelect) {
        onChatSelect(formattedChat);
      }

    } catch (err) {
      console.error('❌ Ошибка создания чата:', err);
      setError('Не удалось создать чат. Создаем локально.');
      createDemoChat();
    }
  };

  // Создание демо чата (fallback)
  const createDemoChat = () => {
    const newChat = {
      id: Date.now(),
      title: `Новый чат ${chats.length + 1}`,
      created_at: new Date().toISOString(),
      preview: "Начните разговор...",
      messages: [],
      user_id: 'demo'
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    localStorage.setItem('stellarum_demo_chats', JSON.stringify(updatedChats));
    
    if (onChatSelect) {
      onChatSelect(newChat);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  // Удаление чата
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Удалить этот чат?')) {
      return;
    }

    try {
      const chatToDelete = chats.find(chat => chat.id === chatId);
      
      // Если это демо чат, удаляем только локально
      if (chatToDelete.user_id === 'demo') {
        deleteDemoChat(chatId);
        return;
      }

      // Проверяем токен для реального чата
      if (!checkTokenAndRedirect()) {
        setError('Требуется авторизация для удаления чата');
        return;
      }

      // API не предоставляет endpoint для удаления чатов, удаляем локально
      console.log('API не поддерживает удаление чатов, удаляем локально');
      deleteDemoChat(chatId);

    } catch (err) {
      console.error('Ошибка удаления чата:', err);
      setError('Ошибка удаления чата');
    }
  };

  // Удаление демо чата
  const deleteDemoChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // Сохраняем в localStorage
    const isDemoChat = chats.find(chat => chat.id === chatId)?.user_id === 'demo';
    if (isDemoChat) {
      localStorage.setItem('stellarum_demo_chats', JSON.stringify(updatedChats));
    }
    
    // Обновляем выбранный чат если нужно
    if (chatId === currentChatId && updatedChats.length > 0 && onChatSelect) {
      onChatSelect(updatedChats[0]);
    } else if (chatId === currentChatId && updatedChats.length === 0 && onChatSelect) {
      handleNewChat();
    }
  };

  const handleStartEdit = (chatId, chatTitle, e) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(chatTitle);
  };

  // Изменение названия чата через API
  const handleSaveEdit = async (chatId) => {
    if (!editingTitle.trim() || editingTitle.length < 3 || editingTitle.length > 50) {
      setEditingChatId(null);
      setError('Название чата должно быть от 3 до 50 символов');
      return;
    }

    try {
      const chatToUpdate = chats.find(chat => chat.id === chatId);
      
      if (!chatToUpdate) {
        setEditingChatId(null);
        return;
      }

      // Если это демо чат, обновляем только локально
      if (chatToUpdate.user_id === 'demo') {
        updateDemoChatTitle(chatId, editingTitle.trim());
        setEditingChatId(null);
        return;
      }

      // Проверяем токен для реального чата
      if (!checkTokenAndRedirect()) {
        setError('Требуется авторизация для изменения чата');
        setEditingChatId(null);
        return;
      }

      console.log('Изменяем название чата через API...');
      
      // Эндпоинт из спецификации: /api/chat/{chat_id} (PATCH)
      const endpoint = `${API_BASE_URL}/api/chat/${chatId}?new_chat_title=${encodeURIComponent(editingTitle.trim())}`;
      console.log('PATCH запрос к:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      console.log('Статус изменения:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setError('Сессия истекла');
        setEditingChatId(null);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`Ошибка изменения чата: ${response.status}`);
      }

      const updatedChat = await response.json();
      console.log('✅ Название чата изменено через API:', updatedChat);

      // Обновляем локально
      const updatedChats = chats.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            title: updatedChat.title || editingTitle.trim() 
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      setEditingChatId(null);
      
      // Обновляем выбранный чат если нужно
      if (chatId === currentChatId && onChatSelect) {
        const chat = updatedChats.find(c => c.id === chatId);
        if (chat) {
          onChatSelect(chat);
        }
      }

    } catch (err) {
      console.error('❌ Ошибка изменения названия чата:', err);
      setError('Не удалось изменить название чата. Изменяем локально.');
      updateDemoChatTitle(chatId, editingTitle.trim());
      setEditingChatId(null);
    }
  };

  // Обновление названия демо чата
  const updateDemoChatTitle = (chatId, newTitle) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, title: newTitle };
      }
      return chat;
    });
    
    setChats(updatedChats);
    
    // Сохраняем в localStorage для демо чатов
    const isDemoChat = chats.find(chat => chat.id === chatId)?.user_id === 'demo';
    if (isDemoChat) {
      localStorage.setItem('stellarum_demo_chats', JSON.stringify(updatedChats));
    }
    
    if (chatId === currentChatId && onChatSelect) {
      const chat = updatedChats.find(c => c.id === chatId);
      if (chat) {
        onChatSelect(chat);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e, chatId) => {
    if (e.key === 'Enter') {
      handleSaveEdit(chatId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const selectChat = (chat) => {
    if (editingChatId) return;
    if (onChatSelect) onChatSelect(chat);
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Сегодня';
      if (diffDays === 1) return 'Вчера';
      if (diffDays < 7) return `${diffDays} дн. назад`;
      
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  // Обновление списка чатов
  const refreshChats = () => {
    loadChats();
  };

  return (
    <div className={`sidebar ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="sidebar-header">
        <div className="header-left">
          <div className="header-logo">
            {logoImg ? (
              <img src={logoImg} alt="Stellarum AI" />
            ) : (
              <span style={{ fontSize: '12px' }}>⭐</span>
            )}
          </div>
          <h1>STELLARUM AI</h1>
        </div>
        <div className="header-right">
          <div 
            className="header-icon" 
            onClick={refreshChats}
            title="Обновить чаты"
            style={{ cursor: 'pointer' }}
          >
            {reloadImg ? (
              <img src={reloadImg} alt="Обновить" />
            ) : (
              <span style={{ fontSize: '14px' }}>🔄</span>
            )}
          </div>
          <div 
            className="header-icon" 
            onClick={() => setIsSettingsOpen(true)}
            title="Настройки"
            style={{ cursor: 'pointer' }}
          >
            {settingsImg ? (
              <img src={settingsImg} alt="Настройки" />
            ) : (
              <span style={{ fontSize: '14px' }}>⚙️</span>
            )}
          </div>
          <div 
            className="header-icon" 
            title={user?.username || "Профиль"}
            onClick={() => {
              if (onLogout && window.confirm('Выйти из аккаунта?')) {
                onLogout();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {profileImg ? (
              <img src={profileImg} alt="Профиль" />
            ) : (
              <span style={{ fontSize: '14px' }}>{user?.username?.charAt(0)?.toUpperCase() || '👤'}</span>
            )}
          </div>
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
              <button onClick={handleNewChat} style={{ marginTop: '10px' }}>Создать первый чат</button>
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
                  {editingChatId === chat.id ? (
                    <div className="chat-title-edit">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, chat.id)}
                        onBlur={() => handleSaveEdit(chat.id)}
                        className="chat-edit-input"
                        maxLength={50}
                        minLength={3}
                      />
                      <div className="chat-edit-buttons">
                        <button 
                          className="chat-edit-save"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(chat.id);
                          }}
                          title="Сохранить"
                        >
                          ✓
                        </button>
                        <button 
                          className="chat-edit-cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          title="Отмена"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="chat-title">{chat.title}</div>
                      <div className="chat-preview">{chat.preview}</div>
                    </>
                  )}
                </div>
                <div className="chat-time">{formatDate(chat.created_at)}</div>
                {editingChatId !== chat.id && (
                  <div className="chat-actions">
                    <button 
                      className="chat-edit-btn"
                      onClick={(e) => handleStartEdit(chat.id, chat.title, e)}
                      title="Редактировать название"
                    >
                      ✎
                    </button>
                    <button 
                      className="chat-delete-btn"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      title="Удалить чат"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isSettingsOpen && (
        <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Настройки</h2>
              <button className="settings-close" onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            
            <div className="settings-content">
              {user && (
                <div className="settings-section">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h3 className="setting-title">Пользователь</h3>
                      <p className="setting-description">
                        {user.username || user.email || 'Гость'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3 className="setting-title">Тема оформления</h3>
                    <p className="setting-description">
                      {isDarkTheme ? 'Темная тема' : 'Светлая тема'}
                    </p>
                  </div>
                  <div className="setting-control">
                    <button 
                      className="theme-toggle-btn"
                      onClick={onThemeToggle}
                    >
                      {isDarkTheme ? '☀️' : '🌙'}
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3 className="setting-title">Выход из аккаунта</h3>
                    <p className="setting-description">
                      Завершить текущую сессию
                    </p>
                  </div>
                  <div className="setting-control">
                    <button 
                      className="logout-btn"
                      onClick={() => {
                        if (window.confirm('Вы уверены, что хотите выйти?')) {
                          setIsSettingsOpen(false);
                          if (onLogout) onLogout();
                        }
                      }}
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;