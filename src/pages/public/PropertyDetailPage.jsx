import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import PublicLayout from "../../layouts/PublicLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import { Spinner }         from "../../components/ui/Spinner.jsx";
import { EmptyState }      from "../../components/ui/Spinner.jsx";
import { Alert }           from "../../components/ui/Alert.jsx";
import Badge               from "../../components/ui/Badge.jsx";
import Button              from "../../components/ui/Button.jsx";
import { Breadcrumb }      from "../../components/navigation/TabBar.jsx";
import RentalRequestModal  from "../../components/modals/RentalRequestModal.jsx";

// ── API ───────────────────────────────────────────────────────────────────────
import { getTenantBySlug } from "../../lib/api/tenants.js";
import { getRooms }        from "../../lib/api/rooms.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency } from "../../lib/formatters.js";

// =============================================================================
// PropertyDetailPage  /property/:slug
//
// Real data only (tenant + its rooms). Sections with no data are hidden.
// =============================================================================

const prettyType = (t) => (t ? t.replace(/_/g, " ") : "");

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
              {[prettyType(room.room_type), room.description ?? (room.capacity ? `Capacity ${room.capacity}` : null)].filter(Boolean).join(" · ")}
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

  const [tenant,      setTenant]      = useState(null);
  const [rooms,       setRooms]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [saved,       setSaved]       = useState(false);
  const [requestRoom, setRequestRoom] = useState(null);

  const overviewRef  = useRef(null);
  const roomsRef     = useRef(null);
  const amenitiesRef = useRef(null);

  // Fetch real property + rooms
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    setTenant(null);
    setRooms([]);

    getTenantBySlug(slug)
      .then(async ({ data: t }) => {
        if (!alive) return;
        if (!t) return;
        setTenant(t);
        const { data } = await getRooms(t.id, { limit: 50 });
        if (alive) setRooms(data ?? []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [slug]);

  // ── Everything below is derived from real data ──────────────────────────────
  const images = useMemo(() => {
    const all = rooms.flatMap(r => Array.isArray(r.images) ? r.images : []);
    return Array.from(new Set(all.filter(Boolean)));
  }, [rooms]);

  const amenities = useMemo(() => {
    const all = rooms.flatMap(r => Array.isArray(r.amenities) ? r.amenities : []);
    return Array.from(new Set(all.filter(Boolean)));
  }, [rooms]);

  const roomTypes = useMemo(
    () => Array.from(new Set(rooms.map(r => r.room_type).filter(Boolean))),
    [rooms]
  );

  const availableRooms = rooms.filter(r => r.status === "available");
  const minPrice = availableRooms.length
    ? Math.min(...availableRooms.map(r => Number(r.monthly_price)))
    : null;

  const location =
    [tenant?.address, tenant?.city, tenant?.county].filter(Boolean).join(", ") ||
    rooms.find(r => r.buildings?.address)?.buildings?.address ||
    "";

  const description = tenant?.description || "";

  const tabs = [
    description          && ["overview",  "Overview",  overviewRef],
    rooms.length > 0     && ["rooms",     "Rooms",     roomsRef],
    amenities.length > 0 && ["amenities", "Amenities", amenitiesRef],
  ].filter(Boolean);

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

  if (!tenant) {
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

  const crumbs = [
    { label: "Home",   to: "/" },
    { label: "Browse", to: "/browse" },
    { label: tenant.name },
  ];

  const facts = [
    location && ["Location", location],
    ["Rooms",     `${rooms.length} total`],
    ["Available", `${availableRooms.length}`],
  ].filter(Boolean);

  return (
    <PublicLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fdU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fd1{animation:fdU 0.5s 0.05s ease both} .fd2{animation:fdU 0.5s 0.15s ease both}
        .tab-btn { padding:12px 0; font-size:14px; font-weight:500; border:none; background:transparent; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.18s; white-space:nowrap; }
        .tab-btn.active { color:#C5612C; border-bottom-color:#C5612C; }
        .tab-btn:not(.active) { color:#8B7355; }
        .tab-btn:not(.active):hover { color:#1A1412; }
        @media(max-width:900px){.detail-sidebar{display:none!important}}
      `}</style>

      <div style={{ paddingTop:68, minHeight:"100vh", background:"#FAF7F2", fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* ── Gallery (only when real photos exist) ── */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"16px 28px 0" }}>
          <Breadcrumb crumbs={crumbs} style={{ marginBottom:12 }} />

          {images.length > 0 && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(2,1fr)", gap:8, height:440, borderRadius:24, overflow:"hidden" }}>
                <div style={{ gridColumn: images.length > 1 ? "span 2" : "span 4", gridRow:"span 2", position:"relative", cursor:"pointer", overflow:"hidden" }}
                  onClick={() => { setActiveImage(0); setGalleryOpen(true); }}>
                  <img src={images[0]} alt={tenant.name}
                    style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.5s ease" }}
                    onMouseOver={e=>e.target.style.transform="scale(1.04)"}
                    onMouseOut={e=>e.target.style.transform="scale(1)"}
                  />
                </div>
                {images.slice(1,5).map((img, i) => (
                  <div key={i} style={{ position:"relative",cursor:"pointer",overflow:"hidden" }}
                    onClick={() => { setActiveImage(i+1); setGalleryOpen(true); }}>
                    <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s ease,opacity 0.2s" }}
                      onMouseOver={e=>{e.target.style.transform="scale(1.05)";e.target.style.opacity="0.85"}}
                      onMouseOut={e=>{e.target.style.transform="scale(1)";e.target.style.opacity="1"}}
                    />
                    {i === 3 && images.length > 5 && (
                      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                        <p style={{ color:"#fff",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,margin:0 }}>+{images.length - 5}</p>
                        <p style={{ color:"rgba(255,255,255,0.8)",fontSize:11,margin:0 }}>more photos</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display:"flex",justifyContent:"flex-end",marginTop:8 }}>
                <button onClick={() => { setActiveImage(0); setGalleryOpen(true); }}
                  style={{ fontSize:12,color:"#5C4A3A",border:"1.5px solid #E8DDD4",borderRadius:999,padding:"5px 14px",background:"#fff",cursor:"pointer",transition:"all 0.15s" }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor="#C5612C";e.currentTarget.style.color="#C5612C"}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor="#E8DDD4";e.currentTarget.style.color="#5C4A3A"}}
                >
                  📷 Show all {images.length} photo{images.length === 1 ? "" : "s"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"20px 28px 80px" }}>
          <div style={{ display:"flex", gap:36, alignItems:"flex-start" }}>

            {/* ── Left column ── */}
            <div style={{ flex:1, minWidth:0 }} className="fd1">

              {/* Title block */}
              <div style={{ marginBottom:20 }}>
                {roomTypes.length > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                    {roomTypes.map(t => <Badge key={t} variant="neutral" size="sm">{prettyType(t)}</Badge>)}
                  </div>
                )}

                {tenant.logo_url && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <img
                      src={tenant.logo_url}
                      alt={`${tenant.name} logo`}
                      style={{ height:40, maxWidth:120, objectFit:"contain", borderRadius:8, border:"1px solid #EDE4D8", background:"#fff", padding:4 }}
                    />
                  </div>
                )}
                <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"clamp(26px,4vw,40px)",color:"#1A1412",margin:"0 0 6px",lineHeight:1.1 }}>
                  {tenant.name}
                </h1>
                {location && (
                  <p style={{ fontSize:13,color:"#8B7355",margin:0,display:"flex",alignItems:"center",gap:4 }}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#C5612C"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                    {location}
                  </p>
                )}

                <div style={{ display:"flex",alignItems:"center",gap:16,marginTop:12,flexWrap:"wrap" }}>
                  <p style={{ fontSize:13,fontWeight:600,color: availableRooms.length>0 ? "#059669" : "#D97706", margin:0 }}>
                    {availableRooms.length > 0
                      ? `${availableRooms.length} room${availableRooms.length>1?"s":""} available`
                      : rooms.length > 0 ? "Currently fully occupied" : "No rooms listed yet"}
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
                      onClick={() => navigator.share?.({ title:tenant.name, url: window.location.href })}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Sticky Tab Nav (only tabs that have content) ── */}
              {tabs.length > 1 && (
                <div style={{ position:"sticky",top:68,zIndex:30,background:"#FAF7F2",borderBottom:"1px solid #EDE4D8",margin:"0 -28px",padding:"0 28px",marginBottom:28 }}>
                  <div style={{ display:"flex",gap:28,overflowX:"auto" }}>
                    {tabs.map(([id,label,ref])=>(
                      <button key={id} className={`tab-btn${activeTab===id?" active":""}`}
                        onClick={() => scrollToSection(ref,id)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Overview ── */}
              {description && (
                <section ref={overviewRef} style={{ marginBottom:40 }} className="fd2">
                  <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:12 }}>About this property</h2>
                  <p style={{ fontSize:15,color:"#5C4A3A",lineHeight:1.7,margin:0 }}>{description}</p>
                </section>
              )}

              {/* ── Rooms ── */}
              <section ref={roomsRef} style={{ marginBottom:40 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:16 }}>Rooms</h2>
                {rooms.length === 0 ? (
                  <Alert type="info" title="No rooms listed yet"
                    message="This property has not published any rooms yet. Please check back soon." />
                ) : availableRooms.length === 0 ? (
                  <>
                    <Alert type="warning" title="No rooms currently available"
                      message="All rooms are occupied. Check back soon." />
                    <div style={{ display:"flex",flexDirection:"column",gap:12,marginTop:12 }}>
                      {rooms.map(r => <RoomRow key={r.id} room={r} onRequest={setRequestRoom} />)}
                    </div>
                  </>
                ) : (
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {rooms.map(r => <RoomRow key={r.id} room={r} onRequest={setRequestRoom} />)}
                  </div>
                )}
              </section>

              {/* ── Amenities (union of what the rooms actually list) ── */}
              {amenities.length > 0 && (
                <section ref={amenitiesRef} style={{ marginBottom:40 }}>
                  <h2 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:22,color:"#1A1412",marginBottom:16 }}>Amenities</h2>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12 }}>
                    {amenities.map(a=>(
                      <div key={a} style={{ display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid #EDE4D8",borderRadius:12,padding:"12px 14px" }}>
                        <span style={{ fontSize:13,fontWeight:500,color:"#1A1412" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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

                {/* Room selector */}
                {availableRooms.length > 0 && (
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
                          <p style={{ fontSize:11,color:"#8B7355",margin:"1px 0 0",textTransform:"capitalize" }}>{prettyType(r.room_type)} · {r.status==="available"?"Available":"Full"}</p>
                        </div>
                        <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"#C5612C" }}>{formatCurrency(r.monthly_price)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <Button variant="primary" fullWidth
                  disabled={availableRooms.length === 0}
                  onClick={() => availableRooms.length > 0 && setRequestRoom(availableRooms[0])}
                >
                  {availableRooms.length > 0 ? "Request to Move In" : rooms.length > 0 ? "Fully Occupied" : "No Rooms Yet"}
                </Button>

                {/* Quick facts */}
                <div style={{ display:"flex",flexDirection:"column",gap:8,paddingTop:14,borderTop:"1px solid #EDE4D8" }}>
                  {facts.map(([k,v]) => (
                    <div key={k} style={{ display:"flex",justifyContent:"space-between",gap:12 }}>
                      <span style={{ fontSize:12,color:"#8B7355" }}>{k}</span>
                      <span style={{ fontSize:12,fontWeight:600,color:"#1A1412",textAlign:"right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox gallery ── */}
      {galleryOpen && images.length > 0 && (
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"#0D0B0A",display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",flexShrink:0 }}>
            <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,margin:0 }}>{activeImage+1} / {images.length}</p>
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
            <img key={activeImage} src={images[activeImage]} alt={`Photo ${activeImage+1}`}
              style={{ maxHeight:"100%",maxWidth:"100%",borderRadius:16,objectFit:"contain",animation:"fdU 0.25s ease both" }}
            />
            <button onClick={() => setActiveImage(i=>Math.min(images.length-1,i+1))} disabled={activeImage===images.length-1}
              style={{ position:"absolute",right:16,width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",transition:"background 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseOut={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {/* Thumbnail strip */}
          <div style={{ display:"flex",gap:8,padding:"12px 24px",overflowX:"auto",flexShrink:0 }}>
            {images.map((img,i)=>(
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
        tenantName={tenant.name}
        onSuccess={() => setRequestRoom(null)}
      />
    </PublicLayout>
  );
}