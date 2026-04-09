import { useState, useEffect } from "react";

import DashboardLayout     from "../../layouts/DashboardLayout.jsx";
import PageHeader          from "../../components/layout/PageHeader.jsx";
import { TabBar }          from "../../components/navigation/TabBar.jsx";
import Button              from "../../components/ui/Button.jsx";
import { Spinner }         from "../../components/ui/Spinner.jsx";
import { EmptyState }      from "../../components/ui/Spinner.jsx";
import { NotificationItem } from "../../components/data/domain-cards.jsx";

import useNotificationStore from "../../store/notificationStore.js";
import useAuthStore         from "../../store/authStore.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// NotificationsPage   /dashboard/notifications
// =============================================================================

const TABS = [
  { value:"all",      label:"All"      },
  { value:"unread",   label:"Unread"   },
  { value:"payment",  label:"Payments" },
  { value:"complaint",label:"Complaints"},
  { value:"system",   label:"System"   },
];

export default function NotificationsPage() {
  const profile        = useAuthStore(s => s.profile);
  const notifications  = useNotificationStore(s => s.notifications);
  const unreadCount    = useNotificationStore(s => s.unreadCount);
  const fetchNotifs    = useNotificationStore(s => s.fetchNotifications);
  const markRead       = useNotificationStore(s => s.markRead);
  const markAllRead    = useNotificationStore(s => s.markAllRead);

  const [tab,     setTab]     = useState("all");
  const [loading, setLoading] = useState(!notifications.length);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    fetchNotifs(profile.id).finally(() => setLoading(false));
  }, [profile?.id]);

  const filtered = notifications.filter(n => {
    if (tab === "all")    return true;
    if (tab === "unread") return !n.is_read;
    return n.type?.startsWith(tab);
  });

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.value === "all"    ? undefined
         : t.value === "unread" ? (unreadCount > 0 ? unreadCount : undefined)
         : undefined,
  }));

  if (loading) return (
    <DashboardLayout pageTitle="Notifications">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Notifications">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        actions={
          unreadCount > 0 && (
            <Button variant="ghost" onClick={() => profile?.id && markAllRead(profile.id)}>
              Mark all as read
            </Button>
          )
        }
      />

      <div style={{ marginBottom:20 }}>
        <TabBar tabs={tabsWithCounts} active={tab} onChange={setTab} />
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="bell" title="No notifications"
            description={tab === "unread" ? "You're all caught up!" : "You have no notifications yet."}
          />
        ) : (
          <div style={{ display:"flex", flexDirection:"column" }}>
            {filtered.map((n, i) => (
              <div key={n.id} style={{ borderBottom: i < filtered.length-1 ? "1px solid #F5EDE0" : "none" }}>
                <NotificationItem notification={n} onRead={markRead} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
