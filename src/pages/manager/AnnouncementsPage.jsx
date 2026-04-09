import { useState, useEffect, useCallback } from "react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/Spinner.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import AnnouncementModal from "../../components/modals/AnnouncementModal.jsx";

import useAuthStore from "../../store/authStore.js";
import { getAnnouncementsByTenant } from "../../lib/api/notifications.js";
import { formatDate, formatRelativeTime } from "../../lib/formatters.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// AnnouncementsPage  /manage/announcements
//
// Shows the history of broadcast notifications (type = 'announcement') that
// this manager has sent, and lets them compose a new one.
// =============================================================================

const AUDIENCE_ICON = { clients: "🏠", workers: "👷", all: "📢" };

function AnnouncementCard({ notif }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #EDE4D8",
        padding: "16px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#FFF5EF",
              border: "1px solid rgba(197,97,44,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {AUDIENCE_ICON[notif.data?.audience] ?? "📢"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1A1412",
                margin: "0 0 3px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notif.title}
            </p>
            <p style={{ fontSize: 12, color: "#8B7355", margin: 0 }}>
              {formatDate(notif.created_at)} ·{" "}
              {formatRelativeTime(notif.created_at)}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#C5612C",
            background: "rgba(197,97,44,0.08)",
            border: "1px solid rgba(197,97,44,0.2)",
            borderRadius: 999,
            padding: "3px 10px",
            flexShrink: 0,
            textTransform: "capitalize",
          }}
        >
          {notif.data?.audience ?? "all"}
        </span>
      </div>
      {notif.body && (
        <p
          style={{
            fontSize: 13,
            color: "#5C4A3A",
            lineHeight: 1.65,
            margin: 0,
            padding: "10px 12px",
            background: "#FAF7F2",
            borderRadius: 10,
          }}
        >
          {notif.body}
        </p>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();
  const tenantId = profile?.tenant_id;

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    // Fetch all announcements (type='announcement') sent within this tenant
    getAnnouncementsByTenant(tenantId, { limit: 40 })
      .then(({ data }) => setAnnouncements(data ?? []))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout pageTitle="Announcements">
      <PageHeader
        title="Announcements"
        subtitle="Send updates and notices to residents or staff"
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            + Send Announcement
          </Button>
        }
      />

      {/* Compose prompt banner */}
      {announcements.length === 0 && !loading && (
        <div
          style={{
            background: "linear-gradient(120deg,#1A1412 0%,#2D1E16 100%)",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 22,
                color: "#fff",
                margin: "0 0 6px",
              }}
            >
              No announcements yet
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
              }}
            >
              Send a notice to all residents about upcoming events, maintenance,
              or reminders.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Send First Announcement
          </Button>
        </div>
      )}

      {/* History */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size="lg" />
        </div>
      ) : announcements.length === 0 ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: "#1A1412",
              margin: 0,
            }}
          >
            Recent Announcements
          </h3>
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} notif={a} />
          ))}
        </div>
      )}

      <AnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          load();
        }}
      />
    </DashboardLayout>
  );
}
