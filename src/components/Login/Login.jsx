import React, { useState } from 'react';
import './Login.css';
import logo from '../assets/logo.png'; // ← импортируем картинку

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login data:', formData);
    if (onLogin) onLogin(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="Logo" className="auth-logo" /> {/* ← заменили AI на картинку */}
          <h2>Вход в систему</h2>
          <p>Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              name="login"
              placeholder="Введите логин"
              value={formData.login}
              onChange={handleChange}
              className="form-input"
              required
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
            />
          </div>

          <button type="submit" className="auth-button">
            Войти
          </button>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта? <span className="auth-link" onClick={onSwitchToRegister}>Зарегистрироваться</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;