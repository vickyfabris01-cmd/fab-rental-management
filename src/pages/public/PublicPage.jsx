import { useState, useEffect, useRef } from "react";

// ── Fake data ────────────────────────────────────────────────────────────────
const PROPERTIES = [
  {
    id: 1,
    name: "Sunrise Hostel",
    location: "Westlands, Nairobi",
    type: "Hostel",
    rooms: 24,
    available: 6,
    from: 8500,
    rating: 4.8,
    amenities: ["WiFi", "Water", "Security", "Laundry"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80",
    badge: "Popular",
  },
  {
    id: 2,
    name: "Greenfield Apartments",
    location: "Kilimani, Nairobi",
    type: "Apartment",
    rooms: 48,
    available: 12,
    from: 22000,
    rating: 4.6,
    amenities: ["Parking", "Gym", "WiFi", "CCTV"],
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    badge: "New",
  },
  {
    id: 3,
    name: "Maisha Student Lodge",
    location: "Kahawa, Nairobi",
    type: "Student Residence",
    rooms: 80,
    available: 20,
    from: 5500,
    rating: 4.5,
    amenities: ["WiFi", "Study Room", "Meals", "Security"],
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80",
    badge: "Student",
  },
  {
    id: 4,
    name: "Farmview Workers Estate",
    location: "Limuru, Kiambu",
    type: "Farm Housing",
    rooms: 36,
    available: 8,
    from: 3500,
    rating: 4.3,
    amenities: ["Water", "Electricity", "Security", "Canteen"],
    image: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=80",
    badge: null,
  },
  {
    id: 5,
    name: "BluePeak Residences",
    location: "Lavington, Nairobi",
    type: "Apartment",
    rooms: 30,
    available: 4,
    from: 35000,
    rating: 4.9,
    amenities: ["Rooftop", "Gym", "Concierge", "Parking"],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    badge: "Premium",
  },
  {
    id: 6,
    name: "Kasarani Youth Hostel",
    location: "Kasarani, Nairobi",
    type: "Hostel",
    rooms: 60,
    available: 18,
    from: 4500,
    rating: 4.2,
    amenities: ["WiFi", "Water", "Common Room", "Security"],
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    badge: null,
  },
];

const STATS = [
  { value: "120+", label: "Properties Listed" },
  { value: "4,800+", label: "Happy Residents" },
  { value: "98%", label: "Payment On Time" },
  { value: "34", label: "Cities Covered" },
];

const TYPES = ["All", "Hostel", "Apartment", "Student Residence", "Farm Housing"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const Star = () => (
  <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function PublicPage() {
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = PROPERTIES.filter((p) => {
    const matchType = activeType === "All" || p.type === activeType;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans">
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #FAF7F2; }
        .font-display { font-family: 'Playfair Display', serif; }

        .card-hover {
          transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12);
        }

        .nav-link {
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1.5px;
          background: #C5612C;
          transition: width 0.25s ease;
        }
        .nav-link:hover::after { width: 100%; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.25s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.4s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.55s; opacity: 0; }

        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        .float-dot { animation: floatDot 4s ease-in-out infinite; }

        .badge-popular  { background: #C5612C; color: #fff; }
        .badge-new      { background: #2C6EC5; color: #fff; }
        .badge-student  { background: #2CC578; color: #fff; }
        .badge-premium  { background: #8B2CC5; color: #fff; }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-[#1A1412]">
              fab<span className="text-[#C5612C]">rentals</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Properties", "How It Works", "For Managers", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className={`nav-link text-sm font-medium ${
                  scrolled ? "text-[#1A1412]" : "text-[#1A1412]"
                } hover:text-[#C5612C] transition-colors`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium text-[#1A1412] hover:text-[#C5612C] transition-colors px-4 py-2"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="text-sm font-semibold bg-[#C5612C] text-white px-5 py-2.5 rounded-full hover:bg-[#A84E22] transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-[#1A1412]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 flex flex-col gap-4">
            {["Properties", "How It Works", "For Managers", "Pricing"].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-[#1A1412]">{item}</a>
            ))}
            <hr className="border-stone-200" />
            <a href="/login" className="text-sm font-medium text-[#1A1412]">Sign in</a>
            <a href="/signup" className="text-sm font-semibold bg-[#C5612C] text-white px-5 py-2.5 rounded-full text-center">
              Get Started
            </a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
        style={{ background: "linear-gradient(135deg, #FAF7F2 0%, #F5EDE0 60%, #EDD9C0 100%)" }}
      >
        {/* Background geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #C5612C 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #8B4513 0%, transparent 70%)" }}
          />
          {/* Grid dots pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#1A1412" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          {/* Floating accents */}
          <div className="float-dot absolute top-32 right-[20%] w-3 h-3 rounded-full bg-[#C5612C] opacity-50" />
          <div className="float-dot absolute top-64 right-[35%] w-2 h-2 rounded-full bg-[#C5612C] opacity-30" style={{ animationDelay: "1.5s" }} />
          <div className="float-dot absolute bottom-40 left-[15%] w-4 h-4 rounded-full bg-[#8B4513] opacity-20" style={{ animationDelay: "0.8s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="fade-up fade-up-1 inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-[#C5612C]/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C5612C] animate-pulse" />
              <span className="text-xs font-semibold text-[#C5612C] uppercase tracking-widest">Now Live in Kenya</span>
            </div>

            <h1 className="fade-up fade-up-2 font-display text-5xl lg:text-7xl font-black text-[#1A1412] leading-[1.05] mb-6">
              Find Your
              <br />
              <span className="text-[#C5612C]">Perfect</span>
              <br />
              Home Today
            </h1>

            <p className="fade-up fade-up-3 text-lg text-[#5C4A3A] font-light leading-relaxed mb-10 max-w-md">
              Browse verified hostels, apartments, and student residences across Kenya.
              Apply online, pay via M-Pesa, and move in without the hassle.
            </p>

            <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-4">
              <a
                href="#properties"
                className="inline-flex items-center justify-center gap-2 bg-[#C5612C] text-white font-semibold px-8 py-4 rounded-full hover:bg-[#A84E22] transition-all hover:shadow-lg hover:shadow-[#C5612C]/25 text-base"
              >
                Browse Properties
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1A1412] font-semibold px-8 py-4 rounded-full border border-[#E8DDD4] hover:border-[#C5612C] transition-all text-base"
              >
                List Your Property
              </a>
            </div>
          </div>

          {/* Right: Property card preview */}
          <div className="relative hidden lg:block">
            <div className="relative z-10 bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm ml-auto">
              <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80"
                alt="Property"
                className="w-full h-52 object-cover"
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-[#1A1412] text-lg">Sunrise Hostel</h3>
                    <p className="text-sm text-[#8B7355] mt-0.5">Westlands, Nairobi</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                    <Star />
                    <span className="text-xs font-semibold text-amber-700">4.8</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {["WiFi", "Water", "Security"].map((a) => (
                    <span key={a} className="text-xs bg-[#FAF7F2] text-[#5C4A3A] px-2.5 py-1 rounded-full border border-[#E8DDD4]">{a}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#8B7355]">From</span>
                    <p className="font-display font-bold text-[#C5612C] text-xl">KES 8,500<span className="text-sm font-normal text-[#8B7355]">/mo</span></p>
                  </div>
                  <button className="bg-[#C5612C] text-white text-sm font-semibold px-4 py-2 rounded-full">
                    Request
                  </button>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl px-5 py-3 z-20 border border-stone-100">
              <p className="text-xs text-[#8B7355] mb-0.5">Available Now</p>
              <p className="font-bold text-[#1A1412] text-sm">6 rooms open</p>
            </div>
            <div className="absolute -top-6 -right-4 bg-[#C5612C] text-white rounded-2xl shadow-xl px-5 py-3 z-20">
              <p className="text-xs opacity-75 mb-0.5">M-Pesa Ready</p>
              <p className="font-bold text-sm">Pay Instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#1A1412] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-4xl font-black text-[#C5612C]">{stat.value}</p>
                <p className="text-sm text-stone-400 mt-1 font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Properties Section ── */}
      <section id="properties" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="text-[#C5612C] text-sm font-semibold uppercase tracking-widest mb-2">Available Now</p>
              <h2 className="font-display text-4xl lg:text-5xl font-black text-[#1A1412]">
                Browse Properties
              </h2>
            </div>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E8DDD4] rounded-full text-sm focus:outline-none focus:border-[#C5612C] text-[#1A1412] placeholder-stone-400"
              />
            </div>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-10">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeType === type
                    ? "bg-[#C5612C] text-white shadow-md"
                    : "bg-white text-[#5C4A3A] border border-[#E8DDD4] hover:border-[#C5612C]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Property Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#8B7355]">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
              <p className="font-medium">No properties found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((property) => (
                <div
                  key={property.id}
                  className="card-hover bg-white rounded-3xl overflow-hidden border border-[#F0E8DE] group cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {/* Badge */}
                    {property.badge && (
                      <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full badge-${property.badge.toLowerCase()}`}>
                        {property.badge}
                      </span>
                    )}
                    {/* Available count */}
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-xs font-semibold text-[#2C8B5C]">{property.available} available</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-bold text-[#1A1412] text-lg leading-tight">{property.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg className="w-3.5 h-3.5 text-[#C5612C]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-[#8B7355]">{property.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        <Star />
                        <span className="text-xs font-bold text-amber-700">{property.rating}</span>
                      </div>
                    </div>

                    {/* Type chip */}
                    <span className="inline-block text-xs font-medium text-[#C5612C] bg-[#FFF5EF] px-2.5 py-0.5 rounded-full mb-3 border border-[#C5612C]/15">
                      {property.type}
                    </span>

                    {/* Amenities */}
                    <div className="flex gap-1.5 flex-wrap mb-5">
                      {property.amenities.map((a) => (
                        <span key={a} className="text-xs bg-[#FAF7F2] text-[#5C4A3A] px-2.5 py-1 rounded-full border border-[#EDE4D8]">
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#F0E8DE]">
                      <div>
                        <span className="text-xs text-[#8B7355]">From</span>
                        <p className="font-display font-bold text-[#C5612C] text-lg">
                          KES {property.from.toLocaleString()}
                          <span className="text-xs font-normal text-[#8B7355]">/mo</span>
                        </p>
                      </div>
                      <button className="bg-[#1A1412] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#C5612C] transition-colors">
                        Request
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-[#1A1412]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#C5612C] text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="font-display text-4xl lg:text-5xl font-black text-white">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Browse", desc: "Explore verified properties across Kenya filtered by type, location, and budget.", icon: "🔍" },
              { step: "02", title: "Request", desc: "Submit a rental request directly to the property manager with your preferred move-in date.", icon: "📋" },
              { step: "03", title: "Get Approved", desc: "Manager reviews your request and sends you a move-in offer within 24 hours.", icon: "✅" },
              { step: "04", title: "Move In", desc: "Pay your first rent via M-Pesa, collect your keys, and settle into your new home.", icon: "🏠" },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-full h-px bg-[#C5612C]/20 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#C5612C]/10 border border-[#C5612C]/30 flex items-center justify-center text-2xl mx-auto mb-4">
                    {item.icon}
                  </div>
                  <p className="text-[#C5612C] text-xs font-bold tracking-widest mb-2">{item.step}</p>
                  <h3 className="font-display font-bold text-white text-xl mb-3">{item.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #C5612C 0%, #8B3A18 100%)" }}
          >
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="font-display text-4xl lg:text-5xl font-black text-white mb-4">
                Ready to Find Home?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto font-light">
                Join thousands of residents across Kenya who found their home through fabrentals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#C5612C] font-bold px-8 py-4 rounded-full hover:shadow-xl transition-all text-base"
                >
                  Create Free Account
                </a>
                <a
                  href="#properties"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-full hover:border-white transition-all text-base"
                >
                  Browse First
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1412] text-stone-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C5612C] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold text-white">
                fab<span className="text-[#C5612C]">rentals</span>
              </span>
            </div>
            <p className="text-xs text-center">© {new Date().getFullYear()} fabrentals. Built for Kenya's rental market.</p>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-[#C5612C] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#C5612C] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#C5612C] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
