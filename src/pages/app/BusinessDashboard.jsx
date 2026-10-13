// src/pages/app/BusinessDashboard.jsx — NEW FILE
//
// AIM
// The business dashboard in Phase 1: a welcome, the subscription status, links to the public
// page and a getting-started checklist. Phase 2 adds the real figures (occupancy, revenue,
// arrears) above the checklist; the checklist stays until every step is done.

import "../onboarding/Onboarding.css";
import { Link } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Icon, Skeleton } from "../../components/ui";
import { useBusinessContext } from "../../router/BusinessContext.jsx";
import useAsync from "../../hooks/useAsync.js";
import { supabase } from "../../config/supabase.js";
import { formatDate } from "../../lib/format.js";

async function loadSubscription(businessId) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase.from("business_subscriptions").select("*, plan:subscription_plans(name)")
    .eq("business_id", businessId).order("period_end", { ascending: false }).limit(1).maybeSingle();
  return { data, error: error?.message || null };
}

export default function BusinessDashboard() {
  const { business: b, role } = useBusinessContext();
  const { data: sub, loading } = useAsync(() => loadSubscription(b.id), [b.id]);
  const base = `/app/${b.slug}`;
  const profileDone = (b.description || "").length >= 20 && Boolean(b.phone) && Boolean(b.county);

  const items = [
    { done: true, title: "Create your account", text: "Done." },
    { done: Boolean(sub) || b.status === "active", title: "Pay your subscription", text: sub ? `${sub.plan?.name || "Plan"} paid until ${formatDate(sub.period_end)}.` : "Subscription paid." },
    { done: b.status === "active", title: "Get approved", text: "Your business is live on the platform." },
    { done: profileDone, title: "Complete your business profile", text: "Description, county and phone shown to customers.", to: `/start/details?business=${b.slug}`, label: "Edit details" },
    { done: false, title: "Add your first property", text: "Buildings, floors and rooms.", to: `${base}/properties`, label: "Open" },
    { done: false, title: "Invite a manager", text: "Share the work. Owners only.", to: `${base}/managers`, label: "Open", ownerOnly: true },
    { done: false, title: "Set your payment details", text: "Paybill or till number and billing rules.", to: `${base}/settings`, label: "Open", ownerOnly: true },
  ].filter((i) => !i.ownerOnly || role !== "manager");
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="pg" style={{ paddingTop: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "end", marginBottom: 24 }}>
        <div>
          <h2 className="pg__title">Welcome to {b.name}</h2>
          <p className="pg__lead" style={{ marginBottom: 0 }}>Let's get your business ready. {doneCount} of {items.length} steps done.</p>
        </div>
        <Button as={Link} to={`/b/${b.slug}`} variant="outline" rightIcon={<Icon name="home" size={16} />}>View public page</Button>
      </div>

      <div className="pg-grid pg-grid--2">
        <Card>
          <CardHeader title="Getting started" />
          <CardBody>
            <ul className="onb__check">
              {items.map((i) => (
                <li key={i.title} className={i.done ? "is-done" : ""}>
                  <span className="tick" aria-hidden="true">{i.done ? "✓" : ""}</span>
                  <div><strong>{i.title}</strong><span>{i.text}</span></div>
                  {!i.done && i.to && <Button as={Link} to={i.to} size="sm" variant="outline">{i.label}</Button>}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subscription" />
          <CardBody>
            {loading ? <Skeleton height={60} /> : sub ? (
              <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
                <Badge variant={new Date(sub.period_end) > new Date() ? "success" : "error"}>{new Date(sub.period_end) > new Date() ? "Active" : "Expired"}</Badge>
                <p style={{ margin: 0 }}><strong>{sub.plan?.name || "Plan"}</strong></p>
                <p style={{ margin: 0 }}>Paid until {formatDate(sub.period_end)}</p>
              </div>
            ) : <p style={{ margin: 0 }}>No subscription recorded yet.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
