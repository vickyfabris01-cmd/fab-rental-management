import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoSrc      from "../assets/logo.svg";
import LogoWhiteSrc from "../assets/logo-white.svg";

// =============================================================================
// PublicLayout
//
// Wraps all unauthenticated pages: /, /browse, /property/:slug
//
// Features:
//   - Transparent navbar on load → opaque + shadow after 40px scroll
//   - Active nav-link underline animation
//   - Mobile hamburger → slide-down drawer
//   - Full-width content slot (no max-width constraint — pages set their own)
//   - Footer with logo, links, copyright
//
// Usage:
//   <PublicLayout>
//     <HeroSection />
//     <PropertiesSection />
//   </PublicLayout>
// =============================================================================

const NAV_LINKS = [
  { label: "Properties",   href: "/#properties" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "For Managers", href: "/signup?role=manager" },
  { label: "Pricing",      href: "/#pricing" },
];

const FOOTER_COLS = [
  {
    heading: "Product",
    links: [
      { label: "Browse Properties", href: "/browse" },
      { label: "How It Works",      href: "/#how-it-works" },
      { label: "For Managers",      href: "/signup?role=manager" },
      { label: "Pricing",           href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us",    href: "#" },
      { label: "Blog",        href: "#" },
      { label: "Careers",     href: "#" },
      { label: "Contact",     href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",  href: "#" },
      { label: "Terms of Service",href: "#" },
      { label: "Cookie Policy",   href: "#" },
    ],
  },
];

export default function PublicLayout({ children }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    fn(); // run once on mount
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; background: #FAF7F2; color: #1A1412; }

        .pub-nav-link {
          position: relative;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #1A1412;
          padding-bottom: 3px;
          transition: color 0.15s ease;
        }
        .pub-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1.5px;
          background: #C5612C;
          transition: width 0.22s ease;
        }
        .pub-nav-link:hover { color: #C5612C; }
        .pub-nav-link:hover::after { width: 100%; }
        .pub-nav-link.active::after { width: 100%; }
        .pub-nav-link.active { color: #C5612C; }

        .pub-footer-link {
          text-decoration: none;
          font-size: 13px;
          color: #8B7355;
          transition: color 0.15s;
        }
        .pub-footer-link:hover { color: #C5612C; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-down { animation: slideDown 0.2s ease both; }

        @media (max-width: 767px) { .pub-desk { display: none !important; } }
        @media (min-width: 768px) { .pub-mob  { display: none !important; } }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s",
        background:     scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)"              : "none",
        boxShadow:      scrolled ? "0 1px 0 rgba(0,0,0,0.07)" : "none",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
            <img src={LogoSrc} alt="fabrentals" style={{ height: 30, width: "auto", display: "block" }} />
          </Link>

          {/* Desktop nav */}
          <div className="pub-desk" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className={`pub-nav-link${location.hash === l.href.split("/")[1] ? " active" : ""}`}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="pub-desk" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link to="/login" style={{
              fontSize: 14, fontWeight: 500, color: "#1A1412",
              textDecoration: "none", padding: "8px 16px", borderRadius: 999,
              transition: "color 0.15s",
            }}
              onMouseOver={e => e.currentTarget.style.color = "#C5612C"}
              onMouseOut={e  => e.currentTarget.style.color = "#1A1412"}
            >
              Sign in
            </Link>
            <Link to="/signup" style={{
              fontSize: 14, fontWeight: 600,
              background: "#C5612C", color: "#fff",
              textDecoration: "none",
              padding: "10px 22px", borderRadius: 999,
              transition: "background 0.18s",
            }}
              onMouseOver={e => e.currentTarget.style.background = "#A84E22"}
              onMouseOut={e  => e.currentTarget.style.background = "#C5612C"}
            >
              Get Started →
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="pub-mob"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#1A1412", display: "flex", alignItems: "center" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="slide-down" style={{
            background: "#fff",
            borderTop: "1px solid #EDE4D8",
            padding: "16px 28px 24px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 15, fontWeight: 500, color: "#1A1412", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #EDE4D8", margin: "4px 0" }} />
            <Link to="/login" style={{ fontSize: 15, fontWeight: 500, color: "#1A1412", textDecoration: "none" }}>Sign in</Link>
            <Link to="/signup" style={{
              fontSize: 15, fontWeight: 600,
              background: "#C5612C", color: "#fff",
              textDecoration: "none", textAlign: "center",
              padding: "13px", borderRadius: 999,
            }}>
              Get Started →
            </Link>
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main style={{ minHeight: "100vh" }}>
        {children}
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "#1A1412", paddingTop: 64, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px" }}>

          {/* Top row: logo + columns */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>

            {/* Brand column */}
            <div>
              <Link to="/" style={{ display: "inline-flex", textDecoration: "none" }}>
                <img src={LogoWhiteSrc} alt="fabrentals" style={{ height: 28, width: "auto" }} />
              </Link>
              <p style={{ fontSize: 14, color: "#8B7355", lineHeight: 1.7, marginTop: 16, maxWidth: 280, fontWeight: 300 }}>
                Kenya's modern rental management platform. Connecting residents with quality housing across the country.
              </p>
              {/* Social icons */}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                {[
                  { label: "Twitter/X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.628 5.903-5.628zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                ].map(s => (
                  <a key={s.label} href="#" aria-label={s.label} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    textDecoration: "none",
                    transition: "background 0.18s",
                  }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(197,97,44,0.3)"}
                    onMouseOut={e  => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#A89080">
                      <path d={s.path}/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map(col => (
              <div key={col.heading}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C5612C", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                  {col.heading}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l.label} href={l.href} className="pub-footer-link">{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ fontSize: 12, color: "#5C4A3A" }}>
              © {new Date().getFullYear()} fabrentals. Built for Kenya's rental market.
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy", "Terms", "Cookies"].map(l => (
                <a key={l} href="#" className="pub-footer-link" style={{ fontSize: 12 }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive footer grid */}
      <style>{`
        @media (max-width: 900px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
