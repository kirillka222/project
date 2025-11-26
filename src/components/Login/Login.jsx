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
      // Отправка запроса на получение токена
      const response = await fetch('/api/auth/token/', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Неверный логин или пароль');
      }

      const tokenData = await response.json();
      console.log('Успешный вход:', tokenData);
      
      // Сохраняем токены
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);

      // Получаем информацию о пользователе (опционально)
      // Можно добавить запрос к /api/users/me/ если такой эндпоинт есть

      // Вызываем колбэк успешного входа
      if (onLogin) {
        onLogin({
          username: formData.username,
          tokens: tokenData
        });
      }

    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.message || 'Произошла ошибка при входе');
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="Logo" className="auth-logo" /> 
          <h2>Вход в систему</h2>
          <p>Войдите в свой аккаунт</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              name="username"
              placeholder="Введите логин"
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
              placeholder="Введите пароль"
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
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта? 
            <span 
              className="auth-link" 
              onClick={loading ? undefined : onSwitchToRegister}
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              Зарегистрироваться
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;