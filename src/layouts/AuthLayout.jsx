import { useEffect } from "react";
import { Link }       from "react-router-dom";
import LogoWhiteSrc   from "../assets/logo-white.svg";
import LogoSrc        from "../assets/logo.svg";

// =============================================================================
// AuthLayout
//
// Split-panel shell for all auth pages: /login, /signup, /invite/:token, /reset-password
//
// Props:
//   children         — The form content rendered in the right panel
//   leftContent      — Optional custom left-panel content (passed by the page)
//                      If omitted, a default branded panel is rendered
//   leftBg           — CSS background string for the left panel
//                      Default: terracotta-to-charcoal gradient
//   heading          — Large headline on the left panel
//   subheading       — Subtitle text below the headline
//   showLeftOnMobile — Show left panel on mobile (default false — form takes full width)
//
// Usage (LoginPage):
//   <AuthLayout
//     heading="Welcome back."
//     subheading="Manage your rental, pay your rent, track your home."
//     leftContent={<LoginLeftPanel />}
//   >
//     <LoginForm />
//   </AuthLayout>
// =============================================================================

const DEFAULT_BG = "linear-gradient(145deg, #1A1412 0%, #2D1E16 40%, #3D2318 70%, #C5612C 120%)";

// Animated shapes that float in the left panel background
function FloatingShapes() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Dot grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
        <defs>
          <pattern id="auth-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dots)"/>
      </svg>

      {/* Large radial glow */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(197,97,44,0.35) 0%, transparent 65%)" }}/>

      {/* Bottom glow */}
      <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(197,97,44,0.20) 0%, transparent 65%)" }}/>

      {/* Animated floating orbs */}
      <style>{`
        @keyframes orbFloat1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.05)} }
        @keyframes orbFloat2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(8deg)} }
        @keyframes orbFloat3 { 0%,100%{transform:translateY(0)} 60%{transform:translateY(-22px)} }
        .orb1{animation:orbFloat1 6s ease-in-out infinite}
        .orb2{animation:orbFloat2 8s 1s ease-in-out infinite}
        .orb3{animation:orbFloat3 5s 2s ease-in-out infinite}
      `}</style>

      <div className="orb1" style={{ position:"absolute", top:"22%", right:"18%", width:120, height:120, borderRadius:"50%", border:"1px solid rgba(197,97,44,0.25)", background:"rgba(197,97,44,0.06)" }}/>
      <div className="orb2" style={{ position:"absolute", bottom:"30%", left:"12%", width:80, height:80, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }}/>
      <div className="orb3" style={{ position:"absolute", top:"55%", right:"30%", width:48, height:48, borderRadius:"50%", background:"rgba(197,97,44,0.15)", border:"1px solid rgba(197,97,44,0.3)" }}/>

      {/* Subtle diagonal rule */}
      <div style={{ position:"absolute", top:0, bottom:0, left:"40%", width:1, background:"linear-gradient(to bottom, transparent, rgba(255,255,255,0.04) 30%, rgba(197,97,44,0.12) 60%, transparent)", transform:"rotate(15deg) translateX(50px)", transformOrigin:"center" }}/>
    </div>
  );
}

// Default feature checklist shown on left panel
const DEFAULT_FEATURES = [
  "Pay rent via M-Pesa — anytime, anywhere",
  "Track billing cycles and download invoices",
  "Submit and track maintenance requests",
  "Get real-time notifications on your phone",
];

export default function AuthLayout({
  children,
  leftContent,
  leftBg,
  heading      = "Your rental,\nmanaged simply.",
  subheading   = "Kenya's modern platform for tenants, managers, and property owners.",
  features     = DEFAULT_FEATURES,
  showBackLink = true,
}) {

  // Prevent body scroll behind the fixed layout
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }

        .auth-check-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }

        @keyframes authFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .auth-form-enter { animation: authFadeUp 0.45s ease both; }

        /* Right panel scrollbar */
        .auth-right::-webkit-scrollbar { width: 5px; }
        .auth-right::-webkit-scrollbar-track { background: #FAF7F2; }
        .auth-right::-webkit-scrollbar-thumb { background: #E8DDD4; border-radius: 99px; }

        @media (max-width: 900px) {
          .auth-left  { display: none !important; }
          .auth-right { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>

      <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#FAF7F2" }}>

        {/* ── Left Decorative Panel ── */}
        <div
          className="auth-left"
          style={{
            width: "42%",
            flexShrink: 0,
            position: "relative",
            background: leftBg ?? DEFAULT_BG,
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px",
            overflow: "hidden",
          }}
        >
          <FloatingShapes />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <Link to="/">
              <img src={LogoWhiteSrc} alt="fabrentals" style={{ height: 28, width: "auto" }} />
            </Link>
          </div>

          {/* Headline block — centered */}
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {leftContent ?? (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C5612C", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                  fabrentals
                </p>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px, 3.2vw, 42px)",
                  color: "#fff",
                  lineHeight: 1.15,
                  marginBottom: 18,
                  whiteSpace: "pre-line",
                }}>
                  {heading}
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.65, marginBottom: 36, maxWidth: 340 }}>
                  {subheading}
                </p>

                {/* Feature list */}
                <div>
                  {features.map((feat, i) => (
                    <div key={i} className="auth-check-item">
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: "rgba(197,97,44,0.25)",
                        border: "1px solid rgba(197,97,44,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, fontWeight: 400 }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bottom: manager CTA */}
          <div style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Managing a property?{" "}
              <Link to="/signup?role=manager" style={{ color: "#C5612C", textDecoration: "none", fontWeight: 600 }}>
                Register your business →
              </Link>
            </p>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div
          className="auth-right"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            background: "#FAF7F2",
          }}
        >
          {/* Top nav bar (mobile only — shows logo) */}
          <div style={{ padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #EDE4D8" }}>
            <Link to="/">
              <img src={LogoSrc} alt="fabrentals" style={{ height: 26, width: "auto" }} />
            </Link>
            {showBackLink && (
              <Link to="/" style={{ fontSize: 13, color: "#8B7355", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
                onMouseOver={e => e.currentTarget.style.color = "#C5612C"}
                onMouseOut={e  => e.currentTarget.style.color = "#8B7355"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Back to site
              </Link>
            )}
          </div>

          {/* Form content */}
          <div
            className="auth-form-enter"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 28px",
            }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              {children}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 28px", borderTop: "1px solid #EDE4D8", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "#8B7355", textDecoration: "none" }}
                onMouseOver={e => e.currentTarget.style.color = "#C5612C"}
                onMouseOut={e  => e.currentTarget.style.color = "#8B7355"}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
