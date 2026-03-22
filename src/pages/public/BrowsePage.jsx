import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

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
// Full-featured browse experience with:
//   - Sidebar filters (price range, min available, amenities, verified only)
//   - Type filter pills synced to URL params
//   - Grid / list view toggle
//   - Sort options
//   - RentalRequestModal on "Request" click
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
  { value: "popular",    label: "Most Popular"       },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating",     label: "Highest Rated"      },
  { value: "available",  label: "Most Available"     },
];

// ── Seed data (fallback / dev) ────────────────────────────────────────────────
const SEED = [
  { id:"s1", slug:"sunrise-hostel",        name:"Sunrise Hostel",         location:"Westlands, Nairobi",  type:"Hostel",            monthly_price:8500,  available:6,  rating:4.8, reviews:124, amenities:["WiFi","Water","Security","Laundry","Common Room"], images:["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"],      badge:"Popular", badgeColor:"#C5612C", verified:true,  tenants:{name:"Sunrise Hostel",slug:"sunrise-hostel"} },
  { id:"s2", slug:"greenfield-apartments", name:"Greenfield Apartments",  location:"Kilimani, Nairobi",   type:"Apartment",         monthly_price:22000, available:12, rating:4.6, reviews:87,  amenities:["Parking","Gym","WiFi","CCTV","Backup Power"],   images:["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],     badge:"New",     badgeColor:"#2563EB", verified:true,  tenants:{name:"Greenfield Apartments",slug:"greenfield-apartments"} },
  { id:"s3", slug:"maisha-student-lodge",  name:"Maisha Student Lodge",   location:"Kahawa, Nairobi",     type:"Student Residence", monthly_price:5500,  available:20, rating:4.5, reviews:213, amenities:["WiFi","Study Room","Meals","Security","Laundry"],images:["https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80"],    badge:"Student", badgeColor:"#10B981", verified:true,  tenants:{name:"Maisha Student Lodge",slug:"maisha-student-lodge"} },
  { id:"s4", slug:"farmview-workers",      name:"Farmview Workers Estate",location:"Limuru, Kiambu",       type:"Farm Housing",      monthly_price:3500,  available:8,  rating:4.3, reviews:56,  amenities:["Water","Electricity","Security","Canteen"],     images:["https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80"],    badge:null,      badgeColor:null,      verified:false, tenants:{name:"Farmview Workers Estate",slug:"farmview-workers"} },
  { id:"s5", slug:"bluepeak-residences",   name:"BluePeak Residences",    location:"Lavington, Nairobi",  type:"Apartment",         monthly_price:35000, available:4,  rating:4.9, reviews:61,  amenities:["Rooftop","Gym","Concierge","Parking","Pool"],   images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],    badge:"Premium", badgeColor:"#7C3AED", verified:true,  tenants:{name:"BluePeak Residences",slug:"bluepeak-residences"} },
  { id:"s6", slug:"kasarani-youth-hostel", name:"Kasarani Youth Hostel",  location:"Kasarani, Nairobi",   type:"Hostel",            monthly_price:4500,  available:18, rating:4.2, reviews:98,  amenities:["WiFi","Water","Common Room","Security"],        images:["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"],    badge:null,      badgeColor:null,      verified:true,  tenants:{name:"Kasarani Youth Hostel",slug:"kasarani-youth-hostel"} },
  { id:"s7", slug:"oak-court-suites",      name:"Oak Court Suites",       location:"Upperhill, Nairobi",  type:"Apartment",         monthly_price:45000, available:3,  rating:4.7, reviews:42,  amenities:["Gym","Pool","WiFi","Concierge","Backup Power"], images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"],    badge:"Premium", badgeColor:"#7C3AED", verified:true,  tenants:{name:"Oak Court Suites",slug:"oak-court-suites"} },
  { id:"s8", slug:"valley-view-hostels",   name:"Valley View Hostels",    location:"Ruaka, Kiambu",       type:"Hostel",            monthly_price:6000,  available:14, rating:4.4, reviews:77,  amenities:["WiFi","Water","Security","Kitchen"],            images:["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80"],    badge:null,      badgeColor:null,      verified:false, tenants:{name:"Valley View Hostels",slug:"valley-view-hostels"} },
  { id:"s9", slug:"riverside-student",     name:"Riverside Student Lodge",location:"Ngara, Nairobi",      type:"Student Residence", monthly_price:5000,  available:25, rating:4.3, reviews:189, amenities:["WiFi","Study Room","Security","Laundry"],        images:["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"],       badge:"Student", badgeColor:"#10B981", verified:true,  tenants:{name:"Riverside Student Lodge",slug:"riverside-student"} },
];

// ── Star row ──────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div style={{ display:"flex",gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ── Property card grid ────────────────────────────────────────────────────────
function PropertyCardGrid({ room, onRequest }) {
  const [hovered, setHovered] = useState(false);
  const slug = room.tenants?.slug ?? room.slug ?? "";
  const name = room.tenants?.name ?? room.name ?? "";
  const img  = room.images?.[0] ?? "";
  const location = room.buildings?.address ?? room.location ?? room.buildings?.name ?? "";

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
        cursor: "pointer",
      }}
      onClick={() => {}}
    >
      <div style={{ display:"block", textDecoration:"none", cursor: slug ? "pointer" : "default" }} onClick={() => slug && window.location.assign(`/property/${slug}`)}>
        <div style={{ position:"relative", height:200, overflow:"hidden" }}>
          {img && <img src={img} alt={name} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block", transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 0.5s ease" }}/>}
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.28) 0%,transparent 50%)" }}/>
          {room.badge && <span style={{ position:"absolute",top:12,left:12,background:room.badgeColor,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999 }}>{room.badge}</span>}
          {room.verified && (
            <span style={{ position:"absolute",top:12,right:12,display:"flex",alignItems:"center",gap:3,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(6px)",color:"#059669",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:999 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Verified
            </span>
          )}
          <span style={{ position:"absolute",bottom:12,left:12,background:"rgba(26,20,18,0.75)",backdropFilter:"blur(4px)",color:"#fff",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:999,textTransform:"capitalize" }}>
            {room.type ?? room.room_type}
          </span>
        </div>
      </div>

      <div style={{ padding:"15px 17px 17px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4 }}>
          <Link to={`/property/${slug}`} style={{ textDecoration:"none", flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</p>
          </Link>
        </div>
        <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 10px",display:"flex",alignItems:"center",gap:3 }}>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          {location}
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:12 }}>
          {(room.amenities ?? []).slice(0,4).map(a => (
            <span key={a} style={{ fontSize:11,color:"#5C4A3A",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"3px 9px" }}>{a}</span>
          ))}
          {(room.amenities ?? []).length > 4 && <span style={{ fontSize:11,color:"#8B7355",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"3px 9px" }}>+{room.amenities.length-4}</span>}
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:11,borderTop:"1px solid #F5EDE0" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:2 }}>
              <Stars rating={room.rating ?? 4.5}/>
              <span style={{ fontSize:11,fontWeight:700,color:"#1A1412" }}>{room.rating}</span>
              {room.reviews && <span style={{ fontSize:11,color:"#8B7355" }}>({room.reviews})</span>}
            </div>
            <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>{room.available ?? 1} beds available</p>
          </div>
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
  const slug = room.tenants?.slug ?? room.slug ?? "";
  const name = room.tenants?.name ?? room.name ?? "";
  const img  = room.images?.[0] ?? "";
  const location = room.buildings?.address ?? room.location ?? room.buildings?.name ?? "";

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
        transition:"all 0.22s ease", cursor:"pointer",
      }}
    >
      <Link to={`/property/${slug}`} style={{ display:"block",textDecoration:"none",width:220,flexShrink:0 }}>
        <div style={{ position:"relative",height:"100%",minHeight:140,overflow:"hidden" }}>
          {img && <img src={img} alt={name} style={{ width:"100%",height:"100%",objectFit:"cover", transform:hovered?"scale(1.05)":"scale(1)", transition:"transform 0.5s ease" }}/>}
          {room.badge && <span style={{ position:"absolute",top:10,left:10,background:room.badgeColor,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999 }}>{room.badge}</span>}
        </div>
      </Link>
      <div style={{ flex:1,padding:"16px 18px",display:"flex",flexDirection:"column",justifyContent:"space-between",minWidth:0 }}>
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:4 }}>
            <Link to={`/property/${slug}`} style={{ textDecoration:"none",minWidth:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,color:"#1A1412",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</p>
            </Link>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,color:"#C5612C",margin:0 }}>{formatCurrency(room.monthly_price)}</p>
              <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>/month</p>
            </div>
          </div>
          <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 8px",display:"flex",alignItems:"center",gap:3 }}>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            {location}
          </p>
          <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
            {(room.amenities ?? []).slice(0,5).map(a=>(
              <span key={a} style={{ fontSize:11,color:"#5C4A3A",background:"#FAF7F2",border:"1px solid #EDE4D8",borderRadius:999,padding:"2px 8px" }}>{a}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12,paddingTop:10,borderTop:"1px solid #F5EDE0" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <Stars rating={room.rating ?? 4.5}/>
            <span style={{ fontSize:11,fontWeight:700,color:"#1A1412" }}>{room.rating}</span>
            {room.reviews && <span style={{ fontSize:11,color:"#8B7355" }}>({room.reviews})</span>}
            <span style={{ fontSize:11,color:"#8B7355",marginLeft:4 }}>{room.available ?? 1} available</span>
          </div>
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
  const navigate                           = useNavigate();
  const [searchParams, setSearchParams]    = useSearchParams();

  const [rooms,             setRooms]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState(searchParams.get("q") || "");
  const [activeType,        setActiveType]        = useState(searchParams.get("type") || "all");
  const [sortBy,            setSortBy]            = useState("popular");
  const [viewMode,          setViewMode]          = useState("grid");
  const [filtersOpen,       setFiltersOpen]       = useState(false);
  const [priceRange,        setPriceRange]        = useState([0, 50000]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [verifiedOnly,      setVerifiedOnly]      = useState(false);
  const [requestRoom,       setRequestRoom]       = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch real rooms — fall back to seed data for demo if none exist
  useEffect(() => {
    setLoading(true);
    getAvailableRooms({ limit: 30 })
      .then(({ data }) => { setRooms(data?.length ? data : SEED); })
      .catch(() => { setRooms(SEED); })
      .finally(() => setLoading(false));
  }, []);

  // Sync type to URL
  useEffect(() => {
    const params = {};
    if (search)           params.q    = search;
    if (activeType !== "all") params.type = activeType;
    setSearchParams(params, { replace: true });
  }, [search, activeType, setSearchParams]);

  const toggleAmenity = useCallback((a) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }, []);

  const clearFilters = () => {
    setSearch(""); setActiveType("All"); setPriceRange([0, 50000]);
    setSelectedAmenities([]); setVerifiedOnly(false);
  };

  // Filter + sort
  const results = rooms
    .filter(r => {
      const type      = r.type ?? r.room_type ?? "";
      const name      = r.tenants?.name ?? r.name ?? "";
      const location  = r.buildings?.address ?? r.location ?? "";
      const price     = Number(r.monthly_price ?? 0);
      if (activeType !== "all" && type !== activeType) return false;
      if (debouncedSearch && !name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !location.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (verifiedOnly && !r.verified) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => (r.amenities ?? []).includes(a))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return Number(a.monthly_price) - Number(b.monthly_price);
      if (sortBy === "price_desc") return Number(b.monthly_price) - Number(a.monthly_price);
      if (sortBy === "rating")     return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "available")  return (b.available ?? 0) - (a.available ?? 0);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const activeFiltersCount = [
    activeType !== "All",
    priceRange[0] > 0 || priceRange[1] < 50000,
    selectedAmenities.length > 0,
    verifiedOnly,
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
            {/* Search + type pills */}
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
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
              <div style={{ position:"relative",height:4,background:"#E8DDD4",borderRadius:999 }}>
                <div style={{ position:"absolute",height:"100%",background:"#C5612C",borderRadius:999, left:`${(priceRange[0]/50000)*100}%`, right:`${100-(priceRange[1]/50000)*100}%` }}/>
                {[0,1].map(i => (
                  <input key={i} type="range" min={0} max={50000} step={500} value={priceRange[i]}
                    onChange={e => { const v=Number(e.target.value); const n=[...priceRange]; n[i]=v; if(i===0&&v<=n[1]) setPriceRange(n); if(i===1&&v>=n[0]) setPriceRange(n); }}
                    style={{ position:"absolute",width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:i+2 }}
                  />
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div style={{ marginBottom:20,paddingBottom:20,borderBottom:"1px solid #F5EDE0" }}>
              <p style={{ fontSize:11,fontWeight:700,color:"#8B7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Amenities</p>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {AMENITIES_LIST.map(a => (
                  <Checkbox key={a} label={a} checked={selectedAmenities.includes(a)} onChange={() => toggleAmenity(a)} />
                ))}
              </div>
            </div>

            {/* Verified only */}
            <Checkbox label="Verified properties only" checked={verifiedOnly} onChange={v => setVerifiedOnly(v)} />

            {/* Show sidebar on lg+ */}
            <style>{`@media(min-width:1024px){.browse-sidebar{display:block!important}}`}</style>
          </aside>

          {/* ── Results ── */}
          <div style={{ flex:1,minWidth:0 }}>
            {/* Toolbar */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <p style={{ fontSize:13,color:"#8B7355",margin:0 }}>
                  <strong style={{ color:"#1A1412",fontSize:15 }}>{results.length}</strong> {results.length===1?"property":"properties"} found
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
                <Checkbox label="Verified properties only" checked={verifiedOnly} onChange={setVerifiedOnly} />
                <button onClick={()=>setFiltersOpen(false)} style={{ marginTop:14,width:"100%",background:"#C5612C",color:"#fff",border:"none",borderRadius:999,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer" }}>
                  Show {results.length} results
                </button>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div style={{ display:"flex",justifyContent:"center",padding:80 }}><Spinner size="lg"/></div>
            ) : results.length === 0 ? (
              <div style={{ background:"#fff",borderRadius:18,border:"1px solid #EDE4D8",padding:"0 0 24px" }}>
                <EmptyState icon="search" title="No properties found"
                  description="Try adjusting your search or clearing some filters."
                  action={<Button variant="primary" onClick={clearFilters}>Clear filters</Button>}
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

      {/* ── Rental Request Modal ── */}
      <RentalRequestModal
        isOpen={!!requestRoom}
        onClose={() => setRequestRoom(null)}
        room={requestRoom}
        tenantName={requestRoom?.tenants?.name ?? requestRoom?.name ?? ""}
        onSuccess={() => setRequestRoom(null)}
      />
    </PublicLayout>
  );
}
