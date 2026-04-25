import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./MedixButton.css";

/**
 * Medix design-system button. Use `to` for react-router <Link>, `nav` for <NavLink> (active class).
 * Otherwise renders <button> (default type "button" unless type="submit").
 */
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function MedixButton({
  children,
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  to,
  href,
  nav = false,
  type = "button",
  disabled,
  activeClassName,
  ...rest
}) {
  const base = ["medix-btn", `medix-btn--${variant}`];
  if (size && size !== "md") base.push(`medix-btn--${size}`);
  if (block) base.push("medix-btn--block");
  const fullClass = cx(...base, className);

  if (to) {
    if (nav) {
      return (
        <NavLink
          to={to}
          className={({ isActive }) => cx(fullClass, isActive && (activeClassName || "is-active"))}
          {...rest}
        >
          {children}
        </NavLink>
      );
    }
    return (
      <Link to={to} className={fullClass} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={fullClass} rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button className={fullClass} type={type} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}