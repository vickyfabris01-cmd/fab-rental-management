import { useState, useEffect, useMemo } from "react";
import { Link }                from "react-router-dom";

// ── Layouts ───────────────────────────────────────────────────────────────────
import PublicLayout from "../../layouts/PublicLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import { Badge }               from "../../components/ui/Badge.jsx";
import { EmptyState }          from "../../components/ui/Spinner.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import RentalRequestModal      from "../../components/modals/RentalRequestModal.jsx";

// ── API ───────────────────────────────────────────────────────────────────────
import { supabase }            from "../../config/supabase.js";
import { getAvailableRooms }   from "../../lib/api/rooms.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency }      from "../../lib/formatters.js";
import { useDebounce }         from "../../hooks/useDebounce.js";

// =============================================================================
// PublicPage  /
//
// Marketing landing page. Shows ONLY real data from Supabase.
// No data  → empty states and stats of 0.
// =============================================================================

const HOW_IT_WORKS = [
  { step:"01", title:"Browse",      desc:"Explore properties across Kenya filtered by type, location, and budget.",                              icon:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { step:"02", title:"Request",     desc:"Submit a rental request directly to the property manager with your preferred move-in date.",          icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8" },
  { step:"03", title:"Get Approved",desc:"The manager reviews your request and responds with a move-in offer.",                                 icon:"M20 6L9 17l-5-5" },
  { step:"04", title:"Move In",     desc:"Pay your first rent via M-Pesa, collect your keys, and settle into your new home.",                   icon:"M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9" },
];

const EMPTY_STATS = { properties: 0, buildings: 0, rooms: 0, available: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────
const prettyType = (t) => (t ? t.replace(/_/g, " ") : "");

async function countRows(table, apply) {
  if (!supabase) return 0;
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  return error ? 0 : (count ?? 0);
}

async function fetchPublicStats() {
  const [properties, buildings, rooms, available] = await Promise.all([
    countRows("tenants",   q => q.eq("status", "active")),
    countRows("buildings"),
    countRows("rooms"),
    countRows("rooms",     q => q.eq("status", "available")),
  ]);
  return { properties, buildings, rooms, available };
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ room, onRequest }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc   = room.images?.[0] ?? "";
  const slug     = room.tenants?.slug ?? "";
  const name     = room.tenants?.name ?? "";
  const location = room.buildings?.address ?? room.buildings?.name ?? "";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 24, overflow: "hidden",
        border: "1px solid #EDE4D8",
        transform:  hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow:  hovered ? "0 20px 44px rgba(0,0,0,0.11)" : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease",
      }}
    >
      {/* Image */}
      <Link to={slug ? `/property/${slug}` : "/browse"} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.5s ease" }}
            />
          ) : (
            <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#F5EDE0,#EDE4D8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🏠</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 50%)" }}/>
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", borderRadius: 999, padding: "4px 11px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Available</span>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ marginBottom: 6 }}>
          <Link to={slug ? `/property/${slug}` : "/browse"} style={{ textDecoration: "none" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16, color: "#1A1412", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          </Link>
          {location && (
            <p style={{ fontSize: 12, color: "#8B7355", margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              {location}
            </p>
          )}
        </div>

        {/* Type + room */}
        <div style={{ marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {room.room_type && <Badge variant="brand" size="sm">{prettyType(room.room_type)}</Badge>}
          {room.room_number && <Badge variant="neutral" size="sm">Room {room.room_number}</Badge>}
        </div>

        {/* Amenities */}
        {(room.amenities ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {room.amenities.slice(0, 4).map(a => (
              <span key={a} style={{ fontSize: 11, color: "#5C4A3A", background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 999, padding: "3px 9px" }}>{a}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0E8DE" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8B7355" }}>From</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 17, color: "#C5612C" }}>
              {formatCurrency(room.monthly_price)}<span style={{ fontSize: 11, fontWeight: 400, color: "#8B7355" }}>/mo</span>
            </div>
          </div>
          <button
            onClick={() => onRequest(room)}
            style={{ background: "#1A1412", color: "#fff", border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.18s", flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = "#C5612C"}
            onMouseOut={e  => e.currentTarget.style.background = "#1A1412"}
          >
            Request
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main page component
// =============================================================================
export default function PublicPage() {
  const [rooms,       setRooms]       = useState([]);
  const [stats,       setStats]       = useState(EMPTY_STATS);
  const [loading,     setLoading]     = useState(true);
  const [activeType,  setActiveType]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [requestRoom, setRequestRoom] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Real available rooms + real counts
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAvailableRooms({ limit: 12 })
      .then(({ data }) => { if (alive) setRooms(data ?? []); })
      .catch(() => { if (alive) setRooms([]); })
      .finally(() => { if (alive) setLoading(false); });

    fetchPublicStats()
      .then(s => { if (alive) setStats(s); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Type pills come from the room types that really exist
  const types = useMemo(() => {
    const set = new Set(rooms.map(r => r.room_type).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rooms]);

  const filtered = rooms.filter(r => {
    const name     = r.tenants?.name ?? "";
    const location = r.buildings?.address ?? r.buildings?.name ?? "";
    const q        = debouncedSearch.toLowerCase();
    const matchType   = activeType === "all" || r.room_type === activeType;
    const matchSearch = !q || name.toLowerCase().includes(q) || location.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const featured = rooms[0] ?? null;

  const STATS = [
    { value: stats.properties, label: "Properties Listed" },
    { value: stats.buildings,  label: "Buildings"         },
    { value: stats.rooms,      label: "Total Rooms"       },
    { value: stats.available,  label: "Rooms Available"   },
  ];

  return (
    <PublicLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp 0.6s 0.05s both} .fu2{animation:fadeUp 0.6s 0.18s both}
        .fu3{animation:fadeUp 0.6s 0.30s both} .fu4{animation:fadeUp 0.6s 0.44s both}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
        .float{animation:float 4s ease-in-out infinite}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.4}}
        .pdot{animation:pulseDot 2s ease-in-out infinite}
        @media(max-width:959px){.hero-right{display:none!important}}
        @media(max-width:639px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:1023px){.prop-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:599px){.prop-grid{grid-template-columns:1fr!important}}
        @media(max-width:799px){.steps-grid{grid-template-columns:repeat(2,1fr)!important;gap:40px!important}}
        @media(max-width:479px){.steps-grid{grid-template-columns:1fr!important}}
        input:focus{outline:none}
      `}</style>

      {/* ── Hero ── */}
      <section style={{ position:"relative", minHeight:"100vh", display:"flex", alignItems:"center", overflow:"hidden", paddingTop:68, background:"linear-gradient(140deg,#FAF7F2 0%,#F5EDE0 55%,#EDD9C0 100%)" }}>
        <svg aria-hidden style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.035,pointerEvents:"none" }}>
          <defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#1A1412"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
        <div aria-hidden style={{ position:"absolute",top:-80,right:-80,width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,#C5612C,transparent 68%)",opacity:0.07,pointerEvents:"none" }}/>

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"72px 28px 80px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center" }}>
          {/* Text */}
          <div style={{ maxWidth:540 }}>
            <div className="fu1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.68)", backdropFilter:"blur(8px)", border:"1px solid rgba(197,97,44,0.22)", borderRadius:999, padding:"6px 16px", marginBottom:28 }}>
              <span className="pdot" style={{ width:7,height:7,borderRadius:"50%",background:"#C5612C",display:"inline-block" }}/>
              <span style={{ fontSize:11,fontWeight:700,color:"#C5612C",letterSpacing:"0.08em",textTransform:"uppercase" }}>Now Live in Kenya</span>
            </div>
            <h1 className="fu2" style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(40px,6.5vw,72px)",lineHeight:1.06,color:"#1A1412",margin:"0 0 22px" }}>
              Find Your<br/><span style={{ color:"#C5612C" }}>Perfect</span><br/>Home Today
            </h1>
            <p className="fu3" style={{ fontSize:17,color:"#5C4A3A",lineHeight:1.72,fontWeight:300,margin:"0 0 34px",maxWidth:420 }}>
              Browse hostels, apartments, and residences across Kenya. Apply online, pay via M-Pesa, and move in without the hassle.
            </p>
            <div className="fu4" style={{ display:"flex",flexWrap:"wrap",gap:12 }}>
              <a href="#properties" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#C5612C",color:"#fff",textDecoration:"none",fontWeight:600,fontSize:15,padding:"13px 28px",borderRadius:999,boxShadow:"0 4px 20px rgba(197,97,44,0.32)",transition:"all 0.18s" }}
                onMouseOver={e=>{e.currentTarget.style.background="#A84E22"}}
                onMouseOut={e=>{e.currentTarget.style.background="#C5612C"}}
              >
                Browse Properties
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <Link to="/signup" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"#fff",color:"#1A1412",textDecoration:"none",fontWeight:600,fontSize:15,padding:"13px 28px",borderRadius:999,border:"1.5px solid #E8DDD4",transition:"border-color 0.18s" }}
                onMouseOver={e=>e.currentTarget.style.borderColor="#C5612C"}
                onMouseOut={e=>e.currentTarget.style.borderColor="#E8DDD4"}
              >
                List Your Property
              </Link>
            </div>
          </div>

          {/* Preview card — real featured room, or an honest empty state */}
          <div className="hero-right" style={{ position:"relative",display:"flex",justifyContent:"center",alignItems:"center" }}>
            <div style={{ background:"#fff",borderRadius:24,overflow:"hidden",boxShadow:"0 32px 72px rgba(0,0,0,0.15)",width:"100%",maxWidth:330,position:"relative",zIndex:2 }}>
              {featured ? (
                <>
                  {featured.images?.[0]
                    ? <img src={featured.images[0]} alt={featured.tenants?.name ?? ""} style={{ width:"100%",height:196,objectFit:"cover",display:"block" }}/>
                    : <div style={{ width:"100%",height:196,background:"linear-gradient(135deg,#F5EDE0,#EDE4D8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48 }}>🏠</div>}
                  <div style={{ padding:"18px 20px 20px" }}>
                    <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:"0 0 4px" }}>{featured.tenants?.name}</p>
                    <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 12px",minHeight:16 }}>{featured.buildings?.address ?? featured.buildings?.name ?? ""}</p>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,borderTop:"1px solid #F0E8DE" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,color:"#C5612C" }}>{formatCurrency(featured.monthly_price)}<span style={{ fontSize:12,fontWeight:400,color:"#8B7355" }}>/mo</span></div>
                      <button onClick={() => setRequestRoom(featured)} style={{ background:"#C5612C",color:"#fff",border:"none",borderRadius:999,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer" }}>Request</button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding:"56px 24px",textAlign:"center" }}>
                  <div style={{ fontSize:44,marginBottom:12 }}>🏠</div>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:"#1A1412",margin:"0 0 6px" }}>No properties yet</p>
                  <p style={{ fontSize:13,color:"#8B7355",margin:0,lineHeight:1.6 }}>Listings will appear here as soon as property owners publish rooms.</p>
                </div>
              )}
            </div>
            <div className="float" style={{ position:"absolute",bottom:-8,left:"4%",zIndex:3,background:"#fff",borderRadius:14,boxShadow:"0 8px 28px rgba(0,0,0,0.12)",border:"1px solid #F0E8DE",padding:"10px 16px" }}>
              <div style={{ fontSize:11,color:"#8B7355" }}>Available Now</div>
              <div style={{ fontWeight:700,fontSize:14,color:"#1A1412" }}>{stats.available} room{stats.available === 1 ? "" : "s"} open</div>
            </div>
            <div style={{ position:"absolute",top:-12,right:"4%",zIndex:3,background:"#C5612C",borderRadius:14,boxShadow:"0 8px 28px rgba(197,97,44,0.30)",padding:"10px 16px" }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.72)" }}>M-Pesa Ready</div>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Pay Instantly</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar (real counts, 0 when empty) ── */}
      <section style={{ background:"#1A1412",padding:"44px 28px" }}>
        <div className="stats-grid" style={{ maxWidth:1280,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:40,color:"#C5612C",lineHeight:1 }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize:13,color:"#A89080",marginTop:6,fontWeight:300 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Properties Section ── */}
      <section id="properties" style={{ padding:"88px 28px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto" }}>
          {/* Header */}
          <div style={{ display:"flex",flexWrap:"wrap",alignItems:"flex-end",justifyContent:"space-between",gap:20,marginBottom:36 }}>
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>Available Now</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(28px,4vw,46px)",color:"#1A1412",margin:0 }}>Browse Properties</h2>
            </div>
            {rooms.length > 0 && (
              <div style={{ position:"relative",width:274,flexShrink:0 }}>
                <svg aria-hidden style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or location…"
                  style={{ width:"100%",paddingLeft:40,paddingRight:16,paddingTop:11,paddingBottom:11,background:"#fff",border:"1.5px solid #E8DDD4",borderRadius:999,fontSize:13,color:"#1A1412",transition:"border-color 0.18s" }}
                  onFocus={e=>e.target.style.borderColor="#C5612C"}
                  onBlur={e=>e.target.style.borderColor="#E8DDD4"}
                />
              </div>
            )}
          </div>

          {/* Type filter pills (only types that exist) */}
          {types.length > 2 && (
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:36 }}>
              {types.map(type => (
                <button key={type} onClick={()=>setActiveType(type)} style={{
                  padding:"8px 20px",borderRadius:999,fontSize:13,fontWeight:500,cursor:"pointer",textTransform:"capitalize",
                  background: activeType===type ? "#C5612C" : "#fff",
                  color:      activeType===type ? "#fff"    : "#5C4A3A",
                  border:     `1.5px solid ${activeType===type ? "#C5612C" : "#E8DDD4"}`,
                  boxShadow:  activeType===type ? "0 4px 12px rgba(197,97,44,0.24)" : "none",
                  transition: "all 0.18s",
                }}>{type === "all" ? "All" : prettyType(type)}</button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display:"flex",justifyContent:"center",padding:64 }}><Spinner size="lg"/></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title={rooms.length === 0 ? "No properties listed yet" : "No properties found"}
              description={rooms.length === 0 ? "Check back soon — available rooms will appear here." : "Try adjusting your search or filter."}
            />
          ) : (
            <div className="prop-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:28 }}>
              {filtered.map(r => (
                <PropertyCard key={r.id} room={r} onRequest={setRequestRoom} />
              ))}
            </div>
          )}

          {/* View all */}
          {!loading && filtered.length > 0 && (
            <div style={{ textAlign:"center",marginTop:48 }}>
              <Link to="/browse" style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:14,fontWeight:600,color:"#C5612C",textDecoration:"none",border:"1.5px solid #C5612C",borderRadius:999,padding:"11px 28px",transition:"all 0.18s" }}
                onMouseOver={e=>{e.currentTarget.style.background="#C5612C";e.currentTarget.style.color="#fff"}}
                onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#C5612C"}}
              >
                View all properties →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ background:"#1A1412",padding:"88px 28px" }}>
        <div style={{ maxWidth:1280,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:60 }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12 }}>Simple Process</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(28px,4vw,48px)",color:"#fff",margin:0 }}>How It Works</h2>
          </div>
          <div className="steps-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} style={{ position:"relative",textAlign:"center" }}>
                {i < 3 && <div style={{ position:"absolute",top:27,left:"calc(50% + 28px)",width:"calc(100% - 56px)",height:1,background:"linear-gradient(to right,rgba(197,97,44,0.4),rgba(197,97,44,0.08))" }}/>}
                <div style={{ width:56,height:56,borderRadius:16,background:"rgba(197,97,44,0.10)",border:"1px solid rgba(197,97,44,0.28)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",position:"relative",zIndex:1 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                </div>
                <p style={{ fontSize:11,fontWeight:700,color:"#C5612C",letterSpacing:"0.1em",marginBottom:8 }}>{item.step}</p>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:"#fff",margin:"0 0 10px" }}>{item.title}</h3>
                <p style={{ fontSize:13,color:"#A89080",lineHeight:1.68,margin:0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding:"88px 28px",background:"#FAF7F2" }}>
        <div style={{ maxWidth:860,margin:"0 auto" }}>
          <div style={{ borderRadius:28,padding:"72px 48px",textAlign:"center",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#C5612C 0%,#8B3A18 100%)" }}>
            <svg aria-hidden style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.09,pointerEvents:"none" }}>
              <defs><pattern id="ctag" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#ctag)"/>
            </svg>
            <div style={{ position:"relative",zIndex:1 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(26px,5vw,48px)",color:"#fff",margin:"0 0 14px" }}>Ready to Find Home?</h2>
              <p style={{ fontSize:17,color:"rgba(255,255,255,0.78)",fontWeight:300,margin:"0 auto 36px",maxWidth:460,lineHeight:1.68 }}>
                Create a free account, browse available rooms, and send your first rental request in minutes.
              </p>
              <div style={{ display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center" }}>
                <Link to="/signup" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#fff",color:"#C5612C",fontWeight:700,fontSize:15,textDecoration:"none",padding:"13px 32px",borderRadius:999,boxShadow:"0 4px 18px rgba(0,0,0,0.15)",transition:"box-shadow 0.2s" }}
                  onMouseOver={e=>e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.22)"}
                  onMouseOut={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.15)"}
                >
                  Create Free Account
                </Link>
                <a href="#properties" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"#fff",fontWeight:600,fontSize:15,textDecoration:"none",padding:"13px 32px",borderRadius:999,border:"2px solid rgba(255,255,255,0.40)",transition:"border-color 0.2s" }}
                  onMouseOver={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.9)"}
                  onMouseOut={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.40)"}
                >
                  Browse First
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rental Request Modal ── */}
      <RentalRequestModal
        isOpen={!!requestRoom}
        onClose={() => setRequestRoom(null)}
        room={requestRoom}
        tenantName={requestRoom?.tenants?.name ?? ""}
        onSuccess={() => setRequestRoom(null)}
      />
    </PublicLayout>
  );
}