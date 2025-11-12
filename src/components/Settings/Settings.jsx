import React from 'react';
import './Settings.css'; // ← исправлено с Sidebar.css на Settings.css
import moonIcon from '../assets/moon.png';
import sunIcon from '../assets/sun.png';

const Settings = ({ isOpen, onClose, isDarkTheme, onThemeToggle }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleThemeToggle = () => {
    onThemeToggle();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Настройки</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          <p className="settings-description">
            Настройте параметры AI-чата под свои предпочтения
          </p>

          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-title">Тема оформления</h3>
                <p className="setting-description">
                  {isDarkTheme ? 'Темная тема' : 'Светлая тема'}
                </p>
              </div>
              <div className="setting-control">
                <img 
                  src={isDarkTheme ? sunIcon : moonIcon} 
                  alt={isDarkTheme ? 'Светлая тема' : 'Темная тема'} 
                  className="theme-icon" 
                  onClick={handleThemeToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;