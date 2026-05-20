import { Activity, AppWindow, Bot, CheckCircle2, DownloadCloud, LockKeyhole, Puzzle, RefreshCw, ShieldCheck, Smartphone, Zap } from "lucide-react";

const apps = [
  { name: "Kiosk Lock Agent", version: "v4.8.2", usage: "98%", status: "Synced", icon: LockKeyhole, color: "from-[#315EFB] to-[#5B6CFF]" },
  { name: "Attendance Vision", version: "v2.6.1", usage: "87%", status: "Verified", icon: Bot, color: "from-[#0EA5E9] to-[#315EFB]" },
  { name: "Mouse Telemetry", version: "v3.1.0", usage: "73%", status: "Online", icon: Activity, color: "from-[#22C55E] to-[#0EA5E9]" },
  { name: "Device Sentinel", version: "v5.0.4", usage: "91%", status: "Secured", icon: ShieldCheck, color: "from-[#0F172A] to-[#315EFB]" },
  { name: "Session Recorder", version: "v1.9.7", usage: "64%", status: "Update", icon: AppWindow, color: "from-[#F59E0B] to-[#EF4444]" },
  { name: "Policy Sync", version: "v6.3.3", usage: "100%", status: "Synced", icon: RefreshCw, color: "from-[#5B6CFF] to-[#7C3AED]" }
];

export const AppsPage = ({ users = [], logs = [] }) => {
  return (
    <div className="space-y-8 p-10 animate-panel">
      <section className="flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#315EFB]">
            <Puzzle size={15} />
            Kiosk application marketplace
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Apps & AI Tools</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Manage installed kiosk applications, AI tooling, security posture, and rollout compatibility.</p>
        </div>
        <button className="premium-btn h-12 gap-2 font-black">
          <DownloadCloud size={18} />
          Update Manager
        </button>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <Summary title="Installed apps" value={apps.length} icon={AppWindow} />
        <Summary title="Active devices" value={users.length} icon={Smartphone} />
        <Summary title="Security verified" value="100%" icon={ShieldCheck} />
        <Summary title="Events processed" value={logs.length} icon={Zap} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Installed Apps Grid</h2>
              <p className="text-sm font-semibold text-slate-400">Hover cards expose status, sync state, and quick actions.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {apps.map((app) => <AppCard key={app.name} app={app} />)}
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="AI Tools" icon={Bot} items={["Behavior anomaly detector", "Attendance forecasting", "Idle risk scoring", "Productivity summarizer"]} />
          <Panel title="Recent Installs" icon={DownloadCloud} items={["Policy Sync deployed to all kiosks", "Device Sentinel patched", "Vision model optimized"]} />
          <Panel title="Compatibility" icon={CheckCircle2} items={["Windows kiosk agent ready", "PostgreSQL API verified", "Realtime stream healthy"]} />
        </div>
      </section>
    </div>
  );
};

const Summary = ({ title, value, icon: Icon }) => (
  <div className="neo-card flex items-center gap-4">
    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-[#315EFB]">
      <Icon size={22} />
    </div>
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const AppCard = ({ app }) => {
  const Icon = app.icon;
  return (
    <div className="neo-card group overflow-hidden p-0 hover:-translate-y-1">
      <div className={`bg-gradient-to-br ${app.color} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/18">
            <Icon size={27} />
          </div>
          <span className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{app.status}</span>
        </div>
        <h3 className="mt-6 text-2xl font-black">{app.name}</h3>
        <p className="mt-1 text-sm font-bold text-white/72">{app.version} - last sync 2 min ago</p>
      </div>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-black text-slate-500">Usage stats</span>
          <span className="text-xl font-black text-slate-900">{app.usage}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-[#315EFB] to-[#22C55E]" style={{ width: app.usage }} />
        </div>
        <div className="mt-6 flex gap-3">
          <button className="h-11 flex-1 rounded-2xl bg-slate-50 text-sm font-black text-slate-600 transition-all hover:bg-slate-100">Details</button>
          <button className="h-11 flex-1 rounded-2xl bg-[#315EFB] text-sm font-black text-white shadow-lg shadow-blue-500/20">Sync</button>
        </div>
      </div>
    </div>
  );
};

const Panel = ({ title, icon: Icon, items }) => (
  <div className="neo-card">
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <div className="rounded-2xl bg-blue-50 p-3 text-[#315EFB]">
        <Icon size={19} />
      </div>
    </div>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
          <p className="text-sm font-bold text-slate-600">{item}</p>
        </div>
      ))}
    </div>
  </div>
);
