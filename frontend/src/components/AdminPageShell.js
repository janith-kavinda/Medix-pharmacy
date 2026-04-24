import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function readUserInitial() {
  try {
    const raw = localStorage.getItem("medix_user");
    if (!raw) return "A";
    const u = JSON.parse(raw);
    const n = (u?.fullName || u?.email || "A").trim();
    return n.charAt(0).toUpperCase() || "A";
  } catch {
    return "A";
  }
}

export default function AdminPageShell({ breadcrumb, children }) {
  const navigate = useNavigate();
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const initial = useMemo(() => readUserInitial(), []);
  const dateStr = clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="ph-root">
      <div className="ph-main">
        <header className="ph-header">
          <div className="ph-breadcrumb">
            <span>Medix</span>
            <span>›</span>
            <span className="ph-breadcrumb-current">{breadcrumb}</span>
          </div>
          <div className="ph-header-right">
            <span className="ph-time">
              {`${dateStr} · ${timeStr}`}
            </span>
            <button
              type="button"
              className="ph-avatar ph-avatar--btn"
              onClick={() => navigate("/admin/profile")}
              title="Open profile"
            >
              {initial}
            </button>
          </div>
        </header>
        <main className="ph-content ph-content--subpage">
          <div className="ph-admin-subpage">{children}</div>
        </main>
      </div>
    </div>
  );
}