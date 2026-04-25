import { useEffect, useMemo, useState, createElement as h } from "react";
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

/* Admin dashboard skin (ph-*) is in src/styles/adminPhDashboard.css via Layout. */

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
  const avatarLabel = useMemo(() => {
    try {
      const raw = localStorage.getItem("medix_user");
      if (!raw) return "A";
      const u = JSON.parse(raw);
      const n = (u?.fullName || u?.email || "A").trim();
      return n.charAt(0).toUpperCase() || "A";
    } catch {
      return "A";
    }
  }, []);

  const cards = [
    { title: "Total Medicines",   value: v(stats.totalMedicines),           subtitle: "Active inventory items",    icon: h(PillIcon),    to: "/admin/medicines", index: 0 },
    { title: "Total Orders",      value: v(stats.totalOrders),              subtitle: "All placed orders",         icon: h(OrderIcon),   to: "/admin/orders",    index: 1 },
    { title: "Approved Sales",    value: v(stats.approvedOrders),           subtitle: "Successfully completed",    icon: h(SalesIcon),   to: "/admin/orders",    index: 2 },
    { title: "Total Revenue",     value: v(stats.approvedRevenue, formatRs),subtitle: "From approved orders",      icon: h(RevenueIcon), to: "/admin/orders",    index: 3 },
    { title: "Today's Sales",     value: v(stats.todaySales, formatRs),     subtitle: "Based on today's billing",  icon: h(SalesIcon),   to: "/admin/billing",   index: 4 },
    { title: "Low Stock Items",   value: v(stats.lowStock),                 subtitle: `≤ ${LOW_STOCK_THRESHOLD} units left`, icon: h(AlertIcon), to: "/admin/medicines", tone: "danger", index: 5 },
  ];

  return h("div", { className: "ph-root" },
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
          h("div", { className: "ph-avatar" }, avatarLabel)
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
              h(NavLink, { to: "/admin/medicines", className: "ph-btn ph-btn--accent" }, "Manage Inventory"),
              h(NavLink, { to: "/admin/orders",    className: "ph-btn ph-btn--outline" }, "View All Orders"),
              h(NavLink, { to: "/admin/billing",   className: "ph-btn ph-btn--outline" }, "Go to Billing")
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