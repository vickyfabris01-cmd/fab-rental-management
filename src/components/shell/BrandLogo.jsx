// src/components/shell/BrandLogo.jsx — MODIFIED (contextual: shows the business logo inside a business)
//
// AIM
// The product mark and name in one place (top bar, sidebar, public pages, auth pages).
// The mark is a PLACEHOLDER until the final logo is agreed: replace the <svg> below with the
// real logo and every screen updates. The name always comes from config/brand.js.
//
// With `contextual`, and while a screen has told the business brand store which business it is
// about (business page, room request, /app/:slug), the mark and name become that business's logo
// (or its first letter on green when it has no logo) and its name. Without `contextual`, such as
// in the footer, it is always the platform logo.
//
// PROPS
//   showName     show the name beside the mark (default true)
//   size         height of the mark in pixels (default 32)
//   contextual   use the current business instead of the platform (default false)
//   className

import { useState } from "react";
import useBrand from "../../hooks/useBrand.js";
import useBusinessBrandStore from "../../store/businessBrandStore.js";
import "./BrandLogo.css";

function BusinessMark({ business, showName, size, className }) {
  const [failedUrl, setFailedUrl] = useState("");
  const name = business.name || "";
  const showImg = business.logo_url && failedUrl !== business.logo_url;
  return (
    <span className={`shell-logo ${className}`.trim()}>
      {showImg ? (
        <img
          className="shell-logo__img"
          src={business.logo_url}
          alt={showName ? "" : name}
          width={size}
          height={size}
          onError={() => setFailedUrl(business.logo_url)}
        />
      ) : (
        <span
          className="shell-logo__letter"
          style={{ width: size, height: size }}
          role={showName ? undefined : "img"}
          aria-label={showName ? undefined : name}
          aria-hidden={showName ? "true" : undefined}
        >
          {(name.trim().charAt(0) || "?").toUpperCase()}
        </span>
      )}
      {showName && <span className="shell-logo__name shell-logo__name--business">{name}</span>}
    </span>
  );
}

export default function BrandLogo({ showName = true, size = 32, className = "", contextual = false }) {
  const BRAND = useBrand();
  const business = useBusinessBrandStore((s) => s.business);

  if (contextual && business) {
    return <BusinessMark business={business} showName={showName} size={size} className={className} />;
  }

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