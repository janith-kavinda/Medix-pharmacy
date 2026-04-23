import React, { useEffect, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const isAdmin = currentUser && String(currentUser.role).toLowerCase() === 'admin';
    if (!isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('medix_user');
    localStorage.removeItem('medix_token');
    navigate('/admin/login');
  };

  return (
    <div className="layout">
      <main className="main">
        <Header onLogout={handleLogout} userName={userName} />

        <Outlet />

        <Footer variant="admin" />
      </main>
    </div>
  );
}
