import { useState } from "react";
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Download,
  Activity,
  Clock,
  ExternalLink,
  Settings
} from "lucide-react";

export const UserLogsPage = ({ username, logs, onBack }) => {
  const [filterType, setFilterType] = useState("last20"); // "last20", "custom"
  const [searchQuery, setSearchQuery] = useState("");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  
  // New States for Kiosk Security rules
  const [showSettings, setShowSettings] = useState(false);
  const [kioskRules, setKioskRules] = useState({
    screenShotEnable: true,
    mouseTrackingEnable: true
  });
  const [successMsg, setSuccessMsg] = useState("");

  const getFilteredLogs = () => {
    let filtered = [...logs];

    // Apply Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.activity.toLowerCase().includes(q) || 
        (l.template && l.template.toLowerCase().includes(q))
      );
    }

    // Apply Custom Range Filter
    if (filterType === "custom") {
      if (customDates.start) {
        const start = new Date(customDates.start);
        filtered = filtered.filter(l => new Date(l.timestamp) >= start);
      }
      if (customDates.end) {
        const end = new Date(customDates.end);
        // Set end time to 23:59:59 of that day
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(l => new Date(l.timestamp) <= end);
      }
    }

    // Default view: limit to the last 20 logs
    if (filterType === "last20") {
      return filtered.slice(0, 20);
    }
    return filtered;
  };

  const exportToCSV = () => {
    const filtered = getFilteredLogs();
    if (filtered.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Activity,Timestamp\n";

    filtered.forEach((log) => {
      const activity = log.activity.replace(/"/g, '""');
      const time = new Date(log.timestamp).toISOString();
      csvContent += `"${activity}","${time}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${username}_activity_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveRules = () => {
    setSuccessMsg("Kiosk security policies updated successfully for " + username + "!");
    setTimeout(() => {
      setSuccessMsg("");
      setShowSettings(false); // return to logs view
    }, 2000);
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right-8 duration-700">
      {/* Header section */}
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
              <span>{showSettings ? "Kiosk Configuration" : "Session Logs"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Settings / Kiosk Rules Toggle Button */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
              showSettings 
                ? "bg-slate-850 border-slate-800 text-white shadow-lg bg-[#1e293b]" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings size={18} />
            <span>Kiosk Rules</span>
          </button>

          <button 
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>Report</span>
          </button>
          <button 
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* TOP: Custom Details / Filter Panel (Only shown in Logs View mode) */}
      {!showSettings && (
        <div className="neo-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* User Summary info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-xl font-black text-blue-600 shadow-md">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-none">{username}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-widest">Active • {filteredLogs.length} Logs</p>
            </div>
          </div>

          {/* Filter Type Selection */}
          <div className="flex items-center gap-2 bg-[#f8fafc] p-1.5 rounded-2xl border border-slate-100 self-center justify-self-start lg:justify-self-center">
            <button
              onClick={() => setFilterType("last20")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "last20" ? "bg-[#1b6ef3] text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Last 20
            </button>
            <button
              onClick={() => setFilterType("custom")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterType === "custom" ? "bg-[#1b6ef3] text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Keyword Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search activities..." 
              className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Date Pickers (Shown side-by-side below filter panel if Custom is active and not in settings) */}
      {!showSettings && filterType === "custom" && (
        <div className="neo-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-3 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-blue-500"
              value={customDates.start}
              onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-blue-500"
              value={customDates.end}
              onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* BOTTOM PANEL: Switches dynamically based on showSettings */}
      {showSettings ? (
        <div className="neo-card p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800">Kiosk Monitoring Configuration</h3>
              <p className="text-slate-400 font-bold text-xs mt-1">Configure active terminal monitoring rules for {username}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider text-center animate-in slide-in-from-top-2 duration-350">
              {successMsg}
            </div>
          )}

          <div className="space-y-6">
            {/* Toggle 1: Screen Shot Capture */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
              <div>
                <p className="text-sm font-black text-slate-700">Screen Capture Capture Stream</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Captures desktop screenshot immediately upon terminal unlocks</p>
              </div>
              <input 
                type="checkbox" 
                checked={kioskRules.screenShotEnable}
                onChange={(e) => setKioskRules({ ...kioskRules, screenShotEnable: e.target.checked })}
                className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Mouse Tracking */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
              <div>
                <p className="text-sm font-black text-slate-700">Mouse Movement Telemetry</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Records mouse tracking speed, click paths, and coordinates</p>
              </div>
              <input 
                type="checkbox" 
                checked={kioskRules.mouseTrackingEnable}
                onChange={(e) => setKioskRules({ ...kioskRules, mouseTrackingEnable: e.target.checked })}
                className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button 
              onClick={handleSaveRules}
              className="bg-[#1b6ef3] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <span>Save Kiosk Rules</span>
            </button>
            <button 
              onClick={() => setShowSettings(false)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="neo-card p-0 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800">Complete Activity Trail</h3>
              <p className="text-slate-400 font-bold text-xs mt-1">
                {filterType === "last20" ? "Viewing the last 20 logs" : "Viewing all matching logs"}
              </p>
            </div>
          </div>

          <div className="p-8">
            {filteredLogs.length === 0 ? (
              <div className="py-20 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                  <Activity size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm">No activity records found matching filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6 w-7/12">Activity Name</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-3/12">Date</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/12 text-right pr-6">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map((log, i) => (
                      <tr 
                        key={i} 
                        className="hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${i * 20}ms` }}
                      >
                        <td className="py-4 pl-6 font-black text-slate-800 text-sm w-7/12">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {log.activity.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl" title={log.activity}>
                              {log.activity}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-400 w-3/12 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="py-4 text-xs font-black text-slate-500 w-2/12 text-right pr-6 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
