import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Data ──────────────────────────────────────────────────────────────────────
const PROPERTIES = {
  "sunrise-hostel": {
    id: 1,
    slug: "sunrise-hostel",
    name: "Sunrise Hostel",
    tagline: "Modern hostel living in the heart of Westlands",
    location: "Westlands, Nairobi",
    fullAddress: "Parklands Road, Westlands, Nairobi",
    type: "Hostel",
    rating: 4.8,
    reviews: 124,
    badge: "Popular",
    badgeColor: "#C5612C",
    verified: true,
    managedBy: "Michael Kamau",
    description: "Sunrise Hostel offers comfortable, modern accommodation for young professionals and students seeking quality living in Nairobi's vibrant Westlands district. Our fully furnished rooms come with high-speed fibre internet, 24/7 security, and a friendly community atmosphere that makes settling in effortless.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
    ],
    amenities: [
      { label: "High-Speed WiFi", icon: "📶" },
      { label: "24/7 Security", icon: "🔒" },
      { label: "Laundry Room", icon: "🧺" },
      { label: "Water (24hr)", icon: "💧" },
      { label: "Common Room", icon: "🛋️" },
      { label: "CCTV", icon: "📷" },
      { label: "Backup Generator", icon: "⚡" },
      { label: "Parking (limited)", icon: "🚗" },
    ],
    rules: [
      "No visitors after 10:00 PM",
      "No cooking in rooms — use shared kitchen",
      "Quiet hours: 10 PM – 7 AM",
      "No smoking on premises",
      "Pets are not allowed",
    ],
    rooms: [
      { id: "s1", type: "Single Room",   price: 8500,  size: "12 m²", beds: 1, available: 4, floor: "2nd", features: ["Furnished", "En-suite"], image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80" },
      { id: "d1", type: "Double Room",   price: 12000, size: "18 m²", beds: 2, available: 2, floor: "1st", features: ["Furnished", "Shared Bath"], image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80" },
      { id: "s2", type: "Single Ensuite",price: 10500, size: "14 m²", beds: 1, available: 0, floor: "3rd", features: ["Furnished", "En-suite", "City View"], image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80" },
    ],
    nearbyPlaces: [
      { name: "Sarit Centre", distance: "0.4 km", type: "Shopping" },
      { name: "Westlands Bus Stop", distance: "0.2 km", type: "Transit" },
      { name: "USIU Africa", distance: "2.1 km", type: "University" },
      { name: "Westgate Mall", distance: "0.9 km", type: "Shopping" },
    ],
    reviews_list: [
      { name: "Kevin O.", rating: 5, date: "Feb 2025", text: "Absolutely loved my stay. The WiFi is blazing fast and the security team is very professional.", avatar: "KO" },
      { name: "Grace M.", rating: 5, date: "Jan 2025", text: "Clean, affordable and in a great location. Management responds quickly to any issues.", avatar: "GM" },
      { name: "Ali H.",   rating: 4, date: "Dec 2024", text: "Good value for Westlands. The common room is a great place to meet other residents.", avatar: "AH" },
    ],
  },
  "greenfield-apartments": {
    id: 2,
    slug: "greenfield-apartments",
    name: "Greenfield Apartments",
    tagline: "Upscale apartment living in Kilimani",
    location: "Kilimani, Nairobi",
    fullAddress: "Dennis Pritt Road, Kilimani, Nairobi",
    type: "Apartment",
    rating: 4.6,
    reviews: 87,
    badge: "New",
    badgeColor: "#2C6EC5",
    verified: true,
    managedBy: "Alice Wambui",
    description: "Greenfield Apartments redefines urban living in Nairobi's prestigious Kilimani neighbourhood. With spacious layouts, modern finishes, and a full suite of amenities including a gym and secure parking, each unit is designed to elevate your everyday life.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    ],
    amenities: [
      { label: "Secure Parking", icon: "🚗" },
      { label: "Gym", icon: "🏋️" },
      { label: "High-Speed WiFi", icon: "📶" },
      { label: "CCTV", icon: "📷" },
      { label: "Backup Power", icon: "⚡" },
      { label: "Intercom", icon: "🔔" },
      { label: "Water (24hr)", icon: "💧" },
      { label: "Lift / Elevator", icon: "🛗" },
    ],
    rules: [
      "No short-stay/Airbnb subletting",
      "Parking is one slot per unit",
      "Noise curfew: 11 PM – 6 AM",
      "Building maintenance days: 2nd Saturday monthly",
    ],
    rooms: [
      { id: "1b",  type: "1-Bedroom",   price: 22000, size: "45 m²", beds: 1, available: 5,  floor: "Various", features: ["Open Plan", "Full Kitchen", "Balcony"], image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" },
      { id: "2b",  type: "2-Bedroom",   price: 38000, size: "72 m²", beds: 2, available: 4,  floor: "Various", features: ["2 Bathrooms", "Full Kitchen", "Balcony"], image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80" },
      { id: "stu", type: "Studio",       price: 16000, size: "30 m²", beds: 1, available: 3,  floor: "Ground–2nd", features: ["Kitchenette", "En-suite"], image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80" },
    ],
    nearbyPlaces: [
      { name: "Yaya Centre", distance: "0.3 km", type: "Shopping" },
      { name: "Kilimani Matatu Stage", distance: "0.4 km", type: "Transit" },
      { name: "Nairobi Hospital", distance: "1.2 km", type: "Healthcare" },
    ],
    reviews_list: [
      { name: "Sandra K.", rating: 5, date: "Feb 2025", text: "Modern, spacious and very well managed. The gym is a bonus!", avatar: "SK" },
      { name: "David N.",  rating: 4, date: "Jan 2025", text: "Great location and secure. Would recommend for young professionals.", avatar: "DN" },
    ],
  },
};

// Fallback for slugs not in our mock data
const FALLBACK = PROPERTIES["sunrise-hostel"];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, s = 18, c = "" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d={d} />
  </svg>
);
const ChevLeft    = () => <Ic d="M15 18l-6-6 6-6" />;
const ChevRight   = () => <Ic d="M9 18l6-6-6-6" />;
const LocationPin = () => <Ic d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" s={16}/>;
const ShareIcon   = () => <Ic d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" s={16}/>;
const HeartIcon   = () => <Ic d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" s={16}/>;
const ShieldIcon  = () => <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" s={14}/>;
const StarIcon    = ({ filled }) => (
  <svg className={`w-4 h-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const CheckIcon   = () => <Ic d="M5 13l4 4L19 7" s={15}/>;
const XIcon       = () => <Ic d="M18 6L6 18M6 6l12 12" />;
const XSmall      = () => <Ic d="M18 6L6 18M6 6l12 12" s={16}/>;
const MenuIcon    = () => <Ic d="M4 6h16M4 12h16M4 18h16" />;
const CalIcon     = () => <Ic d="M8 2v3M16 2v3M3 9h18M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" s={16}/>;
const UserSmall   = () => <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" s={16}/>;
const PhoneIcon   = () => <Ic d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" s={16}/>;

const StarRow = ({ rating, size = "w-4 h-4" }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(rating)} />)}
  </div>
);

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
              <path d="M9 21V12h6v9" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-[#1A1412]">fab<span className="text-[#C5612C]">rentals</span></span>
        </button>
        <div className="hidden md:flex items-center gap-8">
          {[["Browse","/browse"],["How it works","/#how"],["For Landlords","/#landlords"]].map(([l,h])=>(
            <a key={l} href={h} className="nav-link text-sm font-medium text-[#5C4A3A] hover:text-[#1A1412] transition-colors">{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="text-sm font-medium text-[#5C4A3A] hover:text-[#1A1412] px-4 py-2">Sign in</button>
          <button onClick={() => navigate("/signup")} className="bg-[#C5612C] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm">Get started</button>
        </div>
        <button className="md:hidden text-[#1A1412] p-1" onClick={() => setMenuOpen(o=>!o)}>
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E8DDD4] px-6 py-4 space-y-3">
          {[["Browse","/browse"],["How it works","/#how"],["For Landlords","/#landlords"]].map(([l,h])=>(
            <a key={l} href={h} className="block text-sm font-medium text-[#5C4A3A] py-1">{l}</a>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate("/login")} className="flex-1 border border-[#E8DDD4] rounded-full py-2.5 text-sm font-medium text-[#5C4A3A]">Sign in</button>
            <button onClick={() => navigate("/signup")} className="flex-1 bg-[#C5612C] text-white rounded-full py-2.5 text-sm font-semibold">Get started</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Rental Request Modal ──────────────────────────────────────────────────────
function RequestModal({ property, room, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=login gate, 2=form, 3=success
  const [form, setForm] = useState({ name:"", phone:"", email:"", moveIn:"", notes:"" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Full name is required";
    if (!form.phone.trim())   e.phone   = "Phone number is required";
    if (!form.email.trim())   e.email   = "Email is required";
    if (!form.moveIn)         e.moveIn  = "Move-in date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep(3);
  };

  const Field = ({ label, name, type = "text", placeholder }) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => { setForm(f => ({...f, [name]: e.target.value})); setErrors(er => ({...er, [name]: ""})); }}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all placeholder:text-[#8B7355] ${
          errors[name] ? "border-red-400 bg-red-50" : "border-[#E8DDD4] bg-[#FAF7F2] focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C]/10"
        }`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(26,20,18,0.7)", backdropFilter: "blur(5px)" }}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">
              {step === 1 ? "Create Account" : step === 2 ? "Rental Request" : "Request Sent!"}
            </p>
            <h3 className="font-display font-black text-[#1A1412] text-xl">
              {step === 1 ? "Sign up to continue" : step === 2 ? room?.type : "You're on the list 🎉"}
            </h3>
            {step === 2 && room && (
              <p className="text-sm text-[#8B7355] mt-0.5">{property.name} · KES {room.price.toLocaleString()}/mo</p>
            )}
          </div>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#1A1412] mt-1 p-1 flex-shrink-0">
            <XIcon />
          </button>
        </div>

        {/* Step 1 — Login gate */}
        {step === 1 && (
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <div className="bg-[#FFF5EF] border border-[#C5612C]/20 rounded-2xl p-4 mb-5">
              <p className="text-sm text-[#5C4A3A]">
                You need a free fabrentals account to submit a rental request. It takes less than a minute.
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => navigate("/signup")}
                className="w-full bg-[#C5612C] text-white font-semibold py-3.5 rounded-full hover:bg-[#A84E22] transition-colors">
                Create free account
              </button>
              <button onClick={() => navigate("/login")}
                className="w-full border border-[#E8DDD4] text-[#5C4A3A] font-medium py-3.5 rounded-full hover:border-[#C5612C] transition-colors">
                Sign in to existing account
              </button>
              <button onClick={() => setStep(2)}
                className="w-full text-xs text-[#8B7355] hover:text-[#C5612C] py-2 transition-colors">
                Continue as guest (limited)
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Form */}
        {step === 2 && (
          <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-4">
            {room && (
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DDD4]">
                <img src={room.image} alt={room.type} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#1A1412]">{room.type}</p>
                  <p className="text-xs text-[#8B7355]">{room.size} · Floor {room.floor}</p>
                  <p className="text-sm font-black text-[#C5612C]">KES {room.price.toLocaleString()}<span className="text-xs font-normal text-[#8B7355]">/mo</span></p>
                </div>
              </div>
            )}
            <Field label="Full Name"    name="name"   placeholder="e.g. Jane Wanjiku" />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Phone Number</label>
              <div className="flex">
                <span className="flex items-center gap-1.5 px-3 border border-r-0 border-[#E8DDD4] rounded-l-xl bg-[#FAF7F2] text-sm text-[#5C4A3A] flex-shrink-0">
                  🇰🇪 +254
                </span>
                <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="712 345 678"
                  className={`flex-1 px-3 py-3 border rounded-r-xl text-sm outline-none transition-all placeholder:text-[#8B7355] ${errors.phone ? "border-red-400 bg-red-50" : "border-[#E8DDD4] bg-[#FAF7F2] focus:border-[#C5612C]"}`} />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <Field label="Email Address" name="email"  type="email" placeholder="jane@example.com" />
            <Field label="Desired Move-in Date" name="moveIn" type="date" placeholder="" />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1412] mb-1.5">Notes <span className="text-[#8B7355] font-normal normal-case">(optional)</span></label>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3}
                placeholder="Any questions or special requirements…"
                className="w-full px-4 py-3 border border-[#E8DDD4] bg-[#FAF7F2] rounded-xl text-sm outline-none focus:border-[#C5612C] resize-none placeholder:text-[#8B7355]" />
            </div>
            <button onClick={handleSubmit}
              className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors flex items-center justify-center gap-2">
              <PhoneIcon /> Submit Rental Request
            </button>
            <p className="text-xs text-center text-[#8B7355]">The property manager will contact you within 24 hours.</p>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="px-6 pb-8 flex-1 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mt-2">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h4 className="font-display font-black text-[#1A1412] text-xl mb-2">Request Submitted!</h4>
            <p className="text-sm text-[#8B7355] mb-1">Your rental request for</p>
            <p className="font-semibold text-[#1A1412] mb-1">{room?.type} at {property.name}</p>
            <p className="text-sm text-[#8B7355] mb-6">has been sent to the property manager.<br/>Expect a response within <strong className="text-[#1A1412]">24 hours</strong>.</p>
            <div className="w-full bg-[#FAF7F2] rounded-2xl border border-[#E8DDD4] p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#8B7355]">Property</span><span className="font-medium text-[#1A1412]">{property.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8B7355]">Room type</span><span className="font-medium text-[#1A1412]">{room?.type}</span></div>
              <div className="flex justify-between"><span className="text-[#8B7355]">Move-in</span><span className="font-medium text-[#1A1412]">{form.moveIn || "TBD"}</span></div>
              <div className="flex justify-between"><span className="text-[#8B7355]">Monthly rent</span><span className="font-black text-[#C5612C]">KES {room?.price.toLocaleString()}</span></div>
            </div>
            <button onClick={onClose} className="w-full bg-[#1A1412] text-white rounded-full py-3.5 font-semibold text-sm">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const property = PROPERTIES[slug] || FALLBACK;

  const [activeImage, setActiveImage]   = useState(0);
  const [galleryOpen, setGalleryOpen]   = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [requestOpen, setRequestOpen]   = useState(false);
  const [saved, setSaved]               = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [activeTab, setActiveTab]       = useState("overview");

  const overviewRef  = useRef(null);
  const roomsRef     = useRef(null);
  const amenitiesRef = useRef(null);
  const reviewsRef   = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, [slug]);

  const scrollTo = (ref, tab) => {
    setActiveTab(tab);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openRequest = (room) => {
    setSelectedRoom(room);
    setRequestOpen(true);
  };

  const availableRooms = property.rooms.filter(r => r.available > 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .nav-link { position: relative; padding-bottom: 2px; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1.5px; background:#C5612C; transition:width 0.25s ease; }
        .nav-link:hover::after { width:100%; }
        .tab-btn { position: relative; transition: color 0.2s; }
        .tab-btn::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px; background:#C5612C; transform:scaleX(0); transition:transform 0.2s; }
        .tab-btn.active::after { transform:scaleX(1); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .s1{animation-delay:.05s;opacity:0}.s2{animation-delay:.10s;opacity:0}.s3{animation-delay:.15s;opacity:0}
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E8DDD4; border-radius: 2px; }
        .room-card { transition: all 0.25s cubic-bezier(.22,.68,0,1.2); }
        .room-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(0,0,0,0.10); }
        .gallery-thumb { transition: all 0.2s ease; }
        .gallery-thumb:hover { opacity: 0.85; transform: scale(1.02); }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* ── Image Gallery ── */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#8B7355] mb-3 mt-1">
            <button onClick={() => navigate("/")} className="hover:text-[#C5612C] transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => navigate("/browse")} className="hover:text-[#C5612C] transition-colors">Browse</button>
            <span>/</span>
            <span className="text-[#1A1412] font-medium truncate">{property.name}</span>
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] sm:h-[500px] rounded-3xl overflow-hidden">
            {/* Main large image */}
            <div className="col-span-4 sm:col-span-2 row-span-2 relative cursor-pointer group"
              onClick={() => { setActiveImage(0); setGalleryOpen(true); }}>
              <img src={property.images[0]} alt={property.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* 4 thumbnails (desktop only) */}
            {property.images.slice(1, 5).map((img, i) => (
              <div key={i} className="hidden sm:block relative cursor-pointer overflow-hidden group"
                onClick={() => { setActiveImage(i + 1); setGalleryOpen(true); }}>
                <img src={img} alt="" className="w-full h-full object-cover gallery-thumb" />
                {i === 3 && property.images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <p className="text-white font-display font-black text-2xl leading-none">+{property.images.length - 4}</p>
                    <p className="text-white/80 text-xs mt-0.5">more photos</p>
                  </div>
                )}
              </div>
            ))}

            {/* Mobile: show all photos button overlay */}
            <div className="sm:hidden absolute bottom-4 right-4">
              <button onClick={() => setGalleryOpen(true)}
                className="bg-white/90 backdrop-blur-sm text-[#1A1412] text-xs font-semibold px-3 py-2 rounded-full shadow">
                📷 All photos ({property.images.length})
              </button>
            </div>
          </div>

          {/* Show all photos button (desktop) */}
          <div className="hidden sm:flex justify-end mt-2">
            <button onClick={() => setGalleryOpen(true)}
              className="text-xs font-medium text-[#5C4A3A] border border-[#E8DDD4] rounded-full px-4 py-1.5 hover:border-[#C5612C] hover:text-[#C5612C] transition-colors">
              📷 Show all {property.images.length} photos
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left — Content */}
          <div className="flex-1 min-w-0">

            {/* Title block */}
            <div className="fade-up s1 mb-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {property.badge && (
                      <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full"
                        style={{ background: property.badgeColor }}>{property.badge}</span>
                    )}
                    {property.verified && (
                      <span className="flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldIcon /> Verified
                      </span>
                    )}
                    <span className="text-xs bg-[#FAF7F2] border border-[#E8DDD4] text-[#5C4A3A] px-2 py-0.5 rounded-full">{property.type}</span>
                  </div>
                  <h1 className="font-display font-black text-[#1A1412] text-3xl sm:text-4xl leading-tight">{property.name}</h1>
                  <p className="text-[#8B7355] mt-1 text-sm">{property.tagline}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[#8B7355] text-sm">
                    <LocationPin /><span>{property.fullAddress}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSaved(s => !s)}
                    className={`p-2.5 rounded-full border transition-all ${saved ? "bg-red-50 border-red-200 text-red-500" : "border-[#E8DDD4] text-[#8B7355] hover:border-[#C5612C] hover:text-[#C5612C]"}`}>
                    <svg className={`w-4 h-4 ${saved ? "fill-red-400 stroke-red-400" : "fill-none stroke-current"}`} viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                  <button className="p-2.5 rounded-full border border-[#E8DDD4] text-[#8B7355] hover:border-[#C5612C] hover:text-[#C5612C] transition-all">
                    <ShareIcon />
                  </button>
                </div>
              </div>

              {/* Rating summary */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <StarRow rating={property.rating} />
                  <span className="font-bold text-[#1A1412]">{property.rating}</span>
                  <span className="text-sm text-[#8B7355]">({property.reviews} reviews)</span>
                </div>
                <div className="w-px h-4 bg-[#E8DDD4]" />
                <p className="text-sm text-[#8B7355]">Managed by <span className="font-medium text-[#1A1412]">{property.managedBy}</span></p>
                <div className="w-px h-4 bg-[#E8DDD4]" />
                <p className="text-sm text-emerald-600 font-medium">
                  {availableRooms.length > 0 ? `${availableRooms.reduce((a,r)=>a+r.available,0)} beds available now` : "All units currently full"}
                </p>
              </div>
            </div>

            {/* ── Sticky Tab Nav ── */}
            <div className="sticky top-16 z-30 bg-[#FAF7F2] border-b border-[#E8DDD4] -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
              <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                {[["overview","Overview"],["rooms","Rooms"],["amenities","Amenities"],["reviews","Reviews"]].map(([id,label])=>(
                  <button key={id}
                    onClick={() => scrollTo({overview:overviewRef,rooms:roomsRef,amenities:amenitiesRef,reviews:reviewsRef}[id], id)}
                    className={`tab-btn text-sm font-medium py-3.5 whitespace-nowrap flex-shrink-0 border-b-0 ${activeTab===id ? "active text-[#C5612C]" : "text-[#8B7355] hover:text-[#1A1412]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Overview ── */}
            <section ref={overviewRef} className="mb-8 scroll-mt-28 fade-up s2">
              <h2 className="font-display font-bold text-[#1A1412] text-2xl mb-3">About this property</h2>
              <p className="text-[#5C4A3A] leading-relaxed text-base">{property.description}</p>

              {/* Nearby */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {property.nearbyPlaces.map(n => (
                  <div key={n.name} className="bg-white rounded-2xl border border-[#E8DDD4] p-3.5 text-center">
                    <p className="text-xs text-[#8B7355] mb-1">{n.type}</p>
                    <p className="text-sm font-semibold text-[#1A1412] leading-snug">{n.name}</p>
                    <p className="text-xs text-[#C5612C] font-semibold mt-0.5">{n.distance}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Rooms ── */}
            <section ref={roomsRef} className="mb-8 scroll-mt-28">
              <h2 className="font-display font-bold text-[#1A1412] text-2xl mb-4">Available Rooms</h2>
              <div className="space-y-4">
                {property.rooms.map(room => (
                  <div key={room.id}
                    className={`room-card bg-white rounded-2xl border overflow-hidden flex flex-col sm:flex-row ${
                      selectedRoom?.id === room.id ? "border-[#C5612C] shadow-lg" : "border-[#E8DDD4]"
                    } ${room.available === 0 ? "opacity-60" : ""}`}>
                    <div className="sm:w-44 h-40 sm:h-auto relative flex-shrink-0 overflow-hidden">
                      <img src={room.image} alt={room.type} className="w-full h-full object-cover" />
                      {room.available === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-white text-[#1A1412] text-xs font-bold px-2.5 py-1 rounded-full">Fully Occupied</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display font-bold text-[#1A1412] text-lg">{room.type}</h3>
                            <p className="text-xs text-[#8B7355] mt-0.5">{room.size} · Floor {room.floor}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-display font-black text-[#C5612C] text-xl leading-none">KES {room.price.toLocaleString()}</p>
                            <p className="text-xs text-[#8B7355]">/month</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {room.features.map(f => (
                            <span key={f} className="text-xs bg-[#FAF7F2] border border-[#E8DDD4] text-[#5C4A3A] px-2.5 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F5EDE0]">
                        <p className={`text-xs font-semibold ${room.available > 0 ? "text-emerald-600" : "text-[#8B7355]"}`}>
                          {room.available > 0 ? `${room.available} bed${room.available !== 1 ? "s" : ""} available` : "No availability"}
                        </p>
                        <button
                          disabled={room.available === 0}
                          onClick={() => openRequest(room)}
                          className={`text-sm font-semibold px-5 py-2 rounded-full transition-all ${
                            room.available > 0
                              ? selectedRoom?.id === room.id
                                ? "bg-[#C5612C] text-white shadow-md"
                                : "bg-[#C5612C] text-white hover:bg-[#A84E22]"
                              : "bg-[#F5EDE0] text-[#8B7355] cursor-not-allowed"
                          }`}>
                          {room.available > 0 ? "Request this room" : "Not available"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Amenities ── */}
            <section ref={amenitiesRef} className="mb-8 scroll-mt-28">
              <h2 className="font-display font-bold text-[#1A1412] text-2xl mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {property.amenities.map(a => (
                  <div key={a.label} className="bg-white border border-[#E8DDD4] rounded-2xl p-3.5 flex items-center gap-2.5">
                    <span className="text-xl flex-shrink-0">{a.icon}</span>
                    <span className="text-sm font-medium text-[#1A1412] leading-snug">{a.label}</span>
                  </div>
                ))}
              </div>

              {/* House Rules */}
              <div className="bg-[#FAF7F2] border border-[#E8DDD4] rounded-2xl p-5">
                <h3 className="font-display font-bold text-[#1A1412] text-base mb-3">House Rules</h3>
                <ul className="space-y-2">
                  {property.rules.map(r => (
                    <li key={r} className="flex items-start gap-2.5 text-sm text-[#5C4A3A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5612C] flex-shrink-0 mt-1.5" />{r}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── Reviews ── */}
            <section ref={reviewsRef} className="mb-8 scroll-mt-28">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[#1A1412] text-2xl">Reviews</h2>
                <div className="flex items-center gap-2">
                  <StarRow rating={property.rating} />
                  <span className="font-bold text-[#1A1412]">{property.rating}</span>
                  <span className="text-sm text-[#8B7355]">· {property.reviews} reviews</span>
                </div>
              </div>
              <div className="space-y-4">
                {property.reviews_list.map(r => (
                  <div key={r.name} className="bg-white rounded-2xl border border-[#E8DDD4] p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#C5612C]/15 text-[#C5612C] font-bold text-sm flex items-center justify-center flex-shrink-0">{r.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1A1412] text-sm">{r.name}</p>
                          <span className="text-xs text-[#8B7355] flex-shrink-0">{r.date}</span>
                        </div>
                        <StarRow rating={r.rating} />
                      </div>
                    </div>
                    <p className="text-sm text-[#5C4A3A] leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 border border-dashed border-[#E8DDD4] rounded-2xl py-3.5 text-sm text-[#8B7355] hover:border-[#C5612C] hover:text-[#C5612C] transition-colors font-medium">
                View all {property.reviews} reviews
              </button>
            </section>
          </div>

          {/* ── Right — Sticky Booking Card ── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 shadow-sm">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display font-black text-[#C5612C] text-3xl">
                    KES {Math.min(...property.rooms.map(r=>r.price)).toLocaleString()}
                  </span>
                  <span className="text-sm text-[#8B7355]">/ month</span>
                </div>
                <p className="text-xs text-[#8B7355] mb-4">Starting price · rates vary by room type</p>

                <div className="flex items-center gap-2 mb-4">
                  <StarRow rating={property.rating} />
                  <span className="text-sm font-semibold text-[#1A1412]">{property.rating}</span>
                  <span className="text-xs text-[#8B7355]">({property.reviews})</span>
                </div>

                {availableRooms.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-4">
                      {property.rooms.map(r => (
                        <button key={r.id}
                          onClick={() => r.available > 0 ? openRequest(r) : null}
                          disabled={r.available === 0}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            r.available > 0
                              ? "border-[#E8DDD4] hover:border-[#C5612C] hover:bg-[#FFF5EF] cursor-pointer"
                              : "border-[#F5EDE0] opacity-50 cursor-not-allowed"
                          }`}>
                          <div>
                            <p className="text-xs font-semibold text-[#1A1412]">{r.type}</p>
                            <p className="text-xs text-[#8B7355]">{r.available > 0 ? `${r.available} available` : "Full"}</p>
                          </div>
                          <p className="font-bold text-[#C5612C] text-sm">KES {r.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => openRequest(availableRooms[0])}
                      className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors text-sm shadow-md">
                      Request to Move In
                    </button>
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center mb-4">
                    <p className="text-xs font-semibold text-amber-700">All units currently full</p>
                    <p className="text-xs text-amber-600 mt-0.5">Join the waitlist to be notified</p>
                  </div>
                )}

                <p className="text-xs text-center text-[#8B7355] mt-3">No booking fees · Manager responds within 24h</p>
              </div>

              {/* Manager contact */}
              <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1412] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {property.managedBy.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1412] leading-none">{property.managedBy}</p>
                    <p className="text-xs text-[#8B7355] mt-0.5">Property Manager</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DDD4] flex items-center justify-center text-[#8B7355] hover:border-[#C5612C] hover:text-[#C5612C] transition-colors">
                      <PhoneIcon />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick facts */}
              <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 space-y-2.5">
                {[
                  { label: "Property type", value: property.type },
                  { label: "Total rooms",   value: property.rooms.reduce((a,r)=>a+r.beds,0) + " beds" },
                  { label: "Location",      value: property.location },
                ].map(f => (
                  <div key={f.label} className="flex justify-between text-sm">
                    <span className="text-[#8B7355]">{f.label}</span>
                    <span className="font-medium text-[#1A1412]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox Gallery ── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D0B0A] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <p className="text-white/60 text-sm">{activeImage + 1} / {property.images.length}</p>
            <button onClick={() => setGalleryOpen(false)} className="text-white/60 hover:text-white p-2 transition-colors">
              <XIcon />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center px-4 relative min-h-0">
            <button onClick={() => setActiveImage(i => Math.max(0, i-1))}
              disabled={activeImage === 0}
              className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30">
              <ChevLeft />
            </button>
            <img
              key={activeImage}
              src={property.images[activeImage]}
              alt={`Gallery ${activeImage + 1}`}
              className="max-h-full max-w-full rounded-2xl object-contain"
              style={{ animation: "fadeUp 0.3s ease forwards" }}
            />
            <button onClick={() => setActiveImage(i => Math.min(property.images.length - 1, i+1))}
              disabled={activeImage === property.images.length - 1}
              className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30">
              <ChevRight />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 px-6 py-4 overflow-x-auto flex-shrink-0">
            {property.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? "border-[#C5612C] opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Request Modal ── */}
      {requestOpen && (
        <RequestModal property={property} room={selectedRoom} onClose={() => setRequestOpen(false)} />
      )}

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-[#E8DDD4] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C5612C] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
            </div>
            <span className="font-display font-bold text-[#1A1412] text-base">fab<span className="text-[#C5612C]">rentals</span></span>
          </div>
          <p className="text-xs text-[#8B7355]">© {new Date().getFullYear()} fabrentals · Built for Kenya</p>
          <div className="flex gap-5">
            {["Privacy","Terms","Contact"].map(l=>(
              <a key={l} href="#" className="text-xs text-[#8B7355] hover:text-[#C5612C] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
