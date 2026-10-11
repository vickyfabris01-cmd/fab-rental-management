// src/pages/public/HomePlaceholder.jsx — NEW FILE (TEMPORARY)
//
// AIM
// A holding page for "/" while the public website is rebuilt (the next build step replaces it
// with the real Home page, and this file is then deleted). It lets anyone who opens the site
// see the new look and jump to the component preview.

import "./HomePlaceholder.css";
import { Link } from "react-router-dom";
import { BRAND } from "../../config/brand.js";
import Button from "../../components/ui/Button.jsx";
import ThemeToggle from "../../components/ui/ThemeToggle.jsx";
import BrandLogo from "../../components/shell/BrandLogo.jsx";

export default function HomePlaceholder() {
  return (
    <div className="home-ph">
      <div className="home-ph__theme">
        <ThemeToggle />
      </div>

      <main className="home-ph__card">
        <BrandLogo size={48} />
        <h1 className="home-ph__title">{BRAND.tagline}</h1>
        <p className="home-ph__text">
          The new {BRAND.name} website is being built step by step. The public pages, sign in and
          dashboards arrive in the next steps. Until then, you can try everything that is ready.
        </p>
        <Button as={Link} to="/preview/components" size="lg">
          Open the component preview
        </Button>
      </main>
    </div>
  );
}