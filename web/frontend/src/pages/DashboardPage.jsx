import { useState } from "react";
import { 
  UserPlus, 
  Users, 
  Activity, 
  Clock, 
  Calendar as CalendarIcon, 
  ArrowUpRight,
  ChevronRight,
  Plus
} from "lucide-react";

export const DashboardPage = ({ 
  users, 
  logs, 
  selectedUser, 
  loading, 
  loggedInAdmin,
  onCreateUser, 
  onLoadLogs,
  onSelectUser
}) => {
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateUser(newUser.username, newUser.password);
    setNewUser({ username: "", password: "" });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Dashboard / Attendance & Live Stream</p>
        </div>
        <button 
          className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          onClick={() => {
            const el = document.getElementById('add-user-modal');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Plus size={18} />
          <span>Quick Provision</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-card p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1b6ef3]">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Employees</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{users.length} Registered</h3>
          </div>
        </div>

        <div className="neo-card p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Kiosk Terminals</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">1 Online</h3>
          </div>
        </div>

        <div className="neo-card p-6 flex items-center gap-6">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiosk Logs Stream</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">Operational</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Timesheet Card */}
        <div className="neo-card relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800">Timesheet</h3>
              <p className="text-xs text-slate-400 mt-0.5">11 Mar 2026</p>
            </div>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Clock size={16} />
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-xl p-4 mb-8 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Punch In at</p>
            <p className="text-sm font-bold text-slate-700 mt-1">Wed, 11th Mar 2026 10.00 AM</p>
          </div>

          <div className="flex flex-col items-center justify-center my-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * 0.43)} className="text-blue-500" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 tracking-tight">3.45 hrs</span>
              </div>
            </div>
          </div>

          <button className="w-full py-4 bg-[#4ade80] text-white font-black rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-500 transition-all active:scale-[0.98]">
            Punch Out
          </button>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
            <div className="text-center border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break</p>
              <p className="text-sm font-black text-slate-800 mt-1">1.21 hrs</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overtime</p>
              <p className="text-sm font-black text-slate-800 mt-1">3 hrs</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="neo-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Statistics</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
              <ArrowUpRight size={16} />
            </div>
          </div>

          <div className="space-y-6">
            <StatRow label="Today" value="3.45" max="8" color="bg-emerald-400" />
            <StatRow label="This Week" value="28" max="40" color="bg-orange-400" />
            <StatRow label="This Month" value="90" max="160" color="bg-amber-500" />
            <StatRow label="Remaining" value="90" max="160" color="bg-blue-50" />
            <StatRow label="Overtime" value="5" max="10" color="bg-yellow-400" />
          </div>
        </div>

        {/* Today Activity */}
        <div className="neo-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Today Activity</h3>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
              <Activity size={16} />
            </div>
          </div>

          <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            <ActivityItem time="10.00 AM" label="Punch In at" active />
            <ActivityItem time="11.00 AM" label="Punch Out at" />
            <ActivityItem time="11.30 AM" label="Punch In at" />
            <ActivityItem time="01.30 PM" label="Punch Out at" />
            <ActivityItem time="02.30 PM" label="Punch In at" />
          </div>
        </div>
      </div>

      {/* Master-Detail Columns for Employee logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Registered Employees List */}
        <div className="xl:col-span-4">
          <div className="neo-card h-[520px] flex flex-col">
            <div className="mb-6">
              <h3 className="font-black text-slate-800 text-xl">Employee Directory</h3>
              <p className="text-slate-400 font-bold text-xs mt-1">Select an employee to stream live logs</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {users.length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-sm font-medium">No employees provisioned yet.</p>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUser === u.username;
                  return (
                    <div 
                      key={u.username}
                      onClick={() => onSelectUser(u.username)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? "bg-blue-50/50 border-[#1b6ef3]/30 text-slate-800" 
                          : "bg-[#f8fafc] border-slate-100 hover:border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? "bg-[#1b6ef3] text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm">{u.username}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Created by {u.createdBy || "Admin"}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${
                        isSelected ? "text-[#1b6ef3] translate-x-0.5" : "text-slate-300 group-hover:translate-x-0.5"
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Logs Stream */}
        <div className="xl:col-span-8">
          <div className="neo-card h-[520px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-800 text-xl">Recent Activity Trail</h3>
                <p className="text-slate-400 font-bold text-xs mt-1">
                  {selectedUser ? `Live logs stream for ${selectedUser}` : "Real-time kiosk monitoring stream"}
                </p>
              </div>
              {selectedUser && (
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg animate-pulse">
                  <Activity size={16} className="text-emerald-500" />
                </div>
              )}
            </div>

            {selectedUser ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <p className="text-slate-400 text-sm font-medium">No live kiosk activity recorded for {selectedUser} yet.</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm">
                          {i + 1}
                        </div>
                        {i !== logs.length - 1 && <div className="w-[2px] h-full bg-slate-100 my-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-black text-slate-800 leading-none">{log.activity}</p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <CalendarIcon size={12} />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                  <Activity size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-800">No Employee Selected</h4>
                <p className="text-slate-400 font-bold text-xs mt-2 max-w-xs uppercase tracking-widest leading-normal">
                  Select an employee from the directory on the left to stream their live kiosk actions here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provision Employee Section */}
      <div id="add-user-modal" className="neo-card p-8 scroll-mt-8">
        <div className="mb-6">
          <h3 className="font-black text-slate-800 text-xl">Quick Provision Employee</h3>
          <p className="text-slate-400 font-bold text-xs mt-1">Register new terminal user credentials directly to PostgreSQL</p>
        </div>

        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              placeholder="Enter new username"
              className="premium-input h-[50px] w-full"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="premium-input h-[50px] w-full"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="premium-btn h-[50px] font-black w-full flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            <span>{loading ? "Provisioning..." : "Provision Employee"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, max, color }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-slate-800">{value} <span className="text-slate-400">/ {max} hrs</span></p>
    </div>
    <div className="neo-stat-bar">
      <div 
        className={`neo-stat-fill ${color}`} 
        style={{ width: `${(parseFloat(value) / parseFloat(max)) * 100}%` }} 
      />
    </div>
  </div>
);

const ActivityItem = ({ time, label, active = false }) => (
  <div className="flex items-center gap-4 relative">
    <div className={`w-[24px] h-[24px] rounded-full border-2 border-white shadow-sm z-10 ${
      active ? "bg-[#4ade80]" : "bg-slate-200"
    }`} />
    <div>
      <p className="text-xs font-black text-slate-800 leading-none">{label}</p>
      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{time}</p>
    </div>
  </div>
);
