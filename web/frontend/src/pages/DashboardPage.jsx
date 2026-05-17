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
  onLoadLogs 
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
          <h1 className="text-2xl font-black text-slate-800">Attendance</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Dashboard / Attendance</p>
        </div>
        <button 
          className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          onClick={() => document.getElementById('add-user-modal').scrollIntoView({ behavior: 'smooth' })}
        >
          <Plus size={18} />
          <span>Quick Provision</span>
        </button>
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
            <StatRow label="Remaining" value="90" max="160" color="bg-blue-500" />
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Activity Logs (Full Width) */}
        <div className="xl:col-span-12">
          <div className="neo-card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-slate-800 text-xl">Recent Activity Trail</h3>
                <p className="text-slate-400 font-bold text-xs mt-1">Real-time kiosk monitoring stream</p>
              </div>
              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                <ArrowUpRight size={16} />
              </div>
            </div>

            {selectedUser ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
                  {logs.length === 0 ? (
                    <p className="text-center py-12 text-slate-400 text-sm font-medium">No records for {selectedUser}</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-4 group">
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
                <div className="bg-[#f8fafc] rounded-[32px] p-8 flex flex-col items-center justify-center text-center border border-slate-50">
                   <div className="w-20 h-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center text-2xl font-black text-[#1b6ef3] mb-6">
                     {selectedUser.charAt(0).toUpperCase()}
                   </div>
                   <h4 className="text-xl font-black text-slate-800">{selectedUser}</h4>
                   <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Active Session</p>
                   <button 
                    onClick={() => onLoadLogs(selectedUser)}
                    className="mt-8 px-6 py-3 bg-white text-[#1b6ef3] font-black rounded-xl shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all active:scale-95 flex items-center gap-2"
                   >
                     <ChevronRight size={18} />
                     <span>View Full Profile</span>
                   </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6">
                  <Activity size={40} />
                </div>
                <h4 className="text-xl font-black text-slate-800">No User Selected</h4>
                <p className="text-slate-400 font-bold text-sm mt-2 max-w-xs">
                  Go to the Employee Directory to select a member and monitor their live activity stream here.
                </p>
              </div>
            )}
          </div>
        </div>
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
