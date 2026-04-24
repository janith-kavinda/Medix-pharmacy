import React from "react";
import "./MedixPublicHero.css";

/**
 * Page hero for public routes — matches landing page framing; optional right-side image.
 */
export default function MedixPublicHero({
  kicker,
  title,
  subtitle,
  image,
  imageAlt = "",
  className = "",
  headExtra = null,
  children,
}) {
  return (
    <section className={cx("medix-public-hero", "public-hero-card", className)}>
      <div className="medix-public-hero__row">
        <div className="medix-public-hero__copy">
          <div className="medix-public-hero__text">
            {kicker && <p className="public-kicker">{kicker}</p>}
            {title && <h1 className="public-title inventory-title">{title}</h1>}
            {subtitle && <p className="public-subtitle">{subtitle}</p>}
            {headExtra}
          </div>
          {children}
        </div>
        {image && (
          <div className="medix-public-hero__media">
            <div className="medix-public-hero__img-wrap">
              <img className="medix-public-hero__img" src={image} alt={imageAlt} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function cx(...args) {
  return args.filter(Boolean).join(" ");
}