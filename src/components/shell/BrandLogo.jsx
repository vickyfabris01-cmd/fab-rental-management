// src/components/shell/BrandLogo.jsx — NEW FILE
//
// AIM
// The product mark and name in one place (top bar, sidebar, public pages, auth pages).
// The mark is a PLACEHOLDER until the final logo is agreed: replace the <svg> below with the
// real logo and every screen updates. The name always comes from config/brand.js.
//
// PROPS
//   showName   show the product name beside the mark (default true)
//   size       height of the mark in pixels (default 32)
//   className

import { BRAND } from "../../config/brand.js";
import "./BrandLogo.css";

export default function BrandLogo({ showName = true, size = 32, className = "" }) {
  return (
    <span className={`shell-logo ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role={showName ? undefined : "img"}
        aria-label={showName ? undefined : BRAND.name}
        aria-hidden={showName ? "true" : undefined}
        focusable="false"
      >
        <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
        {/* Placeholder leaf */}
        <path
          d="M9 22c0-7 5-12 14-12 0 8-4 13-11 13-1 0-2 0-3-1z"
          fill="var(--color-on-scrim)"
        />
        <path d="M9 24c3-5 6-8 10-10" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
      {showName && <span className="shell-logo__name">{BRAND.name}</span>}
    </span>
  );
}