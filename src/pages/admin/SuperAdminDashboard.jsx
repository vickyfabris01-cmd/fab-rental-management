import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────
const tenants = [
  { id:1, name:"Sunrise Hostel",       slug:"sunrise-hostel",   owner:"Robert Njenga",  status:"active",    rooms:48, residents:36, joined:"Jan 2024" },
  { id:2, name:"Greenfield Apartments",slug:"greenfield-apts",  owner:"Alice Wambui",   status:"active",    rooms:30, residents:22, joined:"Mar 2024" },
  { id:3, name:"Maisha Student Lodge", slug:"maisha-lodge",     owner:"Francis Mutua",  status:"active",    rooms:80, residents:61, joined:"Aug 2023" },
  { id:4, name:"BluePeak Residences",  slug:"bluepeak",         owner:"Carol Achieng",  status:"pending",   rooms:30, residents:0,  joined:"Mar 2025" },
  { id:5, name:"Farmview Workers Est.",slug:"farmview",         owner:"Daniel Kamau",   status:"active",    rooms:36, residents:28, joined:"Nov 2023" },
  { id:6, name:"Kasarani Youth Hostel",slug:"kasarani",         owner:"Susan Waweru",   status:"suspended", rooms:60, residents:0,  joined:"Jun 2023" },
];
const growthData = [
  { month:"Sep",tenants:12,users:320 },
  { month:"Oct",tenants:15,users:410 },
  { month:"Nov",tenants:18,users:510 },
  { month:"Dec",tenants:22,users:640 },
  { month:"Jan",tenants:26,users:780 },
  { month:"Feb",tenants:30,users:940 },
  { month:"Mar",tenants:34,users:1100 },
];
const recentActivity = [
  { id:1, actor:"Alice Wambui",   action:"Approved move-in for tenant",   tenant:"Greenfield Apts",  time:"5m ago",   type:"success" },
  { id:2, actor:"Francis Mutua",  action:"Recorded payment KES 5,500",    tenant:"Maisha Lodge",     time:"12m ago",  type:"payment" },
  { id:3, actor:"BluePeak Res.",  action:"New tenant registration pending",tenant:"BluePeak",         time:"1h ago",   type:"pending" },
  { id:4, actor:"Robert Njenga",  action:"New complaint submitted",        tenant:"Sunrise Hostel",   time:"2h ago",   type:"warning" },
  { id:5, actor:"System",         action:"Billing cycles generated for Feb",tenant:"All tenants",     time:"3h ago",   type:"system" },
  { id:6, actor:"Daniel Kamau",   action:"Worker salary recorded",         tenant:"Farmview Estate",  time:"4h ago",   type:"payment" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({d,s=20,c=""}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d}/></svg>;
const HomeIcon   = () => <Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>;
const BuildingIcon=()=> <Ic d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>;
const UsersIcon  = () => <Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>;
const ChartIcon  = () => <Ic d="M18 20V10M12 20V4M6 20v-6"/>;
const WalletIcon = () => <Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>;
const ShieldIcon = () => <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>;
const MenuIcon   = () => <Ic d="M4 6h16M4 12h16M4 18h16"/>;
const BellIcon   = () => <Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>;
const CheckIcon  = () => <Ic d="M5 13l4 4L19 7" s={14}/>;
const XIcon      = () => <Ic d="M18 6L6 18M6 6l12 12" s={14}/>;
const EyeIcon    = () => <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z" s={14}/>;
const LogIcon    = () => <Ic d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>;
const LogoutIcon = () => <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;
const SettingsIcon=() => <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6zm6.93-2.5h1.57a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1.57a6.91 6.91 0 00-.67-1.6l1.11-1.11a.5.5 0 000-.71l-.71-.71a.5.5 0 00-.71 0l-1.11 1.11A6.91 6.91 0 0013 7.07V5.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.57a6.91 6.91 0 00-1.6.67L8.29 6.63a.5.5 0 00-.71 0l-.71.71a.5.5 0 000 .71l1.11 1.11A6.91 6.91 0 007.07 11H5.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1.57c.17.57.39 1.1.67 1.6l-1.11 1.11a.5.5 0 000 .71l.71.71a.5.5 0 00.71 0l1.11-1.11c.5.28 1.04.5 1.6.67V19.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1.57c.56-.17 1.1-.39 1.6-.67l1.11 1.11a.5.5 0 00.71 0l.71-.71a.5.5 0 000-.71l-1.11-1.11c.28-.5.5-1.04.67-1.6z"/>;

// ─── Tenant status badge ──────────────────────────────────────────────────────
const TenantBadge = ({status}) => {
  const cfg = {
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg[status]}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
};

// ─── Activity dot ────────────────────────────────────────────────────────────
const ActivityDot = ({type}) => {
  const cfg = {
    success: "bg-emerald-500", payment: "bg-blue-500",
    pending: "bg-amber-500",   warning: "bg-orange-500",
    system:  "bg-purple-500",
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg[type]||"bg-stone-400"}`} />;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [tenantList, setTenantList] = useState(tenants);
  const [filterStatus, setFilterStatus] = useState("all");

  const handleTenantAction = (id, action) => {
    setTenantList(t => t.map(x => x.id === id ? {...x, status: action==="approve"?"active":action==="suspend"?"suspended":x.status} : x));
  };

  const navGroups = [
    { items: [{ id:"overview",  label:"Platform Overview", icon:<HomeIcon /> }] },
    { label:"Management", items: [
      { id:"tenants",   label:"Tenants",           icon:<BuildingIcon />, badge:tenantList.filter(t=>t.status==="pending").length },
      { id:"users",     label:"All Users",         icon:<UsersIcon /> },
      { id:"revenue",   label:"Platform Revenue",  icon:<WalletIcon /> },
    ]},
    { label:"System", items: [
      { id:"analytics", label:"Analytics",    icon:<ChartIcon /> },
      { id:"audit",     label:"Audit Logs",   icon:<LogIcon /> },
      { id:"settings",  label:"Settings",     icon:<SettingsIcon /> },
      { id:"security",  label:"Security",     icon:<ShieldIcon /> },
    ]},
  ];

  const filtered = filterStatus === "all" ? tenantList : tenantList.filter(t => t.status === filterStatus);
  const totalResidents = tenantList.reduce((a,t)=>a+t.residents,0);
  const totalRooms = tenantList.reduce((a,t)=>a+t.rooms,0);
  const pendingCount = tenantList.filter(t=>t.status==="pending").length;

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#0F0D0C", fontFamily:"'DM Sans', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display{font-family:'Playfair Display',serif}
        .nav-item{transition:all 0.18s ease;border-radius:10px}
        .nav-item:hover{background:rgba(255,255,255,0.06)}
        .nav-item.active{background:rgba(197,97,44,0.15);border:1px solid rgba(197,97,44,0.3)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-slide{animation:fadeSlide 0.35s ease forwards}
        .s1{animation-delay:.04s;opacity:0}.s2{animation-delay:.08s;opacity:0}
        .s3{animation-delay:.12s;opacity:0}.s4{animation-delay:.16s;opacity:0}
        .s5{animation-delay:.20s;opacity:0}.s6{animation-delay:.24s;opacity:0}
        .tenant-row:hover{background:rgba(255,255,255,0.03)}
      `}</style>

      {/* ── Admin Sidebar (dark/dense) ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-56 flex flex-col border-r border-white/5 transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}
        style={{background:"#141210"}}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-[#C5612C] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">fabrentals</p>
            <p className="text-xs text-white/30 mt-0.5">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navGroups.map((g,gi) => (
            <div key={gi}>
              {g.label && <p className="text-xs text-white/20 font-semibold uppercase tracking-widest px-2 mb-1">{g.label}</p>}
              {g.items.map(item => (
                <button key={item.id} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-2.5 px-2.5 py-2 text-left mb-0.5 border border-transparent ${activePage===item.id?"active text-white":"text-white/40 hover:text-white/70"}`}>
                  <span className={`flex-shrink-0 ${activePage===item.id?"text-[#C5612C]":""}`}>{item.icon}</span>
                  <span className="text-xs font-medium flex-1">{item.label}</span>
                  {item.badge > 0 && <span className="bg-amber-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-white/5">
          <div className="flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg bg-white/5">
            <div className="w-7 h-7 rounded-full bg-[#C5612C] flex items-center justify-center text-xs font-bold text-white">SA</div>
            <div><p className="text-xs font-semibold text-white leading-none">Super Admin</p><p className="text-xs text-white/30">admin@fabrentals.co.ke</p></div>
          </div>
          <button className="nav-item w-full flex items-center gap-2.5 px-2.5 py-2 text-white/30 hover:text-red-400 border border-transparent">
            <LogoutIcon /><span className="text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 flex-shrink-0" style={{background:"#141210"}}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/40"><MenuIcon /></button>
            <div>
              <p className="text-xs text-white/30">Platform Administration</p>
              <h1 className="font-display font-bold text-white text-base leading-tight">Platform Overview</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">All systems operational</span>
            </div>
            <button className="relative text-white/40 hover:text-white/80 p-2 transition-colors">
              <BellIcon />
              {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{background:"#0F0D0C"}}>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Total Tenants",   value:tenantList.filter(t=>t.status==="active").length, sub:`${pendingCount} pending approval`,color:"#C5612C",alert:pendingCount>0 },
              { label:"Total Users",     value:"1,247",   sub:"all roles combined",               color:"#3B82F6",  alert:false },
              { label:"Total Rooms",     value:totalRooms, sub:"across all tenants",              color:"#8B5CF6",  alert:false },
              { label:"Active Residents",value:totalResidents, sub:`${Math.round(totalResidents/totalRooms*100)}% occupancy`, color:"#10B981", alert:false },
            ].map((s,i) => (
              <div key={s.label} className={`fade-slide s${i+1} rounded-xl p-4 border ${s.alert?"border-amber-500/30":"border-white/5"}`}
                style={{background:s.alert?"rgba(197,97,44,0.08)":"#1A1612"}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full" style={{background:s.color}} />
                  {s.alert && <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{pendingCount} pending</span>}
                </div>
                <p className="font-display font-black text-white text-2xl">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
                <p className="text-xs mt-0.5 font-medium" style={{color:s.color}}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Growth Chart + Activity */}
          <div className="grid lg:grid-cols-5 gap-4">
            {/* Growth */}
            <div className="fade-slide s2 lg:col-span-3 rounded-xl border border-white/5 p-5" style={{background:"#1A1612"}}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-[#C5612C] font-semibold uppercase tracking-widest mb-0.5">Platform Growth</p>
                  <h3 className="font-display font-bold text-white text-lg">Tenants & Users Over Time</h3>
                </div>
                <div className="flex gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#C5612C] inline-block rounded"/>Tenants</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#3B82F6] inline-block rounded"/>Users</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthData}>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:"rgba(255,255,255,0.3)"}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize:9,fill:"rgba(255,255,255,0.3)"}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:"rgba(255,255,255,0.3)"}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:"#1A1612",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:11,color:"white"}} />
                  <Line yAxisId="left" type="monotone" dataKey="tenants" stroke="#C5612C" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Feed */}
            <div className="fade-slide s3 lg:col-span-2 rounded-xl border border-white/5 p-5" style={{background:"#1A1612"}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white text-lg">Live Activity</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-3">
                {recentActivity.map(a => (
                  <div key={a.id} className="flex gap-2.5">
                    <ActivityDot type={a.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 leading-snug"><span className="font-semibold text-white">{a.actor}</span> — {a.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/30">{a.tenant}</span>
                        <span className="text-xs text-white/20">·</span>
                        <span className="text-xs text-white/30">{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="fade-slide s4 rounded-xl border border-white/5 overflow-hidden" style={{background:"#1A1612"}}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <p className="text-xs text-[#C5612C] font-semibold uppercase tracking-widest mb-0.5">Management</p>
                <h3 className="font-display font-bold text-white text-lg">All Tenants</h3>
              </div>
              <div className="flex gap-2">
                {["all","active","pending","suspended"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${filterStatus===s?"bg-[#C5612C] text-white":"text-white/40 hover:text-white/70"}`}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                    {s==="pending" && pendingCount > 0 && <span className="ml-1.5 bg-amber-400 text-black text-xs font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">{pendingCount}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Tenant","Owner","Status","Rooms","Residents","Joined","Actions"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-white/30 px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="tenant-row border-b border-white/5 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#C5612C]/15 flex items-center justify-center text-xs font-bold text-[#C5612C] flex-shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none">{t.name}</p>
                            <p className="text-xs text-white/30 mt-0.5">{t.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-white/60">{t.owner}</td>
                      <td className="px-5 py-3.5"><TenantBadge status={t.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-white/60">{t.rooms}</td>
                      <td className="px-5 py-3.5 text-sm text-white/60">{t.residents}</td>
                      <td className="px-5 py-3.5 text-xs text-white/40">{t.joined}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button className="w-7 h-7 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors" title="View"><EyeIcon /></button>
                          {t.status === "pending" && (
                            <button onClick={() => handleTenantAction(t.id,"approve")}
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors border border-emerald-500/20" title="Approve">
                              <CheckIcon />
                            </button>
                          )}
                          {t.status === "active" && (
                            <button onClick={() => handleTenantAction(t.id,"suspend")}
                              className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors border border-red-500/20" title="Suspend">
                              <XIcon />
                            </button>
                          )}
                          {t.status === "suspended" && (
                            <button onClick={() => handleTenantAction(t.id,"approve")}
                              className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors border border-emerald-500/20" title="Reactivate">
                              <CheckIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-white/30">Showing {filtered.length} of {tenantList.length} tenants</p>
              <div className="flex gap-1">
                {["←","1","2","3","→"].map(p => (
                  <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p==="1"?"bg-[#C5612C] text-white":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="fade-slide s5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:"Database",     status:"healthy", uptime:"99.99%",  latency:"12ms"  },
              { label:"Auth Service", status:"healthy", uptime:"100%",    latency:"8ms"   },
              { label:"M-Pesa API",   status:"healthy", uptime:"99.7%",   latency:"340ms" },
              { label:"SMS Gateway",  status:"warning", uptime:"98.2%",   latency:"620ms" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 p-4" style={{background:"#1A1612"}}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-white/60">{s.label}</p>
                  <span className={`w-2 h-2 rounded-full ${s.status==="healthy"?"bg-emerald-400":"bg-amber-400 animate-pulse"}`} />
                </div>
                <p className={`text-xs font-bold ${s.status==="healthy"?"text-emerald-400":"text-amber-400"}`}>{s.status.charAt(0).toUpperCase()+s.status.slice(1)}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-white/30">Uptime</span><span className="text-white/60 font-medium">{s.uptime}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-white/30">Latency</span><span className="text-white/60 font-medium">{s.latency}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}
