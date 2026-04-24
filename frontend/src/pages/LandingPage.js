import React, { useCallback, useEffect, useState } from "react";
import MedixButton from "../components/ui/MedixButton";
import "./LandingPage.css";
import pharmacistStockImage from "../images/female-pharmacist-with-table-checking-stock-pharmacy.jpg";
import pharmacistCounterImage from "../images/pharmacist-day-celebration-with-male-pharmacist.jpg";
import pharmacistScannerImage from "../images/young-hispanic-man-pharmacist-smiling-confident-scanning-pills-bottle-pharmacy.jpg";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("medix_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l8 4v5c0 5.5-3.3 8.7-8 9-4.7-.3-8-3.5-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.4" />
      <rect x="14" y="3" width="7" height="7" rx="1.4" />
      <rect x="3" y="14" width="7" height="7" rx="1.4" />
      <rect x="14" y="14" width="7" height="7" rx="1.4" />
    </svg>
  );
}

function BillIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function PillsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.8 8.2a4.6 4.6 0 0 1 0 6.5l-3.1 3.1a4.6 4.6 0 0 1-6.5-6.5l3.1-3.1a4.6 4.6 0 0 1 6.5 0z" />
      <path d="M8.3 15.7l7.4-7.4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 11a3 3 0 1 0-2.9-3.8" />
      <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M2.8 19.2a4.6 4.6 0 0 1 8.4 0" />
      <path d="M13.5 18.8a4 4 0 0 1 7 0" />
    </svg>
  );
}

const modules = [
  {
    title: "Inventory Intelligence",
    description: "Track quantities, expiry dates, and supplier performance from one reliable dashboard.",
    icon: <GridIcon />,
  },
  {
    title: "Fast, Accurate Billing",
    description: "Create patient bills in seconds with tax-ready records and complete daily summaries.",
    icon: <BillIcon />,
  },
  {
    title: "Patient-Ready Counter",
    description: "Search medicine stock quickly, prepare orders cleanly, and reduce service delays.",
    icon: <PillsIcon />,
  },
];

const trustStats = [
  { value: "99.9%", label: "Billing Uptime" },
  { value: "< 10 sec", label: "Average Checkout" },
  { value: "24/7", label: "Access to Records" },
  { value: "Secure", label: "Data Protection" },
];

const galleryImages = [
  {
    src: pharmacistStockImage,
    title: "Inventory Monitoring",
    alt: "Pharmacist checking medicine stock in shelves",
  },
  {
    src: pharmacistCounterImage,
    title: "Counter Operations",
    alt: "Pharmacist serving at the pharmacy counter",
  },
  {
    src: pharmacistScannerImage,
    title: "Fast Billing Flow",
    alt: "Pharmacist scanning medicine bottle for billing",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(getCurrentUser()?._id || getCurrentUser()?.email)
  );

  const syncAuth = useCallback(() => {
    const u = getCurrentUser();
    setIsLoggedIn(Boolean(u?._id || u?.email));
  }, []);

  const ctaUser = getCurrentUser();
  const isAdmin = Boolean(
    ctaUser && String(ctaUser?.role).toLowerCase() === "admin"
  );

  useEffect(() => {
    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [syncAuth]);

  return (
    <div className="landing-home">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-badge">Smart Pharmacy Operations</p>
          <h1 id="landing-title">Run your pharmacy with speed, clarity, and confidence.</h1>
          <p className="landing-subtext">
            Medix combines inventory control, billing, and customer workflow in one professional system built for modern pharmacies.
          </p>

          <div className="landing-hero-actions">
            {isLoggedIn ? (
              <MedixButton to="/cart" variant="primary">
                View my cart
                <ArrowRightIcon />
              </MedixButton>
            ) : (
              <MedixButton to="/login" variant="primary">
                Log in
                <ArrowRightIcon />
              </MedixButton>
            )}
            <MedixButton to="/medicines" variant="ghost">
              Browse Medicines
            </MedixButton>
          </div>
        </div>

        <aside className="landing-hero-panel" aria-label="Operational snapshot">
          <img
            className="landing-hero-image"
            src={pharmacistStockImage}
            alt="Pharmacist checking stock records"
            loading="eager"
          />
          <h2>Daily Operations Snapshot</h2>
          <div className="landing-panel-grid">
            <article>
              <span className="label">Stock Alerts</span>
              <strong>06 items</strong>
              <p>Requires replenishment today</p>
            </article>
            <article>
              <span className="label">Bills Generated</span>
              <strong>184 bills</strong>
              <p>Current shift performance</p>
            </article>
            <article>
              <span className="label">Orders Delivered</span>
              <strong>97%</strong>
              <p>On-time delivery success</p>
            </article>
          </div>
        </aside>
      </section>

      <section className="landing-stats" aria-label="Performance indicators">
        {trustStats.map((stat) => (
          <article key={stat.label} className="landing-stat-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="landing-gallery" aria-label="Pharmacy team gallery">
        {galleryImages.map((item) => (
          <article key={item.title} className="landing-gallery-card">
            <img src={item.src} alt={item.alt} loading="lazy" />
            <div className="landing-gallery-caption">{item.title}</div>
          </article>
        ))}
      </section>

      <section className="landing-modules" aria-labelledby="landing-modules-title">
        <header>
          <p className="landing-section-tag">Core Modules</p>
          <h2 id="landing-modules-title">Everything your pharmacy team needs in one workflow.</h2>
        </header>

        <div className="landing-module-grid">
          {modules.map((module) => (
            <article key={module.title} className="landing-module-card">
              <div className="landing-module-icon">{module.icon}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-workflow" aria-labelledby="landing-workflow-title">
        <div>
          <p className="landing-section-tag">Workflow</p>
          <h2 id="landing-workflow-title">From stock entry to final billing, the process stays clean.</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <p>Add new stock with expiry dates and supplier details.</p>
          </li>
          <li>
            <span>02</span>
            <p>Serve customers quickly with searchable medicine records.</p>
          </li>
          <li>
            <span>03</span>
            <p>Generate invoices and keep transparent audit-ready history.</p>
          </li>
        </ol>
      </section>

      <section className="landing-cta" aria-label="Call to action">
        <div>
          <h2>Ready to modernize your pharmacy?</h2>
          <p>Set up your workspace and manage medicines, orders, and billing from a single professional dashboard.</p>
        </div>
        <div className="landing-cta-actions">
          <MedixButton
            to={!isLoggedIn ? "/signup" : isAdmin ? "/admin" : "/profile"}
            variant="primary"
          >
            {!isLoggedIn ? "Create Account" : isAdmin ? "Go to Dashboard" : "My account"}
          </MedixButton>
          <div className="landing-cta-note">
            <ShieldIcon />
            <span>Secure data handling and role-based access</span>
          </div>
          <div className="landing-cta-note">
            <PeopleIcon />
            <span>Built for pharmacy admins and sales counters</span>
          </div>
        </div>
      </section>
    </div>
  );
}