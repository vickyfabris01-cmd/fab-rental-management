import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate }                    from "react-router-dom";

import DashboardLayout   from "../../layouts/DashboardLayout.jsx";
import PageHeader        from "../../components/layout/PageHeader.jsx";
import Badge             from "../../components/ui/Badge.jsx";
import Avatar            from "../../components/ui/Avatar.jsx";
import Button            from "../../components/ui/Button.jsx";
import { Spinner }       from "../../components/ui/Spinner.jsx";
import { Alert }         from "../../components/ui/Alert.jsx";

import useAuthStore      from "../../store/authStore.js";
import { getComplaint, getComplaintMessages, addComplaintMessage } from "../../lib/api/complaints.js";
import { useComplaintMessagesRealtime } from "../../hooks/useRealtime.js";
import { formatDate, formatRelativeTime } from "../../lib/formatters.js";
import { useToast }      from "../../hooks/useNotifications.js";

// =============================================================================
// ComplaintDetailPage   /dashboard/complaints/:id
// =============================================================================

const CATEGORY_ICONS = {
  maintenance:"🔧", noise:"🔊", billing:"💰", security:"🔒",
  cleanliness:"🧹", other:"💬",
};

const STATUS_STEPS = ["open","in_progress","resolved","closed"];

function StatusTimeline({ status }) {
  const current = STATUS_STEPS.indexOf(status);
  const labels  = { open:"Submitted", in_progress:"In Progress", resolved:"Resolved", closed:"Closed" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, width:"100%" }}>
      {STATUS_STEPS.map((s, i) => {
        const done    = i <= current;
        const isLast  = i === STATUS_STEPS.length - 1;
        return (
          <div key={s} style={{ display:"flex", alignItems:"center", flex: isLast ? 0 : 1 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: done ? "#C5612C" : "#E8DDD4", flexShrink:0, transition:"background 0.3s" }}>
                {done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize:10, fontWeight: done ? 700 : 400, color: done ? "#C5612C" : "#8B7355", whiteSpace:"nowrap" }}>
                {labels[s]}
              </span>
            </div>
            {!isLast && (
              <div style={{ flex:1, height:2, background: i < current ? "#C5612C" : "#E8DDD4", margin:"0 6px", marginBottom:16, transition:"background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  const sender = message.profiles;
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection: isOwn ? "row-reverse" : "row" }}>
      <Avatar name={sender?.full_name} src={sender?.avatar_url} size="sm" style={{ flexShrink:0 }} />
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", gap:4, alignItems: isOwn ? "flex-end" : "flex-start" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"#5C4A3A" }}>{sender?.full_name ?? "Unknown"}</span>
          <span style={{ fontSize:11, color:"#8B7355" }}>{formatRelativeTime(message.created_at)}</span>
          {sender?.role && sender.role !== "client" && (
            <Badge variant={sender.role} size="sm" />
          )}
        </div>
        <div style={{
          padding:"10px 14px", borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isOwn ? "#C5612C" : "#fff",
          border: isOwn ? "none" : "1px solid #EDE4D8",
          fontSize:14, color: isOwn ? "#fff" : "#1A1412", lineHeight:1.6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {message.body}
        </div>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const profile   = useAuthStore(s => s.profile);
  const toast     = useToast();

  const [complaint, setComplaint] = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [newMsg,    setNewMsg]     = useState("");
  const [sending,   setSending]   = useState(false);

  const bottomRef = useRef(null);

  const loadData = useCallback(() => {
    if (!id) return;
    Promise.all([getComplaint(id), getComplaintMessages(id)])
      .then(([{ data: c }, { data: m }]) => {
        setComplaint(c);
        setMessages(m ?? []);
      }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages.length]);

  // Live realtime updates
  useComplaintMessagesRealtime({
    complaintId: id,
    onMessage: (msg) => setMessages(prev => [...prev, msg]),
  });

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    const body = newMsg.trim();
    setNewMsg("");
    try {
      const { data, error } = await addComplaintMessage(id, profile.id, body);
      if (error) throw new Error(error.message);
      setMessages(prev => [...prev, data]);
    } catch (e) {
      toast.error("Failed to send message.");
      setNewMsg(body); // restore
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <DashboardLayout pageTitle="Complaint">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  if (!complaint) return (
    <DashboardLayout pageTitle="Complaint">
      <Alert type="error" message="Complaint not found." />
    </DashboardLayout>
  );

  const isResolved = ["resolved","closed"].includes(complaint.status);

  return (
    <DashboardLayout pageTitle={complaint.title}>
      <PageHeader
        title={complaint.title}
        back="/dashboard/complaints"
        breadcrumb={[
          { label:"Complaints", to:"/dashboard/complaints" },
          { label: complaint.title.length > 40 ? complaint.title.slice(0,40)+"…" : complaint.title },
        ]}
      />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>

        {/* ── Left: Thread ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Status progress */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px 24px" }}>
            <StatusTimeline status={complaint.status} />
          </div>

          {/* Message thread */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #EDE4D8", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:"#1A1412", margin:0 }}>
                Conversation
              </h3>
              <span style={{ fontSize:12, color:"#8B7355" }}>{messages.length} message{messages.length!==1?"s":""}</span>
            </div>

            {/* Original complaint body */}
            <div style={{ padding:"20px", borderBottom:"1px solid #F5EDE0", background:"#FAF7F2" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <Avatar name={complaint.profiles?.full_name} src={complaint.profiles?.avatar_url} size="sm" />
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#1A1412" }}>{complaint.profiles?.full_name}</span>
                    <span style={{ fontSize:11, color:"#8B7355" }}>{formatDate(complaint.created_at)}</span>
                    <Badge variant="brand" size="sm">Original</Badge>
                  </div>
                  <p style={{ fontSize:14, color:"#5C4A3A", lineHeight:1.65, margin:0 }}>{complaint.description}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16, maxHeight:420, overflowY:"auto" }}>
              {messages.length === 0 ? (
                <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"20px 0" }}>
                  No replies yet. The manager will respond soon.
                </p>
              ) : (
                messages.map(m => (
                  <MessageBubble key={m.id} message={m} isOwn={m.sender_id === profile?.id} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {!isResolved ? (
              <div style={{ padding:"16px 20px", borderTop:"1px solid #EDE4D8", display:"flex", gap:10, alignItems:"flex-end" }}>
                <textarea
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  style={{ flex:1, padding:"10px 14px", border:"1.5px solid #E8DDD4", borderRadius:12, fontSize:14, fontFamily:"'DM Sans',system-ui", outline:"none", resize:"none", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor="#C5612C"}
                  onBlur={e=>e.target.style.borderColor="#E8DDD4"}
                />
                <Button variant="primary" loading={sending} onClick={handleSend} disabled={!newMsg.trim()}>
                  Send
                </Button>
              </div>
            ) : (
              <div style={{ padding:"12px 20px", borderTop:"1px solid #EDE4D8", background:"#FAF7F2" }}>
                <Alert type="success" compact message="This complaint has been resolved. You cannot add more messages." />
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#1A1412", marginBottom:14 }}>Details</h3>
            {[
              ["Status",   <Badge key="s" variant={complaint.status} />],
              ["Priority", <Badge key="p" variant={complaint.priority} />],
              ["Category", <span key="c" style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{CATEGORY_ICONS[complaint.category]} {complaint.category}</span>],
              ["Submitted", formatDate(complaint.created_at)],
              ...(complaint.resolved_at ? [["Resolved", formatDate(complaint.resolved_at)]] : []),
              ...(complaint.assignee ? [["Assigned to", complaint.assignee.full_name]] : []),
            ].map(([k,v],i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F5EDE0" }}>
                <span style={{ fontSize:12, color:"#8B7355" }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{v}</span>
              </div>
            ))}
          </div>

          <Button variant="secondary" fullWidth onClick={() => navigate("/dashboard/complaints")}>
            ← Back to all complaints
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
