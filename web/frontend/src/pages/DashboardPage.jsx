import { useMemo, useState } from "react";
import {
  UserPlus,
  Users,
  Activity,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  TrendingUp,
  Database,
  SearchX,
} from "lucide-react";

const HOURLY_BUCKETS = Array.from({ length: 6 }, (_, index) => {
  const hour = index * 4;
  return {
    label: `${String(hour).padStart(2, "0")}:00`,
    start: hour,
    end: hour + 4,
  };
});

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

export const DashboardPage = ({
  users,
  logs,
  selectedUser,
  loading,
  loggedInAdmin,
  searchTerm = "",
  onCreateUser,
  onLoadLogs,
  onSelectUser,
}) => {
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateUser(newUser.username, newUser.password);
    setNewUser({ username: "", password: "" });
  };

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const base = [...users].sort((a, b) => a.username.localeCompare(b.username));

    if (!normalized) return base;
    return base.filter((user) => {
      const createdBy = (user.createdBy || "").toLowerCase();
      return (
        user.username.toLowerCase().includes(normalized) ||
        createdBy.includes(normalized)
      );
    });
  }, [users, searchTerm]);

  const metrics = useMemo(() => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const todayKey = new Date().toDateString();
    const todayLogs = sortedLogs.filter(
      (log) => new Date(log.timestamp).toDateString() === todayKey
    );
    const latestLog = sortedLogs[sortedLogs.length - 1] || null;

    const hourlyActivity = HOURLY_BUCKETS.map((bucket) => {
      const count = todayLogs.filter((log) => {
        const hour = new Date(log.timestamp).getHours();
        return hour >= bucket.start && hour < bucket.end;
      }).length;

      return {
        ...bucket,
        count,
      };
    });

    const peakCount = Math.max(...hourlyActivity.map((item) => item.count), 1);

    return {
      totalEmployees: users.length,
      filteredEmployees: filteredUsers.length,
      logCount: logs.length,
      todayCount: todayLogs.length,
      latestLog,
      hourlyActivity,
      peakCount,
    };
  }, [users, filteredUsers.length, logs]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-200/80">Operations Overview</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Clean dashboard for employee activity monitoring</h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-200/80">
              Welcome, {loggedInAdmin}. This dashboard now uses your live employee list and current database logs instead of placeholder values.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900 transition-all hover:bg-slate-100"
            onClick={() => {
              const el = document.getElementById("add-user-modal");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Plus size={18} />
            <span>Quick Provision</span>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <HeroMetric
            label="Total Employees"
            value={String(metrics.totalEmployees)}
            helper={`${metrics.filteredEmployees} visible in dashboard search`}
            icon={Users}
          />
          <HeroMetric
            label="Loaded Activity Logs"
            value={String(metrics.logCount)}
            helper={selectedUser ? `Current stream for ${selectedUser}` : "Select an employee to load logs"}
            icon={Database}
          />
          <HeroMetric
            label="Today Activity"
            value={String(metrics.todayCount)}
            helper={metrics.todayCount > 0 ? "Events recorded today" : "No events recorded today"}
            icon={TrendingUp}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="neo-card h-full p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Activity Graph</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Exact log distribution by time</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {selectedUser
                    ? `Showing today's loaded activity buckets for ${selectedUser}.`
                    : "Choose an employee to see their loaded database activity pattern."}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Latest Event</p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {metrics.latestLog ? metrics.latestLog.activity : "No activity"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {metrics.latestLog ? `${formatDate(metrics.latestLog.timestamp)} at ${formatTime(metrics.latestLog.timestamp)}` : "Waiting for log data"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-6 items-end gap-3 rounded-[28px] bg-slate-50 p-6">
              {metrics.hourlyActivity.map((item) => {
                const barHeight = Math.max((item.count / metrics.peakCount) * 220, item.count > 0 ? 32 : 12);
                return (
                  <div key={item.label} className="flex flex-col items-center gap-3">
                    <span className="text-xs font-black text-slate-500">{item.count}</span>
                    <div className="flex h-56 w-full items-end justify-center rounded-2xl bg-white px-2 py-3 shadow-sm">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-300 transition-all duration-500"
                        style={{ height: `${barHeight}px` }}
                        title={`${item.label} - ${item.count} logs`}
                      />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="neo-card h-full p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Live Summary</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Current database snapshot</h2>

            <div className="mt-6 space-y-4">
              <InfoRow label="Selected Employee" value={selectedUser || "Not selected"} />
              <InfoRow label="Loaded Logs" value={String(metrics.logCount)} />
              <InfoRow label="Today Logs" value={String(metrics.todayCount)} />
              <InfoRow label="Admin Account" value={loggedInAdmin || "Admin"} />
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Latest activity time</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {metrics.latestLog ? formatTime(metrics.latestLog.timestamp) : "No logs loaded"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Recent Activity Text</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {metrics.latestLog ? metrics.latestLog.activity : "Open an employee stream to see exact activity values here."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="neo-card h-[560px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Employee Directory</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Search from top bar is active
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Visible</p>
                <p className="text-lg font-black text-slate-900">{filteredUsers.length}</p>
              </div>
            </div>

            <div className="h-[468px] overflow-y-auto pr-2 space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                    <SearchX size={30} />
                  </div>
                  <p className="mt-4 text-lg font-black text-slate-900">No employee found</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Try another search in the dashboard header.
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser === user.username;
                  return (
                    <button
                      key={user.username}
                      type="button"
                      onClick={() => onLoadLogs(user.username)}
                      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                        isSelected
                          ? "border-blue-200 bg-blue-50 shadow-[0_18px_40px_rgba(59,130,246,0.14)]"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{user.username}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                              Created by {user.createdBy || "Admin"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={isSelected ? "text-blue-600" : "text-slate-300"} size={18} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="neo-card h-[560px] p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Recent Activity Stream</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  {selectedUser ? `Exact loaded database logs for ${selectedUser}` : "Select an employee to inspect logs"}
                </p>
              </div>
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => onLoadLogs(selectedUser)}
                  className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-blue-700"
                >
                  Open Full History
                </button>
              )}
            </div>

            {selectedUser ? (
              <div className="h-[468px] overflow-y-auto pr-2 space-y-4">
                {logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                      <Activity size={30} />
                    </div>
                    <p className="mt-4 text-lg font-black text-slate-900">No activity loaded</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      This employee has no loaded logs yet.
                    </p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={`${log.timestamp}-${index}`} className="rounded-[24px] border border-slate-100 bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 font-black text-blue-600">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-black text-slate-900">{log.activity}</p>
                            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              <CalendarIcon size={12} />
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              {formatTime(log.timestamp)}
                            </span>
                            {log.template && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-600">
                                {log.template}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex h-[468px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <Activity size={30} />
                </div>
                <p className="mt-4 text-lg font-black text-slate-900">No Employee Selected</p>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                  Select an employee from the left panel to load their exact activity values and graph data from the current log stream.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="add-user-modal" className="neo-card p-8 scroll-mt-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Quick Provision Employee</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Register a new employee directly into the database-backed kiosk system.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Current Status</p>
            <p className="mt-1 text-sm font-black text-slate-900">{loading ? "Provisioning in progress" : "Ready to create employee"}</p>
          </div>
        </div>

        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Username</label>
            <input
              type="text"
              placeholder="Enter new username"
              className="premium-input h-[54px] w-full"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="premium-input h-[54px] w-full"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="premium-btn flex h-[54px] w-full items-center justify-center gap-2 font-black"
          >
            <UserPlus size={18} />
            <span>{loading ? "Provisioning..." : "Provision Employee"}</span>
          </button>
        </form>
      </section>
    </div>
  );
};

const HeroMetric = ({ label, value, helper, icon: Icon }) => (
  <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-100/70">{label}</p>
        <p className="mt-2 text-3xl font-black text-white">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-50">
        <Icon size={22} />
      </div>
    </div>
    <p className="mt-3 text-xs font-bold text-slate-200/80">{helper}</p>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-3">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <p className="text-sm font-black text-slate-900 text-right">{value}</p>
  </div>
);
