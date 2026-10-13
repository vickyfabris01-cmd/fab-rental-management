// src/pages/public/HomePage.jsx — NEW FILE (replaces HomePlaceholder)
//
// AIM
// The front door: what the product is, the business types, how it works, a few live
// businesses and the call to list your own. Everything shown here is real: the business list
// comes from the database and shows a skeleton, then cards, or a friendly message.

import "./HomePage.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Icon } from "../../components/ui";
import BusinessCard, { BusinessCardSkeleton } from "../../components/business/BusinessCard.jsx";
import { BUSINESS_TYPES } from "../../config/counties.js";
import useAsync from "../../hooks/useAsync.js";
import useBrand from "../../hooks/useBrand.js";
import { listBusinesses } from "../../lib/api/directory.js";

const STEPS = [
  { icon: "user", title: "Create your account", text: "Sign up with your email, phone number or Google. It takes a minute." },
  { icon: "building", title: "Set up your business", text: "Pick the type, add your details and choose a subscription. Pay with M-Pesa." },
  { icon: "success", title: "Get approved and go live", text: "We check your details. Once approved, customers can find you and you can start managing." },
];

export default function HomePage() {
  const brand = useBrand();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const { data, error, loading } = useAsync(() => listBusinesses({ limit: 6 }), []);

  function search(e) {
    e.preventDefault();
    navigate(`/explore${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`);
  }

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__inner">
          <h1 className="home-hero__title">{brand.tagline}</h1>
          <p className="home-hero__lead">
            {brand.name} helps Kenyan businesses run day to day work in one place, and helps customers find them.
            Rentals are open today. Agriculture and shops are coming.
          </p>
          <form className="home-hero__search" onSubmit={search} role="search">
            <label htmlFor="home-q" className="home-hero__label">Search businesses</label>
            <input id="home-q" className="ui-control home-hero__input" value={term} onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name or place, for example Nakuru" />
            <Button type="submit" size="lg" leftIcon={<Icon name="search" size={18} />}>Search</Button>
          </form>
          <div className="home-hero__cta">
            <Button as={Link} to="/start" variant="outline">List your business</Button>
            <Link to="/explore" className="home-hero__link">Browse all businesses</Link>
          </div>
        </div>
      </section>

      <section className="pg">
        <h2 className="pg__title">What you can run on {brand.name}</h2>
        <div className="pg-grid pg-grid--3">
          {BUSINESS_TYPES.map((t) => (
            <Card key={t.value} className="home-type">
              <div className="home-type__head">
                <h3>{t.label}</h3>
                {t.open ? <Badge variant="success">Open</Badge> : <Badge variant="neutral">Coming soon</Badge>}
              </div>
              <p>{t.blurb}</p>
              {t.open && <Link to={`/explore?type=${t.value}`} className="home-type__link">Browse {t.label.toLowerCase()} businesses</Link>}
            </Card>
          ))}
        </div>
      </section>

      <section className="pg">
        <h2 className="pg__title">How it works</h2>
        <div className="pg-grid pg-grid--3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="home-step">
              <span className="home-step__n" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="pg">
        <div className="home-list__head">
          <h2 className="pg__title">Businesses on {brand.name}</h2>
          <Link to="/explore">See all</Link>
        </div>
        {loading ? (
          <div className="pg-grid pg-grid--3">{[0, 1, 2].map((i) => <BusinessCardSkeleton key={i} />)}</div>
        ) : error ? (
          <Card><EmptyState icon="info" title="Businesses could not be loaded" description={error} compact /></Card>
        ) : data.length === 0 ? (
          <Card><EmptyState icon="building" title="No businesses yet" description="Approved businesses appear here. Be the first to list yours."
            action={<Button as={Link} to="/start">List your business</Button>} compact /></Card>
        ) : (
          <div className="pg-grid pg-grid--3">{data.map((b) => <BusinessCard key={b.id} business={b} />)}</div>
        )}
      </section>

      <section className="pg">
        <Card className="home-cta">
          <h2>Ready to list your business?</h2>
          <p>Create an account, choose a subscription and send your business for approval. See the prices first if you like.</p>
          <div className="home-cta__actions">
            <Button as={Link} to="/start" size="lg">Get started</Button>
            <Button as={Link} to="/pricing" variant="outline" size="lg">See pricing</Button>
          </div>
        </Card>
      </section>
    </>
  );
}
