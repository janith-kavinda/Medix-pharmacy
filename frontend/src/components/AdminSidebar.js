import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function MedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5-7-7a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7Z" />
      <line x1="8.5" y1="12.5" x2="15.5" y2="5.5" />
    </svg>
  );
}
function OrderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
function BillIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}
function UsersGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 9a3 3 0 1 0-2.2-1.1" />
      <path d="M14.5 7a2.5 2.5 0 1 0-2-4.5" />
      <path d="M2 20a6 6 0 0 1 7.2-1" />
      <path d="M22 20a6 6 0 0 0-4.1-4.2" />
    </svg>
  );
}

const navClass = ({ isActive }) => "admin-sb-link" + (isActive ? " admin-sb-link--active" : "");

const items = [
  { to: "/admin", end: true, label: "Home", title: "Dashboard", Icon: HomeIcon },
  { to: "/admin/medicines", end: false, label: "Medicines", title: "Medicines", Icon: MedIcon },
  { to: "/admin/orders", end: false, label: "Orders", title: "Orders", Icon: OrderIcon },
  { to: "/admin/billing", end: false, label: "Billing", title: "Billing", Icon: BillIcon },
  { to: "/admin/users", end: false, label: "Users", title: "Users", Icon: UsersGroupIcon },
  { to: "/admin/profile", end: false, label: "Profile", title: "Profile", Icon: UserIcon },
];

export default function AdminSidebar({ collapsed, onToggle, onLogout, userName = "Admin" }) {
  const navigate = useNavigate();
  const menuId = useId();
  const userBlockRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const avatarLabel = String(userName || "A").trim().charAt(0).toUpperCase() || "A";

  const closeMenu = useCallback(() => setUserMenuOpen(false), []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e) => {
      if (userBlockRef.current && !userBlockRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const handleLogout = useCallback(() => {
    closeMenu();
    onLogout();
  }, [closeMenu, onLogout]);

  const goProfile = useCallback(() => {
    closeMenu();
    navigate("/admin/profile");
  }, [closeMenu, navigate]);

  return (
    <aside
      className={"admin-sidebar" + (collapsed ? " admin-sidebar--collapsed" : "")}
      aria-label="Admin navigation"
    >
      <div className="admin-sidebar__head">
        <div className="admin-sidebar__brand" title="Medix Pharmacy — Admin">
          <span className="admin-sidebar__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 4v5c0 5.2-3 8.2-7 8.9-4-.7-7-3.7-7-8.9V7l7-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          {!collapsed && (
            <div className="admin-sidebar__brand-text">
              <span className="admin-sidebar__name">Medix</span>
              <span className="admin-sidebar__work">Admin</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="admin-sidebar__chev"
          onClick={onToggle}
          aria-pressed={collapsed}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <svg
            className="admin-sidebar__chev-ico"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? "none" : "scaleX(-1)" }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Primary">
        {items.map(({ to, end, label, title, Icon }) => (
          <NavLink
            key={to + String(end)}
            to={to}
            end={end}
            className={navClass}
            title={collapsed ? title : undefined}
          >
            <span className="admin-sb-ico" aria-hidden="true">
              <Icon />
            </span>
            {!collapsed && <span className="admin-sb-txt">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__foot">
        <div
          className={"admin-sb-user" + (userMenuOpen ? " admin-sb-user--open" : "")}
          ref={userBlockRef}
        >
          <button
            type="button"
            className="admin-sb-user__sum"
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
            aria-controls={userMenuOpen ? menuId : undefined}
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <span className="admin-sb-avatar" aria-hidden="true">
              {avatarLabel}
            </span>
            {!collapsed && <span className="admin-sb-user__name">{userName}</span>}
            <svg
                className={"admin-sb-chev" + (collapsed ? " admin-sb-chev--block" : "")}
                viewBox="0 0 20 20"
                aria-hidden="true"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" />
              </svg>
          </button>
          {userMenuOpen && (
            <div id={menuId} className="admin-sb-user__menu" role="menu" aria-label="Account actions">
              <button type="button" className="admin-sb-mi" role="menuitem" onClick={goProfile}>
                Edit profile
              </button>
              <button type="button" className="admin-sb-mi admin-sb-mi--out" role="menuitem" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}