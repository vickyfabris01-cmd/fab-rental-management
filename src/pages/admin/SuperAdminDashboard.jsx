import { useState, useEffect } from "react";
import {  useNavigate, Link, useLocation } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import AdminLayout from "../../layouts/AdminLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import { Spinner } from "../../components/ui/Spinner.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { GrowthLineChart } from "../../components/charts/GrowthLineChart.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import { WidgetErrorBoundary } from "../../components/feedback/ErrorBoundary.jsx";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useNotifications.js";

// ── API ───────────────────────────────────────────────────────────────────────
import {
  getTenants,
  getPlatformStats,
  approveTenant,
  suspendTenant,
  reactivateTenant,
  createTenant,
} from "../../lib/api/tenants.js";
import TenantFormModal from "../../components/modals/TenantFormModal.jsx";
import {
  getPlatformAnalytics,
  getSystemHealth,
} from "../../lib/api/analytics.js";
import { formatDate, formatRelativeTime } from "../../lib/formatters.js";

// =============================================================================
// SuperAdminDashboard  /admin
// =============================================================================

// ── Design tokens (dark admin palette) ───────────────────────────────────────
const BG = "#0F0D0C";
const SURFACE = "#1A1612";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.35)";
const DIM = "rgba(255,255,255,0.55)";
const TEXT = "rgba(255,255,255,0.88)";
const ACCENT = "#C5612C";

// ── Small primitives ──────────────────────────────────────────────────────────
const Ic = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

