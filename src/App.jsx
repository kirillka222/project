import React, { useState } from 'react';
import Login from './components/Login/Login.jsx';
import Register from './components/Register/Register.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/ChatArea/ChatArea';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const handleLogin = (loginData) => {
    console.log('Login successful:', loginData);
    setIsAuthenticated(true);
  };

  const handleRegister = (registerData) => {
    console.log('Register successful:', registerData);
    setIsAuthenticated(true);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      );
    } else {
      return (
        <Register 
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      );
    }
  }

  return (
    <div className={`app ${isDarkTheme ? 'dark-theme' : ''}`}>
      <Sidebar isDarkTheme={isDarkTheme} onThemeToggle={toggleTheme} />
      <ChatArea isDarkTheme={isDarkTheme} />
    </div>
  );
}

export default App;