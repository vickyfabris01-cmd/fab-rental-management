import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const worker = { name:"Samuel Oloo", role:"Security Guard", tenant:"Sunrise Hostel", salary:18000, payCycle:"Monthly", phone:"0712 345 678", startDate:"Aug 12, 2023" };
const payments = [
  { id:1, period:"Feb 2025",  amount:18000, method:"M-Pesa", ref:"QKT12XBABY", status:"paid", paidAt:"Feb 28, 2025" },
  { id:2, period:"Jan 2025",  amount:18000, method:"M-Pesa", ref:"PJR09WZNBX", status:"paid", paidAt:"Jan 31, 2025" },
  { id:3, period:"Dec 2024",  amount:18000, method:"Cash",   ref:"MANUAL",     status:"paid", paidAt:"Dec 31, 2024" },
  { id:4, period:"Nov 2024",  amount:18000, method:"M-Pesa", ref:"MXZ44PLQRT", status:"paid", paidAt:"Nov 30, 2024" },
  { id:5, period:"Oct 2024",  amount:18000, method:"M-Pesa", ref:"NXZ11BPLYT", status:"paid", paidAt:"Oct 31, 2024" },
  { id:6, period:"Mar 2025",  amount:18000, method:"M-Pesa", ref:null,          status:"pending", paidAt:null },
];
// Generate attendance for current month
const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
const attendance = Array.from({length: daysInMonth}, (_, i) => {
  const day = i + 1;
  const date = new Date(today.getFullYear(), today.getMonth(), day);
  const dow = date.getDay();
  if (day > today.getDate()) return { day, status: "future" };
  if (dow === 0) return { day, status: "off" }; // Sunday off
  const r = Math.random();
  if (r < 0.82) return { day, status: "present" };
  if (r < 0.90) return { day, status: "absent" };
  if (r < 0.95) return { day, status: "half" };
  return { day, status: "leave" };
});

const attStats = {
  present: attendance.filter(a=>a.status==="present").length,
  absent:  attendance.filter(a=>a.status==="absent").length,
  half:    attendance.filter(a=>a.status==="half").length,
  leave:   attendance.filter(a=>a.status==="leave").length,
};

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({d,s=20,c=""}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d}/></svg>;
const HomeIcon   = () => <Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>;
const WalletIcon = () => <Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>;
const CalIcon    = () => <Ic d="M8 2v3M16 2v3M3 9h18M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/>;
const UserIcon   = () => <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>;
const BellIcon   = () => <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>;
const MenuIcon   = () => <Ic d="M4 6h16M4 12h16M4 18h16"/>;
const LogoutIcon = () => <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;

// ─── Status dot colors ────────────────────────────────────────────────────────
const attColor = {
  present: { bg:"bg-emerald-500", label:"Present", text:"text-emerald-700", light:"bg-emerald-50 border-emerald-200" },
  absent:  { bg:"bg-red-500",     label:"Absent",  text:"text-red-600",     light:"bg-red-50 border-red-200" },
  half:    { bg:"bg-amber-400",   label:"Half-day", text:"text-amber-700",  light:"bg-amber-50 border-amber-200" },
  leave:   { bg:"bg-blue-400",    label:"Leave",   text:"text-blue-700",    light:"bg-blue-50 border-blue-200" },
  off:     { bg:"bg-stone-200",   label:"Off",     text:"text-stone-400",   light:"bg-stone-50 border-stone-200" },
  future:  { bg:"bg-transparent", label:"",        text:"text-stone-300",   light:"bg-transparent border-transparent" },
};

