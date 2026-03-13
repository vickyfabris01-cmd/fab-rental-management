import { useState } from "react";

// ─── Fake Data ────────────────────────────────────────────────────────────────
const stats = { totalRooms:48, occupied:36, vacant:12, pendingRequests:5, overduePayments:3, openComplaints:7 };
const buildings = [
  { name:"Block A", total:16, occupied:14 },
  { name:"Block B", total:16, occupied:13 },
  { name:"Block C", total:16, occupied:9  },
];
const pendingRequests = [
  { id:1, name:"Kevin Odhiambo",  room:"304 — Single", moveIn:"Mar 20", time:"2h ago",  avatar:"KO" },
  { id:2, name:"Aisha Mohamed",   room:"102 — Double", moveIn:"Apr 1",  time:"5h ago",  avatar:"AM" },
  { id:3, name:"Brian Kamau",     room:"205 — Single", moveIn:"Mar 25", time:"1d ago",  avatar:"BK" },
  { id:4, name:"Fatuma Otieno",   room:"401 — Suite",  moveIn:"Apr 5",  time:"2d ago",  avatar:"FO" },
];
const overdueList = [
  { id:1, name:"James Mwangi",   room:"211", amount:8500,  overdueDays:12 },
  { id:2, name:"Linda Achieng",  room:"118", amount:17000, overdueDays:8  },
  { id:3, name:"Paul Njoroge",   room:"322", amount:8500,  overdueDays:5  },
];
const recentPayments = [
  { id:1, name:"Mary Njoki",    amount:8500,  method:"M-Pesa", time:"10m ago", ref:"QKT12X" },
  { id:2, name:"Tom Wekesa",    amount:8500,  method:"Cash",   time:"1h ago",  ref:"MANUAL" },
  { id:3, name:"Grace Mutua",   amount:22000, method:"M-Pesa", time:"3h ago",  ref:"PJR09W" },
  { id:4, name:"David Kariuki", amount:8500,  method:"M-Pesa", time:"5h ago",  ref:"NXZ11B" },
];
const openComplaints = [
  { id:1, name:"Jane Wanjiku", title:"Water pressure issue",  priority:"high",   status:"in_progress", room:"204" },
  { id:2, name:"Ali Hassan",   title:"Broken window latch",   priority:"normal", status:"open",        room:"310" },
  { id:3, name:"Rose Waweru",  title:"Electricity flickering",priority:"urgent", status:"open",        room:"115" },
  { id:4, name:"John Kimani",  title:"Missing door key",      priority:"high",   status:"in_progress", room:"220" },
];
const rooms = [
  { num:"101", type:"Single", status:"occupied",   tenant:"James M.", price:8500  },
  { num:"102", type:"Double", status:"occupied",   tenant:"Linda A.", price:12000 },
  { num:"103", type:"Single", status:"available",  tenant:null,       price:8500  },
  { num:"104", type:"Single", status:"maintenance",tenant:null,       price:8500  },
  { num:"105", type:"Suite",  status:"occupied",   tenant:"Paul N.",  price:22000 },
  { num:"201", type:"Single", status:"available",  tenant:null,       price:8500  },
  { num:"202", type:"Double", status:"occupied",   tenant:"Mary J.",  price:12000 },
  { num:"203", type:"Single", status:"reserved",   tenant:null,       price:8500  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({d,s=20,c=""}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d}/></svg>;
const HomeIcon    = () => <Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>;
const GridIcon    = () => <Ic d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>;
const UsersIcon   = () => <Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>;
const WalletIcon  = () => <Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>;
const ToolsIcon   = () => <Ic d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>;
const ChatIcon    = () => <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>;
const BellIcon    = () => <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>;
const MenuIcon    = () => <Ic d="M4 6h16M4 12h16M4 18h16"/>;
const SettingsIcon= () => <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6zm6.93-2.5h1.57a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1.57a6.91 6.91 0 00-.67-1.6l1.11-1.11a.5.5 0 000-.71l-.71-.71a.5.5 0 00-.71 0l-1.11 1.11A6.91 6.91 0 0013 7.07V5.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.57a6.91 6.91 0 00-1.6.67L8.29 6.63a.5.5 0 00-.71 0l-.71.71a.5.5 0 000 .71l1.11 1.11A6.91 6.91 0 007.07 11H5.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1.57a6.91 6.91 0 00.67 1.6L6.63 15.7a.5.5 0 000 .71l.71.71a.5.5 0 00.71 0l1.11-1.11a6.91 6.91 0 001.6.67V19.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1.57a6.91 6.91 0 001.6-.67l1.11 1.11a.5.5 0 00.71 0l.71-.71a.5.5 0 000-.71l-1.11-1.11c.28-.5.5-1.04.67-1.6z"/>;
const UserIcon    = () => <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>;
const LogoutIcon  = () => <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;
const ChevRight   = () => <Ic d="M9 18l6-6-6-6" s={16}/>;
const CheckIcon   = () => <Ic d="M5 13l4 4L19 7" s={16}/>;
const XIcon       = () => <Ic d="M18 6L6 18M6 6l12 12" s={16}/>;
const PlusIcon    = () => <Ic d="M12 5v14M5 12h14" s={16}/>;
const ReceiptIcon = () => <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>;
const MegaphoneIcon=() => <Ic d="M18 9l3 3-3 3M5 12H3M21 12H9m0 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2v-5"/>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    available:   ["bg-emerald-50 text-emerald-700 border-emerald-200","Available"],
    occupied:    ["bg-blue-50 text-blue-700 border-blue-200","Occupied"],
    maintenance: ["bg-amber-50 text-amber-700 border-amber-200","Maintenance"],
    reserved:    ["bg-purple-50 text-purple-700 border-purple-200","Reserved"],
    open:        ["bg-amber-50 text-amber-700 border-amber-200","Open"],
    in_progress: ["bg-blue-50 text-blue-700 border-blue-200","In Progress"],
    resolved:    ["bg-emerald-50 text-emerald-700 border-emerald-200","Resolved"],
    urgent:      ["bg-red-50 text-red-700 border-red-200","Urgent"],
    high:        ["bg-orange-50 text-orange-700 border-orange-200","High"],
    normal:      ["bg-stone-100 text-stone-600 border-stone-200","Normal"],
  };
  const [cls, label] = cfg[status] || ["bg-stone-100 text-stone-600 border-stone-200", status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
};

const Avatar = ({initials, color="bg-[#C5612C]/15 text-[#C5612C]", size="w-9 h-9"}) => (
  <div className={`${size} rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{initials}</div>
);

// ─── Add Room Modal ───────────────────────────────────────────────────────────
const AddRoomModal = ({onClose}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(26,20,18,0.7)",backdropFilter:"blur(4px)"}}>
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
      <div className="p-6 border-b border-[#E8DDD4] flex justify-between items-center">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Properties</p><h3 className="font-display font-black text-[#1A1412] text-xl">Add New Room</h3></div>
        <button onClick={onClose} className="text-[#8B7355] hover:text-[#1A1412] p-1"><XIcon /></button>
      </div>
      <div className="p-6 space-y-4">
        {[["Room Number","e.g. 301"],["Monthly Price (KES)","e.g. 8500"],["Capacity","e.g. 1"]].map(([l,p]) => (
          <div key={l}><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">{l}</label>
          <input placeholder={p} className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]" /></div>
        ))}
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Building</label>
        <select className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]">
          {buildings.map(b=><option key={b.name}>{b.name}</option>)}
        </select></div>
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Room Type</label>
        <select className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]">
          {["Single","Double","Dormitory","Suite"].map(t=><option key={t}>{t}</option>)}
        </select></div>
      </div>
      <div className="p-6 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 border border-[#E8DDD4] rounded-full py-3 text-sm font-medium text-[#5C4A3A] hover:border-[#C5612C]">Cancel</button>
        <button className="flex-[2] bg-[#C5612C] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#A84E22]">Add Room</button>
      </div>
    </div>
  </div>
);

// ─── Manual Payment Modal ─────────────────────────────────────────────────────
const ManualPayModal = ({onClose}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(26,20,18,0.7)",backdropFilter:"blur(4px)"}}>
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
      <div className="p-6 border-b border-[#E8DDD4] flex justify-between items-center">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Billing</p><h3 className="font-display font-black text-[#1A1412] text-xl">Record Payment</h3></div>
        <button onClick={onClose} className="text-[#8B7355] hover:text-[#1A1412] p-1"><XIcon /></button>
      </div>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Resident</label>
        <select className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]">
          <option>Select resident…</option>{recentPayments.map(r=><option key={r.id}>{r.name}</option>)}
        </select></div>
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Billing Cycle</label>
        <select className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]">
          <option>March 2025 — KES 8,500</option><option>February 2025 — KES 8,500</option>
        </select></div>
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Amount (KES)</label>
        <input type="number" placeholder="8500" className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2]" /></div>
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Method</label>
        <div className="grid grid-cols-3 gap-2">
          {["Cash","M-Pesa","Bank Transfer"].map(m=>(
            <label key={m} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E8DDD4] cursor-pointer hover:border-[#C5612C] text-xs font-medium text-[#5C4A3A] has-[:checked]:border-[#C5612C] has-[:checked]:bg-[#FFF5EF] has-[:checked]:text-[#C5612C]">
              <input type="radio" name="method" className="sr-only" />{m}
            </label>
          ))}
        </div></div>
        <div><label className="block text-xs font-semibold text-[#1A1412] mb-1.5 uppercase tracking-wider">Notes (optional)</label>
        <textarea rows={2} placeholder="e.g. Cash received at office" className="w-full px-4 py-3 border border-[#E8DDD4] rounded-xl text-sm outline-none focus:border-[#C5612C] bg-[#FAF7F2] resize-none" /></div>
      </div>
      <div className="p-6 pt-0 flex gap-3">
        <button onClick={onClose} className="flex-1 border border-[#E8DDD4] rounded-full py-3 text-sm font-medium text-[#5C4A3A] hover:border-[#C5612C]">Cancel</button>
        <button className="flex-[2] bg-[#C5612C] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#A84E22]">Confirm Payment</button>
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [requests, setRequests] = useState(pendingRequests);

  const handleRequest = (id, action) => setRequests(r => r.filter(x => x.id !== id));

  const navGroups = [
    { items: [{ id:"dashboard", label:"Dashboard", icon:<HomeIcon /> }] },
    { label:"Properties", items:[
      { id:"properties", label:"Rooms & Buildings", icon:<GridIcon /> },
    ]},
    { label:"Residents", items:[
      { id:"residents",  label:"All Residents",    icon:<UsersIcon /> },
      { id:"requests",   label:"Rental Requests",  icon:<ReceiptIcon />, badge:requests.length },
      { id:"tenancies",  label:"Tenancies",        icon:<HomeIcon /> },
    ]},
    { label:"Finance", items:[
      { id:"billing",    label:"Billing Cycles",   icon:<WalletIcon /> },
      { id:"payments",   label:"Payments",         icon:<WalletIcon /> },
    ]},
    { label:"Workforce", items:[
      { id:"workforce",  label:"Workers",          icon:<ToolsIcon /> },
    ]},
    { label:"Comms", items:[
      { id:"complaints",    label:"Complaints",    icon:<ChatIcon />, badge:stats.openComplaints },
      { id:"announcements", label:"Announcements", icon:<MegaphoneIcon /> },
    ]},
  ];

  const occupancyPct = Math.round((stats.occupied / stats.totalRooms) * 100);

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display{font-family:'Playfair Display',serif}
        .nav-item{transition:all 0.18s ease}
        .nav-item:hover{background:rgba(197,97,44,0.08)}
        .nav-item.active{background:rgba(197,97,44,0.12)}
        .card-lift{transition:transform 0.25s cubic-bezier(.22,.68,0,1.2),box-shadow 0.25s ease}
        .card-lift:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.10)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#E8DDD4;border-radius:2px}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-slide{animation:fadeSlide 0.4s ease forwards}
        .s1{animation-delay:.05s;opacity:0}.s2{animation-delay:.10s;opacity:0}
        .s3{animation-delay:.15s;opacity:0}.s4{animation-delay:.20s;opacity:0}
        .s5{animation-delay:.25s;opacity:0}.s6{animation-delay:.30s;opacity:0}
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#1A1412] transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9" fill="white" opacity="0.5"/></svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">Sunrise Hostel</p>
            <p className="text-xs text-white/40 mt-0.5">Manager Portal</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((g, gi) => (
            <div key={gi}>
              {g.label && <p className="text-xs text-white/25 font-semibold uppercase tracking-widest px-3 mb-1">{g.label}</p>}
              {g.items.map(item => (
                <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${activePage===item.id?"active text-white":"text-white/50 hover:text-white/80"}`}>
                  <span className={`flex-shrink-0 ${activePage===item.id?"text-[#C5612C]":""}`}>{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge > 0 && <span className="bg-[#C5612C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80">
            <SettingsIcon /><span className="text-sm font-medium">Settings</span>
          </button>
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80">
            <UserIcon /><span className="text-sm font-medium">My Profile</span>
          </button>
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400">
            <LogoutIcon /><span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8DDD4] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#8B7355]"><MenuIcon /></button>
            <div>
              <p className="text-xs text-[#8B7355]">Manager Portal</p>
              <h1 className="font-display font-bold text-[#1A1412] text-lg leading-tight">Dashboard Overview</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPayModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-[#C5612C] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#A84E22] transition-colors">
              <PlusIcon /> Record Payment
            </button>
            <button onClick={() => setAddRoomOpen(true)} className="hidden sm:flex items-center gap-2 border border-[#E8DDD4] text-[#1A1412] text-sm font-medium px-4 py-2 rounded-full hover:border-[#C5612C] transition-colors">
              <PlusIcon /> Add Room
            </button>
            <button className="relative text-[#8B7355] hover:text-[#C5612C] p-2 transition-colors">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C5612C] rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#E8DDD4]">
              <Avatar initials="MK" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#1A1412] leading-none">Michael Kamau</p>
                <p className="text-xs text-[#8B7355]">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label:"Total Rooms",      value:stats.totalRooms,       sub:"across 3 buildings", color:"#3B82F6", bg:"#EFF6FF" },
              { label:"Occupied",         value:stats.occupied,         sub:`${occupancyPct}% occupancy`,color:"#10B981",bg:"#ECFDF5" },
              { label:"Vacant",           value:stats.vacant,           sub:"ready to let",        color:"#8B5CF6",bg:"#F5F3FF" },
              { label:"Pending Requests", value:stats.pendingRequests,  sub:"awaiting review",     color:"#F59E0B",bg:"#FFFBEB" },
              { label:"Overdue Payments", value:stats.overduePayments,  sub:"need follow-up",      color:"#EF4444",bg:"#FEF2F2" },
              { label:"Open Complaints",  value:stats.openComplaints,   sub:"2 urgent",            color:"#EC4899",bg:"#FDF2F8" },
            ].map((s,i) => (
              <div key={s.label} className={`fade-slide s${i+1} card-lift bg-white rounded-2xl p-4 border border-[#E8DDD4]`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full" style={{background:s.color}} />
                  <span className="text-xs text-[#8B7355]"></span>
                </div>
                <p className="font-display font-black text-[#1A1412] text-2xl leading-none">{s.value}</p>
                <p className="text-xs font-medium text-[#8B7355] mt-1 leading-tight">{s.label}</p>
                <p className="text-xs mt-0.5 font-medium" style={{color:s.color}}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Occupancy + Pending Requests */}
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Occupancy */}
            <div className="fade-slide s2 lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-1">Occupancy</p>
              <h3 className="font-display font-bold text-[#1A1412] text-xl mb-5">Buildings Overview</h3>
              <div className="space-y-5">
                {buildings.map(b => {
                  const pct = Math.round((b.occupied/b.total)*100);
                  return (
                    <div key={b.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-[#1A1412]">{b.name}</span>
                        <span className="text-xs text-[#8B7355]">{b.occupied}/{b.total} rooms · <span className="font-semibold text-[#1A1412]">{pct}%</span></span>
                      </div>
                      <div className="h-2.5 bg-[#F5EDE0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`, background: pct>=80?"#10B981":pct>=50?"#3B82F6":"#F59E0B"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Room status legend */}
              <div className="mt-5 pt-4 border-t border-[#F5EDE0] grid grid-cols-2 gap-2">
                {[
                  {label:"Available", count:rooms.filter(r=>r.status==="available").length, color:"bg-emerald-500"},
                  {label:"Occupied",  count:rooms.filter(r=>r.status==="occupied").length,  color:"bg-blue-500"},
                  {label:"Reserved",  count:rooms.filter(r=>r.status==="reserved").length,  color:"bg-purple-500"},
                  {label:"Maintenance",count:rooms.filter(r=>r.status==="maintenance").length,color:"bg-amber-500"},
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
                    <span className="text-xs text-[#8B7355]">{s.label}</span>
                    <span className="text-xs font-semibold text-[#1A1412] ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="fade-slide s3 lg:col-span-3 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Action Needed</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-xl">Pending Requests</h3>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">{requests.length} pending</span>
              </div>
              {requests.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-500"><CheckIcon /></div>
                  <p className="text-sm font-medium text-[#5C4A3A]">All caught up!</p>
                  <p className="text-xs text-[#8B7355] mt-1">No pending rental requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(r => (
                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors border border-transparent hover:border-[#E8DDD4]">
                      <Avatar initials={r.avatar} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1412]">{r.name}</p>
                        <p className="text-xs text-[#8B7355]">{r.room} · Move-in {r.moveIn}</p>
                      </div>
                      <span className="text-xs text-[#8B7355] hidden sm:block flex-shrink-0">{r.time}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleRequest(r.id,"approve")} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-200" title="Approve"><CheckIcon /></button>
                        <button onClick={() => handleRequest(r.id,"reject")} className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200" title="Reject"><XIcon /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overdue + Recent Payments + Complaints */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Overdue */}
            <div className="fade-slide s3 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-0.5">Follow Up</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-lg">Overdue Rent</h3>
                </div>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">{overdueList.length}</span>
              </div>
              <div className="space-y-3">
                {overdueList.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FEF2F2] border border-red-100">
                    <Avatar initials={o.name.split(" ").map(n=>n[0]).join("")} color="bg-red-100 text-red-600" size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1A1412] truncate">{o.name}</p>
                      <p className="text-xs text-[#8B7355]">Rm {o.room} · {o.overdueDays}d overdue</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-red-600">KES {o.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full border border-dashed border-red-200 rounded-xl py-2.5 text-xs text-red-500 font-medium hover:bg-red-50 transition-colors">Send reminders to all</button>
            </div>

            {/* Recent Payments */}
            <div className="fade-slide s4 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Incoming</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-lg">Recent Payments</h3>
                </div>
                <button onClick={() => setPayModalOpen(true)} className="w-7 h-7 bg-[#C5612C] text-white rounded-full flex items-center justify-center hover:bg-[#A84E22]"><PlusIcon /></button>
              </div>
              <div className="space-y-3">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#F5EDE0] last:border-0">
                    <Avatar initials={p.name.split(" ").map(n=>n[0]).join("")} color="bg-emerald-100 text-emerald-700" size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1A1412] truncate">{p.name}</p>
                      <p className="text-xs text-[#8B7355]">{p.time} · {p.method}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-emerald-600">+{p.amount.toLocaleString()}</p>
                      <p className="text-xs text-[#8B7355] font-mono">{p.ref}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#F5EDE0] flex justify-between">
                <span className="text-xs text-[#8B7355]">Today's collections</span>
                <span className="text-sm font-bold text-[#1A1412]">KES {recentPayments.reduce((a,p)=>a+p.amount,0).toLocaleString()}</span>
              </div>
            </div>

            {/* Open Complaints */}
            <div className="fade-slide s5 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Support</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-lg">Open Complaints</h3>
                </div>
                <button onClick={() => setActivePage("complaints")} className="text-xs text-[#C5612C] font-medium hover:underline flex items-center gap-1">All <ChevRight /></button>
              </div>
              <div className="space-y-2.5">
                {openComplaints.map(c => (
                  <div key={c.id} className="p-3 rounded-xl border border-[#E8DDD4] hover:border-[#C5612C]/30 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <p className="text-xs font-semibold text-[#1A1412] leading-snug flex-1">{c.title}</p>
                      <StatusBadge status={c.priority==="urgent"?"urgent":c.status} />
                    </div>
                    <p className="text-xs text-[#8B7355]">{c.name} · Rm {c.room}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rooms Quick View */}
          <div className="fade-slide s6 bg-white rounded-2xl border border-[#E8DDD4] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Properties</p>
                <h3 className="font-display font-bold text-[#1A1412] text-xl">Room Status</h3>
              </div>
              <button onClick={() => setAddRoomOpen(true)} className="flex items-center gap-1.5 bg-[#C5612C] text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-[#A84E22] transition-colors">
                <PlusIcon /> Add Room
              </button>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#F5EDE0]">
                    {["Room","Type","Status","Tenant","Price/mo",""].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-[#8B7355] pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r.num} className="border-b border-[#FAF7F2] hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 pr-4 font-semibold text-sm text-[#1A1412]">{r.num}</td>
                      <td className="py-3 pr-4 text-sm text-[#5C4A3A]">{r.type}</td>
                      <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 pr-4 text-sm text-[#8B7355]">{r.tenant || "—"}</td>
                      <td className="py-3 pr-4 text-sm font-medium text-[#1A1412]">KES {r.price.toLocaleString()}</td>
                      <td className="py-3">
                        <button className="text-xs text-[#C5612C] font-medium hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-4" />
        </main>
      </div>

      {addRoomOpen && <AddRoomModal onClose={() => setAddRoomOpen(false)} />}
      {payModalOpen && <ManualPayModal onClose={() => setPayModalOpen(false)} />}
    </div>
  );
}
