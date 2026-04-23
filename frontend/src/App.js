import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import SignupPage from "./pages/SignupPage";
import AdminSignupPage from "./pages/AdminSignupPage";
import PublicMedicinesPage from "./pages/PublicMedicinesPage";
import UserCartPage from "./pages/UserCartPage";
import UserProfilePage from "./pages/UserProfilePage";
import UserBillingPage from "./pages/UserBillingPage";
import PaymentPage from "./pages/PaymentPage";
import MedicinesPage from "./pages/MedicinesPage";
import OrdersPage from "./pages/OrdersPage";
import BillingPage from "./pages/BillingPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin/signup" element={<AdminSignupPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="inventory" element={<Navigate to="/medicines" replace />} />
          <Route path="medicines" element={<PublicMedicinesPage />} />
          <Route path="cart" element={<UserCartPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="billing" element={<UserBillingPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route path="/app" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
