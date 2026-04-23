import React, { useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@500;600&display=swap');

  .public-topbar {
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.62), rgba(230, 255, 247, 0.42));
    border-bottom: 1px solid rgba(15, 110, 86, 0.2);
    width: 100%;
    max-width: none;
    margin: 0;
    box-sizing: border-box;
    padding: 16px 44px;
    min-height: 88px;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'DM Sans', sans-serif;
    position: sticky;
    top: 0;
    z-index: 120;
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
  }

  .public-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    cursor: default;
  }

  .public-brand-icon {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #0F6E56, #1D9E75);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .public-brand-icon svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: white;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .public-brand-text {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #0F4035;
    letter-spacing: -0.2px;
  }

  .public-nav {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(15, 110, 86, 0.12);
  }

  .public-nav-link {
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 13.5px;
    font-weight: 500;
    color: #6b7280;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  .public-nav-link:hover {
    background: #E1F5EE;
    color: #0F6E56;
  }

  .public-nav-link.active {
    background: #E1F5EE;
    color: #0F6E56;
    font-weight: 600;
  }

  .public-nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(15, 110, 86, 0.12);
    margin: 0 6px;
    flex-shrink: 0;
  }

  .public-profile {
    position: relative;
    margin-left: 4px;
  }

  .public-profile-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 3px;
    border-radius: 30px;
    border: 1px solid rgba(15, 110, 86, 0.15);
    background: rgba(255, 255, 255, 0.58);
    cursor: pointer;
    list-style: none;
    transition: background 0.15s, border-color 0.15s;
    user-select: none;
  }

  .public-profile-summary::-webkit-details-marker {
    display: none;
  }

  .public-profile-summary:hover {
    background: #E1F5EE;
    border-color: #5DCAA5;
  }

  .public-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0F6E56, #5DCAA5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .public-profile-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(15, 110, 86, 0.12);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    min-width: 160px;
    padding: 4px;
    z-index: 100;
  }

  .public-profile-menu .menu-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border-radius: 7px;
    border: none;
    background: none;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    color: #374151;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    box-sizing: border-box;
  }

  .public-profile-menu .menu-item:hover {
    background: #E1F5EE;
    color: #0F6E56;
  }

  .public-profile-menu .menu-item-danger {
    color: #dc2626;
  }

  .public-profile-menu .menu-item-danger:hover {
    background: #fef2f2;
    color: #b91c1c;
  }

  .public-header-crossover {
    width: 100%;
    height: 18px;
    background: linear-gradient(
      to bottom,
      rgba(18, 82, 68, 0.2) 0%,
      rgba(18, 82, 68, 0.08) 45%,
      rgba(18, 82, 68, 0) 100%
    );
    pointer-events: none;
  }

  @media (max-width: 900px) {
    .public-topbar {
      padding: 13px 20px;
      min-height: 78px;
    }
  }

  @media (max-width: 640px) {
    .public-topbar {
      padding: 11px 12px;
      min-height: 72px;
    }

    .public-nav-link {
      padding: 6px 10px;
      font-size: 12.5px;
    }

    .public-header-crossover {
      height: 12px;
    }
  }
`;

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("medix_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function PublicHeader() {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser?.email || currentUser?._id);
  const displayName = currentUser?.fullName || currentUser?.email || "User";
  const initials =
    String(displayName)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";

  const handleLogout = () => {
    if (profileMenuRef.current) {
      profileMenuRef.current.removeAttribute("open");
    }
    localStorage.removeItem("medix_user");
    localStorage.removeItem("medix_token");
    navigate("/", { replace: true });
  };

  const closeProfileMenu = () => {
    if (profileMenuRef.current) {
      profileMenuRef.current.removeAttribute("open");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <header className="public-topbar" role="banner">

        <div className="public-brand">
          <span className="public-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3l7 4v5c0 5.2-3 8.2-7 8.9-4-.7-7-3.7-7-8.9V7l7-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <span className="public-brand-text">Medix Pharmacy</span>
        </div>

        <nav className="public-nav" aria-label="Public navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "public-nav-link active" : "public-nav-link")}
          >
            Home
          </NavLink>
          <NavLink
            to="/medicines"
            className={({ isActive }) => (isActive ? "public-nav-link active" : "public-nav-link")}
          >
            Medicines
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) => (isActive ? "public-nav-link active" : "public-nav-link")}
          >
            Cart
          </NavLink>
          <NavLink
            to="/billing"
            className={({ isActive }) => (isActive ? "public-nav-link active" : "public-nav-link")}
          >
            Billing
          </NavLink>

          {isLoggedIn && (
            <>
              <div className="public-nav-divider" aria-hidden="true" />
              <details className="public-profile" ref={profileMenuRef}>
                <summary className="public-profile-summary" aria-label="User menu">
                  <span className="public-avatar">{initials}</span>
                </summary>
                <div className="public-profile-menu" role="menu">
                  <Link
                    to="/profile"
                    className="menu-item"
                    role="menuitem"
                    onClick={closeProfileMenu}
                  >
                    Edit Profile
                  </Link>
                  <button
                    type="button"
                    className="menu-item menu-item-danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </details>
            </>
          )}
        </nav>

      </header>
      <div className="public-header-crossover" aria-hidden="true" />
    </>
  );
}