import { useState }           from "react";
import { Link, useNavigate }  from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import AuthLayout             from "../../layouts/AuthLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import Input                  from "../../components/ui/Input.jsx";
import PasswordInput          from "../../components/ui/PasswordInput.jsx";
import Button                 from "../../components/ui/Button.jsx";
import { Checkbox }           from "../../components/ui/TextArea.jsx";
import { Alert }              from "../../components/ui/Alert.jsx";
import { Divider }            from "../../components/ui/Spinner.jsx";

// ── Store / hooks ──────────────────────────────────────────────────────────────
import useAuthStore           from "../../store/authStore.js";
import { useToast }           from "../../hooks/useNotifications.js";

// ── Validators ────────────────────────────────────────────────────────────────
import { validateLoginForm }  from "../../lib/validators.js";

// ── Config ────────────────────────────────────────────────────────────────────
import { ROLE_HOME }          from "../../config/constants.js";

// =============================================================================
// LoginPage  /login
//
// Two modes in the right panel, toggled without navigation:
//   MODE login  — email + password + remember me + Google
//   MODE forgot — email → send reset link → success state
// =============================================================================

// Left panel activity cards (decorative)
const ACTIVITY_CARDS = [
  { icon:"🏠", title:"Sunrise Hostel",    sub:"Billing due in 3 days",  badge:"Due",  badgeBg:"rgba(245,158,11,0.18)", badgeColor:"#92400E" },
  { icon:"✅", title:"Rent Paid",         sub:"KES 8,500 via M-Pesa",   badge:"Paid", badgeBg:"rgba(16,185,129,0.18)", badgeColor:"#065F46" },
  { icon:"💬", title:"Complaint Resolved",sub:"Water issue fixed today", badge:"Done", badgeBg:"rgba(59,130,246,0.18)", badgeColor:"#1E40AF" },
];