const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("overview");

  const monthName = today.toLocaleString("default",{month:"long"});
  const year = today.getFullYear();
  const firstDayOfMonth = new Date(year, today.getMonth(), 1).getDay();

  // Calendar grid (including leading empty cells)
  const calendarCells = [...Array(firstDayOfMonth).fill(null), ...attendance];

  const navItems = [
    { id:"overview",   label:"My Overview",  icon:<HomeIcon /> },
    { id:"payments",   label:"Pay History",  icon:<WalletIcon /> },
    { id:"attendance", label:"Attendance",   icon:<CalIcon /> },
    { id:"profile",    label:"My Profile",   icon:<UserIcon /> },
  ];

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display{font-family:'Playfair Display',serif}
        .nav-item{transition:all 0.18s ease}
        .nav-item:hover{background:rgba(197,97,44,0.08)}
        .nav-item.active{background:rgba(197,97,44,0.12)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#E8DDD4;border-radius:2px}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-slide{animation:fadeSlide 0.4s ease forwards}
        .s1{animation-delay:.05s;opacity:0}.s2{animation-delay:.10s;opacity:0}
        .s3{animation-delay:.15s;opacity:0}.s4{animation-delay:.20s;opacity:0}
      `}</style>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-60 bg-[#1A1412] transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#C5612C] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">{worker.tenant}</p>
            <p className="text-xs text-white/40">Worker Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${activePage===item.id?"active text-white":"text-white/50 hover:text-white/80"}`}>
              <span className={activePage===item.id?"text-[#C5612C]":""}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400">
            <LogoutIcon /><span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8DDD4] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#8B7355]"><MenuIcon /></button>
            <div>
              <p className="text-xs text-[#8B7355]">Worker Portal</p>
              <h1 className="font-display font-bold text-[#1A1412] text-lg">{worker.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[#8B7355] hover:text-[#C5612C] p-2 transition-colors"><BellIcon /></button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#E8DDD4]">
              <div className="w-8 h-8 rounded-full bg-[#C5612C]/15 flex items-center justify-center text-sm font-bold text-[#C5612C]">
                {worker.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#1A1412] leading-none">{worker.name.split(" ")[0]}</p>
                <p className="text-xs text-[#8B7355]">{worker.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Profile Banner */}
          <div className="fade-slide s1 relative rounded-3xl overflow-hidden p-6"
            style={{background:"linear-gradient(135deg, #1A1412 0%, #3D2415 100%)"}}>
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full"><defs><pattern id="pw" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#pw)"/></svg>
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#C5612C]/25 border border-[#C5612C]/40 flex items-center justify-center text-2xl font-black text-[#C5612C] flex-shrink-0">
                {worker.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="flex-1">
                <h2 className="font-display font-black text-white text-2xl">{worker.name}</h2>
                <p className="text-white/60 text-sm mt-0.5">{worker.role} · {worker.tenant}</p>
                <p className="text-white/40 text-xs mt-1">Since {worker.startDate}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-white/40 text-xs">Monthly Salary</p>
                  <p className="font-display font-bold text-[#C5612C] text-lg leading-tight">KES {worker.salary.toLocaleString()}</p>
                </div>
                <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-white/40 text-xs">Pay Cycle</p>
                  <p className="font-display font-bold text-white text-lg leading-tight">{worker.payCycle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance + Payments side by side */}
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Attendance Calendar */}
            <div className="fade-slide s2 lg:col-span-3 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">This Month</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-xl">{monthName} {year}</h3>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {["present","absent","half","leave","off"].map(k => (
                    <div key={k} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${attColor[k].bg}`} />
                      <span className="text-xs text-[#8B7355] capitalize">{attColor[k].label||k}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayLabels.map(d => <p key={d} className="text-center text-xs font-semibold text-[#8B7355] py-1">{d}</p>)}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={`e-${i}`} />;
                  const cfg = attColor[cell.status] || attColor.off;
                  const isToday = cell.day === today.getDate() && cell.status !== "future";
                  return (
                    <div key={cell.day}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all
                        ${cell.status==="future" ? "opacity-30" : "cursor-default"}
                        ${isToday ? "ring-2 ring-[#C5612C] ring-offset-1" : ""}
                        ${cell.status !== "future" && cell.status !== "off" ? cfg.light + " border" : ""}
                        ${cell.status==="off" ? "bg-stone-50" : ""}
                      `}>
                      <span className={`font-semibold ${isToday ? "text-[#C5612C]" : cfg.text} ${cell.status==="future" ? "text-stone-300" : ""}`}>
                        {cell.day}
                      </span>
                      {cell.status !== "future" && cell.status !== "off" && (
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg} mt-0.5`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Attendance summary */}
              <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[#F5EDE0]">
                {[
                  { label:"Present", count:attStats.present, color:"text-emerald-600", bg:"bg-emerald-50" },
                  { label:"Absent",  count:attStats.absent,  color:"text-red-600",     bg:"bg-red-50" },
                  { label:"Half",    count:attStats.half,    color:"text-amber-600",   bg:"bg-amber-50" },
                  { label:"Leave",   count:attStats.leave,   color:"text-blue-600",    bg:"bg-blue-50" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl py-2.5 text-center`}>
                    <p className={`font-display font-black text-xl ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-[#8B7355] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div className="fade-slide s3 lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD4] p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Salary</p>
                <h3 className="font-display font-bold text-[#1A1412] text-xl">Payment History</h3>
              </div>

              {/* Next payment banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base">⏳</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-800">March 2025 — Pending</p>
                  <p className="text-xs text-amber-600">KES 18,000 · Due Mar 31</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {payments.filter(p=>p.status==="paid").map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-[#F5EDE0] last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1412]">{p.period}</p>
                      <p className="text-xs text-[#8B7355]">{p.paidAt} · {p.method}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600">KES {p.amount.toLocaleString()}</p>
                      <p className="text-xs text-[#8B7355] font-mono">{p.ref !== "MANUAL" ? p.ref : "Cash"}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#F5EDE0] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8B7355]">Total paid (2024–2025)</span>
                  <span className="font-bold text-[#1A1412]">KES {(payments.filter(p=>p.status==="paid").reduce((a,p)=>a+p.amount,0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8B7355]">Next expected</span>
                  <span className="font-semibold text-amber-600">KES {worker.salary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}
