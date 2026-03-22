import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import useAuthStore  from "../../store/authStore.js";
import { ROLE_HOME } from "../../config/constants.js";
import { supabase }  from "../../config/supabase.js";

// =============================================================================
// LoginPage  /login
//
// Auth flow:
//   1. handleLogin → authStore.signIn(email, password)
//   2. signIn calls supabase.auth.signInWithPassword()
//   3. onAuthStateChange fires in authStore → sets profile in store
//   4. useEffect watches profile → redirects to ROLE_HOME[role]
// =============================================================================

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink:0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function EyeIcon({ open }) {
  return open
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function InputField({ label, type = "text", value, onChange, error, placeholder, autoComplete, rightSlot, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{label}</label>
      )}
      <div style={{ position:"relative" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", padding: rightSlot ? "12px 44px 12px 14px" : "12px 14px",
            border:`1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
            borderRadius:10, fontSize:14, color:"#1A1412", background:"#fff",
            outline:"none", boxSizing:"border-box",
            boxShadow: focused ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}` : "none",
            transition:"border-color 0.18s, box-shadow 0.18s",
          }}
        />
        {rightSlot && (
          <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <span style={{ fontSize:12, color:"#DC2626", display:"flex", alignItems:"center", gap:5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

function PrimaryBtn({ children, onClick, type = "button", loading, fullWidth }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={loading}
      onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding:"13px 20px", borderRadius:10, border:"none",
        cursor: loading ? "wait" : "pointer",
        background: hov ? "#A84E22" : "#C5612C",
        color:"#fff", fontSize:14, fontWeight:700,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        transition:"background 0.18s", opacity: loading ? 0.75 : 1,
      }}>
      {loading && (
        <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.35)",
          borderTopColor:"#fff", borderRadius:"50%", animation:"lspin 0.7s linear infinite" }}/>
      )}
      {children}
    </button>
  );
}

