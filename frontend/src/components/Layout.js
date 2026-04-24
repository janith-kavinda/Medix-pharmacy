import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import '../styles/adminPhDashboard.css';

const SB_KEY = 'medix_admin_sidebar_collapsed';

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SB_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSidebarCollapsed(v) {
  try {
    localStorage.setItem(SB_KEY, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const savedUser = localStorage.getItem('medix_user');
  const currentUser = useMemo(() => {
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }, [savedUser]);

  const userName = currentUser?.fullName || 'Admin';
  const isAdmin = currentUser && String(currentUser.role).toLowerCase() === 'admin';

  const handleLogout = useCallback(() => {
    localStorage.removeItem('medix_user');
    localStorage.removeItem('medix_token');
    navigate('/admin/login');
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      writeSidebarCollapsed(next);
      return next;
    });
  }, []);

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div
      className={
        'layout admin-layout' + (sidebarCollapsed ? ' admin-layout--sb-collapsed' : '')
      }
    >
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
        userName={userName}
      />
      <div className="admin-shell">
        <main className="main admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}