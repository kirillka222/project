import React from 'react';
import './ActionButtons.css';

const ActionButtons = ({ onActionSelect, isDarkTheme }) => {
  const actions = [
    {
      title: "Объясни код",
      description: "Получите объяснение любого фрагмента кода"
    },
    {
      title: "Напиши резюме",
      description: "Создайте профессиональное резюме"
    },
    {
      title: "Составь письмо",
      description: "Напишите эффективное деловое письмо"
    }
  ];

  const handleActionClick = (actionTitle) => {
    if (onActionSelect) {
      onActionSelect(actionTitle);
    }
  };

  return (
    <div className={`action-buttons ${isDarkTheme ? 'dark-theme' : ''}`}>
      {actions.map((action, index) => (
        <div 
          key={index} 
          className="action-button"
          onClick={() => handleActionClick(action.title)}
        >
          <h3>{action.title}</h3>
          <p>{action.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ActionButtons;