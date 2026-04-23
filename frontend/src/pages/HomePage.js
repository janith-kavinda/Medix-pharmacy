import { useEffect, useState, createElement as h } from "react";
import { NavLink } from "react-router-dom";
import { billingsApi, medicinesApi, ordersApi } from "../api/client";

const LOW_STOCK_THRESHOLD = 10;

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRs(amount) {
  const value = Number(amount) || 0;
  return "Rs " + value.toLocaleString("en-LK", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/* ─── Enhanced Styles ─────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ph-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Inter', sans-serif;
  color: #0f172a;
}

/* ── Sidebar ── */
.ph-sidebar {
  position: fixed;
  top: 0; left: 0;
  width: 72px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0;
  z-index: 100;
  gap: 12px;
  box-shadow: 4px 0 20px rgba(15, 23, 42, 0.06);
}

.ph-logo {
  width: 48px; 
  height: 48px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border-radius: 14px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.ph-logo svg { 
  width: 24px; 
  height: 24px; 
  color: #ffffff; 
}

.ph-nav-item {
  width: 52px; 
  height: 52px;
  border-radius: 14px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  text-decoration: none;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.ph-nav-item:hover {
  background: #f1f5f9;
  color: #0ea5e9;
  transform: scale(1.08);
}

.ph-nav-item.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.ph-nav-item svg { 
  width: 20px; 
  height: 20px; 
}

.ph-sidebar-spacer { flex: 1; }

.ph-sidebar-dot {
  width: 9px; 
  height: 9px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 12px #10b981;
  animation: phPulse 3s ease-in-out infinite;
}

/* ── Main Content ── */
.ph-main {
  margin-left: 72px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.ph-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  padding: 0 48px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky; 
  top: 0; 
  z-index: 50;
}

.ph-breadcrumb {
  display: flex; 
  align-items: center; 
  gap: 10px;
  font-size: 14px; 
  color: #64748b;
  font-weight: 500;
}

.ph-breadcrumb-current { 
  color: #0f172a; 
  font-weight: 600;
}

.ph-header-right {
  display: flex; 
  align-items: center; 
  gap: 20px;
}

.ph-time {
  font-size: 13.5px; 
  color: #64748b;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.ph-avatar {
  width: 38px; 
  height: 38px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border-radius: 50%;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 13px; 
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.25);
}

/* ── Content ── */
.ph-content { 
  padding: 48px; 
  flex: 1; 
}

/* ── Hero Section ── */
.ph-hero {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  margin-bottom: 40px;
}

.ph-hero-card {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
  border-radius: 24px;
  padding: 48px 52px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(14, 165, 233, 0.25);
}

.ph-hero-card::before {
  content: '';
  position: absolute;
  top: -120px; 
  right: -100px;
  width: 320px; 
  height: 320px;
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
}

.ph-tag {
  display: inline-flex; 
  align-items: center; 
  gap: 8px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 11px; 
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 9999px;
  margin-bottom: 20px;
}

.ph-hero-title {
  font-family: 'Poppins', sans-serif;
  font-size: 48px;
  line-height: 1.05;
  color: #ffffff;
  margin-bottom: 16px;
  font-weight: 700;
}

.ph-hero-title em {
  font-style: normal;
  color: rgba(255,255,255,0.88);
  font-weight: 500;
}

.ph-hero-desc {
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  line-height: 1.7;
  margin-bottom: 32px;
  max-width: 420px;
}

.ph-cta-row {
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap;
}

/* Button Styles */
.ph-btn {
  display: inline-flex; 
  align-items: center; 
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px; 
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Poppins', sans-serif;
}

.ph-btn--accent {
  background: #ffffff;
  color: #0ea5e9;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.25);
}

.ph-btn--accent:hover {
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.35);
}

.ph-btn--outline {
  background: transparent;
  color: rgba(255,255,255,0.9);
  border: 1.5px solid rgba(255,255,255,0.4);
}

.ph-btn--outline:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.7);
  color: #fff;
}

/* Quick Stats */
.ph-quick {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ph-q-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px 26px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.04);
}

.ph-q-card:hover {
  border-color: #0ea5e9;
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.12);
}

