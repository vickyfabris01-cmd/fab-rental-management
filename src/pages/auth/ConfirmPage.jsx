import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { supabase }            from "../../config/supabase.js";
import { ROLE_HOME }           from "../../config/constants.js";
import useAuthStore            from "../../store/authStore.js";

// =============================================================================
// ConfirmPage  /confirm
//
// Supabase redirects here after email confirmation links are clicked.
// The URL will contain either:
//
//   SUCCESS: /confirm?token=xxx  (Supabase exchanges token for session)
//   ERROR:   /confirm#error=access_denied&error_code=otp_expired&...
//
// We read the hash fragment, check for errors, and handle both cases.
// =============================================================================

function Btn({ children, onClick, variant = "primary" }) {
  const [hov, setHov] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button onClick={onClick}
      onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        width:"100%", padding:"13px 20px", borderRadius:10,
        border: isPrimary ? "none" : "1.5px solid #E8DDD4",
        cursor:"pointer",
        background: isPrimary ? (hov?"#A84E22":"#C5612C") : (hov?"#F5EDE0":"#fff"),
        color: isPrimary ? "#fff" : "#5C4A3A",
        fontSize:14, fontWeight:700, transition:"background 0.18s",
      }}>
      {children}
    </button>
  );
}

export default function ConfirmPage() {
  const navigate   = useNavigate();
  const profile    = useAuthStore(s => s.profile);
  const authLoading= useAuthStore(s => s.loading);

  // page states: loading | success | error | expired
  const [state,    setState]    = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Parse the hash fragment from Supabase redirect
    // e.g. #error=access_denied&error_code=otp_expired&error_description=...
    const hash   = window.location.hash.substring(1); // remove leading #
    const params = new URLSearchParams(hash);

    const error      = params.get("error");
    const errorCode  = params.get("error_code");
    const errorDesc  = params.get("error_description");

    if (error) {
      // Supabase sent an error in the hash
      if (errorCode === "otp_expired") {
        setState("expired");
      } else {
        setErrorMsg(errorDesc?.replace(/\+/g, " ") ?? error ?? "Something went wrong.");
        setState("error");
      }
      return;
    }

    // No error in hash — Supabase may have already exchanged the token
    // and set a session via onAuthStateChange. Wait briefly for authStore to hydrate.
    const timeout = setTimeout(() => {
      // If profile loaded successfully, redirect to their dashboard
      if (profile?.role) {
        navigate(ROLE_HOME[profile.role] ?? "/browse", { replace:true });
      } else {
        setState("success"); // show manual sign-in prompt
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  // If profile loads while we're waiting, redirect immediately
  useEffect(() => {
    if (state === "loading" && profile?.role && !authLoading) {
      navigate(ROLE_HOME[profile.role] ?? "/browse", { replace:true });
    }
  }, [profile?.role, authLoading, state]);

  const Wrapper = ({ children }) => (
    <div style={{
      minHeight:"100dvh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#FAF7F2",
      fontFamily:"'DM Sans',system-ui,sans-serif", padding:"32px 20px",
    }}>
      <div style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",
          gap:10,marginBottom:36 }}>
          <div style={{ width:34,height:34,borderRadius:10,
            background:"linear-gradient(135deg,#C5612C,#8B3A18)",
            display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            </svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,
            fontSize:16,color:"#1A1412" }}>fabRentals</span>
        </div>
        {children}
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") return (
    <Wrapper>
      <style>{`@keyframes cp_spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:44,height:44,borderRadius:"50%",
        border:"3px solid #F5EDE0",borderTopColor:"#C5612C",
        animation:"cp_spin 0.8s linear infinite",margin:"0 auto 20px" }}/>
      <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
        fontSize:22,color:"#1A1412",marginBottom:8 }}>
        Confirming your email…
      </h1>
      <p style={{ fontSize:14,color:"#8B7355" }}>Just a moment.</p>
    </Wrapper>
  );

  // ── OTP expired ───────────────────────────────────────────────────────────
  if (state === "expired") return (
    <Wrapper>
      <div style={{ width:68,height:68,borderRadius:20,background:"#FFFBEB",
        border:"2px solid #FDE68A",display:"flex",alignItems:"center",
        justifyContent:"center",margin:"0 auto 20px" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="#D97706" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
        fontSize:24,color:"#1A1412",marginBottom:10 }}>
        Confirmation Link Expired
      </h1>
      <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.7,marginBottom:28 }}>
        This email confirmation link has expired. Links are only valid for a short time.
        You can request a new one by trying to sign in — Supabase will prompt you to resend.
      </p>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <Btn onClick={() => navigate("/login")}>Go to Sign In</Btn>
        <Btn variant="secondary" onClick={() => navigate("/signup")}>
          Create a New Account
        </Btn>
      </div>
    </Wrapper>
  );

  // ── Other error ───────────────────────────────────────────────────────────
  if (state === "error") return (
    <Wrapper>
      <div style={{ width:68,height:68,borderRadius:20,background:"#FEF2F2",
        border:"2px solid #FECACA",display:"flex",alignItems:"center",
        justifyContent:"center",margin:"0 auto 20px" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
        fontSize:24,color:"#1A1412",marginBottom:10 }}>
        Confirmation Failed
      </h1>
      <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.7,marginBottom:28 }}>
        {errorMsg || "Something went wrong with your confirmation link. Please try again."}
      </p>
      <Btn onClick={() => navigate("/login")}>Go to Sign In</Btn>
    </Wrapper>
  );

  // ── Success / manual prompt ───────────────────────────────────────────────
  return (
    <Wrapper>
      <div style={{ width:68,height:68,borderRadius:20,background:"#ECFDF5",
        border:"2px solid #10B981",display:"flex",alignItems:"center",
        justifyContent:"center",margin:"0 auto 20px" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
          stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,
        fontSize:24,color:"#1A1412",marginBottom:10 }}>
        Email Confirmed!
      </h1>
      <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.7,marginBottom:28 }}>
        Your email address has been verified. You can now sign in to your account.
      </p>
      <Btn onClick={() => navigate("/login", { replace:true })}>
        Continue to Sign In →
      </Btn>
    </Wrapper>
  );
}