// =============================================================================
export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const signIn    = useAuthStore(s => s.signIn);
  const profile   = useAuthStore(s => s.profile);
  const authLoading = useAuthStore(s => s.loading);

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [forgot,       setForgot]       = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState(null);

  // Redirect after successful sign-in once profile loads
  useEffect(() => {
    if (profile?.role && !authLoading) {
      const from = location.state?.from?.pathname;
      navigate(from || ROLE_HOME[profile.role] || "/browse", { replace:true });
    }
  }, [profile?.role, authLoading]);

  const validate = () => {
    const e = {};
    if (!email.trim())                    e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email address.";
    if (!password)                         e.password = "Password is required.";
    return e;
  };

  const handleLogin = async (ev) => {
    ev?.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (error) {
      setApiError(
        error.toLowerCase().includes("invalid") || error.toLowerCase().includes("credentials")
          ? "Incorrect email or password. Please try again."
          : error
      );
    }
  };

  const handleForgot = async (ev) => {
    ev?.preventDefault();
    setResetError(null);
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError("Enter a valid email address."); return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password?type=recovery` }
    );
    setResetLoading(false);
    if (error) { setResetError(error.message); return; }
    setResetSent(true);
  };

  const handleGoogle = () => supabase.auth.signInWithOAuth({
    provider:"google",
    options:{ redirectTo:`${window.location.origin}/dashboard` },
  });

  return (
    <div style={{ minHeight:"100dvh", display:"flex", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#FAF7F2" }}>
      <style>{`
        @keyframes lspin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        .lp-left{display:none}
        @media(min-width:900px){.lp-left{display:flex!important}}
      `}</style>

      {/* ── Left decorative panel ── */}
      <div className="lp-left" style={{
        flex:"0 0 44%", flexDirection:"column", justifyContent:"space-between",
        padding:"48px 52px", position:"relative", overflow:"hidden",
        background:"linear-gradient(150deg,#C5612C 0%,#8B3A18 45%,#3D1A0A 100%)",
      }}>
        <div style={{ position:"absolute",top:-90,right:-90,width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,0.06)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:-80,left:-80,width:260,height:260,borderRadius:"50%",background:"rgba(255,255,255,0.04)",pointerEvents:"none" }}/>

        <div>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:56 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:"#fff",letterSpacing:"-0.02em" }}>fabRentals</span>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(38px,3.5vw,56px)",color:"#fff",lineHeight:1.06,marginBottom:18,letterSpacing:"-0.02em" }}>
            Welcome<br/>Back.
          </h1>
          <p style={{ fontSize:15,color:"rgba(255,255,255,0.58)",lineHeight:1.7,maxWidth:320 }}>
            Your rental dashboard, payments, and home — all in one place.
          </p>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {[
            { icon:"🏠",title:"Sunrise Hostel",    sub:"Billing due in 3 days",  badge:"Due",  bc:"rgba(245,158,11,0.25)",  btext:"#FCD34D" },
            { icon:"✅",title:"Rent Paid",          sub:"KES 8,500 via M-Pesa",   badge:"Paid", bc:"rgba(16,185,129,0.25)",  btext:"#6EE7B7" },
            { icon:"💬",title:"Complaint Resolved", sub:"Water issue fixed today", badge:"Done", bc:"rgba(99,102,241,0.25)", btext:"#A5B4FC" },
          ].map((c,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,
              background:"rgba(255,255,255,0.09)",backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"12px 16px",
              animation:`floatY ${4+i*0.8}s ${i*0.5}s ease-in-out infinite` }}>
              <div style={{ width:40,height:40,borderRadius:10,background:"rgba(255,255,255,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{c.icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,fontWeight:700,color:"#fff",margin:0 }}>{c.title}</p>
                <p style={{ fontSize:11,color:"rgba(255,255,255,0.52)",margin:"2px 0 0" }}>{c.sub}</p>
              </div>
              <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:c.bc,color:c.btext }}>{c.badge}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize:12,color:"rgba(255,255,255,0.28)" }}>
          © {new Date().getFullYear()} fabRentals · Made for Kenya
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",overflowY:"auto" }}>
        <div style={{ width:"100%",maxWidth:420,animation:"fadeUp 0.4s ease both" }}>

          {/* FORGOT PASSWORD */}
          {forgot ? (
            <div>
              <button onClick={() => { setForgot(false); setResetSent(false); setResetError(null); }}
                style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#8B7355",
                  background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:32 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to sign in
              </button>

              {resetSent ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:72,height:72,borderRadius:20,background:"#ECFDF5",
                    border:"2px solid #10B981",display:"flex",alignItems:"center",
                    justifyContent:"center",margin:"0 auto 24px" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color:"#1A1412",marginBottom:10 }}>
                    Check your inbox
                  </h2>
                  <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.7,marginBottom:28 }}>
                    We sent a reset link to <strong>{resetEmail}</strong>.<br/>It expires in 60 minutes.
                  </p>
                  <button onClick={() => { setForgot(false); setResetSent(false); }}
                    style={{ width:"100%",padding:"12px",borderRadius:10,border:"1.5px solid #E8DDD4",
                      background:"#fff",fontSize:14,fontWeight:600,color:"#5C4A3A",cursor:"pointer" }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:28,color:"#1A1412",marginBottom:8 }}>Reset password</h1>
                  <p style={{ fontSize:14,color:"#8B7355",marginBottom:28,lineHeight:1.6 }}>
                    Enter your email and we'll send a secure reset link.
                  </p>
                  <form onSubmit={handleForgot} style={{ display:"flex",flexDirection:"column",gap:16 }}>
                    <InputField id="reset-email" label="Email Address" type="email"
                      placeholder="you@example.com" value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setResetError(null); }}
                      autoComplete="email" error={resetError} />
                    <PrimaryBtn type="submit" fullWidth loading={resetLoading}>
                      Send Reset Link
                    </PrimaryBtn>
                  </form>
                </>
              )}
            </div>

          ) : (
            // SIGN IN FORM
            <>
              {/* Logo (mobile only) */}
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:28 }} className="lp-mobile-logo">
                <style>{`.lp-mobile-logo{display:flex}@media(min-width:900px){.lp-mobile-logo{display:none}}`}</style>
                <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#C5612C,#8B3A18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
                </div>
                <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"#1A1412" }}>fabRentals</span>
              </div>

              <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:30,color:"#1A1412",marginBottom:6,letterSpacing:"-0.02em" }}>
                Sign in
              </h1>
              <p style={{ fontSize:14,color:"#8B7355",marginBottom:28,lineHeight:1.5 }}>
                Welcome back — enter your credentials to continue.
              </p>

              {/* Error */}
              {apiError && (
                <div style={{ background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,
                  padding:"12px 14px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#DC2626" style={{ flexShrink:0,marginTop:1 }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <p style={{ fontSize:13,color:"#991B1B",margin:0 }}>{apiError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display:"flex",flexDirection:"column",gap:18 }}>
                <InputField id="login-email" label="Email Address" type="email"
                  placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p=>({...p,email:null})); setApiError(null); }}
                  autoComplete="email" error={errors.email} />

                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <label htmlFor="login-pw" style={{ fontSize:13,fontWeight:600,color:"#1A1412" }}>Password</label>
                    <button type="button" onClick={() => { setForgot(true); setResetEmail(email); setResetError(null); setResetSent(false); }}
                      style={{ fontSize:12,color:"#C5612C",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0 }}>
                      Forgot password?
                    </button>
                  </div>
                  <InputField id="login-pw" type={showPw ? "text" : "password"}
                    placeholder="Your password" value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p=>({...p,password:null})); setApiError(null); }}
                    autoComplete="current-password" error={errors.password}
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(v=>!v)}
                        style={{ background:"none",border:"none",cursor:"pointer",color:"#8B7355",display:"flex",alignItems:"center",padding:0 }}>
                        <EyeIcon open={showPw}/>
                      </button>
                    }
                  />
                </div>

                <PrimaryBtn type="submit" fullWidth loading={submitting}>
                  {submitting ? "Signing in…" : "Sign in →"}
                </PrimaryBtn>
              </form>

              {/* Divider */}
              <div style={{ display:"flex",alignItems:"center",gap:12,margin:"22px 0" }}>
                <div style={{ flex:1,height:1,background:"#E8DDD4" }}/>
                <span style={{ fontSize:12,color:"#8B7355",whiteSpace:"nowrap" }}>or continue with</span>
                <div style={{ flex:1,height:1,background:"#E8DDD4" }}/>
              </div>

              {/* Google */}
              <button onClick={handleGoogle}
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  width:"100%",padding:"12px 20px",borderRadius:10,
                  border:"1.5px solid #E8DDD4",background:"#fff",
                  fontSize:14,fontWeight:500,color:"#1A1412",cursor:"pointer",
                  transition:"border-color 0.18s,box-shadow 0.18s" }}
                onMouseOver={e=>{ e.currentTarget.style.borderColor="#C5612C"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(197,97,44,0.10)"; }}
                onMouseOut={e=>{ e.currentTarget.style.borderColor="#E8DDD4"; e.currentTarget.style.boxShadow="none"; }}>
                <GoogleIcon/>
                Continue with Google
              </button>

              {/* Role hint */}
              <div style={{ marginTop:24,padding:"14px 16px",background:"#fff",
                borderRadius:12,border:"1px solid #EDE4D8" }}>
                <p style={{ fontSize:11,fontWeight:700,color:"#8B7355",
                  textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px" }}>
                  Sign in as
                </p>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                  {[{label:"Resident",icon:"🏠"},{label:"Manager",icon:"🗝️"},{label:"Owner",icon:"📊"}].map(r=>(
                    <div key={r.label} style={{ display:"flex",flexDirection:"column",
                      alignItems:"center",gap:5,padding:"10px 6px",
                      background:"#FAF7F2",borderRadius:10,border:"1px solid #EDE4D8" }}>
                      <span style={{ fontSize:20 }}>{r.icon}</span>
                      <span style={{ fontSize:11,fontWeight:600,color:"#5C4A3A" }}>{r.label}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11,color:"#8B7355",margin:"10px 0 0",textAlign:"center" }}>
                  Same login — your role is set by your account type
                </p>
              </div>

              <p style={{ textAlign:"center",fontSize:13,color:"#8B7355",marginTop:24 }}>
                Don't have an account?{" "}
                <Link to="/signup" style={{ color:"#C5612C",fontWeight:700,textDecoration:"none" }}>
                  Create one free
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
