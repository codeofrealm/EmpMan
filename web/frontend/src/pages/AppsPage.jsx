import { Bot, Boxes, Sparkles, Smartphone, Zap } from "lucide-react";

const apps = [
  {
    name: "CoreFlow",
    version: "v1.0.0",
    status: "Installed",
    description: "Core employee workflow engine for kiosk operations, attendance handling, and secure process flow.",
    icon: Boxes,
    color: "from-[#1d4ed8] to-[#38bdf8]",
  },
  {
    name: "EmpMap AI",
    version: "v1.0.0",
    status: "Installed",
    description: "AI support layer for employee mapping, activity understanding, and smart monitoring insights.",
    icon: Bot,
    color: "from-[#0f172a] to-[#2563eb]",
  },
];

export const AppsPage = ({ users = [], logs = [] }) => {
  return (
    <div className="p-10 space-y-8 animate-panel">
      <section className="neo-card p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500">Applications</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Installed Apps</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
          This page now shows only the core installed apps for your system: CoreFlow and EmpMap AI.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Summary title="Installed Apps" value={apps.length} icon={Boxes} />
        <Summary title="Active Devices" value={users.length} icon={Smartphone} />
        <Summary title="Loaded Events" value={logs.length} icon={Zap} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {apps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </section>
    </div>
  );
};

const Summary = ({ title, value, icon: Icon }) => (
  <div className="neo-card flex items-center gap-4 p-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon size={24} />
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
    <div className="neo-card overflow-hidden p-0">
      <div className={`bg-gradient-to-br ${app.color} p-8 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
            <Icon size={30} />
          </div>
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em]">
            {app.status}
          </span>
        </div>

        <h2 className="mt-6 text-3xl font-black tracking-tight">{app.name}</h2>
        <p className="mt-2 text-sm font-bold text-white/80">{app.version}</p>
      </div>

      <div className="p-8">
        <p className="text-sm font-medium leading-7 text-slate-600">{app.description}</p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Ready to use</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Stable application status</p>
          </div>
        </div>
      </div>
    </div>
  );
};
