import React from "react";
import { NavLink } from "react-router-dom";
import "./Layout.css";

function Sidebar({ isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-menu">
        <div className="menu-section-title">MAIN MENU</div>

        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">🏠</span>
          <span>Dashboard</span>
        </NavLink>

        <div className="menu-section-title">INVENTORY</div>

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📦</span>
          <span>Stock Overview</span>
        </NavLink>

        <NavLink
          to="/add-stock"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">➕</span>
          <span>Add Stock</span>
        </NavLink>

        <NavLink
          to="/issue-stock"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📤</span>
          <span>Given Stock</span>
        </NavLink>

        <NavLink
          to="/return-stock"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📥</span>
          <span>Return Stock</span>
        </NavLink>

        <NavLink
          to="/stock-history"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📋</span>
          <span>Stock History</span>
        </NavLink>

        <div className="menu-section-title">BRANCHES</div>

        <NavLink
          to="/branch-stock"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">🏫</span>
          <span>Branch Stock</span>
        </NavLink>

        <div className="menu-section-title">REQUIREMENTS</div>

        <NavLink
          to="/requirements"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📝</span>
          <span>Requirements</span>
        </NavLink>

        <div className="menu-section-title">REPORTS</div>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">📊</span>
          <span>Reports</span>
        </NavLink>
      </div>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="menu-icon">⚙️</span>
          <span>Settings</span>
        </NavLink>

        <div className="sidebar-version">
          <span>Millennium Kidss</span>
          <small>Stock Management v1.0</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
