// stellarum_ai_frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import MainLayout from './components/MainLayout/MainLayout';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем токен в localStorage
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');
    
    if (token) {
      setIsAuthenticated(true);
      if (userInfo) {
        try {
          setUser(JSON.parse(userInfo));
        } catch {
          setUser({ username: 'Пользователь' });
        }
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (loginData) => {
    console.log('App: User logged in', loginData);
    setIsAuthenticated(true);
    setUser({
      username: loginData.username,
      tokens: loginData.tokens
    });
    
    localStorage.setItem('user_info', JSON.stringify({
      username: loginData.username
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    setUser(null);
    console.log('App: User logged out');
  };

  const handleRegister = (registerData) => {
    console.log('App: User registered', registerData);
    setIsAuthenticated(true);
    setUser({
      username: registerData.user?.username || registerData.username,
      tokens: registerData.tokens
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '10px' }}>Загрузка...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <Login 
                  onLogin={handleLogin} 
                  onSwitchToRegister={() => window.location.href = '/register'} 
                />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <Register 
                  onRegister={handleRegister} 
                  onSwitchToLogin={() => window.location.href = '/login'} 
                />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <MainLayout 
                  user={user}
                  onLogout={handleLogout} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;