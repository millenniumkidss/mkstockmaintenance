import React from "react";
import "./Layout.css";

function Header({ onMenuClick }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          ☰
        </button>

        <div className="header-brand">
          <div className="header-logo">MK</div>

          <div>
            <h2>Millennium Kidss</h2>
            <span>Stock Management</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="notification-btn">
          🔔
          <span className="notification-dot"></span>
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-info">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>

          <span className="profile-arrow">⌄</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