.ph-q-label {
  font-size: 11.5px;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.ph-q-value {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.ph-q-value--green { color: #10b981; }

.ph-q-bar {
  margin-top: 16px;
  height: 5px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.ph-q-fill {
  height: 100%;
  background: linear-gradient(to right, #0ea5e9, #38bdf8);
  border-radius: 9999px;
  transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Metrics Grid */
.ph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.ph-mc-wrap {
  text-decoration: none;
  display: block;
}

.ph-mc {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 26px;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.ph-mc:hover {
  border-color: #bae6fd;
  box-shadow: 0 20px 40px rgba(14, 165, 233, 0.1);
  transform: translateY(-6px);
}

.ph-mc--alert {
  border-color: #fecaca;
  background: #fff1f2;
}

.ph-mc--alert:hover {
  border-color: #f87171;
  box-shadow: 0 20px 40px rgba(239, 68, 68, 0.12);
}

.ph-mc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ph-mc-icon {
  width: 48px; 
  height: 48px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #0ea5e9;
  transition: all 0.3s;
}

.ph-mc:hover .ph-mc-icon {
  transform: scale(1.1);
  background: #e0f2fe;
}

.ph-mc-icon--alert {
  background: #fee2e2;
  color: #ef4444;
}

.ph-mc-val {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.025em;
}

.ph-mc-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.ph-mc-sub {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.ph-mc-arr {
  position: absolute;
  bottom: 24px;
  right: 24px;
  opacity: 0;
  transition: all 0.3s;
  color: #64748b;
}

.ph-mc-wrap:hover .ph-mc-arr {
  opacity: 1;
  transform: translateX(4px);
}

/* Error Message */
.ph-error {
  display: flex; 
  align-items: center; 
  gap: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 13.5px; 
  color: #ef4444;
  margin-top: 20px;
}

/* Responsive */
@media(max-width: 1200px) {
  .ph-grid { grid-template-columns: repeat(2, 1fr); }
}

@media(max-width: 900px) {
  .ph-hero { grid-template-columns: 1fr; }
  .ph-content { padding: 32px 24px; }
  .ph-header { padding: 0 24px; }
}

@media(max-width: 640px) {
  .ph-grid { grid-template-columns: 1fr; }
}
`;

function injectStyles() {
  if (document.getElementById("ph-styles")) return;
  const s = document.createElement("style");
  s.id = "ph-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── Icons (Same as before) ─────────────────────────────────────── */
function svgIcon(children) {
  return h("svg", { 
    viewBox: "0 0 24 24", 
    fill: "none", 
    stroke: "currentColor", 
    strokeWidth: "2", 
    strokeLinecap: "round", 
    strokeLinejoin: "round" 
  }, ...children);
}

const PillIcon    = () => svgIcon([h("path",{d:"m10.5 20.5-7-7a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7Z"}), h("line",{x1:"8.5",y1:"12.5",x2:"15.5",y2:"5.5"})]);
const OrderIcon   = () => svgIcon([h("path",{d:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"}), h("rect",{x:"9",y:"3",width:"6",height:"4",rx:"2"}), h("path",{d:"M9 12h6M9 16h4"})]);
const SalesIcon   = () => svgIcon([h("polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17"}), h("polyline",{points:"16 7 22 7 22 13"})]);
const RevenueIcon = () => svgIcon([h("path",{d:"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"})]);
const AlertIcon   = () => svgIcon([h("path",{d:"M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}), h("line",{x1:"12",y1:"9",x2:"12",y2:"13"}), h("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]);
const ChevronIcon = () => svgIcon([h("polyline",{points:"9 18 15 12 9 6"})]);
const GridIcon    = () => svgIcon([h("rect",{x:"3",y:"3",width:"7",height:"7"}), h("rect",{x:"14",y:"3",width:"7",height:"7"}), h("rect",{x:"14",y:"14",width:"7",height:"7"}), h("rect",{x:"3",y:"14",width:"7",height:"7"})]);
const BillingIcon = () => svgIcon([h("rect",{x:"2",y:"5",width:"20",height:"14",rx:"2"}), h("line",{x1:"2",y1:"10",x2:"22",y2:"10"})]);
const ProfileIcon = () => svgIcon([h("circle",{cx:"12",cy:"8",r:"4"}), h("path",{d:"M4 20a8 8 0 0 1 16 0"})]);

/* ─── MetricCard Component ───────────────────────────────────────── */
function MetricCard({ title, value, subtitle, tone, icon, to, index }) {
  const isAlert = tone === "danger";

  const inner = h("div", { 
    className: `ph-mc ${isAlert ? "ph-mc--alert" : ""}`,
    style: { "--d": `${index * 60}ms` }
  },
    h("div", { className: "ph-mc-top" },
      h("div", { className: `ph-mc-icon ${isAlert ? "ph-mc-icon--alert" : ""}` }, icon),
      isAlert && value !== "—" && Number(value) > 0 && 
        h("div", { className: "ph-mc-badge" }, value)
    ),
    h("div", { className: "ph-mc-val" }, value),
    h("div", { className: "ph-mc-name" }, title),
    h("div", { className: "ph-mc-sub" }, subtitle),
    to && h("div", { className: "ph-mc-arr" }, h(ChevronIcon))
  );

  return to 
    ? h(NavLink, { to, className: "ph-mc-wrap" }, inner)
    : h("div", { className: "ph-mc-wrap" }, inner);
}

/* ─── HomePage ───────────────────────────────────────────────────── */
export default function HomePage() {
  injectStyles();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMedicines: null, totalOrders: null, approvedOrders: null,
    approvedRevenue: null, todaySales: null, lowStock: null,
  });

  // Keep your original useEffect and logic unchanged
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); 
      setError(null);
      try {
        const [mR, oR, bR] = await Promise.allSettled([
          medicinesApi.getAll(), 
          ordersApi.getAll(), 
          billingsApi.getAll(),
        ]);

        const medicines = mR.status === "fulfilled" && Array.isArray(mR.value) ? mR.value : [];
        const orders    = oR.status === "fulfilled" && Array.isArray(oR.value) ? oR.value : [];
        const billings  = bR.status === "fulfilled" && Array.isArray(bR.value) ? bR.value : [];

        const approved = orders.filter(o => {
          const s = String(o?.status || "").toLowerCase();
          return s === "approved" || s === "completed";
        });

        const revenue = approved.reduce((s, o) => s + (Number(o?.totalPrice) || 0), 0);

        const today = new Date();
        const todaySales = billings
          .filter(b => b?.createdAt ? isSameLocalDay(new Date(b.createdAt), today) : false)
          .reduce((s, b) => s + (Number(b?.total) || 0), 0);

        const lowStock = medicines.filter(m =>
          (Number(m?.quantity) || 0) > 0 && (Number(m?.quantity) || 0) <= LOW_STOCK_THRESHOLD
        ).length;

        const anyOk = mR.status === "fulfilled" || oR.status === "fulfilled" || bR.status === "fulfilled";

        if (!anyOk) {
          setError("Backend is offline. Start the backend to show live statistics.");
          setStats({ totalMedicines: null, totalOrders: null, approvedOrders: null, approvedRevenue: null, todaySales: null, lowStock: null });
          return;
        }

        setStats({
          totalMedicines: medicines.length,
          totalOrders: orders.length,
          approvedOrders: approved.length,
          approvedRevenue: revenue,
          todaySales,
          lowStock
        });
      } catch (err) {
        setError(err?.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const id = window.setInterval(fetchStats, 10000);
    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const v = (val, fmt) => loading ? "—" : val == null ? "—" : (fmt ? fmt(val) : String(val));

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const cards = [
    { title: "Total Medicines",   value: v(stats.totalMedicines),           subtitle: "Active inventory items",    icon: h(PillIcon),    to: "/app/medicines", index: 0 },
    { title: "Total Orders",      value: v(stats.totalOrders),              subtitle: "All placed orders",         icon: h(OrderIcon),   to: "/app/orders",    index: 1 },
    { title: "Approved Sales",    value: v(stats.approvedOrders),           subtitle: "Successfully completed",    icon: h(SalesIcon),   to: "/app/orders",    index: 2 },
    { title: "Total Revenue",     value: v(stats.approvedRevenue, formatRs),subtitle: "From approved orders",      icon: h(RevenueIcon), to: "/app/orders",    index: 3 },
    { title: "Today's Sales",     value: v(stats.todaySales, formatRs),     subtitle: "Based on today's billing",  icon: h(SalesIcon),   to: "/app/billing",   index: 4 },
    { title: "Low Stock Items",   value: v(stats.lowStock),                 subtitle: `≤ ${LOW_STOCK_THRESHOLD} units left`, icon: h(AlertIcon), to: "/app/medicines", tone: "danger", index: 5 },
  ];

  return h("div", { className: "ph-root" },

    /* Sidebar */
    h("nav", { className: "ph-sidebar" },
      h("div", { className: "ph-logo" }, h(PillIcon)),
      h(NavLink, { to: "/app", end: true, className: ({ isActive }) => isActive ? "ph-nav-item active" : "ph-nav-item" }, h(GridIcon)),
      h(NavLink, { to: "/app/medicines", className: ({ isActive }) => isActive ? "ph-nav-item active" : "ph-nav-item" }, h(PillIcon)),
      h(NavLink, { to: "/app/orders", className: ({ isActive }) => isActive ? "ph-nav-item active" : "ph-nav-item" }, h(OrderIcon)),
      h(NavLink, { to: "/app/billing", className: ({ isActive }) => isActive ? "ph-nav-item active" : "ph-nav-item" }, h(BillingIcon)),
      h(NavLink, { to: "/app/profile", className: ({ isActive }) => isActive ? "ph-nav-item active" : "ph-nav-item" }, h(ProfileIcon)),
      h("div", { className: "ph-sidebar-spacer" }),
      h("div", { className: "ph-sidebar-dot" })
    ),

    /* Main Area */
    h("div", { className: "ph-main" },

      /* Header */
      h("header", { className: "ph-header" },
        h("div", { className: "ph-breadcrumb" },
          h("span", null, "Medix"),
          h("span", null, "›"),
          h("span", { className: "ph-breadcrumb-current" }, "Dashboard")
        ),
        h("div", { className: "ph-header-right" },
          h("span", { className: "ph-time" }, `${dateStr} • ${timeStr}`),
          h("div", { className: "ph-avatar" }, "AD")
        )
      ),

      /* Content */
      h("main", { className: "ph-content" },

        h("div", { className: "ph-hero" },

          /* Hero Card */
          h("div", { className: "ph-hero-card" },
            h("div", { className: "ph-tag" },
              h("span", { className: "ph-tag-dot" }),
              "LIVE DASHBOARD"
            ),
            h("h1", { className: "ph-hero-title" },
              "Pharmacy ", h("em", null, "at a glance")
            ),
            h("p", { className: "ph-hero-desc" },
              "Real-time insights into your inventory, orders, and today's performance."
            ),
            h("div", { className: "ph-cta-row" },
              h(NavLink, { to: "/app/medicines", className: "ph-btn ph-btn--accent" }, "Manage Inventory"),
              h(NavLink, { to: "/app/orders",    className: "ph-btn ph-btn--outline" }, "View All Orders"),
              h(NavLink, { to: "/app/billing",   className: "ph-btn ph-btn--outline" }, "Go to Billing")
            ),
            error && h("div", { className: "ph-error" }, h(AlertIcon), error)
          ),

          /* Quick Stats */
          h("div", { className: "ph-quick" },
            h("div", { className: "ph-q-card" },
              h("div", { className: "ph-q-label" }, "Total Medicines"),
              h("div", { className: "ph-q-value" }, loading ? "—" : (stats.totalMedicines ?? "—")),
              h("div", { className: "ph-q-bar" }, h("div", { className: "ph-q-fill", style: { width: "78%" } }))
            ),
            h("div", { className: "ph-q-card" },
              h("div", { className: "ph-q-label" }, "Today's Revenue"),
              h("div", { className: "ph-q-value ph-q-value--green" },
                loading || stats.todaySales == null ? "—" : formatRs(stats.todaySales)
              ),
              h("div", { className: "ph-q-bar" }, h("div", { className: "ph-q-fill ph-q-fill--green", style: { width: "85%" } }))
            )
          )
        ),

        /* Key Metrics Section */
        h("div", { style: { marginBottom: "16px", fontSize: "13px", fontWeight: "600", color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" } },
          "Key Performance Metrics"
        ),
        h("div", { className: "ph-grid" },
          ...cards.map((card, idx) => h(MetricCard, { key: card.title, ...card, index: idx }))
        )
      )
    )
  );
}