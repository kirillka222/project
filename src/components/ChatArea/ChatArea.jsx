import React, { useState, useEffect, useRef, useCallback } from 'react';
import ActionButtons from '../ActionButtons/ActionButtons';
import './ChatArea.css';

const ChatArea = ({ isDarkTheme, currentChat }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

  // Проверка токена и обработка 401
  const checkTokenAndRedirect = () => {
    const token = getAuthToken();
    if (!token) {
      console.log('Токен не найден, требуется авторизация');
      // Здесь можно добавить редирект на логин
      return false;
    }
    return true;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Загрузка сообщений чата
  const loadChatMessages = useCallback(async () => {
    if (!currentChat || !currentChat.id) {
      console.log('Чат не выбран или не имеет ID');
      setMessages([]);
      return;
    }

    try {
      console.log('Загружаем сообщения для чата ID:', currentChat.id);
      
      // Проверяем токен
      if (!checkTokenAndRedirect()) {
        console.log('Пользователь не авторизован');
        setMessages(getDefaultMessages());
        return;
      }

      // Эндпоинт из спецификации: /api/chat/messages/{chat_id}
      const endpoint = `${API_BASE_URL}/api/chat/messages/${currentChat.id}`;
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
        setMessages(getDefaultMessages());
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Получены сообщения от API:', data);

      // Форматируем сообщения согласно спецификации API
      let messageList = [];
      
      if (Array.isArray(data)) {
        messageList = data;
      } else if (data.messages && Array.isArray(data.messages)) {
        messageList = data.messages;
      } else if (data.data && Array.isArray(data.data)) {
        messageList = data.data;
      }

      // Преобразуем в формат для фронтенда
      const formattedMessages = messageList.map(msg => {
        // Спецификация: role может быть "user", "assistant", "system"
        const role = msg.role || 'user';
        const content = msg.data || msg.content || msg.message || '';
        
        return {
          id: msg.id || msg.message_id || Date.now(),
          type: role === 'assistant' ? 'ai' : role === 'system' ? 'system' : 'user',
          content: content,
          timestamp: msg.changed_at || msg.created_at || new Date().toISOString(),
          parent_id: msg.parent_id,
          user_id: msg.user_id
        };
      });

      // Сортируем по времени
      formattedMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Если нет сообщений, добавляем приветственное
      if (formattedMessages.length === 0) {
        setMessages(getDefaultMessages());
      } else {
        setMessages(formattedMessages);
      }

    } catch (err) {
      console.error('❌ Ошибка загрузки сообщений:', err);
      setError('Не удалось загрузить сообщения. Проверьте подключение.');
      setMessages(getDefaultMessages());
    }
  }, [currentChat, API_BASE_URL]);

  // Дефолтные сообщения
  const getDefaultMessages = () => {
    return [{
      id: Date.now(),
      type: 'ai',
      content: 'Привет! Я ваш AI-помощник Stellarum. Чем могу помочь?',
      timestamp: new Date().toISOString()
    }];
  };

  useEffect(() => {
    if (currentChat) {
      loadChatMessages();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setMessages([]);
    }
  }, [currentChat, loadChatMessages]);

  // Отправка сообщения согласно спецификации API
  const sendMessageToBackend = async (messageText, chatId) => {
    try {
      console.log('Отправляем сообщение в чат ID:', chatId);
      
      if (!checkTokenAndRedirect()) {
        throw new Error('Пользователь не авторизован');
      }

      // Эндпоинт из спецификации: /api/chat/messages/{chat_id}
      const endpoint = `${API_BASE_URL}/api/chat/messages/${chatId}`;
      console.log('POST запрос к:', endpoint);

      const requestBody = {
        message: messageText
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('Статус отправки:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Сессия истекла');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Ответ от модели:', data);

      // Спецификация возвращает MessageSendOut с question и answer
      return {
        success: true,
        question: data.question || messageText,
        answer: data.answer || 'Получен ответ от AI',
        changed_at: data.changed_at || new Date().toISOString()
      };

    } catch (err) {
      console.error('❌ Ошибка отправки сообщения:', err);
      
      // Fallback на локальную имитацию
      return {
        success: false,
        question: messageText,
        answer: await mockSendMessage(messageText),
        changed_at: new Date().toISOString()
      };
    }
  };

  // Локальная имитация AI (fallback)
  const mockSendMessage = useCallback((messageText) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerMessage = messageText.toLowerCase();
        
        if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
          resolve("Привет! Рад вас видеть! Чем могу помочь сегодня?");
        } else if (lowerMessage.includes('как дела') || lowerMessage.includes('как ты')) {
          resolve("У меня все отлично, готов помогать вам! 😊");
        } else if (lowerMessage.includes('помощь') || lowerMessage.includes('что ты умеешь')) {
          resolve("Я могу помочь с:\n\n📝 **Текст и документы:**\n- Написание писем и сообщений\n- Составление резюме\n- Редактирование текста\n- Переводы\n\n💻 **Программирование:**\n- Объяснение кода\n- Отладка ошибок\n- Архитектурные решения\n- Оптимизация\n\n🎯 **Общее:**\n- Ответы на вопросы\n- Идеи и креатив\n- Планирование задач\n- Обучение");
        } else if (lowerMessage.includes('код') || lowerMessage.includes('программир')) {
          resolve("Вот пример кода на Python для решения задачи:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# Использование\nprint(fibonacci(10))  # Выведет 55\n```\n\nЭто рекурсивная функция для вычисления чисел Фибоначчи.");
        } else if (lowerMessage.includes('резюме') || lowerMessage.includes('cv')) {
          resolve("**Иван Иванов**\n\nFrontend разработчик с 3+ годами опыта\n\n**Навыки:**\n- React, Vue.js, JavaScript (ES6+)\n- HTML5, CSS3, SASS/LESS\n- REST API, GraphQL\n- Git, Webpack, Docker\n\n**Опыт работы:**\n- Разработка SPA приложений\n- Оптимизация производительности\n- Код-ревью и менторство\n\n**Образование:**\nКомпьютерные науки, Университет");
        } else {
          const responses = [
            "Интересный вопрос! Вот что я думаю об этом...",
            "Позвольте мне объяснить это подробнее.",
            "Отличный вопрос! Вот мой ответ:",
            "Это важная тема. Вот что нужно учитывать:",
            "На основе вашего запроса, вот мои рекомендации:"
          ];
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          resolve(`${randomResponse}\n\n${messageText} - это важный аспект, который требует внимания. Рекомендую изучить документацию и протестировать разные подходы.`);
        }
      }, Math.random() * 500 + 500);
    });
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChat || isLoading) return;

    // Создаем объект сообщения пользователя
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Отправляем на бэкенд
      const result = await sendMessageToBackend(message, currentChat.id);
      
      // Создаем сообщение от AI
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.answer,
        timestamp: result.changed_at || new Date().toISOString()
      };

      // Добавляем ответ AI
      setMessages(prev => [...prev, aiMessage]);

      // Сохраняем в localStorage как резервную копию
      try {
        const savedChats = JSON.parse(localStorage.getItem('stellarum_chats') || '[]');
        const updatedChats = savedChats.map(chat => {
          if (chat.id === currentChat.id) {
            const updatedMessages = [...(chat.messages || []), userMessage, aiMessage];
            return { 
              ...chat, 
              messages: updatedMessages,
              preview: message.length > 50 ? message.substring(0, 50) + '...' : message,
              updated_at: new Date().toISOString()
            };
          }
          return chat;
        });
        localStorage.setItem('stellarum_chats', JSON.stringify(updatedChats));
      } catch (storageErr) {
        console.error('Ошибка сохранения в localStorage:', storageErr);
      }

    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
      
      if (err.message.includes('Сессия истекла')) {
        setError('Сессия истекла. Пожалуйста, войдите заново.');
      } else {
        setError('Произошла ошибка при отправке сообщения. Попробуйте еще раз.');
      }
      
      // Добавляем сообщение об ошибке
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'только что';
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Логотип SVG
  const LogoIcon = () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#1F3A8A" stroke="#4F8EF7" strokeWidth="4"/>
      <path d="M30 30 L50 30 L50 50 L30 50 Z" stroke="white" strokeWidth="3" fill="none"/>
      <circle cx="40" cy="40" r="8" fill="#4F8EF7"/>
      <path d="M25 55 L55 55" stroke="white" strokeWidth="3"/>
      <path d="M25 60 L55 60" stroke="white" strokeWidth="3"/>
    </svg>
  );

  const SmallLogoIcon = () => (
    <svg width="60" height="60" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#1F3A8A" stroke="#4F8EF7" strokeWidth="4"/>
      <path d="M30 30 L50 30 L50 50 L30 50 Z" stroke="white" strokeWidth="3" fill="none"/>
      <circle cx="40" cy="40" r="8" fill="#4F8EF7"/>
      <path d="M25 55 L55 55" stroke="white" strokeWidth="3"/>
      <path d="M25 60 L55 60" stroke="white" strokeWidth="3"/>
    </svg>
  );

  if (!currentChat) {
    return (
      <div className={`chat-area ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="welcome-section">
          <div className="center-logo">
            <LogoIcon />
          </div>
          
          <h1 className="welcome-title">Добро пожаловать в Stellarum AI</h1>
          <p className="welcome-subtitle">
            Ваш персональный AI-помощник для решения задач любой сложности.<br />
            Начните новый разговор или выберите существующий чат.
          </p>
          
          <ActionButtons onActionSelect={handleActionSelect} isDarkTheme={isDarkTheme} />
          
          <div className="features-list">
            <h3>Что я умею:</h3>
            <ul>
              <li>💬 Общаться на любые темы</li>
              <li>💻 Помогать с программированием</li>
              <li>📝 Писать и редактировать тексты</li>
              <li>🎯 Давать советы и рекомендации</li>
              <li>🔍 Объяснять сложные концепции</li>
            </ul>
          </div>
          
          <div className="input-container">
            <input 
              type="text" 
              className="message-input" 
              placeholder="Выберите чат слева или создайте новый..."
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
          Создан: {formatDate(currentChat.created_at)}
          {messages.length > 0 && ` • ${messages.length} сообщений`}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-logo">
              <SmallLogoIcon />
            </div>
            <h3>Начните разговор с AI</h3>
            <p>Задайте вопрос или выберите действие из списка ниже</p>
            <ActionButtons onActionSelect={handleActionSelect} isDarkTheme={isDarkTheme} />
            
            <div className="quick-questions">
              <h4>Примеры запросов:</h4>
              <button onClick={() => setMessage("Объясни что такое React")}>Что такое React?</button>
              <button onClick={() => setMessage("Напиши план проекта")}>План проекта</button>
              <button onClick={() => setMessage("Как улучшить производительность сайта")}>Оптимизация сайта</button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'user' ? '👤' : msg.type === 'error' ? '⚠️' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
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
          {error.includes('Сессия истекла') && (
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                marginLeft: '10px', 
                padding: '5px 10px',
                background: '#4F8EF7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Обновить страницу
            </button>
          )}
        </div>
      )}

      <div className="input-container">
        <input 
          ref={inputRef}
          type="text" 
          className="message-input" 
          placeholder="Введите сообщение... (Enter для отправки)"
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