function StatTile({ label, value, sub, color = ACCENT, alert }) {
  return (
    <div
      style={{
        background: alert ? "rgba(197,97,44,0.08)" : SURFACE,
        borderRadius: 14,
        border: `1px solid ${alert ? "rgba(197,97,44,0.3)" : BORDER}`,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
          }}
        />
        {alert && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#F59E0B",
              background: "rgba(245,158,11,0.12)",
              padding: "2px 7px",
              borderRadius: 999,
            }}
          >
            {alert}
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: 28,
          color: TEXT,
          margin: "0 0 3px",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{label}</p>
      {sub && (
        <p style={{ fontSize: 11, color, margin: "2px 0 0", fontWeight: 600 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function TenantStatusBadge({ status }) {
  const cfg = {
    active: {
      bg: "rgba(16,185,129,0.12)",
      color: "#10B981",
      border: "rgba(16,185,129,0.25)",
    },
    pending: {
      bg: "rgba(245,158,11,0.12)",
      color: "#F59E0B",
      border: "rgba(245,158,11,0.25)",
    },
    suspended: {
      bg: "rgba(239,68,68,0.12)",
      color: "#EF4444",
      border: "rgba(239,68,68,0.25)",
    },
  };
  const s = cfg[status] ?? cfg.active;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function ActionBtn({ onClick, icon, title, variant = "neutral" }) {
  const colors = {
    approve: {
      bg: "rgba(16,185,129,0.10)",
      hover: "rgba(16,185,129,0.22)",
      color: "#10B981",
      border: "rgba(16,185,129,0.22)",
    },
    suspend: {
      bg: "rgba(239,68,68,0.10)",
      hover: "rgba(239,68,68,0.22)",
      color: "#EF4444",
      border: "rgba(239,68,68,0.22)",
    },
    neutral: {
      bg: "rgba(255,255,255,0.05)",
      hover: "rgba(255,255,255,0.1)",
      color: DIM,
      border: "transparent",
    },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = c.hover)}
      onMouseOut={(e) => (e.currentTarget.style.background = c.bg)}
    >
      {icon}
    </button>
  );
}

// ── Shared table header row ───────────────────────────────────────────────────
function THead({ cols }) {
  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      {cols.map((c) => (
        <th
          key={c}
          style={{
            padding: "9px 16px",
            textAlign: "left",
            fontSize: 10,
            fontWeight: 700,
            color: MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {c}
        </th>
      ))}
    </tr>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();
  const toast = useToast();
  const [newTenantOpen, setNewTenantOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    const [{ data: st }, { data: ten }, { data: anl }, { data: hlth }] =
      await Promise.all([
        getPlatformStats(),
        getTenants({ limit: 20 }),
        getPlatformAnalytics(),
        getSystemHealth(),
      ]);
    setStats(st);
    setTenants(ten ?? []);
    setAnalytics(anl);
    setHealth(hlth ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (tenantId, action) => {
    setActioning(tenantId);
    try {
      const fn =
        action === "approve"
          ? approveTenant
          : action === "suspend"
            ? suspendTenant
            : reactivateTenant;
      const { error } = await fn(tenantId);
      if (error) throw new Error(error.message);
      toast.success(
        `Tenant ${action === "approve" ? "approved" : action === "suspend" ? "suspended" : "reactivated"}.`,
      );
      load();
    } catch (e) {
      toast.error(e.message ?? "Action failed.");
    } finally {
      setActioning(null);
    }
  };

  const filtered =
    filterStatus === "all"
      ? tenants
      : tenants.filter((t) => t.status === filterStatus);
  const pendingCount = tenants.filter((t) => t.status === "pending").length;

  // Build growth chart data from analytics or derived
  const growthData = analytics?.growth ?? [];

  if (loading)
    return (
      <AdminLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <style>{`
        @keyframes adminFU{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .afu1{animation:adminFU 0.35s 0.04s ease both} .afu2{animation:adminFU 0.35s 0.08s ease both}
        .afu3{animation:adminFU 0.35s 0.12s ease both} .afu4{animation:adminFU 0.35s 0.16s ease both}
        .afu5{animation:adminFU 0.35s 0.20s ease both}
        .t-row:hover{background:rgba(255,255,255,0.025)!important}
      `}</style>

      {/* ── KPI tiles ── */}
      <div
        className="afu1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatTile
          label="Active Tenants"
          value={stats?.tenants?.active ?? 0}
          sub={`${stats?.tenants?.pending ?? 0} pending`}
          color={ACCENT}
          alert={pendingCount > 0 ? `${pendingCount} pending` : null}
        />
        <StatTile
          label="Total Users"
          value={(stats?.users?.total ?? 0).toLocaleString()}
          sub={`${stats?.users?.client ?? 0} residents`}
          color="#3B82F6"
        />
        <StatTile
          label="Managers"
          value={stats?.users?.manager ?? 0}
          sub={`${stats?.users?.owner ?? 0} owners`}
          color="#8B5CF6"
        />
        <StatTile
          label="Suspended"
          value={stats?.tenants?.suspended ?? 0}
          sub="tenant accounts"
          color="#EF4444"
        />
        {analytics?.mrr && (
          <StatTile
            label="Platform MRR"
            value={`KES ${(analytics.mrr / 1000).toFixed(0)}K`}
            sub="monthly recurring"
            color="#10B981"
          />
        )}
      </div>

      {/* ── Growth chart + System health ── */}
      <div
        className="afu2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Growth chart */}
        <div
          style={{
            background: SURFACE,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: ACCENT,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 3px",
            }}
          >
            Platform Growth
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: TEXT,
              marginBottom: 14,
            }}
          >
            Tenants & Users
          </h3>
          {growthData.length > 0 ? (
            <WidgetErrorBoundary label="GrowthLineChart">
              <GrowthLineChart data={growthData} height={180} />
            </WidgetErrorBoundary>
          ) : (
            // Placeholder when FastAPI not wired yet
            <div
              style={{
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px dashed ${BORDER}`,
                borderRadius: 12,
              }}
            >
              <p style={{ fontSize: 12, color: MUTED }}>
                Growth data available via FastAPI
              </p>
            </div>
          )}
        </div>

        {/* System health */}
        <div
          style={{
            background: SURFACE,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: ACCENT,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 3px",
            }}
          >
            Infrastructure
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: TEXT,
              marginBottom: 14,
            }}
          >
            System Health
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {health.length > 0
              ? health.map((s) => {
                  const ok = s.status === "healthy";
                  return (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: ok ? "#10B981" : "#F59E0B",
                          boxShadow: ok ? "none" : "0 0 6px #F59E0B",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: ok ? DIM : "#F59E0B",
                          flex: 1,
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: MUTED,
                          fontFamily: "'DM Mono','Courier New',monospace",
                        }}
                      >
                        {s.latency}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: ok ? "#10B981" : "#F59E0B",
                        }}
                      >
                        {s.uptime}
                      </span>
                    </div>
                  );
                })
              : [
                  {
                    label: "Database",
                    status: "healthy",
                    uptime: "99.99%",
                    latency: "12ms",
                  },
                  {
                    label: "Auth Service",
                    status: "healthy",
                    uptime: "100%",
                    latency: "8ms",
                  },
                  {
                    label: "M-Pesa API",
                    status: "healthy",
                    uptime: "99.7%",
                    latency: "340ms",
                  },
                  {
                    label: "SMS Gateway",
                    status: "warning",
                    uptime: "98.2%",
                    latency: "620ms",
                  },
                  {
                    label: "FastAPI",
                    status: "healthy",
                    uptime: "99.95%",
                    latency: "22ms",
                  },
                ].map((s) => {
                  const ok = s.status === "healthy";
                  return (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: ok ? "#10B981" : "#F59E0B",
                          boxShadow: ok ? "none" : "0 0 6px #F59E0B",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: ok ? DIM : "#F59E0B",
                          flex: 1,
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: MUTED,
                          fontFamily: "'DM Mono','Courier New',monospace",
                        }}
                      >
                        {s.latency}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: ok ? "#10B981" : "#F59E0B",
                        }}
                      >
                        {s.uptime}
                      </span>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* ── Tenants table ── */}
      <div
        className="afu3"
        style={{
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: ACCENT,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 2px",
              }}
            >
              Management
            </p>
            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                color: TEXT,
                margin: 0,
              }}
            >
              All Tenants
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setNewTenantOpen(true)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 10,
                background: ACCENT,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Tenant
            </button>
            {["all", "active", "pending", "suspended"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: filterStatus === s ? ACCENT : "transparent",
                  color: filterStatus === s ? "#fff" : MUTED,
                  borderColor: filterStatus === s ? ACCENT : BORDER,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s === "pending" && pendingCount > 0 && (
                  <span
                    style={{
                      marginLeft: 5,
                      background: "#F59E0B",
                      color: "#0F0D0C",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 999,
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
            <Link
              to="/admin/tenants"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: ACCENT,
                textDecoration: "none",
                marginLeft: 4,
              }}
            >
              View all →
            </Link>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
          >
            <thead>
              <THead
                cols={[
                  "Tenant",
                  "Owner",
                  "Status",
                  "Plan",
                  "Joined",
                  "Actions",
                ]}
              />
            </thead>
            <tbody>
              {filtered.slice(0, 10).map((t, i) => (
                <tr
                  key={t.id}
                  className="t-row"
                  style={{
                    borderBottom:
                      i < Math.min(filtered.length, 10) - 1
                        ? `1px solid ${BORDER}`
                        : "none",
                  }}
                >
                  <td style={{ padding: "11px 16px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "rgba(197,97,44,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: ACCENT,
                          flexShrink: 0,
                        }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: TEXT,
                            margin: 0,
                          }}
                        >
                          {t.name}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: MUTED,
                            margin: "1px 0 0",
                            fontFamily: "'DM Mono','Courier New',monospace",
                          }}
                        >
                          {t.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{ padding: "11px 16px", fontSize: 12, color: DIM }}
                  >
                    {t.email ?? "—"}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <TenantStatusBadge status={t.status} />
                  </td>
                  <td
                    style={{
                      padding: "11px 16px",
                      fontSize: 11,
                      color: MUTED,
                      textTransform: "capitalize",
                    }}
                  >
                    {t.plan ?? "basic"}
                  </td>
                  <td
                    style={{ padding: "11px 16px", fontSize: 11, color: MUTED }}
                  >
                    {formatDate(t.created_at)}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <ActionBtn
                        onClick={() => navigate(`/admin/tenants/${t.id}`)}
                        icon={
                          <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z" />
                        }
                        title="View"
                        variant="neutral"
                      />
                      {t.status === "pending" && (
                        <ActionBtn
                          onClick={() => handleAction(t.id, "approve")}
                          icon={<Ic d="M5 13l4 4L19 7" />}
                          title="Approve"
                          variant="approve"
                          disabled={actioning === t.id}
                        />
                      )}
                      {t.status === "active" && (
                        <ActionBtn
                          onClick={() => handleAction(t.id, "suspend")}
                          icon={<Ic d="M18 6L6 18M6 6l12 12" />}
                          title="Suspend"
                          variant="suspend"
                          disabled={actioning === t.id}
                        />
                      )}
                      {t.status === "suspended" && (
                        <ActionBtn
                          onClick={() => handleAction(t.id, "reactivate")}
                          icon={<Ic d="M5 13l4 4L19 7" />}
                          title="Reactivate"
                          variant="approve"
                          disabled={actioning === t.id}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                textAlign: "center",
                padding: "32px",
              }}
            >
              No tenants found.
            </p>
          )}
        </div>

        <div
          style={{
            padding: "10px 20px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
            Showing {Math.min(filtered.length, 10)} of {filtered.length} tenants
          </p>
          <Link
            to="/admin/tenants"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: ACCENT,
              textDecoration: "none",
            }}
          >
            View all {tenants.length} tenants →
          </Link>
        </div>
      </div>

      {/* ── User role breakdown ── */}
      {stats?.users && (
        <div
          className="afu4"
          style={{
            background: SURFACE,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: ACCENT,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 3px",
            }}
          >
            Platform Users
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: TEXT,
              marginBottom: 14,
            }}
          >
            Users by Role
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
              gap: 10,
            }}
          >
            {[
              ["Residents", stats.users.client ?? 0, "#10B981"],
              ["Managers", stats.users.manager ?? 0, "#3B82F6"],
              ["Owners", stats.users.owner ?? 0, "#8B5CF6"],
              ["Workers", stats.users.worker ?? 0, "#F59E0B"],
              ["Visitors", stats.users.visitor ?? 0, MUTED],
            ].map(([label, count, color]) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  padding: "12px 14px",
                }}
              >
                <p style={{ fontSize: 11, color: MUTED, margin: "0 0 5px" }}>
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 900,
                    fontSize: 22,
                    color: TEXT,
                    margin: 0,
                  }}
                >
                  {count.toLocaleString()}
                </p>
                <div
                  style={{
                    marginTop: 8,
                    height: 3,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: color,
                      width: `${stats.users.total > 0 ? Math.round((count / stats.users.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <TenantFormModal
        open={newTenantOpen}
        onClose={() => setNewTenantOpen(false)}
        onCreated={(t) => {
          setNewTenantOpen(false);
          load();
          toast.success(`Tenant "${t.name}" created.`);
        }}
      />
    </AdminLayout>
  );
}
