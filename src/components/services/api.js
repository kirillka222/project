// src/components/services/api.js

// Базовый URL API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Функция для получения заголовков авторизации
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || 
                sessionStorage.getItem('token') ||
                localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Универсальная функция для выполнения запросов
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };
  
  // Если есть тело и это объект, преобразуем в JSON
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    // Проверяем тип контента
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
};

// API для работы с чатами
export const chatAPI = {
  // Получить все чаты
  getAll: () => apiRequest('/chat/'),
  
  // Создать новый чат
  create: (title = 'Новый чат') => apiRequest('/chat/', {
    method: 'POST',
    body: { title }
  }),
  
  // Получить сообщения чата
  getMessages: (chatId) => apiRequest(`/chat/${chatId}/messages/`),
  
  // Обновить название чата
  update: (chatId, newTitle) => apiRequest(`/chat/${chatId}`, {
    method: 'PATCH',
    body: { new_chat_title: newTitle }
  }),
  
  // Удалить чат
  delete: (chatId) => apiRequest(`/chat/${chatId}`, {
    method: 'DELETE'
  }),
};

// API для работы с сообщениями
export const messageAPI = {
  // Создать сообщение
  create: (chatId, content, role = 'user') => apiRequest('/messages/', {
    method: 'POST',
    body: {
      chat_id: chatId,
      content,
      role
    }
  }),
  
  // Получить сообщение по ID
  getById: (messageId) => apiRequest(`/messages/${messageId}`),
};

// API для аутентификации
export const authAPI = {
  login: (email, password) => apiRequest('/auth/login/', {
    method: 'POST',
    body: { email, password }
  }),
  
  register: (userData) => apiRequest('/auth/register/', {
    method: 'POST',
    body: userData
  }),
  
  logout: () => apiRequest('/auth/logout/', {
    method: 'POST'
  }),
  
  profile: () => apiRequest('/auth/profile/'),
};

// Экспортируем базовую функцию для кастомных запросов
export default apiRequest;