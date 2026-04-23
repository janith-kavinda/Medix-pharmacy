import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Header({ onLogout, userName = "Admin" }) {
  const navigate = useNavigate();
  const avatarLabel = String(userName || "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <div className="topbar-brand" aria-label="Medix Pharmacy">
          <span className="topbar-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3l7 4v5c0 5.2-3 8.2-7 8.9-4-.7-7-3.7-7-8.9V7l7-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <div className="topbar-logo-block">
            <div className="topbar-logo">Medix Pharmacy</div>
            <div className="topbar-logo-sub">Admin Workspace</div>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Primary">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => (isActive ? "topbar-link active" : "topbar-link")}
          >
            Home
          </NavLink>
          <NavLink
            to="/app/medicines"
            className={({ isActive }) => (isActive ? "topbar-link active" : "topbar-link")}
          >
            Medicines
          </NavLink>
          <NavLink
            to="/app/orders"
            className={({ isActive }) => (isActive ? "topbar-link active" : "topbar-link")}
          >
            Orders
          </NavLink>
          <NavLink
            to="/app/billing"
            className={({ isActive }) => (isActive ? "topbar-link active" : "topbar-link")}
          >
            Billing
          </NavLink>
        </nav>

        <div className="topbar-tools">
          <div className="topbar-search" role="search">
            <span className="topbar-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="icon">
                <path
                  fill="currentColor"
                  d="M10.5 3a7.5 7.5 0 1 1 4.76 13.3l4.22 4.22-1.42 1.42-4.22-4.22A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
                />
              </svg>
            </span>
            <input
              className="topbar-search-input"
              type="search"
              placeholder="Search medicines, orders, bills..."
              aria-label="Search"
            />
          </div>

          <button className="icon-btn" type="button" aria-label="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              <path
                fill="currentColor"
                d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5L3.5 17.5V19h17v-1.5L19 16Zm-2 .25L18.5 17H5.5L7 16.25V11a5 5 0 0 1 10 0v5.25Z"
              />
            </svg>
            <span className="notif-count" aria-hidden="true">3</span>
            <span className="notif-dot" aria-hidden="true" />
          </button>

          <details className="profile">
            <summary className="profile-summary" aria-label="User menu">
              <span className="avatar" aria-hidden="true">{avatarLabel}</span>
              <span className="profile-name">{userName}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="chev">
                <path
                  fill="currentColor"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                />
              </svg>
            </summary>
            <div className="profile-menu" role="menu">
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => navigate("/app/profile")}
              >
                Edit Profile
              </button>
              <button type="button" className="menu-item" role="menuitem" onClick={onLogout}>
                Logout
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
