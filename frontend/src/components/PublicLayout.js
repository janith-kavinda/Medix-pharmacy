import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main className="public-content">
        <Outlet />
      </main>
      <Footer variant="public" />
    </div>
  );
}
