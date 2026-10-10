import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import PublicLayout from "../../layouts/PublicLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import { Spinner }           from "../../components/ui/Spinner.jsx";
import { EmptyState }        from "../../components/ui/Spinner.jsx";
import { Checkbox }          from "../../components/ui/TextArea.jsx";
import Button                from "../../components/ui/Button.jsx";
import RentalRequestModal    from "../../components/modals/RentalRequestModal.jsx";

// ── API ───────────────────────────────────────────────────────────────────────
import { getAvailableRooms } from "../../lib/api/rooms.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency }    from "../../lib/formatters.js";
import { useDebounce }       from "../../hooks/useDebounce.js";

// =============================================================================
// BrowsePage  /browse
//
// Real data only. No data → "0 properties found" + empty state.
//   - Sidebar filters (price range, amenities)
//   - Room-type pills synced to URL params
//   - Grid / list view toggle
//   - Sort by price
// =============================================================================

const TYPES = [
  { label:"All",        value:"all"       },
  { label:"Single",     value:"single"    },
  { label:"Double",     value:"double"    },
  { label:"Bedsitter",  value:"bedsitter" },
  { label:"Studio",     value:"studio"    },
  { label:"Dormitory",  value:"dormitory" },
  { label:"Suite",      value:"suite"     },
];

const AMENITIES_LIST = [
  "WiFi", "Parking", "Gym", "Security", "Laundry",
  "Meals", "Pool", "Study Room", "Backup Power", "CCTV",
];

const SORT_OPTIONS = [
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PRICE_MAX = 50000; // slider ceiling — at the ceiling there is no upper limit

const prettyType = (t) => (t ? t.replace(/_/g, " ") : "");

// ── Property card grid ────────────────────────────────────────────────────────
function PropertyCardGrid({ room, onRequest }) {
  const [hovered, setHovered] = useState(false);
  const slug = room.tenants?.slug ?? "";
  const name = room.tenants?.name ?? "";
  const img  = room.images?.[0] ?? "";
  const location = room.buildings?.address ?? room.buildings?.name ?? "";
  const to = slug ? `/property/${slug}` : "/browse";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:"#fff", borderRadius:22, overflow:"hidden",
        border:"1px solid #EDE4D8",
        transform:  hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow:  hovered ? "0 18px 40px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease",
      }}
    >
      <Link to={to} style={{ display:"block", textDecoration:"none" }}>
        <div style={{ position:"relative", height:200, overflow:"hidden" }}>
          {img
            ? <img src={img} alt={name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block", transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 0.5s ease" }}/>
            : <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#F5EDE0,#EDE4D8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40 }}>🏠</div>}
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.28) 0%,transparent 50%)" }}/>
          {room.room_type && (
            <span style={{ position:"absolute",bottom:12,left:12,background:"rgba(26,20,18,0.75)",backdropFilter:"blur(4px)",color:"#fff",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:999,textTransform:"capitalize" }}>
              {prettyType(room.room_type)}
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding:"15px 17px 17px" }}>
        <Link to={to} style={{ textDecoration:"none", display:"block", minWidth:0 }}>
          <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</p>
        </Link>
        {location && (
          <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 10px",display:"flex",alignItems:"center",gap:3 }}>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            {location}
          </p>
        )}
        {(room.amenities ?? []).length > 0 && (
          <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:12 }}>
            {room.amenities.slice(0,4).map(a => (
              <span key={a} style={{ fontSize:11,color:"#5C4A3A",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"3px 9px" }}>{a}</span>
            ))}
            {room.amenities.length > 4 && <span style={{ fontSize:11,color:"#8B7355",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"3px 9px" }}>+{room.amenities.length-4}</span>}
          </div>
        )}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:11,borderTop:"1px solid #F5EDE0" }}>
          <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>{room.room_number ? `Room ${room.room_number}` : "Available"}</p>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>From</p>
            <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#C5612C",margin:0 }}>
              {formatCurrency(room.monthly_price)}<span style={{ fontSize:11,fontWeight:400,color:"#8B7355" }}>/mo</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding:"0 17px 15px" }}>
        <button
          onClick={e => { e.stopPropagation(); onRequest(room); }}
          style={{ width:"100%",padding:"10px",borderRadius:12,background:"#1A1412",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",transition:"background 0.18s" }}
          onMouseOver={e=>e.currentTarget.style.background="#C5612C"}
          onMouseOut={e=>e.currentTarget.style.background="#1A1412"}
        >
          Request Room
        </button>
      </div>
    </div>
  );
}

