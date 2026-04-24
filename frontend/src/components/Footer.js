import React from "react";
import { Link } from "react-router-dom";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

.medix-footer {
  --footer-bg: #021320;
  --footer-bg-2: #0a1f2e;
  --footer-text: #e8f1fb;
  --footer-text-secondary: #8fb0cc;
  --footer-accent-1: #5eb0ff;
  --footer-accent-2: #7ec8ff;
  --footer-accent-3: #3d8fd9;
  --footer-divider: rgba(94, 176, 255, 0.22);
  margin-top: auto;
  position: relative;
  overflow: hidden;
  border-top: 2px solid var(--footer-divider);
  background: linear-gradient(150deg, var(--footer-bg) 0%, var(--footer-bg-2) 55%, #021320 100%);
  font-family: 'Outfit', sans-serif;
  color: var(--footer-text);
}

.medix-footer::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(700px 300px at 5% -10%, rgba(0, 110, 207, 0.12), transparent 68%),
    radial-gradient(500px 280px at 110% 105%, rgba(0, 82, 155, 0.1), transparent 70%);
  pointer-events: none;
}

.medix-footer-shell {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 32px 28px;
}

.medix-footer-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.medix-footer-brand {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  min-width: 240px;
}

.medix-footer-brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(140deg, #00529b, #006ecf);
  display: grid;
  place-items: center;
  box-shadow: 0 12px 32px rgba(0, 82, 155, 0.35);
  flex-shrink: 0;
}

.medix-footer-brand-icon svg {
  width: 24px;
  height: 24px;
  stroke: #fff;
  stroke-width: 1.6;
}

.medix-footer-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--footer-text);
  line-height: 1.2;
  letter-spacing: 0.01em;
  margin: 0 0 4px 0;
}

.medix-footer-copy {
  font-size: 13px;
  color: var(--footer-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.medix-footer-sections {
  display: flex;
  align-items: center;
  gap: 48px;
  flex: 1;
  flex-wrap: wrap;
}

.medix-footer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.medix-footer-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--footer-accent-1);
  margin: 0;
}

.medix-footer-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

.medix-footer-link {
  position: relative;
  text-decoration: none;
  color: var(--footer-text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 0;
  transition: color 0.25s ease, padding-left 0.25s ease;
  display: inline-block;
}

.medix-footer-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 4px;
  height: 2px;
  border-radius: 999px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(90deg, var(--footer-accent-1), var(--footer-accent-2));
}

.medix-footer-link:hover {
  color: var(--footer-accent-1);
  padding-left: 6px;
}

.medix-footer-link:hover::after {
  transform: scaleX(1);
  width: calc(100% - 6px);
}

.medix-footer-meta {
  width: 100%;
  padding-top: 24px;
  border-top: 1px solid var(--footer-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.medix-footer-meta-text {
  font-size: 12px;
  color: var(--footer-text-secondary);
}

.medix-footer-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(94, 176, 255, 0.12);
  border: 1px solid var(--footer-accent-1);
  font-size: 12px;
  font-weight: 700;
  color: var(--footer-accent-1);
}

.medix-footer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--footer-accent-1);
  box-shadow: 0 0 12px rgba(94, 176, 255, 0.75);
  animation: medix-pulse 2s infinite;
}

@keyframes medix-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }
}

@media (max-width: 720px) {
  .medix-footer-shell {
    padding: 32px 20px 20px;
  }

  .medix-footer-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 24px;
  }

  .medix-footer-sections {
    gap: 28px;
    width: 100%;
  }

  .medix-footer-section {
    gap: 10px;
  }

  .medix-footer-meta {
    padding-top: 20px;
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

export default function Footer({ variant = "admin" }) {
  const year = new Date().getFullYear();
  const isPublic = variant === "public";

  return (
    <>
      <style>{styles}</style>

      <footer className="medix-footer">
        <div className="medix-footer-shell">
          <div className="medix-footer-row">
            <div className="medix-footer-brand">
              <div className="medix-footer-brand-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l7 4v5c0 5.2-3 8.2-7 8.9-4-.7-7-3.7-7-8.9V7l7-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="medix-footer-title">Medix Pharmacy</div>
                <div className="medix-footer-copy">Your trusted partner in healthcare innovation and pharmacy excellence.</div>
              </div>
            </div>

            <div className="medix-footer-sections">
              <section className="medix-footer-section">
                <h3 className="medix-footer-section-title">Platform</h3>
                <nav className="medix-footer-nav" aria-label="Platform links">
                  <Link className="medix-footer-link" to="/">Home</Link>
                  <Link className="medix-footer-link" to="/medicines">Medicines</Link>
                  <Link className="medix-footer-link" to="/cart">Cart</Link>
                </nav>
              </section>
              <section className="medix-footer-section">
                <h3 className="medix-footer-section-title">Services</h3>
                <nav className="medix-footer-nav" aria-label="Services links">
                  <Link className="medix-footer-link" to="/billing">Billing</Link>
                  <Link className="medix-footer-link" to="/profile">My Account</Link>
                </nav>
              </section>
            </div>
          </div>

          <div className="medix-footer-meta">
            <span className="medix-footer-meta-text">© {year} Medix Pharmacy. All rights reserved.</span>
            <span className="medix-footer-chip">
              <span className="medix-footer-dot" />
              {isPublic ? "Public Portal" : "Admin Panel"}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}