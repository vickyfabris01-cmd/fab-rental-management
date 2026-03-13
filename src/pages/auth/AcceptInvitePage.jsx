import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Mock invite data (replace with real Supabase lookup) ─────────────────────
const MOCK_INVITES = {
  "abc123token": {
    valid: true,
    expired: false,
    managerName: "",
    tenantName: "Sunrise Hostel",
    invitedBy: "Robert Njenga",
    role: "manager",
    email: "newmanager@example.com",
  },
  "expiredtoken": {
    valid: true,
    expired: true,
    tenantName: "Greenfield Apartments",
    invitedBy: "Alice Wambui",
    role: "manager",
    email: "another@example.com",
  },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, s = 18, c = "" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d={d} />
  </svg>
);
const EyeIcon     = () => <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z" s={16}/>;
const EyeOffIcon  = () => <Ic d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" s={16}/>;
const CheckIcon   = () => <Ic d="M5 13l4 4L19 7" s={16}/>;
const ShieldIcon  = () => <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
const BuildingIcon= () => <Ic d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />;
const AlertIcon   = () => <Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />;

// ── Password strength ────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "",         color: "" },
    { label: "Weak",     color: "#EF4444" },
    { label: "Fair",     color: "#F59E0B" },
    { label: "Good",     color: "#3B82F6" },
    { label: "Strong",   color: "#10B981" },
  ];
  return { score, ...map[score] };
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate  = useNavigate();

  // Simulate token lookup
  const invite = MOCK_INVITES[token] || null;
  const tokenState = !invite ? "invalid" : invite.expired ? "expired" : "valid";

  const [step, setStep]               = useState(1); // 1=review, 2=set password, 3=success
  const [form, setForm]               = useState({ fullName: "", password: "", confirm: "" });
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);

  const strength = getStrength(form.password);

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.fullName.trim())        e.fullName = "Your full name is required";
    if (!form.password)               e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    else if (strength.score < 2)      e.password = "Please choose a stronger password";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAccept = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setStep(3);
  };

  // ── Decorative left panel ─────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1A1412 0%, #2D1E16 50%, #3D2415 100%)" }}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C5612C] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9" fill="white" opacity="0.6"/>
          </svg>
        </div>
        <span className="font-display text-xl font-bold text-white">
          fab<span className="text-[#C5612C]">rentals</span>
        </span>
      </div>

      {/* Centre graphic */}
      <div className="relative flex-1 flex flex-col items-center justify-center py-12">
        {/* Orbital rings */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {[1,2,3].map(i => (
            <div key={i} className="absolute rounded-full border border-white/10"
              style={{ width: `${i*70}px`, height: `${i*70}px` }} />
          ))}
          {/* Centre icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#C5612C] flex items-center justify-center shadow-2xl"
            style={{ boxShadow: "0 0 40px rgba(197,97,44,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          {/* Orbit dots */}
          {[0, 90, 180, 270].map((deg, i) => (
            <div key={i} className="absolute w-3 h-3 rounded-full bg-[#C5612C]/60"
              style={{
                transform: `rotate(${deg}deg) translateX(90px)`,
                animation: `orbit${i} ${6+i}s linear infinite`,
              }} />
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="font-display font-black text-white text-3xl leading-tight">
            You've been<br/>invited to join
          </p>
          {invite && tokenState === "valid" && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
              <BuildingIcon />
              <span className="text-white font-semibold text-sm">{invite.tenantName}</span>
            </div>
          )}
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Accept this invitation to start<br/>managing properties on fabrentals
          </p>
        </div>
      </div>

      {/* Bottom quote */}
      <div className="relative border-t border-white/10 pt-6">
        <p className="text-white/60 text-sm italic leading-relaxed">
          "The best managers use the best tools. Welcome to a platform built for Kenya's rental market."
        </p>
      </div>

      <style>{`
        @keyframes orbit0 { from{transform:rotate(0deg) translateX(90px)}   to{transform:rotate(360deg) translateX(90px)} }
        @keyframes orbit1 { from{transform:rotate(90deg) translateX(90px)}  to{transform:rotate(450deg) translateX(90px)} }
        @keyframes orbit2 { from{transform:rotate(180deg) translateX(90px)} to{transform:rotate(540deg) translateX(90px)} }
        @keyframes orbit3 { from{transform:rotate(270deg) translateX(90px)} to{transform:rotate(630deg) translateX(90px)} }
      `}</style>
    </div>
  );

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
        .input-field:focus { border-color: #C5612C; box-shadow: 0 0 0 3px rgba(197,97,44,0.1); }
        .input-field.error { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .s1{animation-delay:.05s;opacity:0} .s2{animation-delay:.12s;opacity:0}
        .s3{animation-delay:.19s;opacity:0} .s4{animation-delay:.26s;opacity:0}
        .s5{animation-delay:.33s;opacity:0}
      `}</style>

      <LeftPanel />

      {/* ── Right: Form ── */}
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

          {/* ── Invalid token ── */}
          {tokenState === "invalid" && (
            <div className="fade-up text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 text-red-500">
                <AlertIcon />
              </div>
              <h1 className="font-display font-black text-[#1A1412] text-3xl mb-2">Invalid Link</h1>
              <p className="text-[#8B7355] text-sm leading-relaxed mb-6">
                This invitation link is invalid or has already been used. Please ask the property owner to send a new invite.
              </p>
              <button onClick={() => navigate("/login")}
                className="w-full bg-[#1A1412] text-white font-semibold py-4 rounded-full hover:bg-[#2D1E16] transition-colors">
                Go to Sign In
              </button>
            </div>
          )}

          {/* ── Expired token ── */}
          {tokenState === "expired" && (
            <div className="fade-up text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5 text-amber-500">
                <AlertIcon />
              </div>
              <h1 className="font-display font-black text-[#1A1412] text-3xl mb-2">Link Expired</h1>
              <p className="text-[#8B7355] text-sm leading-relaxed mb-2">
                This invitation link expired after 48 hours.
              </p>
              <p className="text-[#8B7355] text-sm mb-6">
                It was sent by <span className="font-medium text-[#1A1412]">{invite.invitedBy}</span> for{" "}
                <span className="font-medium text-[#1A1412]">{invite.tenantName}</span>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-800 font-medium mb-1">What to do next</p>
                <p className="text-xs text-amber-700">Contact the property owner and ask them to re-send your manager invitation from their fabrentals dashboard.</p>
              </div>
              <button onClick={() => navigate("/login")}
                className="w-full bg-[#1A1412] text-white font-semibold py-4 rounded-full hover:bg-[#2D1E16] transition-colors">
                Go to Sign In
              </button>
            </div>
          )}

          {/* ── Valid token: Step 1 — Review invite ── */}
          {tokenState === "valid" && step === 1 && (
            <div>
              <div className="fade-up s1 mb-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-2">Manager Invitation</p>
                <h1 className="font-display font-black text-[#1A1412] text-4xl leading-tight">
                  You're invited!
                </h1>
                <p className="text-[#8B7355] text-sm mt-2">
                  Review the details below, then set up your account to get started.
                </p>
              </div>

              {/* Invite card */}
              <div className="fade-up s2 bg-white rounded-2xl border border-[#E8DDD4] p-5 mb-6"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#C5612C] flex items-center justify-center flex-shrink-0">
                    <BuildingIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-[#1A1412] text-lg leading-none">{invite.tenantName}</p>
                    <p className="text-xs text-[#8B7355] mt-1">Invited by <span className="font-medium text-[#5C4A3A]">{invite.invitedBy}</span></p>
                  </div>
                  <span className="bg-[#C5612C]/10 text-[#C5612C] text-xs font-bold px-2.5 py-1 rounded-full border border-[#C5612C]/20 flex-shrink-0 capitalize">
                    {invite.role}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F5EDE0] space-y-2">
                  {[
                    { label: "Your role",    value: "Property Manager" },
                    { label: "Sign-in email",value: invite.email },
                    { label: "Property",     value: invite.tenantName },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-[#8B7355]">{r.label}</span>
                      <span className="font-medium text-[#1A1412] text-right truncate ml-4">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What you'll be able to do */}
              <div className="fade-up s3 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">As a manager you can</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Manage rooms & buildings",
                    "Approve rental requests",
                    "Record & track payments",
                    "Handle resident complaints",
                    "Manage workers & salaries",
                    "Send announcements",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2 bg-white rounded-xl border border-[#E8DDD4] p-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-600">
                        <CheckIcon />
                      </div>
                      <p className="text-xs text-[#5C4A3A] leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fade-up s4 flex gap-3">
                <button onClick={() => navigate("/")}
                  className="flex-1 border border-[#E8DDD4] rounded-full py-3.5 text-sm font-medium text-[#5C4A3A] hover:border-[#C5612C] transition-colors">
                  Decline
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-[2] bg-[#C5612C] text-white font-semibold py-3.5 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm">
                  Accept & Set Up Account →
                </button>
              </div>

              <p className="fade-up s5 text-xs text-center text-[#8B7355] mt-4">
                By accepting, you agree to fabrentals'{" "}
                <a href="#" className="text-[#C5612C] hover:underline">Terms of Service</a>
              </p>
            </div>
          )}

          {/* ── Valid token: Step 2 — Set password ── */}
          {tokenState === "valid" && step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="fade-up flex items-center gap-1.5 text-sm text-[#8B7355] hover:text-[#C5612C] mb-6 transition-colors">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <div className="fade-up s1 mb-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-2">Almost there</p>
                <h1 className="font-display font-black text-[#1A1412] text-4xl leading-tight">Set your password</h1>
                <p className="text-[#8B7355] text-sm mt-2">
                  You'll sign in as <span className="font-medium text-[#1A1412]">{invite.email}</span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Full name */}
                <div className="fade-up s2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Full Name</label>
                  <input
                    className={`input-field ${errors.fullName ? "error" : ""}`}
                    placeholder="e.g. Michael Kamau"
                    value={form.fullName}
                    onChange={e => update("fullName", e.target.value)}
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* Password */}
                <div className="fade-up s3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className={`input-field pr-11 ${errors.password ? "error" : ""}`}
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412] transition-colors p-1">
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: i <= strength.score ? strength.color : "#E8DDD4" }} />
                        ))}
                      </div>
                      <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm */}
                <div className="fade-up s4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`input-field pr-11 ${errors.confirm ? "error" : ""}`}
                      placeholder="Repeat your password"
                      value={form.confirm}
                      onChange={e => update("confirm", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412] transition-colors p-1">
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {form.confirm && form.confirm === form.password && (
                      <span className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500">
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                  {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
                </div>

                <button onClick={handleAccept} disabled={loading}
                  className="fade-up s5 w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating your account…
                    </>
                  ) : (
                    "Create Account & Join →"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Success ── */}
          {tokenState === "valid" && step === 3 && (
            <div className="fade-up text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h1 className="font-display font-black text-[#1A1412] text-3xl mb-2">Welcome aboard!</h1>
              <p className="text-[#8B7355] text-sm mb-1">
                Your manager account for
              </p>
              <p className="font-semibold text-[#1A1412] mb-5">{invite?.tenantName}</p>

              <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 mb-6 text-left space-y-2">
                {[
                  { label: "Name",     value: form.fullName },
                  { label: "Email",    value: invite?.email },
                  { label: "Role",     value: "Property Manager" },
                  { label: "Property", value: invite?.tenantName },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-[#8B7355]">{r.label}</span>
                    <span className="font-medium text-[#1A1412]">{r.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate("/manage")}
                className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm">
                Go to Manager Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
