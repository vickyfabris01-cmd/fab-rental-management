// src/pages/public/BusinessPage.jsx — NEW FILE
//
// AIM
// The public page of one approved business at /b/:slug: name, type, description, location,
// contact buttons (call, WhatsApp, email). Reviews and stars are left out on purpose.
// For rentals, "Request a room" leads to /b/:slug/request (built in Phase 2; until then it
// shows the ComingSoon page). A business that is not active shows "not found".

import "./BusinessPage.css";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Icon, Skeleton, SkeletonText } from "../../components/ui";
import { typeLabel } from "../../config/counties.js";
import useAsync from "../../hooks/useAsync.js";
import { getBusinessBySlug } from "../../lib/api/directory.js";
import { toE164 } from "../../lib/phone.js";

export default function BusinessPage() {
  const { slug } = useParams();
  const { data: b, error, loading } = useAsync(() => getBusinessBySlug(slug), [slug]);

  if (loading) {
    return (
      <div className="pg">
        <Skeleton height={220} style={{ borderRadius: "var(--radius-lg)" }} />
        <div style={{ marginTop: 24 }}><Skeleton width="40%" height={28} /><SkeletonText lines={3} /></div>
      </div>
    );
  }
  if (error || !b) {
    return (
      <div className="pg pg--narrow">
        <Card>
          <EmptyState icon="search" title={error ? "This page could not be loaded" : "Business not found"}
            description={error || "It may not be approved yet, or the address is wrong."}
            action={<Button as={Link} to="/explore">Explore businesses</Button>} />
        </Card>
      </div>
    );
  }

  const wa = toE164(b.whatsapp || b.phone);
  const place = [b.address, b.county].filter(Boolean).join(", ");

  return (
    <div className="pg">
      <nav className="bpage__crumbs" aria-label="Breadcrumb"><Link to="/explore">Explore</Link> / <span>{b.name}</span></nav>
      <div className="bpage__cover" style={b.cover_url ? { backgroundImage: `url(${b.cover_url})` } : undefined}>
        {!b.cover_url && <span aria-hidden="true">{b.name.charAt(0).toUpperCase()}</span>}
      </div>

      <div className="bpage__grid">
        <div>
          <div className="bpage__title-row">
            <h1 className="pg__title">{b.name}</h1>
            <Badge variant="brand">{typeLabel(b.business_type)}</Badge>
          </div>
          {place && <p className="bpage__place"><Icon name="home" size={16} /> {place}</p>}
          <h2>About</h2>
          <p>{b.description || "This business has not added a description yet."}</p>
        </div>

        <Card className="bpage__side">
          <h2 className="bpage__side-title">Contact</h2>
          {b.business_type === "rental" && (
            <Button as={Link} to={`/b/${b.slug}/request`} size="lg" fullWidth>Request a room</Button>
          )}
          {b.phone && <Button as="a" href={`tel:${b.phone}`} variant="outline" fullWidth>Call {b.phone}</Button>}
          {wa && <Button as="a" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" variant="outline" fullWidth>WhatsApp</Button>}
          {b.email && <Button as="a" href={`mailto:${b.email}`} variant="ghost" fullWidth>{b.email}</Button>}
        </Card>
      </div>
    </div>
  );
}
