import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, s = 18, c = "" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d={d} />
  </svg>
);
const EyeIcon    = () => <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z" s={16}/>;
const EyeOffIcon = () => <Ic d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" s={16}/>;
const MailIcon   = () => <Ic d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" s={40}/>;
const CheckIcon  = () => <Ic d="M5 13l4 4L19 7" s={16}/>;
const BackIcon   = () => <Ic d="M19 12H5M12 19l-7-7 7-7" s={16}/>;
const LockIcon   = () => <Ic d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" s={40}/>;
const KeyIcon    = () => <Ic d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />;

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "",       color: "" },
    { label: "Weak",   color: "#EF4444" },
    { label: "Fair",   color: "#F59E0B" },
    { label: "Good",   color: "#3B82F6" },
    { label: "Strong", color: "#10B981" },
  ];
  return { score: s, ...map[s] };
}

// ── Left decorative panel ─────────────────────────────────────────────────────
function LeftPanel({ step }) {
  const panels = {
    request: {
      icon: <MailIcon />,
      headline: "Forgot your\npassword?",
      sub: "No worries — we'll send you a secure link to reset it in seconds.",
    },
    sent: {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      ),
      headline: "Check your\ninbox",
      sub: "We've sent a secure reset link. It's valid for 60 minutes.",
    },
    reset: {
      icon: <LockIcon />,
      headline: "Create a new\npassword",
      sub: "Make it strong. You won't need to change it again for a while.",
    },
    success: {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      ),
      headline: "All done!\nYou're in.",
      sub: "Your password has been updated. Head back and sign in.",
    },
  };

  const { icon, headline, sub } = panels[step] || panels.request;

  return (
    <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #C5612C 0%, #8B3A18 55%, #5C2410 100%)" }}>
      {/* Pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9" fill="white" opacity="0.6"/>
          </svg>
        </div>
        <span className="font-display text-xl font-bold text-white">fabrentals</span>
      </div>

      {/* Centre */}
      <div className="relative flex-1 flex flex-col items-center justify-center py-12 text-center">
        {/* Pulsing rings behind icon */}
        <div className="relative flex items-center justify-center mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="absolute rounded-full border border-white/15"
              style={{
                width: `${i * 80}px`, height: `${i * 80}px`,
                animation: `pulse-ring ${1.5 + i * 0.4}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }} />
          ))}
          <div className="relative w-20 h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white"
            style={{ backdropFilter: "blur(8px)" }}>
            {icon}
          </div>
        </div>

        <h2 className="font-display font-black text-white text-4xl leading-tight whitespace-pre-line">{headline}</h2>
        <p className="text-white/60 text-sm mt-4 max-w-xs leading-relaxed">{sub}</p>

        {/* Step dots */}
        <div className="flex gap-2 mt-8">
          {["request","sent","reset","success"].map((s, i) => (
            <div key={s} className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: s === step ? "24px" : "8px",
                background: s === step ? "white" : "rgba(255,255,255,0.3)",
              }} />
          ))}
        </div>
      </div>

      {/* Bottom tip */}
      <div className="relative border-t border-white/15 pt-5">
        <p className="text-white/50 text-xs leading-relaxed">
          🔒 Reset links expire after 60 minutes and can only be used once.
        </p>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          70%  { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If Supabase sends ?type=recovery in the URL, skip straight to the reset step
  const hasRecoveryToken = searchParams.get("type") === "recovery";

  const [step, setStep]           = useState(hasRecoveryToken ? "reset" : "request");
  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [pwError, setPwError]     = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const strength = getStrength(password);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleRequestReset = async () => {
    if (!email.trim()) { setEmailError("Email address is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email address"); return; }
    setEmailError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setResendCooldown(60);
    setStep("sent");
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setResendCooldown(60);
  };

  const handleSetPassword = async () => {
    let valid = true;
    if (!password)              { setPwError("Password is required"); valid = false; }
    else if (password.length < 8){ setPwError("Minimum 8 characters"); valid = false; }
    else if (strength.score < 2) { setPwError("Please choose a stronger password"); valid = false; }
    else                         { setPwError(""); }

    if (confirm !== password)   { setConfirmError("Passwords do not match"); valid = false; }
    else                        { setConfirmError(""); }

    if (!valid) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    setStep("success");
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAF7F2" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .input-field {
          width: 100%; padding: 14px 16px;
          border: 1.5px solid #E8DDD4; border-radius: 12px;
          font-size: 14px; color: #1A1412; background: white; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .input-field:focus  { border-color: #C5612C; box-shadow: 0 0 0 3px rgba(197,97,44,0.1); }
        .input-field.error  { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .s1{animation-delay:.05s;opacity:0} .s2{animation-delay:.12s;opacity:0}
        .s3{animation-delay:.19s;opacity:0} .s4{animation-delay:.26s;opacity:0}
        .s5{animation-delay:.33s;opacity:0}
        @keyframes spinIn { from{opacity:0;transform:scale(0.7) rotate(-10deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        .spin-in { animation: spinIn 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
      `}</style>

      <LeftPanel step={step} />

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-[#1A1412]">
              fab<span className="text-[#C5612C]">rentals</span>
            </span>
          </div>

          {/* ───────────── STEP: request ───────────── */}
          {step === "request" && (
            <div key="request">
              <button onClick={() => navigate("/login")}
                className="fade-up flex items-center gap-1.5 text-sm text-[#8B7355] hover:text-[#C5612C] mb-7 transition-colors">
                <BackIcon /> Back to sign in
              </button>

              <div className="fade-up s1 mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-2">Password Reset</p>
                <h1 className="font-display font-black text-[#1A1412] text-4xl leading-tight">
                  Forgot your<br/>password?
                </h1>
                <p className="text-[#8B7355] text-sm mt-3 leading-relaxed">
                  Enter the email linked to your account and we'll send you a reset link.
                </p>
              </div>

              <div className="fade-up s2 mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Email Address</label>
                <input
                  type="email"
                  className={`input-field ${emailError ? "error" : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleRequestReset()}
                />
                {emailError && <p className="text-xs text-red-500 mt-1.5">{emailError}</p>}
              </div>

              <button onClick={handleRequestReset} disabled={loading}
                className="fade-up s3 w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 mb-4">
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
                ) : (
                  "Send Reset Link →"
                )}
              </button>

              <p className="fade-up s4 text-xs text-center text-[#8B7355]">
                Remembered it?{" "}
                <button onClick={() => navigate("/login")} className="text-[#C5612C] font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ───────────── STEP: sent ───────────── */}
          {step === "sent" && (
            <div key="sent">
              {/* Animated envelope */}
              <div className="spin-in w-20 h-20 bg-[#FFF5EF] border-2 border-[#C5612C]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#C5612C]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>

              <div className="fade-up s1 text-center mb-6">
                <h1 className="font-display font-black text-[#1A1412] text-3xl mb-2">Check your inbox</h1>
                <p className="text-[#8B7355] text-sm leading-relaxed">
                  We sent a reset link to
                </p>
                <p className="font-semibold text-[#1A1412] mt-1">{email}</p>
              </div>

              {/* Steps */}
              <div className="fade-up s2 bg-white rounded-2xl border border-[#E8DDD4] p-5 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">What to do next</p>
                <div className="space-y-3">
                  {[
                    { n:"1", text:"Open the email from fabrentals" },
                    { n:"2", text:"Click the \"Reset password\" button" },
                    { n:"3", text:"Create your new password" },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#C5612C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {s.n}
                      </div>
                      <p className="text-sm text-[#5C4A3A]">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiry notice */}
              <div className="fade-up s3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                  </svg>
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The link expires in <strong>60 minutes</strong>. Can't find it? Check your spam folder.
                </p>
              </div>

              {/* Resend */}
              <div className="fade-up s4 text-center space-y-3">
                <button onClick={handleResend} disabled={resendCooldown > 0 || loading}
                  className="w-full border border-[#E8DDD4] text-[#5C4A3A] font-medium py-3.5 rounded-full hover:border-[#C5612C] hover:text-[#C5612C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-[#C5612C]/30 border-t-[#C5612C] animate-spin" /> Resending…</>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend email"
                  )}
                </button>
                <button onClick={() => { setStep("request"); setEmail(""); }}
                  className="text-xs text-[#8B7355] hover:text-[#C5612C] transition-colors">
                  Use a different email address
                </button>
              </div>

              {/* Dev shortcut */}
              <div className="fade-up s5 mt-6 border-t border-dashed border-[#E8DDD4] pt-5">
                <p className="text-xs text-center text-[#8B7355] mb-2">Development shortcut</p>
                <button onClick={() => setStep("reset")}
                  className="w-full border border-dashed border-[#C5612C]/40 text-[#C5612C] text-xs font-medium py-2.5 rounded-xl hover:bg-[#FFF5EF] transition-colors">
                  Simulate clicking reset link →
                </button>
              </div>
            </div>
          )}

          {/* ───────────── STEP: reset ───────────── */}
          {step === "reset" && (
            <div key="reset">
              <div className="fade-up s1 mb-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-2">New Password</p>
                <h1 className="font-display font-black text-[#1A1412] text-4xl leading-tight">
                  Create a new<br/>password
                </h1>
                <p className="text-[#8B7355] text-sm mt-2 leading-relaxed">
                  Choose something strong that you'll remember.
                </p>
              </div>

              <div className="space-y-4">
                {/* New password */}
                <div className="fade-up s2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className={`input-field pr-11 ${pwError ? "error" : ""}`}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setPwError(""); }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412] transition-colors p-1">
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i <= strength.score ? strength.color : "#E8DDD4" }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                        <p className="text-xs text-[#8B7355]">{password.length} chars</p>
                      </div>
                    </div>
                  )}
                  {pwError && <p className="text-xs text-red-500 mt-1">{pwError}</p>}
                </div>

                {/* Requirements */}
                <div className="fade-up s3 grid grid-cols-2 gap-1.5">
                  {[
                    { label: "8+ characters",     met: password.length >= 8 },
                    { label: "Uppercase letter",  met: /[A-Z]/.test(password) },
                    { label: "Number",            met: /[0-9]/.test(password) },
                    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
                  ].map(r => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all ${r.met ? "bg-emerald-50 text-emerald-700" : "bg-[#F5EDE0] text-[#8B7355]"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.met ? "bg-emerald-500 text-white" : "bg-[#E8DDD4]"}`}>
                        {r.met && <CheckIcon />}
                      </span>
                      {r.label}
                    </div>
                  ))}
                </div>

                {/* Confirm */}
                <div className="fade-up s4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`input-field pr-11 ${confirmError ? "error" : ""}`}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setConfirmError(""); }}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412] transition-colors p-1">
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {confirm && confirm === password && (
                      <span className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                  {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
                </div>

                <button onClick={handleSetPassword} disabled={loading}
                  className="fade-up s5 w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Updating password…</>
                  ) : (
                    "Update Password →"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ───────────── STEP: success ───────────── */}
          {step === "success" && (
            <div key="success" className="text-center">
              {/* Animated checkmark */}
              <div className="spin-in w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <div className="fade-up s1 mb-6">
                <h1 className="font-display font-black text-[#1A1412] text-4xl mb-2">Password updated!</h1>
                <p className="text-[#8B7355] text-sm leading-relaxed">
                  Your password has been successfully reset.<br/>You can now sign in with your new password.
                </p>
              </div>

              {/* Security tip */}
              <div className="fade-up s2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 flex-shrink-0 mt-0.5">
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">Security tip</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      All active sessions have been signed out. Use your new password to sign back in.
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate("/login")}
                className="fade-up s3 w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm">
                Sign In Now →
              </button>

              <p className="fade-up s4 text-xs text-[#8B7355] mt-4">
                Having trouble?{" "}
                <a href="mailto:support@fabrentals.co.ke" className="text-[#C5612C] hover:underline">Contact support</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