function LeftContent() {
  return (
    <>
      <p style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:24 }}>
        fabrentals
      </p>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(34px,4vw,52px)",color:"#fff",lineHeight:1.1,marginBottom:32,whiteSpace:"pre-line" }}>
        {"Welcome\nBack."}
      </h2>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        {ACTIVITY_CARDS.map((c, i) => (
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:14,
            background:"rgba(255,255,255,0.09)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:16,padding:"14px 16px",
            animation:`floatY ${4+i}s ${i*0.8}s ease-in-out infinite`,
          }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
              {c.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13,fontWeight:700,color:"#fff",margin:0 }}>{c.title}</p>
              <p style={{ fontSize:11,color:"rgba(255,255,255,0.55)",margin:"2px 0 0" }}>{c.sub}</p>
            </div>
            <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:c.badgeBg,color:c.badgeColor,flexShrink:0 }}>
              {c.badge}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function LoginPage() {
  const navigate   = useNavigate();
  const signIn     = useAuthStore(s => s.signIn);
  const sendReset  = useAuthStore(s => s.sendPasswordReset);
  const toast      = useToast();

  // ── Login mode state ──────────────────────────────────────────────────────
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [remember,   setRemember]   = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState(null);
  const [loading,    setLoading]    = useState(false);

  // ── Forgot password mode state ────────────────────────────────────────────
  const [forgot,       setForgot]       = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setApiError(null);
    const v = validateLoginForm({ email, password });
    if (!v.valid) { setErrors(v.errors); return; }
    setErrors({});
    setLoading(true);
    try {
      const { error, profile } = await signIn(email.trim().toLowerCase(), password);
      if (error) throw new Error(error.message);
      toast.success(`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!`);
      navigate(ROLE_HOME[profile?.role] ?? "/browse", { replace: true });
    } catch (e) {
      setApiError(e.message === "Invalid login credentials"
        ? "Incorrect email or password. Please try again."
        : e.message ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setResetError(null);
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError("Enter a valid email address.");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await sendReset(resetEmail.trim().toLowerCase());
      if (error) throw new Error(error.message);
      setResetSent(true);
    } catch (e) {
      setResetError(e.message ?? "Failed to send reset link.");
    } finally {
      setResetLoading(false);
    }
  };

  const enterForgot = () => {
    setForgot(true);
    setResetEmail(email); // pre-fill from login email
    setResetSent(false);
    setResetError(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      heading={"Welcome\nBack."}
      subheading="Your rental, payments and home — all in one place."
      leftContent={<LeftContent />}
      leftBg="linear-gradient(145deg,#C5612C 0%,#8B3A18 50%,#5C2410 100%)"
    >
      <style>{`
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn 0.3s ease both}
      `}</style>

      {/* ── Forgot password mode ── */}
      {forgot ? (
        <div className="slide-in">
          {/* Back */}
          <button onClick={() => setForgot(false)} style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#8B7355",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:28,transition:"color 0.15s" }}
            onMouseOver={e=>e.currentTarget.style.color="#C5612C"}
            onMouseOut={e=>e.currentTarget.style.color="#8B7355"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to sign in
          </button>

          {resetSent ? (
            // Success state
            <div style={{ textAlign:"center",padding:"12px 0" }}>
              <div style={{ width:64,height:64,borderRadius:20,background:"#ECFDF5",border:"2px solid #10B981",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:"#1A1412",marginBottom:10 }}>Check your inbox</h2>
              <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.65,marginBottom:24 }}>
                We've sent a reset link to <strong>{resetEmail}</strong>. It expires in 60 minutes.
              </p>
              <Button variant="secondary" fullWidth onClick={() => { setForgot(false); setResetSent(false); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:28,color:"#1A1412",marginBottom:8 }}>Reset password</h1>
              <p style={{ fontSize:14,color:"#8B7355",marginBottom:24,lineHeight:1.6 }}>
                Enter your email and we'll send a secure reset link.
              </p>
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <Input label="Email Address" type="email" required
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); setResetError(null); }}
                  error={resetError}
                />
                <Button variant="primary" fullWidth loading={resetLoading} onClick={handleForgot}>
                  Send Reset Link
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        // ── Login mode ──
        <>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:28,color:"#1A1412",marginBottom:6 }}>Sign In</h1>
          <p style={{ fontSize:14,color:"#8B7355",marginBottom:28,lineHeight:1.5 }}>
            Welcome back. Enter your credentials to continue.
          </p>

          {apiError && <Alert type="error" message={apiError} style={{ marginBottom:20 }} />}

          <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
            <Input label="Email Address" type="email" required
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:null})); setApiError(null); }}
              error={errors.email}
            />

            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#1A1412" }}>Password</label>
                <button type="button" onClick={enterForgot}
                  style={{ fontSize:12,color:"#C5612C",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0 }}>
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                label={null}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p=>({...p,password:null})); setApiError(null); }}
                error={errors.password}
              />
            </div>

            <Checkbox label="Remember me for 30 days" checked={remember} onChange={setRemember} />

            <Button variant="primary" fullWidth loading={loading} onClick={handleLogin}>
              Sign In
            </Button>

            <Divider label="or continue with" />

            {/* Google OAuth */}
            <button style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              width:"100%",padding:"11px",borderRadius:999,
              border:"1.5px solid #E8DDD4",background:"#fff",
              fontSize:14,fontWeight:500,color:"#1A1412",cursor:"pointer",
              transition:"border-color 0.18s",
            }}
              onMouseOver={e=>e.currentTarget.style.borderColor="#C5612C"}
              onMouseOut={e=>e.currentTarget.style.borderColor="#E8DDD4"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Role hint */}
          <div style={{ marginTop:28,padding:"14px 16px",background:"#F5EDE0",borderRadius:16,border:"1px solid #EDE4D8" }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#8B7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Sign in as</p>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
              {[{label:"Resident",icon:"🏠"},{label:"Manager",icon:"🗝️"},{label:"Owner",icon:"📊"}].map(r=>(
                <div key={r.label} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 8px",background:"#fff",borderRadius:12,border:"1px solid #EDE4D8" }}>
                  <span style={{ fontSize:18 }}>{r.icon}</span>
                  <span style={{ fontSize:12,fontWeight:500,color:"#5C4A3A" }}>{r.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize:11,color:"#8B7355",marginTop:8,textAlign:"center" }}>
              Same login — your role is determined by your account type
            </p>
          </div>

          <p style={{ textAlign:"center",fontSize:13,color:"#8B7355",marginTop:24 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color:"#C5612C",fontWeight:700,textDecoration:"none" }}>Sign up free</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
