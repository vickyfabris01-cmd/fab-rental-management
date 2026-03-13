import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ── Data ──────────────────────────────────────────────────────────────────────
const PROPERTIES = [
  {
    id: 1,
    slug: "sunrise-hostel",
    name: "Sunrise Hostel",
    location: "Westlands, Nairobi",
    type: "Hostel",
    beds: 48,
    available: 6,
    from: 8500,
    rating: 4.8,
    reviews: 124,
    amenities: ["WiFi", "Water", "Security", "Laundry", "Common Room"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    badge: "Popular",
    badgeColor: "#C5612C",
    verified: true,
    features: ["24/7 Security", "Furnished Rooms"],
    lat: -1.2676, lng: 36.8108,
  },
  {
    id: 2,
    slug: "greenfield-apartments",
    name: "Greenfield Apartments",
    location: "Kilimani, Nairobi",
    type: "Apartment",
    beds: 30,
    available: 12,
    from: 22000,
    rating: 4.6,
    reviews: 87,
    amenities: ["Parking", "Gym", "WiFi", "CCTV", "Backup Power"],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    badge: "New",
    badgeColor: "#2C6EC5",
    verified: true,
    features: ["Modern Finishes", "Secure Parking"],
    lat: -1.2895, lng: 36.7915,
  },
  {
    id: 3,
    slug: "maisha-student-lodge",
    name: "Maisha Student Lodge",
    location: "Kahawa, Nairobi",
    type: "Student Residence",
    beds: 80,
    available: 20,
    from: 5500,
    rating: 4.5,
    reviews: 213,
    amenities: ["WiFi", "Study Room", "Meals", "Security", "Laundry"],
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
    badge: "Student",
    badgeColor: "#10B981",
    verified: true,
    features: ["Near University", "Meals Included"],
    lat: -1.1797, lng: 36.9296,
  },
  {
    id: 4,
    slug: "farmview-workers-estate",
    name: "Farmview Workers Estate",
    location: "Limuru, Kiambu",
    type: "Farm Housing",
    beds: 36,
    available: 8,
    from: 3500,
    rating: 4.3,
    reviews: 56,
    amenities: ["Water", "Electricity", "Security", "Canteen", "Transport"],
    image: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80",
    badge: null,
    badgeColor: null,
    verified: false,
    features: ["Company Transport", "Subsidised Meals"],
    lat: -1.1067, lng: 36.6540,
  },
  {
    id: 5,
    slug: "bluepeak-residences",
    name: "BluePeak Residences",
    location: "Lavington, Nairobi",
    type: "Apartment",
    beds: 24,
    available: 4,
    from: 35000,
    rating: 4.9,
    reviews: 61,
    amenities: ["Rooftop", "Gym", "Concierge", "Parking", "Pool"],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    badge: "Premium",
    badgeColor: "#7C3AED",
    verified: true,
    features: ["Rooftop Terrace", "Concierge Service"],
    lat: -1.2736, lng: 36.7739,
  },
  {
    id: 6,
    slug: "kasarani-youth-hostel",
    name: "Kasarani Youth Hostel",
    location: "Kasarani, Nairobi",
    type: "Hostel",
    beds: 60,
    available: 18,
    from: 4500,
    rating: 4.2,
    reviews: 98,
    amenities: ["WiFi", "Water", "Common Room", "Security"],
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    badge: null,
    badgeColor: null,
    verified: true,
    features: ["Near SGR Station", "Budget Friendly"],
    lat: -1.2192, lng: 36.8966,
  },
  {
    id: 7,
    slug: "oak-court-suites",
    name: "Oak Court Suites",
    location: "Upperhill, Nairobi",
    type: "Apartment",
    beds: 18,
    available: 3,
    from: 45000,
    rating: 4.7,
    reviews: 42,
    amenities: ["Gym", "Pool", "WiFi", "Concierge", "Backup Power"],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    badge: "Premium",
    badgeColor: "#7C3AED",
    verified: true,
    features: ["Business District", "Serviced Apartments"],
    lat: -1.2980, lng: 36.8168,
  },
  {
    id: 8,
    slug: "valley-view-hostels",
    name: "Valley View Hostels",
    location: "Ruaka, Kiambu",
    type: "Hostel",
    beds: 55,
    available: 14,
    from: 6000,
    rating: 4.4,
    reviews: 77,
    amenities: ["WiFi", "Water", "Security", "Kitchen"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    badge: null,
    badgeColor: null,
    verified: false,
    features: ["Quiet Area", "Self-Catering"],
    lat: -1.2008, lng: 36.7592,
  },
  {
    id: 9,
    slug: "riverside-student-lodge",
    name: "Riverside Student Lodge",
    location: "Ngara, Nairobi",
    type: "Student Residence",
    beds: 100,
    available: 25,
    from: 5000,
    rating: 4.3,
    reviews: 189,
    amenities: ["WiFi", "Study Room", "Security", "Laundry"],
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    badge: "Student",
    badgeColor: "#10B981",
    verified: true,
    features: ["City Centre", "Affordable Rates"],
    lat: -1.2750, lng: 36.8316,
  },
];

const TYPES = ["All", "Hostel", "Apartment", "Student Residence", "Farm Housing"];
const AMENITIES_LIST = ["WiFi", "Parking", "Gym", "Security", "Laundry", "Meals", "Pool", "Study Room", "Backup Power"];
const SORT_OPTIONS = [
  { value: "popular",  label: "Most Popular" },
  { value: "price_asc",label: "Price: Low to High" },
  { value: "price_desc",label:"Price: High to Low" },
  { value: "rating",   label: "Highest Rated" },
  { value: "available",label: "Most Available" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, s = 18, c = "" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d={d} />
  </svg>
);
const SearchIcon  = () => <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />;
const FilterIcon  = () => <Ic d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const MapIcon     = () => <Ic d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
const GridIcon    = () => <Ic d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />;
const ListIcon    = () => <Ic d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
const StarIcon    = ({ filled }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const XIcon       = () => <Ic d="M18 6L6 18M6 6l12 12" s={16} />;
const ChevDown    = () => <Ic d="M6 9l6 6 6-6" s={16} />;
const CheckIcon   = () => <Ic d="M5 13l4 4L19 7" s={14} />;
const LocationPin = () => <Ic d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" s={14} />;
const BedIcon     = () => <Ic d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4M2 9h20M2 9v10a1 1 0 001 1h18a1 1 0 001-1V9M7 14h.01M12 14h.01M17 14h.01" s={14} />;
const ShieldIcon  = () => <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" s={13} />;
const MenuIcon    = () => <Ic d="M4 6h16M4 12h16M4 18h16" />;
const HomeIcon    = () => <Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" s={20}/>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(rating)} />)}
  </div>
);

// ── Navbar (matches PublicPage) ───────────────────────────────────────────────
function Navbar({ scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/95 backdrop-blur-md shadow-sm"}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-[#1A1412]">
            fab<span className="text-[#C5612C]">rentals</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {[["Browse", "/browse"], ["How it works", "/#how"], ["For Landlords", "/#landlords"]].map(([l, h]) => (
            <a key={l} href={h} className="nav-link text-sm font-medium text-[#5C4A3A] hover:text-[#1A1412] transition-colors">{l}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="text-sm font-medium text-[#5C4A3A] hover:text-[#1A1412] px-4 py-2">Sign in</button>
          <button onClick={() => navigate("/signup")} className="bg-[#C5612C] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#A84E22] transition-colors shadow-sm">
            Get started
          </button>
        </div>

        <button className="md:hidden text-[#1A1412] p-1" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E8DDD4] px-6 py-4 space-y-3">
          {[["Browse", "/browse"],["How it works","/#how"],["For Landlords","/#landlords"]].map(([l,h])=>(
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

// ── Price Range Slider ────────────────────────────────────────────────────────
function PriceSlider({ min, max, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#8B7355] mb-2">
        <span>KES {value[0].toLocaleString()}</span>
        <span>KES {value[1].toLocaleString()}</span>
      </div>
      <div className="relative h-2 bg-[#E8DDD4] rounded-full">
        <div className="absolute h-full bg-[#C5612C] rounded-full"
          style={{ left: `${((value[0]-min)/(max-min))*100}%`, right: `${100-((value[1]-min)/(max-min))*100}%` }} />
        {[0,1].map(i => (
          <input key={i} type="range" min={min} max={max} step={500}
            value={value[i]}
            onChange={e => {
              const v = Number(e.target.value);
              const next = [...value];
              next[i] = v;
              if (i===0 && v <= next[1]) onChange(next);
              if (i===1 && v >= next[0]) onChange(next);
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer appearance-none"
            style={{ zIndex: i === 1 ? 3 : 2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Property Card (Grid) ──────────────────────────────────────────────────────
function PropertyCardGrid({ p, onClick }) {
  return (
    <div onClick={onClick} className="card-hover bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] cursor-pointer group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {p.badge && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: p.badgeColor }}>{p.badge}</span>
        )}
        {p.verified && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full">
            <ShieldIcon /> Verified
          </span>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="bg-[#1A1412]/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {p.type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-[#1A1412] text-lg leading-snug">{p.name}</h3>
        </div>
        <div className="flex items-center gap-1 text-[#8B7355] text-xs mb-3">
          <LocationPin />
          <span>{p.location}</span>
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.amenities.slice(0, 4).map(a => (
            <span key={a} className="text-xs bg-[#FAF7F2] border border-[#E8DDD4] text-[#5C4A3A] px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {p.amenities.length > 4 && (
            <span className="text-xs bg-[#FAF7F2] border border-[#E8DDD4] text-[#8B7355] px-2 py-0.5 rounded-full">+{p.amenities.length - 4}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#F5EDE0]">
          <div>
            <div className="flex items-center gap-1.5">
              <StarRow rating={p.rating} />
              <span className="text-xs font-semibold text-[#1A1412]">{p.rating}</span>
              <span className="text-xs text-[#8B7355]">({p.reviews})</span>
            </div>
            <p className="text-xs text-[#8B7355] mt-0.5 flex items-center gap-1">
              <BedIcon /> {p.available} beds available
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8B7355]">From</p>
            <p className="font-display font-black text-[#C5612C] text-lg leading-none">
              KES {p.from.toLocaleString()}
            </p>
            <p className="text-xs text-[#8B7355]">/month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property Card (List) ──────────────────────────────────────────────────────
function PropertyCardList({ p, onClick }) {
  return (
    <div onClick={onClick} className="card-hover bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] cursor-pointer flex flex-col sm:flex-row group">
      <div className="relative w-full sm:w-56 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
        <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {p.badge && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: p.badgeColor }}>{p.badge}</span>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-[#1A1412] text-lg">{p.name}</h3>
              <div className="flex items-center gap-1 text-[#8B7355] text-xs mt-0.5">
                <LocationPin /><span>{p.location}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display font-black text-[#C5612C] text-xl">KES {p.from.toLocaleString()}</p>
              <p className="text-xs text-[#8B7355]">/month</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {p.amenities.slice(0,5).map(a=>(
              <span key={a} className="text-xs bg-[#FAF7F2] border border-[#E8DDD4] text-[#5C4A3A] px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {p.features.map(f=>(
              <span key={f} className="text-xs text-[#C5612C] font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#C5612C]" />{f}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5EDE0]">
          <div className="flex items-center gap-2">
            <StarRow rating={p.rating} />
            <span className="text-xs font-semibold text-[#1A1412]">{p.rating}</span>
            <span className="text-xs text-[#8B7355]">({p.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-3">
            {p.verified && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <ShieldIcon /> Verified
              </span>
            )}
            <span className="text-xs text-[#8B7355] flex items-center gap-1">
              <BedIcon /> {p.available} available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]           = useState(searchParams.get("q") || "");
  const [activeType, setActiveType]   = useState(searchParams.get("type") || "All");
  const [sortBy, setSortBy]           = useState("popular");
  const [viewMode, setViewMode]       = useState("grid"); // "grid" | "list"
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange]   = useState([0, 50000]);
  const [minAvailable, setMinAvailable] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Sync search to URL
  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (activeType !== "All") params.type = activeType;
    setSearchParams(params, { replace: true });
  }, [search, activeType]);

  const toggleAmenity = (a) =>
    setSelectedAmenities(s => s.includes(a) ? s.filter(x => x !== a) : [...s, a]);

  // Filter
  let results = PROPERTIES.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q) && !p.type.toLowerCase().includes(q)) return false;
    if (activeType !== "All" && p.type !== activeType) return false;
    if (p.from < priceRange[0] || p.from > priceRange[1]) return false;
    if (p.available < minAvailable) return false;
    if (selectedAmenities.length && !selectedAmenities.every(a => p.amenities.includes(a))) return false;
    if (verifiedOnly && !p.verified) return false;
    return true;
  });

  // Sort
  results = [...results].sort((a, b) => {
    if (sortBy === "price_asc")  return a.from - b.from;
    if (sortBy === "price_desc") return b.from - a.from;
    if (sortBy === "rating")     return b.rating - a.rating;
    if (sortBy === "available")  return b.available - a.available;
    return b.reviews - a.reviews; // popular
  });

  const activeFiltersCount =
    (activeType !== "All" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0) +
    selectedAmenities.length +
    (verifiedOnly ? 1 : 0) +
    (minAvailable > 0 ? 1 : 0);

  const clearFilters = () => {
    setActiveType("All");
    setPriceRange([0, 50000]);
    setSelectedAmenities([]);
    setVerifiedOnly(false);
    setMinAvailable(0);
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .card-hover { transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.10); }
        .nav-link { position: relative; padding-bottom: 2px; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1.5px; background:#C5612C; transition:width 0.25s ease; }
        .nav-link:hover::after { width: 100%; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E8DDD4; border-radius: 2px; }
        input[type="range"] { -webkit-appearance: none; appearance: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #C5612C; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer; }
        @keyframes slideIn { from { opacity:0; transform: translateX(-12px); } to { opacity:1; transform: translateX(0); } }
        .slide-in { animation: slideIn 0.3s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .filter-panel { transition: all 0.3s cubic-bezier(.22,.68,0,1.2); }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* ── Search Hero Bar ── */}
      <div className="pt-20 bg-white border-b border-[#E8DDD4]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#8B7355] mb-4">
            <button onClick={() => navigate("/")} className="hover:text-[#C5612C] transition-colors flex items-center gap-1">
              <HomeIcon /> Home
            </button>
            <span>/</span>
            <span className="text-[#1A1412] font-medium">Browse Properties</span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search input */}
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]"><SearchIcon /></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, location or type…"
                className="w-full pl-11 pr-4 py-3.5 bg-[#FAF7F2] border border-[#E8DDD4] rounded-2xl text-sm outline-none focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C]/10 transition-all placeholder:text-[#8B7355]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#1A1412]">
                  <XIcon />
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(t => (
                <button key={t} onClick={() => setActiveType(t)}
                  className={`text-sm font-medium px-4 py-3 rounded-2xl border transition-all whitespace-nowrap ${
                    activeType === t
                      ? "bg-[#C5612C] text-white border-[#C5612C] shadow-sm"
                      : "bg-[#FAF7F2] text-[#5C4A3A] border-[#E8DDD4] hover:border-[#C5612C]/50"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">

        {/* ── Filter Sidebar (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 space-y-5 self-start sticky top-28">
          <div className="bg-white rounded-2xl border border-[#E8DDD4] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-[#1A1412] text-base">Filters</h3>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-[#C5612C] font-medium hover:underline">
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Price range */}
            <div className="mb-5 pb-5 border-b border-[#F5EDE0]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">Price Range (KES/mo)</p>
              <PriceSlider min={0} max={50000} value={priceRange} onChange={setPriceRange} />
            </div>

            {/* Min availability */}
            <div className="mb-5 pb-5 border-b border-[#F5EDE0]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">Minimum Available Beds</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 5, 10].map(n => (
                  <button key={n} onClick={() => setMinAvailable(n)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      minAvailable === n ? "bg-[#C5612C] text-white border-[#C5612C]" : "border-[#E8DDD4] text-[#5C4A3A] hover:border-[#C5612C]/40"
                    }`}>
                    {n === 0 ? "Any" : `${n}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-5 pb-5 border-b border-[#F5EDE0]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">Amenities</p>
              <div className="space-y-2">
                {AMENITIES_LIST.map(a => (
                  <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                    <div onClick={() => toggleAmenity(a)}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedAmenities.includes(a)
                          ? "bg-[#C5612C] border-[#C5612C]"
                          : "border-[#E8DDD4] group-hover:border-[#C5612C]/50"
                      }`}>
                      {selectedAmenities.includes(a) && <CheckIcon />}
                    </div>
                    <span className="text-sm text-[#5C4A3A] group-hover:text-[#1A1412] transition-colors">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified only */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div onClick={() => setVerifiedOnly(v => !v)}
                className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                  verifiedOnly ? "bg-[#C5612C] border-[#C5612C]" : "border-[#E8DDD4] group-hover:border-[#C5612C]/50"
                }`}>
                {verifiedOnly && <CheckIcon />}
              </div>
              <span className="text-sm text-[#5C4A3A]">Verified properties only</span>
            </label>
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-[#8B7355]">
                <span className="font-bold text-[#1A1412] text-base">{results.length}</span> {results.length === 1 ? "property" : "properties"} found
              </p>
              {activeFiltersCount > 0 && (
                <span className="text-xs bg-[#C5612C]/10 text-[#C5612C] font-semibold px-2 py-0.5 rounded-full border border-[#C5612C]/20">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="appearance-none text-sm border border-[#E8DDD4] rounded-xl px-3 py-2 pr-7 bg-white text-[#5C4A3A] outline-none focus:border-[#C5612C] cursor-pointer">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8B7355]"><ChevDown /></span>
              </div>

              {/* Mobile filter button */}
              <button onClick={() => setFiltersOpen(o => !o)}
                className="lg:hidden flex items-center gap-1.5 border border-[#E8DDD4] rounded-xl px-3 py-2 text-sm text-[#5C4A3A] hover:border-[#C5612C] transition-colors">
                <FilterIcon />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-[#C5612C] text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>
                )}
              </button>

              {/* View toggle */}
              <div className="flex border border-[#E8DDD4] rounded-xl overflow-hidden">
                <button onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#1A1412] text-white" : "bg-white text-[#8B7355] hover:text-[#1A1412]"}`}>
                  <GridIcon />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#1A1412] text-white" : "bg-white text-[#8B7355] hover:text-[#1A1412]"}`}>
                  <ListIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {filtersOpen && (
            <div className="lg:hidden bg-white rounded-2xl border border-[#E8DDD4] p-5 mb-5 slide-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-[#1A1412]">Filters</h3>
                <div className="flex gap-3">
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-[#C5612C] font-medium">Clear all</button>
                  )}
                  <button onClick={() => setFiltersOpen(false)} className="text-[#8B7355]"><XIcon /></button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-3">Price Range (KES/mo)</p>
                  <PriceSlider min={0} max={50000} value={priceRange} onChange={setPriceRange} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(a => (
                      <button key={a} onClick={() => toggleAmenity(a)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                          selectedAmenities.includes(a) ? "bg-[#C5612C] text-white border-[#C5612C]" : "border-[#E8DDD4] text-[#5C4A3A]"
                        }`}>{a}</button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setVerifiedOnly(v => !v)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${verifiedOnly ? "bg-[#C5612C] border-[#C5612C]" : "border-[#E8DDD4]"}`}>
                    {verifiedOnly && <CheckIcon />}
                  </div>
                  <span className="text-sm text-[#5C4A3A]">Verified properties only</span>
                </label>
                <button onClick={() => setFiltersOpen(false)} className="w-full bg-[#C5612C] text-white rounded-full py-3 text-sm font-semibold">
                  Show {results.length} results
                </button>
              </div>
            </div>
          )}

          {/* Results grid / list */}
          {results.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-[#F5EDE0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#C5612C]">
                <SearchIcon />
              </div>
              <h3 className="font-display font-bold text-[#1A1412] text-xl mb-2">No properties found</h3>
              <p className="text-[#8B7355] text-sm mb-5">Try adjusting your search or clearing some filters.</p>
              <button onClick={clearFilters} className="bg-[#C5612C] text-white rounded-full px-6 py-2.5 text-sm font-semibold">
                Clear filters
              </button>
            </div>
          ) : (
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              : "flex flex-col gap-4"
            }>
              {results.map((p, i) => (
                <div key={p.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                  {viewMode === "grid"
                    ? <PropertyCardGrid p={p} onClick={() => navigate(`/property/${p.slug}`)} />
                    : <PropertyCardList p={p} onClick={() => navigate(`/property/${p.slug}`)} />
                  }
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {results.length > 0 && (
            <div className="text-center mt-10">
              <p className="text-sm text-[#8B7355] mb-3">Showing {results.length} of {PROPERTIES.length} properties</p>
              <button className="border border-[#E8DDD4] hover:border-[#C5612C] text-[#5C4A3A] hover:text-[#C5612C] font-medium text-sm px-8 py-3 rounded-full transition-all">
                Load more properties
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-[#E8DDD4] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C5612C] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
            </div>
            <span className="font-display font-bold text-[#1A1412] text-base">fab<span className="text-[#C5612C]">rentals</span></span>
          </div>
          <p className="text-xs text-[#8B7355]">© {new Date().getFullYear()} fabrentals · Built for Kenya</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" className="text-xs text-[#8B7355] hover:text-[#C5612C] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
