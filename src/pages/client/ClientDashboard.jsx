import { useState } from "react";

// ─── Fake Data ────────────────────────────────────────────────────────────────
const profile = { name: "Jane Wanjiku", room: "204", building: "Block A", floor: "2nd Floor", moveIn: "Jan 15, 2025", billingType: "Monthly" };
const currentCycle = { period: "March 2025", amountDue: 8500, amountPaid: 0, dueDate: "Mar 15, 2025", status: "unpaid", lateFee: 0 };
const billingCycles = [
  { id:1, period:"Mar 2025", due:8500, paid:0, dueDate:"Mar 15",  status:"unpaid" },
  { id:2, period:"Feb 2025", due:8500, paid:8500, dueDate:"Feb 15", status:"paid" },
  { id:3, period:"Jan 2025", due:8500, paid:8500, dueDate:"Jan 15", status:"paid" },
];
const recentPayments = [
  { id:1, date:"Feb 12, 2025", amount:8500, method:"M-Pesa", ref:"QKT12XBABY", status:"confirmed" },
  { id:2, date:"Jan 10, 2025", amount:8500, method:"M-Pesa", ref:"PJR09WZNBX", status:"confirmed" },
];
const complaints = [
  { id:1, title:"Water pressure very low in bathroom", category:"Maintenance", priority:"high",   status:"in_progress", created:"Mar 2, 2025" },
  { id:2, title:"Noisy neighbours after 10pm",          category:"Noise",       priority:"normal", status:"open",        created:"Feb 28, 2025" },
];
const notifications = [
  { id:1, type:"billing", title:"Rent due in 3 days",            body:"Your March rent of KES 8,500 is due on Mar 15.",  time:"2h ago",  unread:true },
  { id:2, type:"complaint", title:"Complaint update",             body:"Your water pressure complaint is being handled.", time:"1d ago",  unread:true },
  { id:3, type:"system", title:"Welcome to fabrentals!",         body:"Your account is now active. Explore your dashboard.", time:"5d ago", unread:false },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const HomeIcon     = () => <Icon d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />;
const WalletIcon   = () => <Icon d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4M12 12v4" />;
const CalIcon      = () => <Icon d="M8 2v3M16 2v3M3 9h18M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />;
const ChatIcon     = () => <Icon d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const BellIcon     = () => <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />;
const MenuIcon     = () => <Icon d="M4 6h16M4 12h16M4 18h16" />;
const XIcon        = () => <Icon d="M18 6L6 18M6 6l12 12" />;
const ChevronRight = () => <Icon d="M9 18l6-6-6-6" size={16} />;
const ReceiptIcon  = () => <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />;
const TransferIcon = () => <Icon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />;
const UserIcon     = () => <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const LogoutIcon   = () => <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
const PhoneIcon    = () => <Icon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" size={16}/>;

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    paid:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
    unpaid:      "bg-amber-50 text-amber-700 border border-amber-200",
    overdue:     "bg-red-50 text-red-700 border border-red-200",
    partial:     "bg-blue-50 text-blue-700 border border-blue-200",
    confirmed:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
    failed:      "bg-red-50 text-red-700 border border-red-200",
    pending:     "bg-amber-50 text-amber-700 border border-amber-200",
    open:        "bg-amber-50 text-amber-700 border border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
    resolved:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  const label = { in_progress: "In Progress" }[status] || status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || "bg-stone-100 text-stone-600"}`}>{label}</span>;
};

// ─── M-Pesa Modal ─────────────────────────────────────────────────────────────
const MPesaModal = ({ onClose, cycle }) => {
  const [phone, setPhone] = useState("0712 345 678");
  const [step, setStep] = useState(1); // 1=form, 2=waiting, 3=success

  const handlePay = () => {
    setStep(2);
    setTimeout(() => setStep(3), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(26,20,18,0.7)", backdropFilter:"blur(4px)"}}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-1">Pay via M-Pesa</p>
            <h3 className="font-display text-2xl font-black text-[#1A1412]">
              KES {cycle.amountDue.toLocaleString()}
            </h3>
            <p className="text-sm text-[#8B7355] mt-0.5">{cycle.period} — due {cycle.dueDate}</p>
          </div>
          <button onClick={onClose} className="text-[#8B7355] hover:text-[#1A1412] mt-1">
            <XIcon />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DDD4]">
                <p className="text-xs text-[#8B7355] mb-1">M-Pesa phone number</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1A1412]">🇰🇪 +254</span>
                  <input value={phone} onChange={e=>setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium text-[#1A1412] outline-none border-b border-[#E8DDD4] pb-0.5 focus:border-[#C5612C]" />
                </div>
              </div>
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DDD4] space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#8B7355]">Rent</span><span className="font-medium text-[#1A1412]">KES 8,500</span></div>
                <div className="flex justify-between"><span className="text-[#8B7355]">Late fee</span><span className="font-medium text-[#1A1412]">KES 0</span></div>
                <div className="border-t border-[#E8DDD4] pt-2 flex justify-between font-bold"><span className="text-[#1A1412]">Total</span><span className="text-[#C5612C]">KES 8,500</span></div>
              </div>
              <button onClick={handlePay} className="w-full bg-[#C5612C] text-white font-semibold py-4 rounded-full hover:bg-[#A84E22] transition-colors flex items-center justify-center gap-2">
                <PhoneIcon /> Send STK Push
              </button>
              <p className="text-xs text-center text-[#8B7355]">You'll receive a prompt on your phone to confirm</p>
            </div>
          )}
          {step === 2 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#C5612C]/20 border-t-[#C5612C] animate-spin" />
              <p className="font-semibold text-[#1A1412]">Waiting for confirmation…</p>
              <p className="text-sm text-[#8B7355]">Check your phone and enter your M-Pesa PIN</p>
            </div>
          )}
          {step === 3 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-[#1A1412]">Payment Received!</p>
                <p className="text-sm text-[#8B7355] mt-1">KES 8,500 confirmed via M-Pesa</p>
              </div>
              <button onClick={onClose} className="w-full bg-[#1A1412] text-white font-semibold py-3 rounded-full hover:bg-[#2D1E16] transition-colors">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [payModalOpen, setPayModalOpen] = useState(false);

  const navItems = [
    { id:"dashboard",    label:"Dashboard",          icon:<HomeIcon /> },
    { id:"room",         label:"My Room",             icon:<HomeIcon /> },
    { id:"billing",      label:"Billing & Invoices",  icon:<ReceiptIcon /> },
    { id:"payments",     label:"Payments",            icon:<WalletIcon /> },
    { id:"transfer",     label:"Room Transfer",       icon:<TransferIcon /> },
    { id:"complaints",   label:"Complaints",          icon:<ChatIcon />, badge:complaints.filter(c=>c.status!=="resolved").length },
    { id:"notifications",label:"Notifications",       icon:<BellIcon />, badge:notifications.filter(n=>n.unread).length },
  ];

  const paidPct = Math.round((currentCycle.amountPaid / currentCycle.amountDue) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .nav-item { transition: all 0.18s ease; }
        .nav-item:hover { background: rgba(197,97,44,0.08); }
        .nav-item.active { background: rgba(197,97,44,0.12); }
        .card-lift { transition: transform 0.25s cubic-bezier(.22,.68,0,1.2), box-shadow 0.25s ease; }
        .card-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8DDD4; border-radius: 2px; }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-slide { animation: fadeSlide 0.4s ease forwards; }
        .stagger-1 { animation-delay: 0.05s; opacity: 0; }
        .stagger-2 { animation-delay: 0.10s; opacity: 0; }
        .stagger-3 { animation-delay: 0.15s; opacity: 0; }
        .stagger-4 { animation-delay: 0.20s; opacity: 0; }
        .stagger-5 { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#1A1412] transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9" fill="white" opacity="0.5"/></svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-base leading-none">fabrentals</p>
            <p className="text-xs text-white/40 mt-0.5">Sunrise Hostel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${activePage===item.id ? "active text-white" : "text-white/50 hover:text-white/80"}`}>
              <span className={`flex-shrink-0 ${activePage===item.id ? "text-[#C5612C]" : ""}`}>{item.icon}</span>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge > 0 && <span className="bg-[#C5612C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <button onClick={() => setActivePage("profile")}
            className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80">
            <span className="flex-shrink-0"><UserIcon /></span>
            <span className="text-sm font-medium">My Profile</span>
          </button>
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400">
            <span className="flex-shrink-0"><LogoutIcon /></span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8DDD4] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#8B7355] hover:text-[#1A1412]"><MenuIcon /></button>
            <div>
              <p className="text-xs text-[#8B7355]">Resident Portal</p>
              <h1 className="font-display font-bold text-[#1A1412] text-lg leading-tight">
                {navItems.find(n=>n.id===activePage)?.label || "Dashboard"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActivePage("notifications")} className="relative text-[#8B7355] hover:text-[#C5612C] transition-colors p-2">
              <BellIcon />
              {notifications.filter(n=>n.unread).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C5612C] rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#E8DDD4]">
              <div className="w-8 h-8 rounded-full bg-[#C5612C]/15 flex items-center justify-center text-sm font-bold text-[#C5612C]">
                {profile.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#1A1412] leading-none">{profile.name}</p>
                <p className="text-xs text-[#8B7355]">Room {profile.room}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Welcome Banner ── */}
          <div className="fade-slide stagger-1 relative rounded-3xl overflow-hidden p-6 md:p-8"
            style={{background:"linear-gradient(135deg, #1A1412 0%, #3D2415 100%)"}}>
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full"><defs><pattern id="pd" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#pd)"/></svg>
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-white/50 text-sm">{greeting} 👋</p>
                <h2 className="font-display text-2xl md:text-3xl font-black text-white mt-1">{profile.name}</h2>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <HomeIcon /><span className="text-white/80">Room {profile.room}, {profile.building}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <CalIcon /><span className="text-white/80">Since {profile.moveIn}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-center">
                  <p className="text-white/50 text-xs">Billing Type</p>
                  <p className="text-white font-semibold text-sm">{profile.billingType}</p>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-4 py-2 text-center">
                  <p className="text-emerald-300/70 text-xs">Status</p>
                  <p className="text-emerald-300 font-semibold text-sm">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"Current Balance", value:`KES ${currentCycle.amountDue.toLocaleString()}`, sub:"March rent due", color:"#EF4444", bg:"#FEF2F2", icon:<WalletIcon /> },
              { label:"Due Date",        value:currentCycle.dueDate,       sub:"3 days remaining",      color:"#F59E0B", bg:"#FFFBEB", icon:<CalIcon /> },
              { label:"Tenancy",         value:"Active",                   sub:`${profile.building}, Fl. ${profile.floor.split(" ")[0]}`, color:"#10B981", bg:"#ECFDF5", icon:<HomeIcon /> },
              { label:"Open Complaints", value:complaints.filter(c=>c.status!=="resolved").length, sub:"1 in progress",  color:"#3B82F6", bg:"#EFF6FF", icon:<ChatIcon /> },
            ].map((s, i) => (
              <div key={s.label} className={`fade-slide stagger-${i+2} card-lift bg-white rounded-2xl p-5 border border-[#E8DDD4]`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:s.bg, color:s.color}}>{s.icon}</div>
                  <span className="w-2 h-2 rounded-full mt-1" style={{background:s.color}} />
                </div>
                <p className="font-display font-bold text-[#1A1412] text-xl leading-none">{s.value}</p>
                <p className="text-xs text-[#8B7355] mt-1">{s.label}</p>
                <p className="text-xs text-[#C5612C] font-medium mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Billing Snapshot + Recent Payments ── */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Billing Snapshot */}
            <div className="fade-slide stagger-2 lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-1">Current Billing Cycle</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-xl">{currentCycle.period}</h3>
                </div>
                <StatusBadge status={currentCycle.status} />
              </div>
              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8B7355]">Amount paid</span>
                  <span className="font-semibold text-[#1A1412]">KES {currentCycle.amountPaid.toLocaleString()} <span className="text-[#8B7355] font-normal">/ {currentCycle.amountDue.toLocaleString()}</span></span>
                </div>
                <div className="h-3 bg-[#F5EDE0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{width:`${paidPct}%`, background: paidPct===100 ? "#10B981" : paidPct > 0 ? "#3B82F6" : "#E8DDD4"}} />
                </div>
                <p className="text-xs text-[#8B7355] mt-1.5">{paidPct}% paid — KES {(currentCycle.amountDue - currentCycle.amountPaid).toLocaleString()} remaining</p>
              </div>
              {/* Billing table */}
              <div className="space-y-2 mb-5">
                {billingCycles.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#1A1412]">{c.period}</p>
                      <p className="text-xs text-[#8B7355]">Due {c.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#1A1412]">KES {c.due.toLocaleString()}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setPayModalOpen(true)}
                className="w-full bg-[#C5612C] text-white font-semibold py-3.5 rounded-full hover:bg-[#A84E22] transition-colors flex items-center justify-center gap-2">
                <PhoneIcon /> Pay March Rent via M-Pesa
              </button>
            </div>

            {/* Recent Payments */}
            <div className="fade-slide stagger-3 bg-white rounded-2xl border border-[#E8DDD4] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-[#1A1412] text-lg">Recent Payments</h3>
                <button onClick={() => setActivePage("payments")} className="text-xs text-[#C5612C] font-medium hover:underline flex items-center gap-1">All <ChevronRight /></button>
              </div>
              <div className="flex-1 space-y-3">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-start gap-3 py-3 border-b border-[#F5EDE0] last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1A1412]">KES {p.amount.toLocaleString()}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-[#8B7355] mt-0.5">{p.date} · {p.method}</p>
                      <p className="text-xs text-[#8B7355] font-mono">{p.ref}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#F5EDE0]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B7355]">Total paid (2025)</span>
                  <span className="font-bold text-[#10B981]">KES 17,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Complaints + Notifications ── */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Complaints */}
            <div className="fade-slide stagger-4 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-[#1A1412] text-lg">My Complaints</h3>
                <button onClick={() => setActivePage("complaints")} className="text-xs text-[#C5612C] font-medium hover:underline flex items-center gap-1">View all <ChevronRight /></button>
              </div>
              <div className="space-y-3">
                {complaints.map(c => (
                  <div key={c.id} className="p-4 rounded-xl border border-[#E8DDD4] hover:border-[#C5612C]/30 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-[#1A1412] leading-snug flex-1">{c.title}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-[#F5EDE0] text-[#5C4A3A] px-2 py-0.5 rounded-full">{c.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.priority==="high" ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-500"}`}>{c.priority}</span>
                      <span className="text-xs text-[#8B7355] ml-auto">{c.created}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full border border-dashed border-[#E8DDD4] rounded-xl py-3 text-sm text-[#8B7355] hover:border-[#C5612C] hover:text-[#C5612C] transition-colors font-medium">
                  + New Complaint
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="fade-slide stagger-5 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-[#1A1412] text-lg">Notifications</h3>
                <button className="text-xs text-[#C5612C] font-medium hover:underline">Mark all read</button>
              </div>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors ${n.unread ? "bg-[#FFF5EF] border border-[#C5612C]/15" : "hover:bg-[#FAF7F2]"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${n.type==="billing" ? "bg-amber-100 text-amber-600" : n.type==="complaint" ? "bg-blue-100 text-blue-600" : "bg-stone-100 text-stone-500"}`}>
                      {n.type==="billing" ? "💰" : n.type==="complaint" ? "💬" : "ℹ️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm leading-snug ${n.unread ? "font-semibold text-[#1A1412]" : "font-medium text-[#5C4A3A]"}`}>{n.title}</p>
                        <span className="text-xs text-[#8B7355] flex-shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#8B7355] mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-[#C5612C] flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-4" />
        </main>
      </div>

      {payModalOpen && <MPesaModal onClose={() => setPayModalOpen(false)} cycle={currentCycle} />}
    </div>
  );
}
