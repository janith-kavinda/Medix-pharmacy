import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap');

  .public-topbar {
    background: linear-gradient(120deg, #ffffff 0%, #e7f0fb 50%, #dce8f8 100%);
    border-bottom: 1px solid rgba(0, 82, 155, 0.22);
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
    font-family: 'Outfit', system-ui, sans-serif;
    position: sticky;
    top: 0;
    z-index: 120;
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    box-shadow: 0 10px 24px rgba(0, 82, 155, 0.1);
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
    background: linear-gradient(140deg, #00529b, #006ecf);
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
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #0b2e4a;
    letter-spacing: -0.2px;
  }

  .public-nav {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 82, 155, 0.15);
  }

  .public-nav-link {
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 13.5px;
    font-weight: 500;
    color: #3e5f7a;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  .public-nav-link:hover {
    background: #dbeafe;
    color: #00529b;
  }

  .public-nav-link.active {
    background: #c7ddfc;
    color: #003d75;
    font-weight: 600;
  }

  .public-nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(0, 82, 155, 0.2);
    margin: 0 6px;
    flex-shrink: 0;
  }

  .public-profile {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 4px;
  }

  .public-profile-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px 4px 4px;
    border-radius: 30px;
    border: 1px solid rgba(0, 82, 155, 0.18);
    background: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    user-select: none;
  }

  .public-profile-link:hover {
    background: #e8f1fd;
    border-color: #5eb0ff;
  }

  .public-profile-link.public-profile-link--active {
    background: #dbeafe;
    border-color: #00529b;
    box-shadow: 0 0 0 1px rgba(0, 82, 155, 0.25);
  }

  .public-profile-link-label {
    font-size: 13.5px;
    font-weight: 600;
    color: #0b2e4a;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 520px) {
    .public-profile-link-label {
      display: none;
    }
  }

  .public-header-logout {
    padding: 6px 10px;
    border-radius: 7px;
    border: 1px solid rgba(0, 82, 155, 0.2);
    background: rgba(255, 255, 255, 0.6);
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    color: #3e5f7a;
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .public-header-logout:hover {
    background: #fef2f2;
    border-color: rgba(220, 38, 38, 0.35);
    color: #b91c1c;
  }

  .public-header-signin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    text-decoration: none;
    color: #ffffff;
    background: linear-gradient(140deg, #00529b, #006ecf);
    border: 1px solid rgba(0, 82, 155, 0.4);
    box-shadow: 0 4px 12px rgba(0, 82, 155, 0.22);
    transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
    white-space: nowrap;
  }

  .public-header-signin:hover {
    filter: brightness(1.04);
    box-shadow: 0 6px 16px rgba(0, 82, 155, 0.32);
  }

  .public-header-signin.active {
    box-shadow: 0 0 0 2px rgba(0, 110, 207, 0.4);
  }

  .public-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(140deg, #00529b, #3d9ce8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .public-header-crossover {
    width: 100%;
    height: 18px;
    background: linear-gradient(
      to bottom,
      rgba(0, 82, 155, 0.14) 0%,
      rgba(0, 82, 155, 0.06) 45%,
      rgba(0, 82, 155, 0) 100%
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
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser?.email || currentUser?._id);
  const displayName = currentUser?.fullName || currentUser?.email || "User";
  const shortLabel = currentUser?.fullName
    ? String(currentUser.fullName).trim().split(/\s+/)[0] || "Profile"
    : "Profile";
  const initials =
    String(displayName)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";

  const handleLogout = () => {
    localStorage.removeItem("medix_user");
    localStorage.removeItem("medix_token");
    navigate("/", { replace: true });
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

          {isLoggedIn ? (
            <>
              <div className="public-nav-divider" aria-hidden="true" />
              <div className="public-profile">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    "public-profile-link" + (isActive ? " public-profile-link--active" : "")
                  }
                  title="View your profile"
                  end={false}
                >
                  <span className="public-avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="public-profile-link-label">{shortLabel}</span>
                </NavLink>
                <button type="button" className="public-header-logout" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="public-nav-divider" aria-hidden="true" />
              <NavLink
                to="/login"
                className={({ isActive }) => "public-header-signin" + (isActive ? " active" : "")}
              >
                Sign in
              </NavLink>
            </>
          )}
        </nav>

      </header>
      <div className="public-header-crossover" aria-hidden="true" />
    </>
  );
}