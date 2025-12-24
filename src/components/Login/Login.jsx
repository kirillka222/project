import React, { useState } from 'react';
import './Login.css';
import logo from '../assets/logo.png';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Отправка запроса на вход...');
      
      // Основной endpoint - полный URL
      const response = await fetch('http://localhost:8000/api/auth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password,
          grant_type: 'password'
        }),
      });

      console.log('Статус ответа:', response.status);
      
      if (response.ok) {
        const tokenData = await response.json();
        console.log('✅ Успешный вход:', tokenData);
        
        // Сохраняем токены
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);

        // Вызываем колбэк успешного входа
        if (onLogin) {
          onLogin({
            username: formData.username,
            tokens: tokenData
          });
        }
      } else {
        // Если 404 или другая ошибка, пробуем fallback
        let errorMessage = 'Неверный логин или пароль';
        try {
          const errorData = await response.json();
          console.log('Ошибка сервера:', errorData);
          errorMessage = errorData.detail || 
                        errorData.message || 
                        (errorData.detail?.[0]?.msg) || 
                        errorMessage;
        } catch (jsonError) {
          const text = await response.text();
          console.log('Текст ошибки:', text);
          if (text) errorMessage = `HTTP ${response.status}: ${text}`;
          
          // Если 404, возможно endpoint не существует
          if (response.status === 404) {
            errorMessage = 'Endpoint /api/auth/token/ не найден. Проверьте бэкенд.';
          }
        }
        throw new Error(errorMessage);
      }

    } catch (err) {
      console.error('❌ Ошибка входа:', err);
      
      // Если ошибка CORS или сети, показываем подсказку
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        setError(`
          Ошибка CORS! Нужно:
          1. Проверить что бэкенд запущен: curl http://localhost:8000/health
          2. Открыть Chrome с отключенным CORS (см. инструкцию в консоли)
          3. Или исправить CORS в бэкенде
        `);
        
        // Показываем инструкцию в консоли
        console.log(`
          === ИНСТРУКЦИЯ ПО CORS ===
          1. Откройте новый терминал
          2. Выполните: open -n -a /Applications/Google\\\\ Chrome.app/Contents/MacOS/Google\\\\ Chrome --args --user-data-dir="/tmp/chrome_dev" --disable-web-security
          3. Откройте http://localhost
        `);
      } else {
        setError(err.message || 'Произошла ошибка при входе');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Очищаем ошибку при изменении поля
    if (error) setError('');
  };

  // Функция для заполнения тестовых данных
  const fillTestData = () => {
    setFormData({
      username: 'test@example.com',
      password: 'testpassword'
    });
    setError('');
    console.log('Заполнены тестовые данные. Попробуйте войти.');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="Logo" className="auth-logo" /> 
          <h2>Вход в систему</h2>
          <p>Войдите в свой аккаунт</p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: '#ffe6e6', 
            color: '#d63031', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Логин (email)</label>
            <input
              type="text"
              name="username"
              placeholder="test@example.com"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              name="password"
              placeholder="testpassword"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'auth-button--loading' : ''}`}
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
          
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={fillTestData}
              style={{
                background: 'transparent',
                border: '1px solid #ccc',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                color: '#666'
              }}
            >
              Заполнить тестовые данные
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта? 
            <span 
              className="auth-link" 
              onClick={loading ? undefined : onSwitchToRegister}
              style={{ 
                opacity: loading ? 0.5 : 1, 
                cursor: 'pointer', 
                marginLeft: '5px', 
                color: '#4F8EF7',
                textDecoration: 'underline'
              }}
            >
              Зарегистрироваться
            </span>
          </p>
          
          <div style={{ 
            fontSize: '11px', 
            color: '#666', 
            marginTop: '15px', 
            textAlign: 'center',
            padding: '8px',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div><strong>Endpoint:</strong> http://localhost:8000/api/auth/token/</div>
            <div style={{ marginTop: '5px', fontSize: '10px' }}>
              Проверьте: curl http://localhost:8000/health
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;