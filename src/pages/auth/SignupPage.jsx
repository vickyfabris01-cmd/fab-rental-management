import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import AuthLayout            from "../../layouts/AuthLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import Input                 from "../../components/ui/Input.jsx";
import PasswordInput         from "../../components/ui/PasswordInput.jsx";
import PhoneInput            from "../../components/ui/PhoneInput.jsx";
import Button                from "../../components/ui/Button.jsx";
import { Checkbox }          from "../../components/ui/TextArea.jsx";
import { Alert }             from "../../components/ui/Alert.jsx";
import { Divider }           from "../../components/ui/Spinner.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import useAuthStore          from "../../store/authStore.js";
import { useToast }          from "../../hooks/useNotifications.js";

// ── Validators ────────────────────────────────────────────────────────────────
import { validateSignUpForm } from "../../lib/validators.js";

// =============================================================================
// SignupPage  /signup
//
// Two-step form:
//   Step 1 — Credentials: email, password (with strength meter), confirm password
//   Step 2 — Personal:    full name, phone (+254 prefix), terms checkbox
// =============================================================================

const FEATURES = [
  "Browse & apply for rooms online",
  "Pay rent via M-Pesa instantly",
  "Track invoices & billing history",
  "Submit complaints & get responses",
];

function LeftContent() {
  return (
    <>
      <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:24 }}>
        fabrentals
      </p>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(32px,4vw,50px)",color:"#fff",lineHeight:1.1,marginBottom:20,whiteSpace:"pre-line" }}>
        {"Your Next\nHome Starts\n"}
        <span style={{ color:"#C5612C" }}>Here.</span>
      </h2>
      <p style={{ fontSize:14,color:"rgba(255,255,255,0.55)",fontWeight:300,lineHeight:1.7,marginBottom:32,maxWidth:340 }}>
        Join thousands of Kenyans managing their rentals, paying bills, and communicating with managers — all in one place.
      </p>
      <div style={{ display:"flex",flexDirection:"column",gap:13 }}>
        {FEATURES.map((f,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:20,height:20,borderRadius:"50%",background:"rgba(197,97,44,0.25)",border:"1px solid rgba(197,97,44,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize:13,color:"rgba(255,255,255,0.72)",lineHeight:1.4 }}>{f}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const signUp   = useAuthStore(s => s.signUp);
  const toast    = useToast();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError,setApiError]= useState(null);
  const [errors,  setErrors]  = useState({});

  const [form, setForm] = useState({
    email:            "",
    password:         "",
    confirm_password: "",
    full_name:        "",
    phone:            "",
    agree:            false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Step 1 validation ───────────────────────────────────────────────────
  const handleNext = () => {
    setApiError(null);
    const v = validateSignUpForm({ step: 1, ...form });
    if (!v.valid) { setErrors(v.errors); return; }
    setErrors({});
    setStep(2);
  };

  // ── Step 2 — final submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setApiError(null);
    const v = validateSignUpForm({ step: 2, ...form });
    if (!v.valid) { setErrors(v.errors); return; }
    setErrors({});
    setLoading(true);
    try {
      const { error } = await signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        fullName: form.full_name.trim(),
        phone:    form.phone,
      });
      if (error) throw new Error(error.message);
      toast.success("Account created! Check your email to verify your address.");
      navigate("/browse", { replace: true });
    } catch (e) {
      if (e.message?.includes("already registered")) {
        setApiError("An account with this email already exists. ");
      } else {
        setApiError(e.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator ──────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:28 }}>
      {[1,2].map(n => (
        <div key={n} style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{
            width:28,height:28,borderRadius:"50%",
            background: n<=step ? "#C5612C" : "#E8DDD4",
            color:      n<=step ? "#fff"    : "#8B7355",
            fontSize:12,fontWeight:700,
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",
            boxShadow: n===step ? "0 3px 10px rgba(197,97,44,0.30)" : "none",
          }}>
            {n<step
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : n
            }
          </div>
          <span style={{ fontSize:12,color: n<=step ? "#C5612C" : "#8B7355",fontWeight: n===step ? 700 : 400 }}>
            {n===1 ? "Credentials" : "Personal Info"}
          </span>
          {n < 2 && <div style={{ width:32,height:2,background: step>1 ? "#C5612C" : "#E8DDD4",borderRadius:999,transition:"background 0.3s" }}/>}
        </div>
      ))}
    </div>
  );

  return (
    <AuthLayout
      heading={"Your Next\nHome Starts\nHere."}
      subheading="Join thousands managing rentals across Kenya."
      leftContent={<LeftContent />}
      leftBg="linear-gradient(160deg,#1A1412 0%,#2D1E16 60%,#3D2415 100%)"
    >
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn 0.3s ease both}
      `}</style>

      <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:28,color:"#1A1412",marginBottom:6 }}>Create Account</h1>
      <p style={{ fontSize:14,color:"#8B7355",marginBottom:24,lineHeight:1.5 }}>
        {step===1 ? "Set up your login credentials." : "Tell us a little about yourself."}
      </p>

      <StepIndicator />

      {apiError && <Alert type="error" message={apiError}
        action={apiError.includes("already exists") ? <Link to="/login" style={{ color:"#C5612C",fontWeight:700,fontSize:13 }}>Sign in →</Link> : null}
        style={{ marginBottom:18 }}
      />}

      {/* ── Step 1: Credentials ── */}
      {step === 1 && (
        <div className="slide-in" style={{ display:"flex",flexDirection:"column",gap:18 }}>
          <Input label="Email Address" type="email" required
            placeholder="you@example.com"
            value={form.email}
            onChange={e => { set("email", e.target.value); setErrors(p=>({...p,email:null})); }}
            error={errors.email}
          />

          <PasswordInput label="Password" required showStrength
            value={form.password}
            onChange={e => { set("password", e.target.value); setErrors(p=>({...p,password:null})); }}
            error={errors.password}
          />

          <PasswordInput label="Confirm Password" required
            value={form.confirm_password}
            onChange={e => { set("confirm_password", e.target.value); setErrors(p=>({...p,confirm_password:null})); }}
            error={errors.confirm_password}
          />

          <Button variant="primary" fullWidth onClick={handleNext}>
            Continue →
          </Button>

          <Divider label="or sign up with" />

          {/* Google */}
          <button style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"11px",borderRadius:999,border:"1.5px solid #E8DDD4",background:"#fff",fontSize:14,fontWeight:500,color:"#1A1412",cursor:"pointer",transition:"border-color 0.18s" }}
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
      )}

      {/* ── Step 2: Personal Info ── */}
      {step === 2 && (
        <div className="slide-in" style={{ display:"flex",flexDirection:"column",gap:18 }}>
          <Input label="Full Name" required
            placeholder="e.g. Jane Wanjiku"
            value={form.full_name}
            onChange={e => { set("full_name", e.target.value); setErrors(p=>({...p,full_name:null})); }}
            error={errors.full_name}
          />

          <PhoneInput label="Phone Number" required
            value={form.phone}
            onChange={v => { set("phone", v); setErrors(p=>({...p,phone:null})); }}
            error={errors.phone}
            helper="Used for M-Pesa payment notifications"
          />

          {/* Visitor account info box */}
          <div style={{ background:"#FFF5EF",border:"1px solid rgba(197,97,44,0.22)",borderRadius:14,padding:"14px 16px",display:"flex",gap:12 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(197,97,44,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#C5612C"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <div>
              <p style={{ fontSize:12,fontWeight:700,color:"#C5612C",margin:"0 0 3px" }}>Visitor Account</p>
              <p style={{ fontSize:12,color:"#5C4A3A",margin:0,lineHeight:1.6 }}>
                You'll start as a visitor and can browse freely. Once a manager approves your rental request, your account upgrades to a resident automatically.
              </p>
            </div>
          </div>

          <Checkbox
            label={
              <span style={{ fontSize:13,color:"#5C4A3A",lineHeight:1.5 }}>
                I agree to the{" "}
                <a href="#" style={{ color:"#C5612C",fontWeight:600,textDecoration:"underline" }}>Terms of Service</a>
                {" "}and{" "}
                <a href="#" style={{ color:"#C5612C",fontWeight:600,textDecoration:"underline" }}>Privacy Policy</a>
              </span>
            }
            checked={form.agree}
            onChange={v => { set("agree", v); setErrors(p=>({...p,agree:null})); }}
            error={errors.agree}
          />

          <div style={{ display:"flex",gap:10 }}>
            <Button variant="secondary" onClick={() => { setStep(1); setApiError(null); }}>
              ← Back
            </Button>
            <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
              Create Account
            </Button>
          </div>
        </div>
      )}

      <p style={{ textAlign:"center",fontSize:13,color:"#8B7355",marginTop:28 }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color:"#C5612C",fontWeight:700,textDecoration:"none" }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
