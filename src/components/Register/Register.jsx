import React, { useState } from 'react';
import './Register.css';
import logo from '../assets/logo.png';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Валидация пароля
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (formData.password.length < 3) {
      setError('Пароль должен содержать минимум 3 символа');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Логин должен содержать минимум 3 символа');
      setLoading(false);
      return;
    }

    try {
      // Отправка запроса на регистрацию
      const response = await fetch('/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: 'user'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Ошибка регистрации');
      }

      const userData = await response.json();
      console.log('Успешная регистрация:', userData);

      // Автоматический вход после успешной регистрации
      const tokenResponse = await fetch('/api/auth/token/', {
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

      if (!tokenResponse.ok) {
        throw new Error('Ошибка входа после регистрации');
      }

      const tokenData = await tokenResponse.json();
      
      // Сохраняем токены
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);

      // Вызываем колбэк успешной регистрации
      if (onRegister) {
        onRegister({
          user: userData,
          tokens: tokenData
        });
      }

    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Произошла ошибка при регистрации');
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
          <h2>Регистрация</h2>
          <p>Создайте новый аккаунт</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Введите email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              name="username"
              placeholder="Введите логин (мин. 3 символа)"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
              minLength={3}
              maxLength={64}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              name="password"
              placeholder="Введите пароль (мин. 3 символа)"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              minLength={3}
              maxLength={64}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Подтвердите пароль</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              required
              minLength={3}
              maxLength={64}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'auth-button--loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Уже есть аккаунт? 
            <span 
              className="auth-link" 
              onClick={loading ? undefined : onSwitchToLogin}
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              Войти
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;