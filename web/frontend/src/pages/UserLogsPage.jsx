import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  Download,
  Activity,
  User as UserIcon,
  Clock,
  ExternalLink
} from "lucide-react";

export const UserLogsPage = ({ username, logs, onBack }) => {
  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right-8 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-lg transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Activity History</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mt-1">
              <span>{username}</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span>Session Logs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            <Download size={18} />
            <span>Report</span>
          </button>
          <button className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
            <ExternalLink size={18} />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          {/* User Profile Card */}
          <div className="neo-card p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[32px] bg-blue-100 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-blue-600 mb-6">
                {username.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-black text-slate-800">{username}</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">Kiosk User Account</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</p>
                  <p className="text-lg font-black text-slate-800 mt-1">{logs.length}</p>
                </div>
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <p className="text-lg font-black text-emerald-500 mt-1">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="neo-card">
            <h4 className="font-black text-slate-800 mb-6">Filter Logs</h4>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-transparent hover:border-blue-100 cursor-pointer transition-all">
                  <Calendar size={16} className="text-blue-500" />
                  <span>Select dates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="neo-card p-0 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Complete Activity Trail</h3>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity size={18} />
                </div>
              </div>
            </div>

            <div className="p-8">
              {logs.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <Activity size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">No activity records found for this period.</p>
                </div>
              ) : (
                <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 relative group-hover:border-blue-500 group-hover:shadow-lg transition-all duration-300">
                          <Clock size={16} className="text-slate-400 group-hover:text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 pt-1 bg-white group-hover:bg-blue-50/30 p-6 rounded-[24px] border border-transparent group-hover:border-blue-50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-slate-800">{log.activity}</h4>
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Kiosk Unlock</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