// ── Property card list ────────────────────────────────────────────────────────
function PropertyCardList({ room, onRequest }) {
  const [hovered, setHovered] = useState(false);
  const slug = room.tenants?.slug ?? "";
  const name = room.tenants?.name ?? "";
  const img  = room.images?.[0] ?? "";
  const location = room.buildings?.address ?? room.buildings?.name ?? "";
  const to = slug ? `/property/${slug}` : "/browse";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex",flexDirection:"row",
        background:"#fff", borderRadius:18, overflow:"hidden",
        border:"1px solid #EDE4D8",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.09)" : "0 2px 8px rgba(0,0,0,0.05)",
        transition:"all 0.22s ease",
      }}
    >
      <Link to={to} style={{ display:"block",textDecoration:"none",width:220,flexShrink:0 }}>
        <div style={{ position:"relative",height:"100%",minHeight:140,overflow:"hidden" }}>
          {img
            ? <img src={img} alt={name} style={{ width:"100%",height:"100%",objectFit:"cover", transform:hovered?"scale(1.05)":"scale(1)", transition:"transform 0.5s ease" }}/>
            : <div style={{ width:"100%",height:"100%",minHeight:140,background:"linear-gradient(135deg,#F5EDE0,#EDE4D8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>🏠</div>}
        </div>
      </Link>
      <div style={{ flex:1,padding:"16px 18px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0 }}>
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:4 }}>
            <Link to={to} style={{ textDecoration:"none",minWidth:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</p>
            </Link>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,color:"#C5612C",margin:0 }}>{formatCurrency(room.monthly_price)}</p>
              <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>/month</p>
            </div>
          </div>
          {location && (
            <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 8px",display:"flex",alignItems:"center",gap:3 }}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              {location}
            </p>
          )}
          <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
            {(room.amenities ?? []).slice(0,5).map(a=>(
              <span key={a} style={{ fontSize:11,color:"#5C4A3A",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"2px 8px" }}>{a}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12,paddingTop:10,borderTop:"1px solid #F5EDE0" }}>
          <span style={{ fontSize:11,color:"#8B7355",textTransform:"capitalize" }}>
            {[room.room_number ? `Room ${room.room_number}` : null, prettyType(room.room_type)].filter(Boolean).join(" · ")}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRequest(room); }}
            style={{ padding:"8px 18px",borderRadius:999,background:"#C5612C",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",transition:"background 0.18s",flexShrink:0 }}
            onMouseOver={e=>e.currentTarget.style.background="#A84E22"}
            onMouseOut={e=>e.currentTarget.style.background="#C5612C"}
          >
            Request
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main BrowsePage
// =============================================================================
export default function BrowsePage() {
  const [searchParams, setSearchParams]    = useSearchParams();

  const [rooms,             setRooms]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState(searchParams.get("q") || "");
  const [activeType,        setActiveType]        = useState(searchParams.get("type") || "all");
  const [sortBy,            setSortBy]            = useState("price_asc");
  const [viewMode,          setViewMode]          = useState("grid");
  const [filtersOpen,       setFiltersOpen]       = useState(false);
  const [priceRange,        setPriceRange]        = useState([0, PRICE_MAX]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [requestRoom,       setRequestRoom]       = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Auth state for request gating
  const [authUser, setAuthUser] = useState(null);
  useEffect(() => {
    import("../../config/supabase.js").then(({ supabase }) => {
      if (!supabase) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthUser(session?.user ?? null);
      });
    });
  }, []);

  // Real available rooms only
  useEffect(() => {
    setLoading(true);
    getAvailableRooms({ limit: 50 })
      .then(({ data }) => { setRooms(data ?? []); })
      .catch(() => { setRooms([]); })
      .finally(() => setLoading(false));
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    if (search)               params.q    = search;
    if (activeType !== "all") params.type = activeType;
    setSearchParams(params, { replace: true });
  }, [search, activeType, setSearchParams]);

  const toggleAmenity = useCallback((a) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }, []);

  const clearFilters = () => {
    setSearch(""); setActiveType("all"); setPriceRange([0, PRICE_MAX]);
    setSelectedAmenities([]);
  };

  // Filter + sort
  const results = rooms
    .filter(r => {
      const name     = r.tenants?.name ?? "";
      const location = r.buildings?.address ?? r.buildings?.name ?? "";
      const price    = Number(r.monthly_price ?? 0);
      const q        = debouncedSearch.toLowerCase();
      if (activeType !== "all" && r.room_type !== activeType) return false;
      if (q && !name.toLowerCase().includes(q) && !location.toLowerCase().includes(q)) return false;
      if (price < priceRange[0]) return false;
      if (priceRange[1] < PRICE_MAX && price > priceRange[1]) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => (r.amenities ?? []).includes(a))) return false;
      return true;
    })
    .sort((a, b) => {
      const pa = Number(a.monthly_price), pb = Number(b.monthly_price);
      return sortBy === "price_desc" ? pb - pa : pa - pb;
    });

  const activeFiltersCount = [
    activeType !== "all",
    priceRange[0] > 0 || priceRange[1] < PRICE_MAX,
    selectedAmenities.length > 0,
  ].filter(Boolean).length;

  return (
    <PublicLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#C5612C; cursor:pointer; }
        input[type=range] { -webkit-appearance:none; appearance:none; height:4px; background:transparent; }
      `}</style>

      <div style={{ paddingTop:68, minHeight:"100vh", background:"#FAF7F2", fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* ── Page header ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid #EDE4D8", padding:"28px 28px 0" }}>
          <div style={{ maxWidth:1280,margin:"0 auto" }}>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(24px,3vw,34px)",color:"#1A1412",margin:"0 0 16px" }}>
              Browse Properties
            </h1>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",paddingBottom:20 }}>
              <div style={{ position:"relative",width:300,flexShrink:0 }}>
                <svg style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or location…"
                  style={{ width:"100%",paddingLeft:36,paddingRight:14,paddingTop:10,paddingBottom:10,background:"#FAF7F2",border:"1.5px solid #E8DDD4",borderRadius:999,fontSize:13,color:"#1A1412" }}
                  onFocus={e=>e.target.style.borderColor="#C5612C"}
                  onBlur={e=>e.target.style.borderColor="#E8DDD4"}
                />
              </div>
              {TYPES.map(t => (
                <button key={t.value} onClick={()=>setActiveType(t.value)} style={{
                  padding:"8px 18px",borderRadius:999,fontSize:13,fontWeight:500,cursor:"pointer",border:"1.5px solid",
                  background: activeType===t.value ? "#C5612C" : "#fff",
                  color:      activeType===t.value ? "#fff"    : "#5C4A3A",
                  borderColor:activeType===t.value ? "#C5612C" : "#E8DDD4",
                  boxShadow:  activeType===t.value ? "0 3px 10px rgba(197,97,44,0.22)" : "none",
                  transition: "all 0.18s",
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ maxWidth:1280,margin:"0 auto",padding:"28px 28px 60px",display:"flex",gap:28,alignItems:"flex-start" }}>

          {/* ── Sidebar ── */}
          <aside style={{ width:256,flexShrink:0,position:"sticky",top:84,background:"#fff",border:"1px solid #EDE4D8",borderRadius:18,padding:"20px 18px",display:"none" }} className="browse-sidebar">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <p style={{ fontSize:14,fontWeight:700,color:"#1A1412",margin:0 }}>Filters</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} style={{ fontSize:12,color:"#C5612C",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0 }}>Clear all</button>
              )}
            </div>

            {/* Price Range */}
            <div style={{ marginBottom:20,paddingBottom:20,borderBottom:"1px solid #F5EDE0" }}>
              <p style={{ fontSize:11,fontWeight:700,color:"#8B7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Price Range (KES/mo)</p>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#5C4A3A",marginBottom:8 }}>
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{priceRange[1] >= PRICE_MAX ? `${formatCurrency(PRICE_MAX)}+` : formatCurrency(priceRange[1])}</span>
              </div>
              <div style={{ position:"relative",height:4,background:"#E8DDD4",borderRadius:999 }}>
                <div style={{ position:"absolute",height:"100%",background:"#C5612C",borderRadius:999, left:`${(priceRange[0]/PRICE_MAX)*100}%`, right:`${100-(priceRange[1]/PRICE_MAX)*100}%` }}/>
                {[0,1].map(i => (
                  <input key={i} type="range" min={0} max={PRICE_MAX} step={500} value={priceRange[i]}
                    onChange={e => { const v=Number(e.target.value); const n=[...priceRange]; n[i]=v; if(i===0&&v<=n[1]) setPriceRange(n); if(i===1&&v>=n[0]) setPriceRange(n); }}
                    style={{ position:"absolute",width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:i+2 }}
                  />
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:"#8B7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Amenities</p>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {AMENITIES_LIST.map(a => (
                  <Checkbox key={a} label={a} checked={selectedAmenities.includes(a)} onChange={() => toggleAmenity(a)} />
                ))}
              </div>
            </div>

            <style>{`@media(min-width:1024px){.browse-sidebar{display:block!important}}`}</style>
          </aside>

          {/* ── Results ── */}
          <div style={{ flex:1,minWidth:0 }}>
            {/* Toolbar */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <p style={{ fontSize:13,color:"#8B7355",margin:0 }}>
                  <strong style={{ color:"#1A1412",fontSize:15 }}>{loading ? 0 : results.length}</strong> {results.length===1?"property":"properties"} found
                </p>
                {activeFiltersCount > 0 && (
                  <span style={{ fontSize:11,fontWeight:700,color:"#C5612C",background:"rgba(197,97,44,0.10)",border:"1px solid rgba(197,97,44,0.20)",padding:"2px 8px",borderRadius:999 }}>
                    {activeFiltersCount} filter{activeFiltersCount>1?"s":""} active
                  </span>
                )}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                {/* Sort */}
                <div style={{ position:"relative" }}>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                    style={{ fontSize:13,border:"1.5px solid #E8DDD4",borderRadius:10,padding:"7px 30px 7px 10px",background:"#fff",color:"#5C4A3A",outline:"none",appearance:"none",cursor:"pointer" }}>
                    {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                {/* Mobile filter btn */}
                <button onClick={()=>setFiltersOpen(o=>!o)}
                  style={{ display:"flex",alignItems:"center",gap:6,border:"1.5px solid #E8DDD4",borderRadius:10,padding:"7px 12px",background:"#fff",fontSize:13,color:"#5C4A3A",cursor:"pointer" }}
                  className="browse-filter-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                  Filters {activeFiltersCount>0&&<span style={{ background:"#C5612C",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>{activeFiltersCount}</span>}
                </button>
                <style>{`@media(min-width:1024px){.browse-filter-btn{display:none!important}}`}</style>
                {/* Grid / List toggle */}
                <div style={{ display:"flex",border:"1.5px solid #E8DDD4",borderRadius:10,overflow:"hidden" }}>
                  {[["grid","M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"],["list","M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"]].map(([mode,path])=>(
                    <button key={mode} onClick={()=>setViewMode(mode)} style={{ padding:"7px 10px",border:"none",background:viewMode===mode?"#1A1412":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={viewMode===mode?"#fff":"#8B7355"} strokeWidth="2" strokeLinecap="round"><path d={path}/></svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile filter panel */}
            {filtersOpen && (
              <div style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:16,padding:"18px 18px",marginBottom:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:"#1A1412",margin:0 }}>Filters</p>
                  <div style={{ display:"flex",gap:12 }}>
                    {activeFiltersCount>0&&<button onClick={clearFilters} style={{ fontSize:12,color:"#C5612C",fontWeight:600,background:"none",border:"none",cursor:"pointer" }}>Clear all</button>}
                    <button onClick={()=>setFiltersOpen(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#8B7355",display:"flex" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:14 }}>
                  {AMENITIES_LIST.map(a=>(
                    <button key={a} onClick={()=>toggleAmenity(a)} style={{ padding:"6px 14px",borderRadius:999,fontSize:12,fontWeight:500,cursor:"pointer",border:"1.5px solid",background:selectedAmenities.includes(a)?"#C5612C":"#fff",color:selectedAmenities.includes(a)?"#fff":"#5C4A3A",borderColor:selectedAmenities.includes(a)?"#C5612C":"#E8DDD4",transition:"all 0.15s" }}>{a}</button>
                  ))}
                </div>
                <button onClick={()=>setFiltersOpen(false)} style={{ marginTop:4,width:"100%",background:"#C5612C",color:"#fff",border:"none",borderRadius:999,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer" }}>
                  Show {results.length} results
                </button>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div style={{ display:"flex",justifyContent:"center",padding:80 }}><Spinner size="lg"/></div>
            ) : results.length === 0 ? (
              <div style={{ background:"#fff",borderRadius:18,border:"1px solid #EDE4D8",padding:"0 0 24px" }}>
                <EmptyState icon="search"
                  title={rooms.length === 0 ? "No properties listed yet" : "No properties found"}
                  description={rooms.length === 0
                    ? "Available rooms will appear here as soon as property owners publish them."
                    : "Try adjusting your search or clearing some filters."}
                  action={rooms.length > 0 ? <Button variant="primary" onClick={clearFilters}>Clear filters</Button> : undefined}
                />
              </div>
            ) : (
              <div style={{
                display:"grid",
                gridTemplateColumns: viewMode==="grid" ? "repeat(auto-fill,minmax(280px,1fr))" : "1fr",
                gap:18,
              }}>
                {results.map((room, i) => (
                  <div key={room.id} className="fade-up" style={{ animationDelay:`${i*0.04}s`,opacity:0 }}>
                    {viewMode === "grid"
                      ? <PropertyCardGrid room={room} onRequest={setRequestRoom}/>
                      : <PropertyCardList room={room} onRequest={setRequestRoom}/>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Auth gate: guests must sign in to request ── */}
      {requestRoom && !authUser && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        }} onClick={() => setRequestRoom(null)}>
          <div style={{
            background:"#fff", borderRadius:20, padding:"32px 28px", maxWidth:380, width:"100%",
            textAlign:"center", boxShadow:"0 24px 60px rgba(0,0,0,0.18)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔑</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:"#1A1412", margin:"0 0 10px" }}>
              Create an account to request a room
            </h3>
            <p style={{ fontSize:14, color:"#8B7355", margin:"0 0 22px", lineHeight:1.6 }}>
              Sign up for free to submit a rental request and connect with property managers.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <a href="/signup" style={{ background:"#C5612C", color:"#fff", textDecoration:"none", padding:"11px 22px", borderRadius:999, fontSize:13, fontWeight:600 }}>
                Create Account
              </a>
              <a href="/login" style={{ background:"#FAF7F2", color:"#1A1412", textDecoration:"none", padding:"11px 22px", borderRadius:999, fontSize:13, fontWeight:600, border:"1.5px solid #EDE4D8" }}>
                Sign In
              </a>
            </div>
            <button onClick={() => setRequestRoom(null)} style={{ marginTop:14, background:"none", border:"none", color:"#8B7355", fontSize:13, cursor:"pointer" }}>
              Maybe later
            </button>
          </div>
        </div>
      )}
      <RentalRequestModal
        isOpen={!!requestRoom && !!authUser}
        onClose={() => setRequestRoom(null)}
        room={requestRoom}
        tenantName={requestRoom?.tenants?.name ?? ""}
        onSuccess={() => setRequestRoom(null)}
      />
    </PublicLayout>
  );
}