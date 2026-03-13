import { useState, useEffect } from "react";
import LogoSrc from "../../assets/logo.svg";
import LogoWhiteSrc from "../../assets/logo-white.svg";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────
const PROPERTIES = [
  {
    id: 1, slug: "sunrise-hostel",
    name: "Sunrise Hostel", location: "Westlands, Nairobi",
    type: "Hostel", rooms: 24, available: 6, from: 8500, rating: 4.8,
    amenities: ["WiFi", "Water", "Security", "Laundry"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700&q=80",
    badge: "Popular", badgeColor: "#C5612C",
  },
  {
    id: 2, slug: "greenfield-apartments",
    name: "Greenfield Apartments", location: "Kilimani, Nairobi",
    type: "Apartment", rooms: 48, available: 12, from: 22000, rating: 4.6,
    amenities: ["Parking", "Gym", "WiFi", "CCTV"],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700&q=80",
    badge: "New", badgeColor: "#2563EB",
  },
  {
    id: 3, slug: "maisha-student-lodge",
    name: "Maisha Student Lodge", location: "Kahawa, Nairobi",
    type: "Student Residence", rooms: 80, available: 20, from: 5500, rating: 4.5,
    amenities: ["WiFi", "Study Room", "Meals", "Security"],
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=700&q=80",
    badge: "Student", badgeColor: "#059669",
  },
  {
    id: 4, slug: "farmview-workers-estate",
    name: "Farmview Workers Estate", location: "Limuru, Kiambu",
    type: "Farm Housing", rooms: 36, available: 8, from: 3500, rating: 4.3,
    amenities: ["Water", "Electricity", "Security", "Canteen"],
    image: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=700&q=80",
    badge: null, badgeColor: null,
  },
  {
    id: 5, slug: "bluepeak-residences",
    name: "BluePeak Residences", location: "Lavington, Nairobi",
    type: "Apartment", rooms: 30, available: 4, from: 35000, rating: 4.9,
    amenities: ["Rooftop", "Gym", "Concierge", "Parking"],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&q=80",
    badge: "Premium", badgeColor: "#7C3AED",
  },
  {
    id: 6, slug: "kasarani-youth-hostel",
    name: "Kasarani Youth Hostel", location: "Kasarani, Nairobi",
    type: "Hostel", rooms: 60, available: 18, from: 4500, rating: 4.2,
    amenities: ["WiFi", "Water", "Common Room", "Security"],
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=80",
    badge: null, badgeColor: null,
  },
];

const STATS = [
  { value: "120+",   label: "Properties Listed" },
  { value: "4,800+", label: "Happy Residents"   },
  { value: "98%",    label: "On-Time Payments"  },
  { value: "34",     label: "Cities Covered"    },
];

const TYPES = ["All", "Hostel", "Apartment", "Student Residence", "Farm Housing"];

const STEPS = [
  {
    step: "01", title: "Browse",
    desc: "Explore verified properties across Kenya filtered by type, location, and budget.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  },
  {
    step: "02", title: "Request",
    desc: "Submit a rental request to the manager with your preferred move-in date.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    step: "03", title: "Get Approved",
    desc: "Manager reviews your request and sends a move-in offer within 24 hours.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  {
    step: "04", title: "Move In",
    desc: "Pay your first rent via M-Pesa, collect your keys, and settle into your new home.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Micro icons
// ─────────────────────────────────────────────────────────────────────────────
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="#F59E0B">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="#C5612C">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// PropertyCard
// ─────────────────────────────────────────────────────────────────────────────
function PropertyCard({ p }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={`/property/${p.slug}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: "#fff",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid #EDE4D8",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "0 24px 52px rgba(0,0,0,0.11)" : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease",
      }}>
        {/* Image */}
        <div style={{ position: "relative", height: 208, overflow: "hidden" }}>
          <img
            src={p.image}
            alt={p.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 50%)" }} />
          {p.badge && (
            <span style={{
              position: "absolute", top: 12, left: 12,
              background: p.badgeColor, color: "#fff",
              fontSize: 11, fontWeight: 700,
              padding: "3px 10px", borderRadius: 999,
            }}>
              {p.badge}
            </span>
          )}
          <div style={{
            position: "absolute", bottom: 12, right: 12,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
            borderRadius: 999, padding: "4px 11px",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
              {p.available} available
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 20px 20px" }}>
          {/* Name + rating */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 900,
                fontSize: 16, color: "#1A1412", margin: "0 0 4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {p.name}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <PinIcon />
                <span style={{ fontSize: 12, color: "#8B7355" }}>{p.location}</span>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: 999, padding: "4px 8px", flexShrink: 0,
            }}>
              <StarIcon />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>{p.rating}</span>
            </div>
          </div>

          {/* Type chip */}
          <div style={{ marginBottom: 12, marginTop: 4 }}>
            <span style={{
              display: "inline-block",
              fontSize: 11, fontWeight: 600, color: "#C5612C",
              background: "#FFF5EF", border: "1px solid rgba(197,97,44,0.18)",
              borderRadius: 999, padding: "3px 10px",
            }}>
              {p.type}
            </span>
          </div>

          {/* Amenities */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {p.amenities.map(a => (
              <span key={a} style={{
                fontSize: 11, color: "#5C4A3A",
                background: "#FAF7F2", border: "1px solid #EDE4D8",
                borderRadius: 999, padding: "3px 9px",
              }}>
                {a}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 14, borderTop: "1px solid #F0E8DE",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#8B7355", marginBottom: 1 }}>From</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#C5612C" }}>
                KES {p.from.toLocaleString()}
                <span style={{ fontSize: 12, fontWeight: 400, color: "#8B7355" }}>/mo</span>
              </div>
            </div>
            <RequestBtn />
          </div>
        </div>
      </div>
    </a>
  );
}

function RequestBtn() {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={e => { e.preventDefault(); window.location.href = "/signup"; }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? "#C5612C" : "#1A1412",
        color: "#fff", border: "none", borderRadius: 999,
        padding: "9px 18px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "background 0.18s", flexShrink: 0,
      }}
    >
      Request
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PublicPage() {
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch]         = useState("");
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const filtered = PROPERTIES.filter(p => {
    const matchType   = activeType === "All" || p.type === activeType;
    const matchSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1A1412" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link { position:relative; text-decoration:none; transition: color 0.15s; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1.5px; background:#C5612C; transition: width 0.2s ease; }
        .nav-link:hover::after { width:100%; }
        .nav-link:hover { color:#C5612C !important; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp 0.6s 0.05s both} .fu2{animation:fadeUp 0.6s 0.18s both}
        .fu3{animation:fadeUp 0.6s 0.3s both}  .fu4{animation:fadeUp 0.6s 0.44s both}

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        .float  { animation: float 4s ease-in-out infinite; }
        .float2 { animation: float 4s 1.3s ease-in-out infinite; }
        .float3 { animation: float 4s 0.65s ease-in-out infinite; }

        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .live-dot { animation: pulse2 2s ease-in-out infinite; }

        input:focus { outline: none; }

        @media (max-width: 767px)  { .desk { display:none !important; } }
        @media (min-width: 768px)  { .mob  { display:none !important; } }

        @media (max-width: 959px)  {
          .hero-grid  { grid-template-columns: 1fr !important; }
          .hero-right { display:none !important; }
          .hero-text  { max-width: 100% !important; }
        }
        @media (max-width: 639px)  {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .prop-grid  { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .step-connector { display:none !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .prop-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .steps-grid { grid-template-columns: repeat(2,1fr) !important; gap: 40px !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.08)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "0 28px", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <img src={LogoSrc} alt="fabrentals" style={{ height: 30, width: "auto" }} />
          </a>

          {/* Desktop links */}
          <div className="desk" style={{ display: "flex", alignItems: "center", gap: 34 }}>
            {["Properties", "How It Works", "For Managers", "Pricing"].map(label => (
              <a key={label} href="#" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: "#1A1412" }}>
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="desk" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NavBtn href="/login" variant="ghost">Sign in</NavBtn>
            <NavBtn href="/signup" variant="primary">Get Started →</NavBtn>
          </div>

          {/* Mobile burger */}
          <button className="mob" onClick={() => setMenuOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#1A1412", display: "flex" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #EDE4D8", padding: "16px 28px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            {["Properties", "How It Works", "For Managers", "Pricing"].map(l => (
              <a key={l} href="#" style={{ fontSize: 15, fontWeight: 500, color: "#1A1412", textDecoration: "none" }}>{l}</a>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #EDE4D8" }} />
            <a href="/login" style={{ fontSize: 15, fontWeight: 500, color: "#1A1412", textDecoration: "none" }}>Sign in</a>
            <a href="/signup" style={{ background: "#C5612C", color: "#fff", borderRadius: 999, padding: "12px", fontSize: 15, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              Get Started →
            </a>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        paddingTop: 68,
        background: "linear-gradient(140deg,#FAF7F2 0%,#F5EDE0 55%,#EDD9C0 100%)",
      }}>
        {/* Dot grid bg */}
        <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}>
          <defs><pattern id="htdots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#1A1412"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#htdots)"/>
        </svg>
        {/* Radial glows */}
        <div aria-hidden style={{ position:"absolute",top:-100,right:-80,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,#C5612C,transparent 68%)",opacity:0.07,pointerEvents:"none" }}/>
        <div aria-hidden style={{ position:"absolute",bottom:-60,left:-90,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,#8B4513,transparent 68%)",opacity:0.06,pointerEvents:"none" }}/>
        {/* Floating dots */}
        <div aria-hidden className="float"  style={{ position:"absolute",top:"20%",right:"18%",width:9,height:9,borderRadius:"50%",background:"#C5612C",opacity:0.45 }}/>
        <div aria-hidden className="float2" style={{ position:"absolute",top:"40%",right:"35%",width:6,height:6,borderRadius:"50%",background:"#C5612C",opacity:0.28 }}/>
        <div aria-hidden className="float3" style={{ position:"absolute",bottom:"25%",left:"10%",width:11,height:11,borderRadius:"50%",background:"#8B4513",opacity:0.2 }}/>

        <div className="hero-grid" style={{ position:"relative",maxWidth:1280,margin:"0 auto",padding:"72px 28px 80px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center" }}>

          {/* Left */}
          <div className="hero-text" style={{ maxWidth: 540 }}>
            {/* Live badge */}
            <div className="fu1" style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:"rgba(255,255,255,0.68)",backdropFilter:"blur(8px)",
              border:"1px solid rgba(197,97,44,0.22)",borderRadius:999,
              padding:"6px 16px",marginBottom:28,
            }}>
              <span className="live-dot" style={{ width:7,height:7,borderRadius:"50%",background:"#C5612C",display:"inline-block" }}/>
              <span style={{ fontSize:11,fontWeight:700,color:"#C5612C",letterSpacing:"0.08em",textTransform:"uppercase" }}>Now Live in Kenya</span>
            </div>

            <h1 className="fu2" style={{
              fontFamily:"'Playfair Display',serif",fontWeight:900,
              fontSize:"clamp(40px,6.5vw,72px)",lineHeight:1.06,
              color:"#1A1412",margin:"0 0 22px",
            }}>
              Find Your<br/>
              <span style={{color:"#C5612C"}}>Perfect</span><br/>
              Home Today
            </h1>

            <p className="fu3" style={{ fontSize:17,color:"#5C4A3A",lineHeight:1.72,fontWeight:300,margin:"0 0 34px",maxWidth:420 }}>
              Browse verified hostels, apartments, and student residences across Kenya.
              Apply online, pay via M-Pesa, and move in without the hassle.
            </p>

            <div className="fu4" style={{ display:"flex",flexWrap:"wrap",gap:12 }}>
              <a href="#properties" style={{
                display:"inline-flex",alignItems:"center",gap:8,
                background:"#C5612C",color:"#fff",textDecoration:"none",
                fontWeight:600,fontSize:15,
                padding:"13px 28px",borderRadius:999,
                boxShadow:"0 4px 20px rgba(197,97,44,0.32)",
                transition:"all 0.18s",
              }}
                onMouseOver={e=>{e.currentTarget.style.background="#A84E22";e.currentTarget.style.boxShadow="0 6px 28px rgba(197,97,44,0.42)"}}
                onMouseOut={e=>{e.currentTarget.style.background="#C5612C";e.currentTarget.style.boxShadow="0 4px 20px rgba(197,97,44,0.32)"}}
              >
                Browse Properties
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="/signup" style={{
                display:"inline-flex",alignItems:"center",gap:8,
                background:"#fff",color:"#1A1412",textDecoration:"none",
                fontWeight:600,fontSize:15,
                padding:"13px 28px",borderRadius:999,
                border:"1.5px solid #E8DDD4",
                transition:"border-color 0.18s",
              }}
                onMouseOver={e=>e.currentTarget.style.borderColor="#C5612C"}
                onMouseOut={e=>e.currentTarget.style.borderColor="#E8DDD4"}
              >
                List Your Property
              </a>
            </div>
          </div>

          {/* Right — preview card */}
          <div className="hero-right" style={{ position:"relative",display:"flex",justifyContent:"center",alignItems:"center" }}>
            {/* Card */}
            <div style={{
              background:"#fff",borderRadius:24,overflow:"hidden",
              boxShadow:"0 32px 72px rgba(0,0,0,0.15)",
              width:"100%",maxWidth:330,position:"relative",zIndex:2,
            }}>
              <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=680&q=80"
                alt="Sunrise Hostel"
                style={{ width:"100%",height:196,objectFit:"cover",display:"block" }}
              />
              <div style={{ padding:"18px 20px 20px" }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10 }}>
                  <div>
                    <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:"0 0 4px" }}>Sunrise Hostel</p>
                    <div style={{ display:"flex",alignItems:"center",gap:4 }}><PinIcon/><span style={{ fontSize:12,color:"#8B7355" }}>Westlands, Nairobi</span></div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:4,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:999,padding:"4px 8px",flexShrink:0 }}>
                    <StarIcon/><span style={{ fontSize:11,fontWeight:700,color:"#92400E" }}>4.8</span>
                  </div>
                </div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:12 }}>
                  {["WiFi","Water","Security"].map(a=>(
                    <span key={a} style={{ fontSize:11,color:"#5C4A3A",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"3px 9px" }}>{a}</span>
                  ))}
                </div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,borderTop:"1px solid #F0E8DE" }}>
                  <div>
                    <div style={{ fontSize:11,color:"#8B7355" }}>From</div>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,color:"#C5612C" }}>
                      KES 8,500<span style={{ fontSize:12,fontWeight:400,color:"#8B7355" }}>/mo</span>
                    </div>
                  </div>
                  <button style={{ background:"#C5612C",color:"#fff",border:"none",borderRadius:999,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer" }}>
                    Request
                  </button>
                </div>
              </div>
            </div>

            {/* Floating: available */}
            <div style={{ position:"absolute",bottom:4,left:"2%",zIndex:3,background:"#fff",borderRadius:14,boxShadow:"0 8px 28px rgba(0,0,0,0.12)",border:"1px solid #F0E8DE",padding:"10px 16px" }}>
              <div style={{ fontSize:11,color:"#8B7355",marginBottom:2 }}>Available Now</div>
              <div style={{ fontWeight:700,fontSize:14,color:"#1A1412" }}>6 rooms open</div>
            </div>

            {/* Floating: M-Pesa */}
            <div style={{ position:"absolute",top:4,right:"2%",zIndex:3,background:"#C5612C",borderRadius:14,boxShadow:"0 8px 28px rgba(197,97,44,0.32)",padding:"10px 16px" }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.72)",marginBottom:2 }}>M-Pesa Ready</div>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Pay Instantly</div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <section style={{ background:"#1A1412",padding:"44px 28px" }}>
        <div className="stats-grid" style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20 }}>
          {STATS.map(s=>(
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:40,color:"#C5612C",lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:13,color:"#A89080",marginTop:6,fontWeight:300 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          PROPERTIES
      ════════════════════════════════════════ */}
      <section id="properties" style={{ padding:"88px 28px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto" }}>

          {/* Header + search */}
          <div style={{ display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:20,marginBottom:36 }}>
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>Available Now</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(28px,4vw,46px)",color:"#1A1412",margin:0 }}>
                Browse Properties
              </h2>
            </div>
            <div style={{ position:"relative",width:274,flexShrink:0 }}>
              <svg aria-hidden style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name or location…"
                style={{ width:"100%",paddingLeft:40,paddingRight:16,paddingTop:11,paddingBottom:11,background:"#fff",border:"1.5px solid #E8DDD4",borderRadius:999,fontSize:13,color:"#1A1412",transition:"border-color 0.18s" }}
                onFocus={e=>e.target.style.borderColor="#C5612C"}
                onBlur={e=>e.target.style.borderColor="#E8DDD4"}
              />
            </div>
          </div>

          {/* Type filter pills */}
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:36 }}>
            {TYPES.map(type=>(
              <TypeBtn key={type} label={type} active={activeType===type} onClick={()=>setActiveType(type)} />
            ))}
          </div>

          {/* Grid / empty state */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center",padding:"72px 0",color:"#8B7355" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.2" strokeLinecap="round" style={{ margin:"0 auto 16px",opacity:0.4,display:"block" }}>
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
              </svg>
              <p style={{ fontWeight:600,fontSize:16,color:"#1A1412",marginBottom:6 }}>No properties found</p>
              <p style={{ fontSize:14 }}>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="prop-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:28 }}>
              {filtered.map(p=><PropertyCard key={p.id} p={p}/>)}
            </div>
          )}

          {/* View all */}
          {filtered.length > 0 && (
            <div style={{ textAlign:"center",marginTop:48 }}>
              <ViewAllBtn href="/browse" label="View all properties" />
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section style={{ background:"#1A1412",padding:"88px 28px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:60 }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12 }}>Simple Process</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(28px,4vw,48px)",color:"#fff",margin:0 }}>
              How It Works
            </h2>
          </div>
          <div className="steps-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32 }}>
            {STEPS.map((item,i)=>(
              <div key={item.step} style={{ position:"relative",textAlign:"center" }}>
                {/* Connector */}
                {i < 3 && (
                  <div className="step-connector" style={{
                    position:"absolute",
                    top:27,left:"calc(50% + 28px)",
                    width:"calc(100% - 56px)",height:1,
                    background:"linear-gradient(to right,rgba(197,97,44,0.4),rgba(197,97,44,0.08))",
                  }}/>
                )}
                {/* Icon */}
                <div style={{
                  width:56,height:56,borderRadius:16,
                  background:"rgba(197,97,44,0.10)",border:"1px solid rgba(197,97,44,0.28)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  margin:"0 auto 16px",position:"relative",zIndex:1,
                }}>
                  {item.icon}
                </div>
                <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",letterSpacing:"0.1em",marginBottom:8 }}>{item.step}</p>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:"#fff",margin:"0 0 10px" }}>{item.title}</h3>
                <p style={{ fontSize:13,color:"#A89080",lineHeight:1.68,margin:0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════ */}
      <section style={{ padding:"88px 28px",background:"#FAF7F2" }}>
        <div style={{ maxWidth:860,margin:"0 auto" }}>
          <div style={{
            borderRadius:28,padding:"72px 48px",textAlign:"center",
            position:"relative",overflow:"hidden",
            background:"linear-gradient(135deg,#C5612C 0%,#8B3A18 100%)",
          }}>
            {/* Grid */}
            <svg aria-hidden style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.09,pointerEvents:"none" }}>
              <defs><pattern id="ctag" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#ctag)"/>
            </svg>
            <div style={{ position:"relative",zIndex:1 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(26px,5vw,48px)",color:"#fff",margin:"0 0 14px" }}>
                Ready to Find Home?
              </h2>
              <p style={{ fontSize:17,color:"rgba(255,255,255,0.78)",fontWeight:300,margin:"0 auto 36px",maxWidth:460,lineHeight:1.68 }}>
                Join thousands of residents across Kenya who found their home through fabrentals.
              </p>
              <div style={{ display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center" }}>
                <CtaBtn href="/signup" variant="light">Create Free Account</CtaBtn>
                <CtaBtn href="#properties" variant="outline">Browse First</CtaBtn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ background:"#1A1412",padding:"36px 28px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:16 }}>
          <a href="/" style={{ display:"flex",alignItems:"center",textDecoration:"none" }}>
            <img src={LogoWhiteSrc} alt="fabrentals" style={{ height:26,width:"auto" }}/>
          </a>
          <p style={{ fontSize:12,color:"#5C4A3A",textAlign:"center" }}>
            © {new Date().getFullYear()} fabrentals. Built for Kenya's rental market.
          </p>
          <div style={{ display:"flex",gap:22 }}>
            {["Privacy","Terms","Contact"].map(l=>(
              <FooterLink key={l} href="#" label={l}/>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Button helpers
// ─────────────────────────────────────────────────────────────────────────────
function NavBtn({ href, variant, children }) {
  const [h, setH] = useState(false);
  const base = { textDecoration:"none",fontSize:14,fontWeight:600,borderRadius:999,padding:"9px 20px",transition:"all 0.18s",display:"inline-flex",alignItems:"center" };
  const styles = {
    ghost:   { ...base, color: h ? "#C5612C" : "#1A1412", background:"transparent", fontWeight:500 },
    primary: { ...base, background: h ? "#A84E22" : "#C5612C", color:"#fff" },
  };
  return <a href={href} style={styles[variant]} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>{children}</a>;
}

function TypeBtn({ label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
      padding:"8px 20px",borderRadius:999,fontSize:13,fontWeight:500,cursor:"pointer",
      background: active ? "#C5612C" : "#fff",
      color: active ? "#fff" : "#5C4A3A",
      border: `1.5px solid ${active ? "#C5612C" : (h ? "#C5612C" : "#E8DDD4")}`,
      boxShadow: active ? "0 4px 12px rgba(197,97,44,0.24)" : "none",
      transition:"all 0.18s",
    }}>
      {label}
    </button>
  );
}

function ViewAllBtn({ href, label }) {
  const [h, setH] = useState(false);
  return (
    <a href={href} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
      display:"inline-flex",alignItems:"center",gap:6,
      fontSize:14,fontWeight:600,textDecoration:"none",
      color: h ? "#fff" : "#C5612C",
      background: h ? "#C5612C" : "transparent",
      border:"1.5px solid #C5612C",
      borderRadius:999,padding:"11px 28px",
      transition:"all 0.18s",
    }}>
      {label}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  );
}

function CtaBtn({ href, variant, children }) {
  const [h, setH] = useState(false);
  const styles = {
    light:   { background:"#fff",color:"#C5612C",border:"none",boxShadow: h ? "0 8px 28px rgba(0,0,0,0.22)" : "0 4px 16px rgba(0,0,0,0.14)" },
    outline: { background:"transparent",color:"#fff",border:`2px solid ${h?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.38)"}` },
  };
  return (
    <a href={href} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
      ...styles[variant],
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      fontSize:15,fontWeight:700,textDecoration:"none",
      padding:"13px 32px",borderRadius:999,
      transition:"all 0.18s",
    }}>
      {children}
    </a>
  );
}

function FooterLink({ href, label }) {
  const [h, setH] = useState(false);
  return (
    <a href={href} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
      fontSize:13,color: h ? "#C5612C" : "#5C4A3A",
      textDecoration:"none",transition:"color 0.15s",
    }}>
      {label}
    </a>
  );
}
