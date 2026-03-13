import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [resetEmail, setResetEmail] = useState("");
  const [errors, setErrors] = useState({});

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1600));
    setLoading(false);
    // On success: redirect based on role
    alert("Signed in! Redirecting to dashboard...");
  };

  const handleReset = async () => {
    if (!resetEmail) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }

        .input-field {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #E8DDD4;
          border-radius: 12px;
          font-size: 14px;
          color: #1A1412;
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .input-field:focus {
          border-color: #C5612C;
          box-shadow: 0 0 0 3px rgba(197,97,44,0.1);
        }
        .input-field.error {
          border-color: #EF4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.4s ease forwards; }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        .float { animation: floatY 5s ease-in-out infinite; }
      `}</style>

      {/* ── Left: Decorative Panel ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #C5612C 0%, #8B3A18 50%, #5C2410 100%)" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circles" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="30" fill="none" stroke="white" strokeWidth="0.6" />
                <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circles)" />
          </svg>
        </div>

        {/* Light glow effects */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #FAF7F2 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold text-white">
            fab<span className="opacity-70">rentals</span>
          </span>
        </div>

        {/* Center: Visual property cards */}
        <div className="relative flex flex-col gap-4">
          <h2 className="font-display text-5xl font-black text-white leading-tight mb-8">
            Welcome<br />Back.
          </h2>

          {/* Floating property cards */}
          <div className="float" style={{ animationDelay: "0s" }}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🏠</div>
              <div>
                <p className="text-white font-semibold text-sm">Sunrise Hostel</p>
                <p className="text-white/60 text-xs">Billing due in 3 days</p>
              </div>
              <div className="ml-auto bg-amber-400/20 text-amber-200 text-xs font-bold px-2 py-1 rounded-full">Due</div>
            </div>
          </div>

          <div className="float ml-8" style={{ animationDelay: "1.5s" }}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">✅</div>
              <div>
                <p className="text-white font-semibold text-sm">Rent Paid</p>
                <p className="text-white/60 text-xs">KES 8,500 via M-Pesa</p>
              </div>
              <div className="ml-auto bg-green-400/20 text-green-200 text-xs font-bold px-2 py-1 rounded-full">Paid</div>
            </div>
          </div>

          <div className="float ml-4" style={{ animationDelay: "0.8s" }}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">💬</div>
              <div>
                <p className="text-white font-semibold text-sm">Complaint Resolved</p>
                <p className="text-white/60 text-xs">Water issue fixed today</p>
              </div>
              <div className="ml-auto bg-blue-400/20 text-blue-200 text-xs font-bold px-2 py-1 rounded-full">Done</div>
            </div>
          </div>
        </div>

        {/* Bottom: Platform manager note */}
        <div className="relative border-t border-white/20 pt-6">
          <p className="text-white/50 text-xs mb-2 uppercase tracking-widest font-semibold">For Managers</p>
          <p className="text-white/80 text-sm leading-relaxed">
            Manage rooms, tenants, billing cycles, and worker salaries — all from your dashboard.
          </p>
          <a href="#" className="inline-flex items-center gap-1.5 text-white text-xs font-semibold mt-3 underline underline-offset-4">
            Register your property
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-[#1A1412]">
              fab<span className="text-[#C5612C]">rentals</span>
            </span>
          </div>

          {/* ── Forgot Password Mode ── */}
          {forgotMode ? (
            <div className="fade-in">
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#C5612C] mb-8 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </button>

              {resetSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-2xl font-black text-[#1A1412] mb-2">Check Your Email</h2>
                  <p className="text-[#8B7355] text-sm leading-relaxed mb-6">
                    We sent a password reset link to <strong className="text-[#1A1412]">{resetEmail}</strong>. Check your inbox and spam folder.
                  </p>
                  <button
                    onClick={() => { setForgotMode(false); setResetSent(false); }}
                    className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-black text-[#1A1412] mb-2">Reset Password</h1>
                  <p className="text-[#8B7355] text-sm mb-8">
                    Enter your email address and we'll send you a reset link.
                  </p>
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <button
                      onClick={handleReset}
                      disabled={loading || !resetEmail}
                      className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending...
                        </>
                      ) : "Send Reset Link"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Login Mode ── */
            <>
              <h1 className="font-display text-3xl font-black text-[#1A1412] mb-1">Sign In</h1>
              <p className="text-[#8B7355] text-sm mb-8">
                Welcome back. Enter your credentials to continue.
              </p>

              <div className="flex flex-col gap-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={`input-field ${errors.email ? "error" : ""}`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#1A1412] uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-[#C5612C] font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={`input-field pr-12 ${errors.password ? "error" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        {showPassword
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                      </svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.remember}
                      onChange={(e) => update("remember", e.target.checked)}
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        form.remember ? "bg-[#C5612C] border-[#C5612C]" : "border-[#E8DDD4] bg-white"
                      }`}
                    >
                      {form.remember && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-[#5C4A3A]">Remember me for 30 days</span>
                </label>

                {/* Sign in button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-all hover:shadow-lg hover:shadow-[#C5612C]/25 text-sm disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : "Sign In"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#E8DDD4]" />
                  <span className="text-xs text-[#8B7355]">or continue with</span>
                  <div className="flex-1 h-px bg-[#E8DDD4]" />
                </div>

                {/* Google */}
                <button className="w-full border border-[#E8DDD4] bg-white rounded-full py-3.5 text-sm font-medium text-[#1A1412] flex items-center justify-center gap-2 hover:border-[#C5612C] transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Role quick-access */}
              <div className="mt-8 p-4 bg-[#F5EDE0] rounded-2xl border border-[#E8DDD4]">
                <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-3">Sign in as</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Resident", icon: "🏠" },
                    { label: "Manager", icon: "🗝️" },
                    { label: "Owner", icon: "📊" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 bg-white rounded-xl border border-[#E8DDD4] hover:border-[#C5612C] hover:shadow-sm transition-all group"
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-xs font-medium text-[#5C4A3A] group-hover:text-[#C5612C] transition-colors">{r.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#8B7355] mt-2.5 text-center">Same login — your role is determined by your account type</p>
              </div>

              <p className="text-center text-sm text-[#8B7355] mt-8">
                Don't have an account?{" "}
                <a href="/signup" className="text-[#C5612C] font-semibold hover:underline">Sign up free</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
