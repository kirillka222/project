import React from "react";
import "./TopBar.css";
import settings from "../assets/settings.png";
import profile from "../assets/profile.png";

const TopBar = () => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1>STELLARUM AI</h1>
      </div>
      <div className="topbar-right">
        <img src={settings} alt="Настройки" className="topbar-icon" />
        <img src={profile} alt="Профиль" className="topbar-profile" />
      </div>
    </div>
  );
};

export default TopBar;
