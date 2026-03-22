import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "../../config/supabase.js";
import { db }       from "../../config/supabase.js";

// =============================================================================
// AcceptInvitePage  /invite/:token
//
// Flow:
//   1. Token arrives in URL → look up manager_invites row (public RLS allows this)
//   2. Validate: token exists, not expired, status = 'pending'
//   3. Step 1 — show invite details (who invited you, which property, your email)
//   4. Step 2 — set full name + password
//   5. handleAccept:
//      a. supabase.auth.signUp() — creates auth.users + auth.identities correctly
//      b. UPDATE profiles SET role='manager', full_name=... (trigger created visitor row)
//      c. UPDATE manager_invites SET status='accepted'
//   6. Step 3 — success → navigate to /manage
// =============================================================================

// ── Tiny icon ─────────────────────────────────────────────────────────────────
function Ic({ d, size = 16, color = "currentColor", strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

// ── Password visibility toggle input ─────────────────────────────────────────
function PwInput({ label, value, onChange, error, autoComplete, showStrength }) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const strength = showStrength && value ? (() => {
    let s = 0;
    if (value.length >= 8)           s++;
    if (/[A-Z]/.test(value))         s++;
    if (/[0-9]/.test(value))         s++;
    if (/[^A-Za-z0-9]/.test(value))  s++;
    return s;
  })() : 0;
  const SC = ["#E8DDD4","#EF4444","#F59E0B","#3B82F6","#10B981"][strength];
  const SL = ["","Weak","Fair","Good","Strong"][strength];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{label}</label>}
      <div style={{ position:"relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder="••••••••"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", padding:"12px 44px 12px 14px",
            border:`1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
            borderRadius:10, fontSize:14, color:"#1A1412", background:"#fff",
            outline:"none", boxSizing:"border-box",
            boxShadow: focused ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}` : "none",
            transition:"border-color 0.18s, box-shadow 0.18s",
          }}
        />
        <button type="button" onClick={() => setVisible(v => !v)}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", color:"#8B7355",
            display:"flex", alignItems:"center", padding:0 }}>
          {visible
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
      {showStrength && value && (
        <div>
          <div style={{ display:"flex", gap:4, marginBottom:4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex:1, height:3, borderRadius:999,
                background:strength>=i?SC:"#E8DDD4", transition:"background 0.3s" }}/>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#8B7355" }}>Password strength</span>
            {strength > 0 && <span style={{ fontSize:11, fontWeight:700, color:SC }}>{SL}</span>}
          </div>
        </div>
      )}
      {error && (
        <span style={{ fontSize:12, color:"#DC2626", display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
function TInput({ label, value, onChange, error, placeholder, type = "text", autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:"100%", padding:"12px 14px",
          border:`1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
          borderRadius:10, fontSize:14, color:"#1A1412", background:"#fff",
          outline:"none", boxSizing:"border-box",
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}` : "none",
          transition:"border-color 0.18s, box-shadow 0.18s",
        }}
      />
      {error && (
        <span style={{ fontSize:12, color:"#DC2626", display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function Btn({ children, onClick, loading, fullWidth, variant = "primary", type = "button" }) {
  const [hov, setHov] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button type={type} onClick={onClick} disabled={loading}
      onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        width: fullWidth ? "100%" : "auto", padding:"13px 20px",
        borderRadius:10, border: isPrimary ? "none" : "1.5px solid #E8DDD4",
        cursor: loading ? "wait" : "pointer",
        background: isPrimary ? (hov ? "#A84E22" : "#C5612C") : (hov ? "#F5EDE0" : "#fff"),
        color: isPrimary ? "#fff" : "#5C4A3A", fontSize:14, fontWeight:700,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        transition:"background 0.18s", opacity: loading ? 0.75 : 1,
      }}>
      {loading && (
        <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.35)",
          borderTopColor:"#fff", borderRadius:"50%", animation:"aip_spin 0.7s linear infinite" }}/>
      )}
      {children}
    </button>
  );
}

const PERMISSIONS = [
  "Manage rooms, buildings and floors",
  "Approve or reject rental requests",
  "Record payments and generate invoices",
  "Move residents in and out",
  "Manage workforce and payroll",
  "Handle complaints and announcements",
];

// =============================================================================
export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate  = useNavigate();

  // Token states: loading | valid | invalid | expired | accepted
  const [state,  setState]  = useState("loading");
  const [invite, setInvite] = useState(null);
  const [step,   setStep]   = useState(1); // 1=review, 2=setup, 3=success

  const [fullName,   setFullName]   = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Look up token ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setState("invalid"); return; }

    db.managerInvites()
      .select("id, email, status, expires_at, tenant_id, tenants(name, slug), profiles!invited_by(full_name)")
      .eq("token", token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setState("invalid"); return; }
        if (data.status === "accepted")               { setState("accepted"); setInvite(data); return; }
        if (data.status === "cancelled")              { setState("invalid");  return; }
        if (new Date(data.expires_at) < new Date())   { setState("expired");  setInvite(data); return; }
        setInvite(data);
        setState("valid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  // ── Validate step 2 ───────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Enter your full name.";
    if (!password || password.length < 8)               e.password = "Password must be at least 8 characters.";
    if (password !== confirm)                           e.confirm  = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Accept invite ─────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!validate()) return;
    setApiError(null);
    setSubmitting(true);

    try {
      // 1. Create Supabase auth user (handles auth.users + auth.identities correctly)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email:    invite.email,
        password: password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/manage`,
        },
      });

      if (signUpError) {
        // If already registered, try signing in instead
        if (signUpError.message?.toLowerCase().includes("already registered")) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: invite.email,
            password,
          });
          if (signInError) throw new Error("An account with this email already exists. Try signing in.");
        } else {
          throw new Error(signUpError.message);
        }
      }

      // 2. Get the user ID (either newly created or signed in)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Could not establish session. Please try again.");

      // 3. Elevate profile to manager and set name + tenant
      const { error: profileError } = await db
        .profiles()
        .upsert({
          id:        user.id,
          role:      "manager",
          full_name: fullName.trim(),
          email:     invite.email,
          tenant_id: invite.tenant_id,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profileError) throw new Error(profileError.message);

      // 4. Mark invite as accepted
      await db.managerInvites()
        .update({ status: "accepted" })
        .eq("token", token);

      setStep(3);
    } catch (err) {
      setApiError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared wrapper ────────────────────────────────────────────────────────
  const Wrapper = ({ children }) => (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#FAF7F2",
      fontFamily:"'DM Sans',system-ui,sans-serif", padding:"32px 20px" }}>
      <style>{`
        @keyframes aip_spin{to{transform:rotate(360deg)}}
        @keyframes aip_up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes aip_slide{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      <div style={{ display:"flex", width:"100%", maxWidth:960, borderRadius:24,
        overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.12)", minHeight:560 }}>

        {/* Left decorative panel */}
        <div style={{ flex:"0 0 42%", display:"none", flexDirection:"column",
          justifyContent:"space-between", padding:"48px 44px",
          background:"linear-gradient(160deg,#1A1412 0%,#2D1E16 55%,#3D2415 100%)",
          position:"relative", overflow:"hidden" }} className="aip-left">
          <style>{`.aip-left{display:none}@media(min-width:860px){.aip-left{display:flex!important}}`}</style>

          <div style={{ position:"absolute",top:-70,right:-70,width:240,height:240,
            borderRadius:"50%",background:"rgba(197,97,44,0.07)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",bottom:-50,left:-50,width:200,height:200,
            borderRadius:"50%",background:"rgba(197,97,44,0.05)",pointerEvents:"none" }}/>

          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:48 }}>
              <div style={{ width:36,height:36,borderRadius:10,
                background:"rgba(197,97,44,0.25)",border:"1px solid rgba(197,97,44,0.4)",
                display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg viewBox="0 0 24 24" fill="#C5612C" width="18" height="18">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                </svg>
              </div>
              <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
                fontSize:16,color:"#fff" }}>fabRentals</span>
            </div>

            <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
              fontSize:"clamp(28px,3vw,40px)",color:"#fff",lineHeight:1.1,
              marginBottom:14,letterSpacing:"-0.02em" }}>
              You've been<br/>invited to join.
            </h1>

            {invite?.tenants?.name && (
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,
                background:"rgba(197,97,44,0.18)",border:"1px solid rgba(197,97,44,0.35)",
                borderRadius:999,padding:"8px 16px",marginBottom:20 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C5612C" width="14" height="14" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                </svg>
                <span style={{ fontSize:13,fontWeight:700,color:"#fff" }}>
                  {invite.tenants.name}
                </span>
              </div>
            )}

            <p style={{ fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.7,maxWidth:280 }}>
              Accept this invitation to start managing properties on fabRentals as a Property Manager.
            </p>
          </div>

          {/* Permissions list */}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {PERMISSIONS.map((p,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:18,height:18,borderRadius:"50%",
                  background:"rgba(16,185,129,0.2)",border:"1px solid rgba(16,185,129,0.4)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.6)" }}>{p}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize:11,color:"rgba(255,255,255,0.22)" }}>
            © {new Date().getFullYear()} fabRentals · Kenya
          </p>
        </div>

        {/* Right form panel */}
        <div style={{ flex:1,background:"#FAF7F2",padding:"40px 36px",
          display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto" }}>
          <div style={{ width:"100%",maxWidth:380,animation:"aip_up 0.4s ease both" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // ── STATE: loading ────────────────────────────────────────────────────────
  if (state === "loading") return (
    <Wrapper>
      <div style={{ textAlign:"center",padding:"40px 0" }}>
        <div style={{ width:40,height:40,borderRadius:"50%",
          border:"3px solid #F5EDE0",borderTopColor:"#C5612C",
          animation:"aip_spin 0.8s linear infinite",margin:"0 auto 16px" }}/>
        <p style={{ fontSize:14,color:"#8B7355" }}>Validating your invitation…</p>
      </div>
    </Wrapper>
  );

  // ── STATE: invalid ────────────────────────────────────────────────────────
  if (state === "invalid") return (
    <Wrapper>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:68,height:68,borderRadius:20,background:"#FEF2F2",
          border:"2px solid #FECACA",display:"flex",alignItems:"center",
          justifyContent:"center",margin:"0 auto 20px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color:"#1A1412",marginBottom:10 }}>
          Invalid Invite Link
        </h1>
        <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.65,marginBottom:28 }}>
          This invite link is invalid, has already been used, or has been cancelled.
          Ask the property owner to send you a new one.
        </p>
        <Btn fullWidth onClick={() => navigate("/login")}>Go to Sign In</Btn>
      </div>
    </Wrapper>
  );

  // ── STATE: expired ────────────────────────────────────────────────────────
  if (state === "expired") return (
    <Wrapper>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:68,height:68,borderRadius:20,background:"#FFFBEB",
          border:"2px solid #FDE68A",display:"flex",alignItems:"center",
          justifyContent:"center",margin:"0 auto 20px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color:"#1A1412",marginBottom:10 }}>
          Invite Expired
        </h1>
        <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.65,marginBottom:28 }}>
          This invite link for <strong>{invite?.email}</strong> expired on{" "}
          {invite?.expires_at ? new Date(invite.expires_at).toLocaleDateString("en-KE", { dateStyle:"medium" }) : "—"}.
          Ask the property owner to resend the invite.
        </p>
        <Btn fullWidth onClick={() => navigate("/login")}>Go to Sign In</Btn>
      </div>
    </Wrapper>
  );

  // ── STATE: accepted ───────────────────────────────────────────────────────
  if (state === "accepted") return (
    <Wrapper>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:68,height:68,borderRadius:20,background:"#EFF6FF",
          border:"2px solid #BFDBFE",display:"flex",alignItems:"center",
          justifyContent:"center",margin:"0 auto 20px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color:"#1A1412",marginBottom:10 }}>
          Already Accepted
        </h1>
        <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.65,marginBottom:28 }}>
          This invite has already been accepted. Sign in with the account you created.
        </p>
        <Btn fullWidth onClick={() => navigate("/login")}>Sign In</Btn>
      </div>
    </Wrapper>
  );

  // ── STATE: valid — step 1 (review) ────────────────────────────────────────
  if (step === 1) return (
    <Wrapper>
      <div style={{ animation:"aip_slide 0.3s ease both" }}>
        <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",
          textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>Invitation</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
          fontSize:28,color:"#1A1412",marginBottom:6 }}>
          Join {invite?.tenants?.name ?? "this property"}
        </h1>
        <p style={{ fontSize:14,color:"#8B7355",lineHeight:1.6,marginBottom:24 }}>
          {invite?.profiles?.full_name
            ? <><strong style={{ color:"#1A1412" }}>{invite.profiles.full_name}</strong> has invited you</>
            : "You have been invited"
          } to manage <strong style={{ color:"#1A1412" }}>{invite?.tenants?.name}</strong> as a Property Manager.
        </p>

        {/* Invite detail card */}
        <div style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:14,
          padding:"16px 18px",marginBottom:20,display:"flex",flexDirection:"column",gap:10 }}>
          {[
            ["Invited email", invite?.email],
            ["Property",      invite?.tenants?.name],
            ["Role",          "Property Manager"],
            ["Expires",       invite?.expires_at
              ? new Date(invite.expires_at).toLocaleDateString("en-KE",{dateStyle:"medium"})
              : "—"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#8B7355" }}>{k}</span>
              <span style={{ fontSize:13,fontWeight:600,color:"#1A1412" }}>{v ?? "—"}</span>
            </div>
          ))}
        </div>

        {/* Permissions */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:12,fontWeight:700,color:"#1A1412",marginBottom:10 }}>
            As a manager you can:
          </p>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {PERMISSIONS.map((p,i) => (
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"
                  style={{ flexShrink:0,marginTop:2 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize:13,color:"#5C4A3A" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="secondary" onClick={() => navigate("/")}>Decline</Btn>
          <Btn fullWidth onClick={() => setStep(2)}>
            Accept & Set Up Account →
          </Btn>
        </div>

        <p style={{ fontSize:11,color:"#8B7355",textAlign:"center",marginTop:14 }}>
          By accepting you agree to fabRentals' Terms of Service
        </p>
      </div>
    </Wrapper>
  );

  // ── STATE: valid — step 2 (setup account) ────────────────────────────────
  if (step === 2) return (
    <Wrapper>
      <div style={{ animation:"aip_slide 0.3s ease both" }}>
        <button onClick={() => setStep(1)}
          style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#8B7355",
            background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:24 }}>
          <Ic d="M19 12H5M12 19l-7-7 7-7"/>
          Back
        </button>

        <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",
          textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6 }}>Almost there</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
          fontSize:26,color:"#1A1412",marginBottom:6 }}>
          Set up your account
        </h1>
        <p style={{ fontSize:14,color:"#8B7355",marginBottom:24 }}>
          You'll sign in as <strong style={{ color:"#1A1412" }}>{invite?.email}</strong>
        </p>

        {apiError && (
          <div style={{ background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,
            padding:"12px 14px",marginBottom:18,display:"flex",gap:10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#DC2626" style={{ flexShrink:0,marginTop:1 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p style={{ fontSize:13,color:"#991B1B",margin:0 }}>{apiError}</p>
          </div>
        )}

        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <TInput label="Full Name" required value={fullName}
            onChange={e => { setFullName(e.target.value); setErrors(p=>({...p,fullName:null})); }}
            placeholder="e.g. Michael Kamau"
            autoComplete="name" error={errors.fullName} />

          <PwInput label="Password" value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p=>({...p,password:null})); }}
            autoComplete="new-password" showStrength error={errors.password} />

          <PwInput label="Confirm Password" value={confirm}
            onChange={e => { setConfirm(e.target.value); setErrors(p=>({...p,confirm:null})); }}
            autoComplete="new-password" error={errors.confirm} />

          <Btn fullWidth loading={submitting} onClick={handleAccept}>
            {submitting ? "Creating account…" : "Create Account & Join →"}
          </Btn>
        </div>
      </div>
    </Wrapper>
  );

  // ── STATE: step 3 (success) ───────────────────────────────────────────────
  return (
    <Wrapper>
      <div style={{ textAlign:"center",animation:"aip_slide 0.3s ease both" }}>
        <div style={{ width:72,height:72,borderRadius:20,background:"#ECFDF5",
          border:"2px solid #10B981",display:"flex",alignItems:"center",
          justifyContent:"center",margin:"0 auto 20px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
          fontSize:28,color:"#1A1412",marginBottom:8 }}>Welcome aboard!</h1>
        <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.65,marginBottom:24 }}>
          Your manager account for <strong>{invite?.tenants?.name}</strong> is ready.
          You can now sign in and start managing the property.
        </p>

        <div style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:14,
          padding:"16px 18px",marginBottom:24,textAlign:"left",
          display:"flex",flexDirection:"column",gap:10 }}>
          {[
            ["Name",     fullName],
            ["Email",    invite?.email],
            ["Role",     "Property Manager"],
            ["Property", invite?.tenants?.name],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:"#8B7355" }}>{k}</span>
              <span style={{ fontSize:13,fontWeight:600,color:"#1A1412" }}>{v ?? "—"}</span>
            </div>
          ))}
        </div>

        <Btn fullWidth onClick={() => navigate("/login", { replace:true })}>
          Sign In to Your Dashboard →
        </Btn>
      </div>
    </Wrapper>
  );
}
