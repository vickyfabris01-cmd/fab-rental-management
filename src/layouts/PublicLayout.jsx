// src/layouts/PublicLayout.jsx — NEW FILE
//
// AIM
// The frame for every public page: header (logo, links, theme, sign in / account), the page,
// and the footer. On phones the links move into a menu drawer. The product name and support
// address come from useBrand(), so a change in Admin > Settings shows everywhere.
//
// USAGE (as a layout route)  <Route element={<PublicLayout />}> ...pages... </Route>

import "./PublicLayout.css";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button, Icon, ThemeToggle } from "../components/ui";
import { Drawer } from "../components/modals/Modal.jsx";
import BrandLogo from "../components/shell/BrandLogo.jsx";
import useBrand from "../hooks/useBrand.js";
import { useSession } from "../store/sessionStore.js";

const LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/help", label: "Help" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const name = profile?.full_name || user?.email || "";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="Home">
          <BrandLogo />
        </Link>

        <nav className="site-header__nav" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `site-link${isActive ? " is-active" : ""}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <ThemeToggle />
          {user ? (
            <Button as={Link} to="/businesses" variant="outline" size="sm" className="site-hide-sm">
              {name ? name.split(" ")[0] : "My account"}
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm" className="site-hide-sm">Sign in</Button>
              <Button as={Link} to="/signup" size="sm" className="site-hide-sm">Get started</Button>
            </>
          )}
          <button type="button" className="site-header__menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      <Drawer isOpen={open} onClose={() => setOpen(false)} title="Menu" width={320}>
        <ul className="site-drawer">
          {LINKS.map((l) => (
            <li key={l.to}><Link to={l.to} onClick={() => setOpen(false)}>{l.label}</Link></li>
          ))}
          <li className="site-drawer__sep" />
          {user ? (
            <>
              <li><Link to="/businesses" onClick={() => setOpen(false)}>My businesses</Link></li>
              <li><Link to="/account" onClick={() => setOpen(false)}>My account</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link></li>
              <li><Link to="/signup" onClick={() => setOpen(false)}>Create an account</Link></li>
            </>
          )}
        </ul>
      </Drawer>
    </header>
  );
}

export function SiteFooter() {
  const brand = useBrand();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__about">
          <BrandLogo />
          <p>{brand.tagline}</p>
          <a href={brand.mailto}>{brand.supportEmail}</a>
        </div>
        <nav aria-label="Company">
          <h2>Company</h2>
          <Link to="/about">About</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <nav aria-label="Support">
          <h2>Support</h2>
          <Link to="/help">Help centre</Link>
          <Link to="/terms">Terms of use</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
        <nav aria-label="Get started">
          <h2>Get started</h2>
          <Link to="/explore">Find a business</Link>
          <Link to="/start">List your business</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </div>
      <p className="site-footer__copy">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="site">
      <a className="site-skip" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content" className="site__main" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
