import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────
const revenueData = [
  { month:"Sep",expected:320000,collected:298000 },
  { month:"Oct",expected:336000,collected:321000 },
  { month:"Nov",expected:336000,collected:310000 },
  { month:"Dec",expected:352000,collected:344000 },
  { month:"Jan",expected:352000,collected:341000 },
  { month:"Feb",expected:352000,collected:338000 },
  { month:"Mar",expected:364000,collected:170000 },
];
const occupancyTrend = [
  { month:"Sep",rate:72 },{ month:"Oct",rate:78 },{ month:"Nov",rate:80 },
  { month:"Dec",rate:85 },{ month:"Jan",rate:82 },{ month:"Feb",rate:86 },
  { month:"Mar",rate:75 },
];
const paymentMethods = [
  { name:"M-Pesa",   value:78, color:"#10B981" },
  { name:"Cash",     value:15, color:"#C5612C" },
  { name:"Bank",     value:7,  color:"#3B82F6" },
];
const buildings = [
  { name:"Block A", rooms:16, occupied:14, revenue:238000, collected:224000, rate:88 },
  { name:"Block B", rooms:16, occupied:13, revenue:195000, collected:182000, rate:82 },
  { name:"Block C", rooms:16, occupied:9,  revenue:216000, collected:198000, rate:75 },
];
const workers = [
  { name:"Samuel Oloo",  role:"Security",    salary:18000, nextPay:"Mar 30" },
  { name:"Esther Waweru",role:"Cleaner",     salary:15000, nextPay:"Mar 30" },
  { name:"Peter Mugo",   role:"Maintenance", salary:20000, nextPay:"Mar 30" },
  { name:"Joyce Auma",   role:"Cleaner",     salary:15000, nextPay:"Mar 30" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({d,s=20,c=""}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d}/></svg>;
const HomeIcon   = () => <Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>;
const ChartIcon  = () => <Ic d="M18 20V10M12 20V4M6 20v-6"/>;
const WalletIcon = () => <Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>;
const GridIcon   = () => <Ic d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>;
const ToolsIcon  = () => <Ic d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>;
const BellIcon   = () => <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>;
const MenuIcon   = () => <Ic d="M4 6h16M4 12h16M4 18h16"/>;
const UserIcon   = () => <Ic d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>;
const LogoutIcon = () => <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;
const ArrowUp    = () => <Ic d="M5 15l7-7 7 7" s={14}/>;
const ArrowDown  = () => <Ic d="M19 9l-7 7-7-7" s={14}/>;
const DownloadIcon=() => <Ic d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" s={16}/>;

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1412] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white/60 mb-1.5 font-semibold">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-semibold" style={{color:p.color}}>
          {p.name}: KES {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [period, setPeriod] = useState("6m");

  const navItems = [
    { id:"overview",   label:"Overview",          icon:<HomeIcon /> },
    { id:"occupancy",  label:"Occupancy Report",  icon:<GridIcon /> },
    { id:"financials", label:"Financial Summary", icon:<WalletIcon /> },
    { id:"billing",    label:"Billing",           icon:<WalletIcon /> },
    { id:"workforce",  label:"Worker Costs",      icon:<ToolsIcon /> },
    { id:"analytics",  label:"Analytics",         icon:<ChartIcon /> },
  ];

  const totalExpected  = 364000;
  const totalCollected = 170000; // March partial
  const outstanding    = totalExpected - totalCollected;
  const workerPayroll  = workers.reduce((a,w)=>a+w.salary,0);
  const netCashFlow    = totalCollected - workerPayroll;
  const collectionRate = Math.round((totalCollected/totalExpected)*100);

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

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}
        style={{background:"linear-gradient(180deg,#1A1412 0%,#2D1E16 100%)"}}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#C5612C] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">Sunrise Hostel</p>
            <p className="text-xs text-white/40">Owner Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${activePage===item.id?"active text-white":"text-white/50 hover:text-white/80"}`}>
              <span className={activePage===item.id?"text-[#C5612C]":""}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#C5612C]/20 flex items-center justify-center text-xs font-bold text-[#C5612C]">RN</div>
            <div><p className="text-xs font-semibold text-white">Robert Njenga</p><p className="text-xs text-white/40">Owner</p></div>
          </div>
          <button className="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:text-red-400 mt-1">
            <LogoutIcon /><span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8DDD4] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#8B7355]"><MenuIcon /></button>
            <div>
              <p className="text-xs text-[#8B7355]">Owner View · Read-only</p>
              <h1 className="font-display font-bold text-[#1A1412] text-lg">Business Overview</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="hidden sm:flex bg-[#F5EDE0] rounded-full p-1 gap-0.5">
              {["1m","3m","6m","1y"].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${period===p?"bg-white text-[#C5612C] shadow-sm":"text-[#8B7355] hover:text-[#1A1412]"}`}>
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 border border-[#E8DDD4] text-[#5C4A3A] text-xs font-medium px-3 py-2 rounded-full hover:border-[#C5612C] transition-colors">
              <DownloadIcon /> Export
            </button>
            <button className="relative text-[#8B7355] hover:text-[#C5612C] p-2"><BellIcon /></button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label:"Total Units",     value:"48",                    sub:"across 3 buildings",   trend:null,    color:"#3B82F6" },
              { label:"Occupancy Rate",  value:`${collectionRate}%`,   sub:"36 of 48 occupied",    trend:"up",    color:"#10B981" },
              { label:"Expected Revenue",value:"KES 364K",             sub:"March 2025",            trend:null,    color:"#8B5CF6" },
              { label:"Collected",       value:`KES ${(totalCollected/1000).toFixed(0)}K`, sub:`${collectionRate}% collection rate`,trend:"down",color:"#C5612C"},
              { label:"Outstanding",     value:`KES ${(outstanding/1000).toFixed(0)}K`,   sub:"from 28 tenants",  trend:"down",  color:"#EF4444" },
              { label:"Net Cash Flow",   value:`KES ${(netCashFlow/1000).toFixed(0)}K`,   sub:"after payroll",    trend:"up",    color:"#10B981" },
            ].map((s,i) => (
              <div key={s.label} className={`fade-slide s${i+1} card-lift bg-white rounded-2xl p-4 border border-[#E8DDD4]`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}} />
                  {s.trend && (
                    <span className={`flex items-center text-xs font-semibold ${s.trend==="up"?"text-emerald-600":"text-red-500"}`}>
                      {s.trend==="up"?<ArrowUp/>:<ArrowDown/>}
                    </span>
                  )}
                </div>
                <p className="font-display font-black text-[#1A1412] text-xl leading-none">{s.value}</p>
                <p className="text-xs text-[#8B7355] mt-1 font-medium">{s.label}</p>
                <p className="text-xs mt-0.5 font-medium" style={{color:s.color}}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart + Payment Methods */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Revenue Chart */}
            <div className="fade-slide s2 lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Financial</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-xl">Revenue vs Collections</h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-[#E8DDD4] inline-block"/>Expected</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-[#C5612C] inline-block"/>Collected</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} barGap={4} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#8B7355"}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:10,fill:"#8B7355"}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<RevenueTooltip />} cursor={{fill:"rgba(197,97,44,0.04)"}} />
                  <Bar dataKey="expected" fill="#F5EDE0" radius={[6,6,0,0]} />
                  <Bar dataKey="collected" fill="#C5612C" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Pie */}
            <div className="fade-slide s3 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Breakdown</p>
                <h3 className="font-display font-bold text-[#1A1412] text-xl">Payment Methods</h3>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {paymentMethods.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v)=>`${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentMethods.map(m => (
                  <div key={m.name} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:m.color}} />
                    <span className="text-sm text-[#5C4A3A] flex-1">{m.name}</span>
                    <span className="text-sm font-bold text-[#1A1412]">{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Occupancy Trend + Buildings */}
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Occupancy Line Chart */}
            <div className="fade-slide s3 lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Trend</p>
                <h3 className="font-display font-bold text-[#1A1412] text-xl">Occupancy Rate</h3>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={occupancyTrend}>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#8B7355"}} axisLine={false} tickLine={false} />
                  <YAxis domain={[60,100]} tick={{fontSize:10,fill:"#8B7355"}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                  <Tooltip formatter={(v)=>`${v}%`} contentStyle={{background:"#1A1412",border:"none",borderRadius:12,fontSize:12,color:"white"}} />
                  <Line type="monotone" dataKey="rate" stroke="#C5612C" strokeWidth={2.5} dot={{fill:"#C5612C",r:4,strokeWidth:0}} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#8B7355]">Current occupancy</span>
                <span className="font-bold text-[#C5612C] text-base">75%</span>
              </div>
            </div>

            {/* Buildings Table */}
            <div className="fade-slide s4 lg:col-span-3 bg-white rounded-2xl border border-[#E8DDD4] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Properties</p>
                  <h3 className="font-display font-bold text-[#1A1412] text-xl">Building Performance</h3>
                </div>
              </div>
              <div className="space-y-4">
                {buildings.map(b => {
                  const collRate = Math.round((b.collected/b.revenue)*100);
                  return (
                    <div key={b.name} className="p-4 rounded-xl border border-[#F5EDE0] hover:border-[#C5612C]/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-[#1A1412]">{b.name}</p>
                          <p className="text-xs text-[#8B7355]">{b.occupied}/{b.rooms} rooms · {b.rate}% occupied</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#C5612C]">KES {(b.collected/1000).toFixed(0)}K</p>
                          <p className="text-xs text-[#8B7355]">of KES {(b.revenue/1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#F5EDE0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${collRate}%`,background:collRate>=90?"#10B981":collRate>=70?"#C5612C":"#EF4444"}} />
                      </div>
                      <p className="text-xs text-[#8B7355] mt-1">{collRate}% collected</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Worker Costs */}
          <div className="fade-slide s5 bg-white rounded-2xl border border-[#E8DDD4] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C5612C] mb-0.5">Operations</p>
                <h3 className="font-display font-bold text-[#1A1412] text-xl">Worker Payroll</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8B7355]">Monthly payroll</p>
                <p className="font-display font-black text-[#1A1412] text-xl">KES {workerPayroll.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workers.map(w => (
                <div key={w.name} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD4]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1412]/10 flex items-center justify-center text-xs font-bold text-[#1A1412]">
                      {w.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A1412] leading-none">{w.name.split(" ")[0]}</p>
                      <p className="text-xs text-[#8B7355]">{w.role}</p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-[#1A1412]">KES {w.salary.toLocaleString()}</p>
                  <p className="text-xs text-[#8B7355] mt-0.5">Due {w.nextPay}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#F5EDE0] flex justify-between items-center">
              <p className="text-sm text-[#8B7355]">Total workers: {workers.length}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#8B7355]">% of collected revenue</span>
                <span className="font-bold text-[#C5612C]">{Math.round((workerPayroll/totalCollected)*100)}%</span>
              </div>
            </div>
          </div>

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}
