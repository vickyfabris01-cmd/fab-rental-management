import { useState } from "react";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1 = account, 2 = personal
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    agree: false,
  });
  const [errors, setErrors] = useState({});

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const passwordStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { score: 1, label: "Weak", color: "#EF4444" },
      { score: 2, label: "Fair", color: "#F59E0B" },
      { score: 3, label: "Good", color: "#3B82F6" },
      { score: 4, label: "Strong", color: "#10B981" },
    ];
    return map[score - 1] || { score: 0, label: "", color: "" };
  };

  const strength = passwordStrength(form.password);

  const validateStep1 = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Must be at least 8 characters";
    if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.full_name) e.full_name = "Full name is required";
    if (!form.phone) e.phone = "Phone number is required";
    else if (!/^(\+254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid Kenyan phone number";
    if (!form.agree) e.agree = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    alert("Account created! Check your email to verify.");
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

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: slideIn 0.35s ease forwards; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      {/* ── Left Panel (decorative) ── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1A1412 0%, #2D1E16 60%, #3D2415 100%)" }}
      >
        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,2 58,17 58,35 30,50 2,35 2,17" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex)" />
          </svg>
        </div>

        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C5612C 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#C5612C] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold text-white">
            fab<span className="text-[#C5612C]">rentals</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative">
          <h2 className="font-display text-5xl font-black text-white leading-tight mb-6">
            Your Next<br />
            Home Starts<br />
            <span className="text-[#C5612C]">Here.</span>
          </h2>
          <p className="text-stone-400 text-base leading-relaxed font-light max-w-sm">
            Join thousands of Kenyans who manage their rentals, pay bills, and communicate with managers — all in one place.
          </p>

          {/* Feature list */}
          <div className="mt-10 flex flex-col gap-4">
            {[
              "Browse & apply for rooms online",
              "Pay rent via M-Pesa instantly",
              "Track invoices & billing history",
              "Submit complaints & get responses",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5612C]/20 border border-[#C5612C]/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#C5612C]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-stone-300 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-stone-300 text-sm italic leading-relaxed mb-4">
            "Found my apartment in Kilimani within a day. The M-Pesa integration makes paying rent so much easier."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C5612C]/30 flex items-center justify-center text-xs font-bold text-[#C5612C]">JK</div>
            <div>
              <p className="text-white text-xs font-semibold">James K.</p>
              <p className="text-stone-500 text-xs">Resident, Kilimani</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
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

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s < step
                      ? "bg-[#C5612C] text-white"
                      : s === step
                      ? "bg-[#1A1412] text-white"
                      : "bg-[#E8DDD4] text-[#8B7355]"
                  }`}
                >
                  {s < step ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${s === step ? "text-[#1A1412]" : "text-[#8B7355]"}`}>
                  {s === 1 ? "Account" : "Personal"}
                </span>
                {s < 2 && <div className="w-10 h-px bg-[#E8DDD4]" />}
              </div>
            ))}
          </div>

          <h1 className="font-display text-3xl font-black text-[#1A1412] mb-1">
            {step === 1 ? "Create Account" : "Almost Done"}
          </h1>
          <p className="text-[#8B7355] text-sm mb-8">
            {step === 1
              ? "Set up your login credentials to get started."
              : "Tell us a bit about yourself."}
          </p>

          {/* ── Step 1: Credentials ── */}
          {step === 1 && (
            <div className="slide-in flex flex-col gap-5">
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
                <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
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
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength.score ? strength.color : "#E8DDD4",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={(e) => update("confirm_password", e.target.value)}
                  className={`input-field ${errors.confirm_password ? "error" : ""}`}
                />
                {errors.confirm_password && <p className="text-xs text-red-500 mt-1.5">{errors.confirm_password}</p>}
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors mt-2 text-sm"
              >
                Continue →
              </button>

              {/* Social divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-[#E8DDD4]" />
                <span className="text-xs text-[#8B7355]">or sign up with</span>
                <div className="flex-1 h-px bg-[#E8DDD4]" />
              </div>

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
          )}

          {/* ── Step 2: Personal Info ── */}
          {step === 2 && (
            <div className="slide-in flex flex-col gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Wanjiku"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className={`input-field ${errors.full_name ? "error" : ""}`}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1.5">{errors.full_name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1412] mb-2 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-[#5C4A3A] font-medium border-r border-[#E8DDD4] pr-3">
                    🇰🇪 +254
                  </div>
                  <input
                    type="tel"
                    placeholder="7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={`input-field pl-24 ${errors.phone ? "error" : ""}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1.5">{errors.phone}</p>}
                <p className="text-xs text-[#8B7355] mt-1.5">Used for M-Pesa payment notifications</p>
              </div>

              {/* Account type info */}
              <div className="bg-[#FFF5EF] border border-[#C5612C]/20 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C5612C]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C5612C]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#C5612C] mb-0.5">Visitor Account</p>
                    <p className="text-xs text-[#5C4A3A] leading-relaxed">
                      You'll start as a visitor and can browse properties freely. Once a manager approves your rental request, your account will be upgraded to a resident.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.agree}
                      onChange={(e) => update("agree", e.target.checked)}
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        form.agree ? "bg-[#C5612C] border-[#C5612C]" : "border-[#E8DDD4] bg-white"
                      }`}
                    >
                      {form.agree && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#5C4A3A] leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-[#C5612C] font-medium underline underline-offset-2">Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="text-[#C5612C] font-medium underline underline-offset-2">Privacy Policy</a>
                  </span>
                </label>
                {errors.agree && <p className="text-xs text-red-500 mt-1.5">{errors.agree}</p>}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-[#E8DDD4] text-[#1A1412] font-semibold py-4 rounded-full hover:border-[#C5612C] transition-colors text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-[#8B7355] mt-8">
            Already have an account?{" "}
            <a href="/login" className="text-[#C5612C] font-semibold hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
