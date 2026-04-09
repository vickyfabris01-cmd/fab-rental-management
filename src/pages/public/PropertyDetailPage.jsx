import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import PublicLayout from "../../layouts/PublicLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import { Spinner }         from "../../components/ui/Spinner.jsx";
import { EmptyState }      from "../../components/ui/Spinner.jsx";
import { Alert }           from "../../components/ui/Alert.jsx";
import Badge               from "../../components/ui/Badge.jsx";
import Avatar              from "../../components/ui/Avatar.jsx";
import Button              from "../../components/ui/Button.jsx";
import { Breadcrumb }      from "../../components/navigation/TabBar.jsx";
import RentalRequestModal  from "../../components/modals/RentalRequestModal.jsx";

// ── API ───────────────────────────────────────────────────────────────────────
import { getTenantBySlug } from "../../lib/api/tenants.js";
import { getRooms }        from "../../lib/api/rooms.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency, formatDate } from "../../lib/formatters.js";

// =============================================================================
// PropertyDetailPage  /property/:slug
//
// Full detail view for a single property (tenant).
// Sections: gallery → title/meta → sticky tab nav → overview / rooms /
//           amenities / rules / reviews → sticky booking sidebar
// =============================================================================

// ── Seed data — shown while real data loads ───────────────────────────────────
const SEED_PROPERTIES = {
  "sunrise-hostel": {
    id: "seed-1", slug: "sunrise-hostel", name: "Sunrise Hostel",
    tagline: "Modern hostel living in the heart of Westlands",
    location: "Westlands, Nairobi", fullAddress: "Parklands Road, Westlands, Nairobi",
    type: "Hostel", rating: 4.8, reviews: 124, badge: "Popular", badgeColor: "#C5612C",
    verified: true, managedBy: "Michael Kamau",
    description: "Sunrise Hostel offers comfortable, modern accommodation for young professionals and students seeking quality living in Nairobi's vibrant Westlands district. Our fully furnished rooms come with high-speed fibre internet, 24/7 security, and a friendly community atmosphere.",
    images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80","https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80"],
    amenities: [{label:"High-Speed WiFi",icon:"📶"},{label:"24/7 Security",icon:"🔒"},{label:"Laundry Room",icon:"🧺"},{label:"Water (24hr)",icon:"💧"},{label:"Common Room",icon:"🛋️"},{label:"CCTV",icon:"📷"},{label:"Backup Generator",icon:"⚡"},{label:"Parking (limited)",icon:"🚗"}],
    rules: ["No visitors after 10:00 PM","No cooking in rooms — use shared kitchen","Quiet hours: 10 PM – 7 AM","No smoking on premises","Pets are not allowed"],
    nearbyPlaces: [{name:"Sarit Centre",distance:"0.4 km",type:"Shopping"},{name:"Westlands Bus Stop",distance:"0.2 km",type:"Transit"},{name:"USIU Africa",distance:"2.1 km",type:"University"}],
    reviews_list: [
      {name:"Kevin O.",rating:5,date:"Feb 2025",text:"Absolutely loved my stay. The WiFi is blazing fast and the security team is very professional.",avatar:"KO"},
      {name:"Grace M.",rating:5,date:"Jan 2025",text:"Clean, affordable and in a great location. Management responds quickly to any issues.",avatar:"GM"},
      {name:"Ali H.",  rating:4,date:"Dec 2024",text:"Good value for Westlands. The common room is a great place to meet other residents.",avatar:"AH"},
    ],
    rooms: [
      {id:"s1",room_number:"A1",room_type:"single",monthly_price:8500, status:"available",capacity:1,amenities:["Furnished","En-suite"],       images:["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80"],description:"12 m² · 2nd Floor"},
      {id:"s2",room_number:"B3",room_type:"double",monthly_price:12000,status:"available",capacity:2,amenities:["Furnished","Shared Bath"],    images:["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80"],description:"18 m² · 1st Floor"},
      {id:"s3",room_number:"C2",room_type:"single",monthly_price:10500,status:"occupied", capacity:1,amenities:["Furnished","En-suite","City View"],images:["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80"],description:"14 m² · 3rd Floor"},
    ],
  },
  "greenfield-apartments": {
    id: "seed-2", slug: "greenfield-apartments", name: "Greenfield Apartments",
    tagline: "Upscale apartment living in Kilimani",
    location: "Kilimani, Nairobi", fullAddress: "Dennis Pritt Road, Kilimani, Nairobi",
    type: "Apartment", rating: 4.6, reviews: 87, badge: "New", badgeColor: "#2563EB",
    verified: true, managedBy: "Alice Wambui",
    description: "Greenfield Apartments redefines urban living in Nairobi's prestigious Kilimani neighbourhood. With spacious layouts, modern finishes, and a full suite of amenities including a gym and secure parking, each unit is designed to elevate your everyday life.",
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80","https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&q=80"],
    amenities: [{label:"Secure Parking",icon:"🚗"},{label:"Gym",icon:"🏋️"},{label:"High-Speed WiFi",icon:"📶"},{label:"CCTV",icon:"📷"},{label:"Backup Power",icon:"⚡"},{label:"Water (24hr)",icon:"💧"},{label:"Lift / Elevator",icon:"🛗"}],
    rules: ["No short-stay/Airbnb subletting","Parking is one slot per unit","Noise curfew: 11 PM – 6 AM"],
    nearbyPlaces: [{name:"Junction Mall",distance:"0.6 km",type:"Shopping"},{name:"Kilimani Police",distance:"0.4 km",type:"Services"},{name:"Nairobi Hospital",distance:"1.2 km",type:"Healthcare"}],
    reviews_list: [
      {name:"Sarah K.",rating:5,date:"Mar 2025",text:"Beautiful apartments with excellent management. The gym is well-equipped.",avatar:"SK"},
      {name:"Tom O.",  rating:4,date:"Feb 2025",text:"Great location and responsive management team.",avatar:"TO"},
    ],
    rooms: [
      {id:"a1",room_number:"101",room_type:"apartment",monthly_price:22000,status:"available",capacity:2,amenities:["Open Plan","Full Kitchen","Balcony"],images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80"],description:"45 m² · 1-Bedroom"},
      {id:"a2",room_number:"201",room_type:"apartment",monthly_price:35000,status:"available",capacity:3,amenities:["Open Plan","Full Kitchen","2 Balconies","Study"],images:["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80"],description:"72 m² · 2-Bedroom"},
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ── Room availability card ────────────────────────────────────────────────────
function RoomRow({ room, onRequest }) {
  const isAvailable = room.status === "available";
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"14px 16px",
        border:`1.5px solid ${hovered && isAvailable ? "#C5612C" : "#EDE4D8"}`,
        borderRadius:14,
        background: hovered && isAvailable ? "#FFF5EF" : "#fff",
        transition:"all 0.18s",
        cursor: isAvailable ? "pointer" : "default",
        opacity: isAvailable ? 1 : 0.55,
      }}
      onClick={() => isAvailable && onRequest(room)}
    >
      {room.images?.[0] && (
        <img src={room.images[0]} alt={room.room_number}
          style={{ width:72, height:56, objectFit:"cover", borderRadius:10, flexShrink:0 }}
        />
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:0 }}>Room {room.room_number}</p>
            <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 6px", textTransform:"capitalize" }}>
              {room.room_type?.replace(/_/g," ")} · {room.description ?? `Capacity ${room.capacity}`}
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {(room.amenities ?? []).slice(0,3).map(a=>(
                <span key={a} style={{ fontSize:10, color:"#5C4A3A", background:"#FAF7F2", border:"1px solid #EDE4D8", borderRadius:999, padding:"2px 7px" }}>{a}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17, color:"#C5612C", margin:0 }}>
              {formatCurrency(room.monthly_price)}<span style={{ fontSize:11, fontWeight:400, color:"#8B7355" }}>/mo</span>
            </p>
            <Badge variant={isAvailable ? "available" : "occupied"} size="sm" style={{ marginTop:4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================
export default function PropertyDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();

  const [property,    setProperty]    = useState(SEED_PROPERTIES[slug] ?? null);
  const [rooms,       setRooms]       = useState(SEED_PROPERTIES[slug]?.rooms ?? []);
  const [loading,     setLoading]     = useState(!SEED_PROPERTIES[slug]);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [saved,       setSaved]       = useState(false);
  const [requestRoom, setRequestRoom] = useState(null);

  const overviewRef  = useRef(null);
  const roomsRef     = useRef(null);
  const amenitiesRef = useRef(null);
  const reviewsRef   = useRef(null);

  // Fetch real property + rooms
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getTenantBySlug(slug)
      .then(({ data: tenant }) => {
        if (tenant) {
          // Merge real tenant data with seed shape (seed provides amenities, reviews, rules etc.)
          const seed = SEED_PROPERTIES[slug] ?? {};
          setProperty({ ...seed, ...tenant,
            // Keep logo separate from room photos (P-5)
            // logo_url goes to property.logo_url, images stays as room photos
            logo_url: tenant.logo_url ?? seed.logo_url ?? null,
            images: seed.images ?? [],
          });
          return getRooms(tenant.id, { limit: 50 });
        }
        // Tenant not found or not accessible — keep seed data
        return { data: null };
      })
      .then(({ data }) => {
        if (data?.length) {
          // Show all rooms (available + occupied for display)
          setRooms(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const scrollToSection = (ref, id) => {
    setActiveTab(id);
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <PublicLayout>
        <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Spinner size="lg"/>
        </div>
      </PublicLayout>
    );
  }

  if (!property) {
    return (
      <PublicLayout>
        <div style={{ maxWidth:600, margin:"120px auto", padding:"0 28px" }}>
          <EmptyState icon="search" title="Property not found"
            description="This property may have moved or is no longer available."
            action={<Button variant="primary" onClick={() => navigate("/browse")}>Browse all properties</Button>}
          />
        </div>
      </PublicLayout>
    );
  }

  const availableRooms = rooms.filter(r => r.status === "available");
  const minPrice       = availableRooms.length
    ? Math.min(...availableRooms.map(r => Number(r.monthly_price)))
    : null;

  const crumbs = [
    { label: "Home",   to: "/" },
    { label: "Browse", to: "/browse" },
    { label: property.name },
  ];

  return (
    <PublicLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fdU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fd1{animation:fdU 0.5s 0.05s ease both} .fd2{animation:fdU 0.5s 0.15s ease both}
        .fd3{animation:fdU 0.5s 0.25s ease both}
        .tab-btn { padding:12px 0; font-size:14px; font-weight:500; border:none; background:transparent; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.18s; white-space:nowrap; }
        .tab-btn.active { color:#C5612C; border-bottom-color:#C5612C; }
        .tab-btn:not(.active) { color:#8B7355; }
        .tab-btn:not(.active):hover { color:#1A1412; }
        @media(max-width:900px){.detail-sidebar{display:none!important}}
      `}</style>

      <div style={{ paddingTop:68, minHeight:"100vh", background:"#FAF7F2", fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* ── Gallery ── */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"16px 28px 0" }}>
          <Breadcrumb crumbs={crumbs} style={{ marginBottom:12 }} />

          {/* Gallery grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(2,1fr)", gap:8, height:440, borderRadius:24, overflow:"hidden" }}>
            {/* Main image */}
            <div style={{ gridColumn:"span 2", gridRow:"span 2", position:"relative", cursor:"pointer", overflow:"hidden" }}
              onClick={() => { setActiveImage(0); setGalleryOpen(true); }}>
              <img src={property.images?.[0]} alt={property.name}
                style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.5s ease" }}
                onMouseOver={e=>e.target.style.transform="scale(1.04)"}
                onMouseOut={e=>e.target.style.transform="scale(1)"}
              />
              <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0)",transition:"background 0.18s" }}
                onMouseOver={e=>e.currentTarget.style.background="rgba(0,0,0,0.08)"}
                onMouseOut={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}
              />
            </div>
            {/* Thumbnails */}
            {(property.images ?? []).slice(1,5).map((img, i) => (
              <div key={i} style={{ position:"relative",cursor:"pointer",overflow:"hidden" }}
                onClick={() => { setActiveImage(i+1); setGalleryOpen(true); }}>
                <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s ease,opacity 0.2s" }}
                  onMouseOver={e=>{e.target.style.transform="scale(1.05)";e.target.style.opacity="0.85"}}
                  onMouseOut={e=>{e.target.style.transform="scale(1)";e.target.style.opacity="1"}}
                />
                {i === 3 && (property.images ?? []).length > 5 && (
                  <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <p style={{ color:"#fff",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,margin:0 }}>+{property.images.length - 4}</p>
                    <p style={{ color:"rgba(255,255,255,0.8)",fontSize:11,margin:0 }}>more photos</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:8 }}>
            <button onClick={() => setGalleryOpen(true)}
              style={{ fontSize:12,color:"#5C4A3A",border:"1.5px solid #E8DDD4",borderRadius:999,padding:"5px 14px",background:"#fff",cursor:"pointer",transition:"all 0.15s" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#C5612C";e.currentTarget.style.color="#C5612C"}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.color="#5C4A3A"}}
            >
              📷 Show all {(property.images ?? []).length} photos
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"20px 28px 80px" }}>
          <div style={{ display:"flex", gap:36, alignItems:"flex-start" }}>

            {/* ── Left column ── */}
            <div style={{ flex:1, minWidth:0 }} className="fd1">

              {/* Title block */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                  {property.badge && <Badge variant="brand" size="sm">{property.badge}</Badge>}
                  {property.verified && (
                    <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"#059669",background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:999,padding:"3px 9px" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Verified
                    </span>
                  )}
                  <Badge variant="neutral" size="sm">{property.type}</Badge>
                </div>

                {/* P-5: Logo shown before property name, clearly distinct from room photos */}
                {property.logo_url && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <img
                      src={property.logo_url}
                      alt={`${property.name} logo`}
                      style={{ height:40, maxWidth:120, objectFit:"contain", borderRadius:8, border:"1px solid #EDE4D8", background:"#fff", padding:4 }}
                    />
                  </div>
                )}
                <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(26px,4vw,40px)",color:"#1A1412",margin:"0 0 6px",lineHeight:1.1 }}>
                  {property.name}
                </h1>
                {property.tagline && <p style={{ fontSize:15,color:"#8B7355",margin:"0 0 8px" }}>{property.tagline}</p>}
                <p style={{ fontSize:13,color:"#8B7355",margin:0,display:"flex",alignItems:"center",gap:4 }}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  {property.fullAddress ?? property.location}
                </p>

                <div style={{ display:"flex",alignItems:"center",gap:16,marginTop:12,flexWrap:"wrap" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Stars rating={property.rating}/>
                    <span style={{ fontWeight:700,fontSize:14,color:"#1A1412" }}>{property.rating}</span>
                    <span style={{ fontSize:13,color:"#8B7355" }}>({property.reviews} reviews)</span>
                  </div>
                  <div style={{ width:1,height:16,background:"#E8DDD4" }}/>
                  {property.managedBy && (
                    <p style={{ fontSize:13,color:"#8B7355",margin:0 }}>
                      Managed by <strong style={{ color:"#1A1412" }}>{property.managedBy}</strong>
                    </p>
                  )}
                  <div style={{ width:1,height:16,background:"#E8DDD4" }}/>
                  <p style={{ fontSize:13,fontWeight:600,color: availableRooms.length>0 ? "#059669" : "#D97706", margin:0 }}>
                    {availableRooms.length > 0
                      ? `${availableRooms.length} room${availableRooms.length>1?"s":""} available`
                      : "Currently fully occupied"}
                  </p>

                  {/* Save + Share */}
                  <div style={{ display:"flex",gap:8,marginLeft:"auto" }}>
                    <button onClick={() => setSaved(s=>!s)}
                      style={{ display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:"50%",border:`1.5px solid ${saved?"#FCA5A5":"#E8DDD4"}`,background:saved?"#FEF2F2":"#fff",cursor:"pointer",color:saved?"#EF4444":"#8B7355",transition:"all 0.18s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved?"#EF4444":"none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                    <button style={{ display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:"50%",border:"1.5px solid #E8DDD4",background:"#fff",cursor:"pointer",color:"#8B7355",transition:"all 0.18s" }}
                      onMouseOver={e=>{e.currentTarget.style.borderColor="#C5612C";e.currentTarget.style.color="#C5612C"}}
                      onMouseOut={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.color="#8B7355"}}
                      onClick={() => navigator.share?.({ title:property.name, url: window.location.href })}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Sticky Tab Nav ── */}
              <div style={{ position:"sticky",top:68,zIndex:30,background:"#FAF7F2",borderBottom:"1px solid #EDE4D8",margin:"0 -28px",padding:"0 28px",marginBottom:28 }}>
                <div style={{ display:"flex",gap:28,overflowX:"auto" }}>
                  {[["overview","Overview"],["rooms","Rooms"],["amenities","Amenities"],["reviews","Reviews"]].map(([id,label])=>(
                    <button key={id} className={`tab-btn${activeTab===id?" active":""}`}
                      onClick={() => scrollToSection({overview:overviewRef,rooms:roomsRef,amenities:amenitiesRef,reviews:reviewsRef}[id],id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Overview ── */}
              <section ref={overviewRef} style={{ marginBottom:40 }} className="fd2">
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:12 }}>About this property</h2>
                <p style={{ fontSize:15,color:"#5C4A3A",lineHeight:1.7,margin:0 }}>{property.description}</p>

                {/* Nearby */}
                {property.nearbyPlaces?.length > 0 && (
                  <div style={{ marginTop:20 }}>
                    <p style={{ fontSize:13,fontWeight:700,color:"#1A1412",marginBottom:12 }}>Nearby</p>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
                      {property.nearbyPlaces.map(n=>(
                        <div key={n.name} style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:12,padding:"10px 14px" }}>
                          <p style={{ fontSize:13,fontWeight:600,color:"#1A1412",margin:"0 0 2px" }}>{n.name}</p>
                          <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>{n.distance} · {n.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Rooms ── */}
              <section ref={roomsRef} style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:16 }}>Available Rooms</h2>
                {availableRooms.length === 0 ? (
                  <Alert type="warning" title="No rooms currently available"
                    message="All rooms are occupied. Check back soon or save this property to get notified." />
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {rooms.map(r => <RoomRow key={r.id} room={r} onRequest={setRequestRoom} />)}
                  </div>
                )}
              </section>

              {/* ── Amenities ── */}
              <section ref={amenitiesRef} style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:16 }}>Amenities</h2>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12 }}>
                  {(property.amenities ?? []).map(a=>(
                    <div key={a.label ?? a} style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid #EDE4D8",borderRadius:12,padding:"12px 14px" }}>
                      {a.icon && <span style={{ fontSize:20 }}>{a.icon}</span>}
                      <span style={{ fontSize:13,fontWeight:500,color:"#1A1412" }}>{a.label ?? a}</span>
                    </div>
                  ))}
                </div>

                {/* House rules */}
                {property.rules?.length > 0 && (
                  <div style={{ marginTop:28 }}>
                    <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:"#1A1412",marginBottom:12 }}>House Rules</h3>
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {property.rules.map(r=>(
                        <div key={r} style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0,marginTop:2 }}><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize:14,color:"#5C4A3A" }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Reviews ── */}
              <section ref={reviewsRef} style={{ marginBottom:40 }} className="fd3">
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",margin:0 }}>Reviews</h2>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <Stars rating={property.rating}/>
                    <span style={{ fontWeight:700,fontSize:16,color:"#1A1412" }}>{property.rating}</span>
                    <span style={{ fontSize:13,color:"#8B7355" }}>({property.reviews})</span>
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  {(property.reviews_list ?? []).map((review, i) => (
                    <div key={i} style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:16,padding:"16px 18px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                        <Avatar name={review.name} size="sm"/>
                        <div>
                          <p style={{ fontSize:14,fontWeight:700,color:"#1A1412",margin:0 }}>{review.name}</p>
                          <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>{review.date}</p>
                        </div>
                        <div style={{ marginLeft:"auto" }}><Stars rating={review.rating} size={12}/></div>
                      </div>
                      <p style={{ fontSize:14,color:"#5C4A3A",lineHeight:1.6,margin:0 }}>{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Sticky booking sidebar ── */}
            <div className="detail-sidebar" style={{ width:320, flexShrink:0, position:"sticky", top:88 }}>
              <div style={{ background:"#fff",border:"1px solid #EDE4D8",borderRadius:20,padding:"22px",boxShadow:"0 8px 28px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", gap:16 }}>
                {/* Price */}
                <div>
                  {minPrice ? (
                    <div>
                      <p style={{ fontSize:12,color:"#8B7355",margin:"0 0 2px" }}>Starting from</p>
                      <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:28,color:"#C5612C",margin:0 }}>
                        {formatCurrency(minPrice)}<span style={{ fontSize:13,fontWeight:400,color:"#8B7355" }}>/mo</span>
                      </p>
                    </div>
                  ) : (
                    <Alert type="warning" compact message="No rooms currently available." />
                  )}
                </div>

                {/* Rating */}
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <Stars rating={property.rating}/>
                  <span style={{ fontWeight:700,fontSize:13,color:"#1A1412" }}>{property.rating}</span>
                  <span style={{ fontSize:12,color:"#8B7355" }}>({property.reviews})</span>
                </div>

                {/* Room selector */}
                {availableRooms.length > 0 ? (
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {rooms.map(r => (
                      <button key={r.id}
                        onClick={() => r.status === "available" && setRequestRoom(r)}
                        disabled={r.status !== "available"}
                        style={{
                          display:"flex",justifyContent:"space-between",alignItems:"center",
                          padding:"10px 14px",borderRadius:12,border:"1.5px solid #EDE4D8",
                          background:r.status==="available"?"#fff":"#FAF7F2",
                          cursor:r.status==="available"?"pointer":"not-allowed",
                          opacity:r.status==="available"?1:0.5,
                          transition:"all 0.15s",textAlign:"left",
                        }}
                        onMouseOver={e=>{if(r.status==="available"){e.currentTarget.style.borderColor="#C5612C";e.currentTarget.style.background="#FFF5EF"}}}
                        onMouseOut={e=>{if(r.status==="available"){e.currentTarget.style.borderColor="#EDE4D8";e.currentTarget.style.background="#fff"}}}
                      >
                        <div>
                          <p style={{ fontSize:12,fontWeight:700,color:"#1A1412",margin:0 }}>Room {r.room_number}</p>
                          <p style={{ fontSize:11,color:"#8B7355",margin:"1px 0 0",textTransform:"capitalize" }}>{r.room_type?.replace(/_/g," ")} · {r.status==="available"?"Available":"Full"}</p>
                        </div>
                        <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#C5612C" }}>{formatCurrency(r.monthly_price)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <Button variant="primary" fullWidth
                  disabled={availableRooms.length === 0}
                  onClick={() => availableRooms.length > 0 && setRequestRoom(availableRooms[0])}
                >
                  {availableRooms.length > 0 ? "Request to Move In" : "Fully Occupied"}
                </Button>

                <p style={{ fontSize:11,color:"#8B7355",textAlign:"center",margin:0 }}>No booking fees · Responds within 24 hours</p>

                {/* Manager card */}
                {property.managedBy && (
                  <div style={{ display:"flex",alignItems:"center",gap:10,paddingTop:14,borderTop:"1px solid #EDE4D8" }}>
                    <Avatar name={property.managedBy} size="sm"/>
                    <div>
                      <p style={{ fontSize:13,fontWeight:700,color:"#1A1412",margin:0 }}>{property.managedBy}</p>
                      <p style={{ fontSize:11,color:"#8B7355",margin:0 }}>Property Manager</p>
                    </div>
                  </div>
                )}

                {/* Quick facts */}
                <div style={{ display:"flex",flexDirection:"column",gap:8,paddingTop:14,borderTop:"1px solid #EDE4D8" }}>
                  {[
                    ["Type",     property.type],
                    ["Location", property.location],
                    ["Rooms",    `${rooms.length} total`],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex",justifyContent:"space-between" }}>
                      <span style={{ fontSize:12,color:"#8B7355" }}>{k}</span>
                      <span style={{ fontSize:12,fontWeight:600,color:"#1A1412" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox gallery ── */}
      {galleryOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"#0D0B0A",display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",flexShrink:0 }}>
            <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,margin:0 }}>{activeImage+1} / {(property.images??[]).length}</p>
            <button onClick={() => setGalleryOpen(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",transition:"color 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.color="#fff"}
              onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 64px",position:"relative",minHeight:0 }}>
            <button onClick={() => setActiveImage(i=>Math.max(0,i-1))} disabled={activeImage===0}
              style={{ position:"absolute",left:16,width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",transition:"background 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <img key={activeImage} src={(property.images??[])[activeImage]} alt={`Photo ${activeImage+1}`}
              style={{ maxHeight:"100%",maxWidth:"100%",borderRadius:16,objectFit:"contain",animation:"fdU 0.25s ease both" }}
            />
            <button onClick={() => setActiveImage(i=>Math.min((property.images??[]).length-1,i+1))} disabled={activeImage===(property.images??[]).length-1}
              style={{ position:"absolute",right:16,width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",transition:"background 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {/* Thumbnail strip */}
          <div style={{ display:"flex",gap:8,padding:"12px 24px",overflowX:"auto",flexShrink:0 }}>
            {(property.images??[]).map((img,i)=>(
              <button key={i} onClick={()=>setActiveImage(i)}
                style={{ flexShrink:0,width:72,height:50,borderRadius:10,overflow:"hidden",border:`2px solid ${activeImage===i?"#C5612C":"transparent"}`,opacity:activeImage===i?1:0.45,transition:"all 0.18s",padding:0,cursor:"pointer" }}>
                <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Rental Request Modal ── */}
      <RentalRequestModal
        isOpen={!!requestRoom}
        onClose={() => setRequestRoom(null)}
        room={requestRoom}
        tenantName={property.name}
        onSuccess={() => setRequestRoom(null)}
      />
    </PublicLayout>
  );
}
