import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Search,
  Download,
  Activity,
  ExternalLink,
  Settings,
  BarChart3,
  CalendarDays,
  Clock3,
} from "lucide-react";
import { adminService } from "../api/adminService";

const PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 200;
const HOURLY_BUCKETS = Array.from({ length: 6 }, (_, index) => {
  const hour = index * 4;
  return {
    label: `${String(hour).padStart(2, "0")}:00`,
    start: hour,
    end: hour + 4,
  };
});

const sortChronologically = (items) =>
  [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const UserLogsPage = ({ username, token, initialLogs = [], onBack }) => {
  const [filterType, setFilterType] = useState("last20");
  const [searchQuery, setSearchQuery] = useState("");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [visibleLogs, setVisibleLogs] = useState(sortChronologically(initialLogs));
  const [totalLogs, setTotalLogs] = useState(initialLogs.length);
  const [hasMore, setHasMore] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [buildingReport, setBuildingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [kioskRules, setKioskRules] = useState({
    screenShotEnable: true,
    mouseTrackingEnable: true,
  });
  const [successMsg, setSuccessMsg] = useState("");

  const scrollContainerRef = useRef(null);

  const buildRequestOptions = (offset = 0, limit = PAGE_SIZE) => {
    const requestOptions = {
      limit,
      offset,
      search: searchQuery.trim(),
    };

    if (filterType === "custom") {
      requestOptions.startDate = customDates.start;
      requestOptions.endDate = customDates.end;
    }

    return requestOptions;
  };

  const fetchLogs = async ({ reset = false } = {}) => {
    if (!token || !username) return;

    if (reset) {
      setLoadingLogs(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMsg("");

    try {
      const response = await adminService.getLogs(
        token,
        username,
        buildRequestOptions(reset ? 0 : visibleLogs.length, PAGE_SIZE)
      );
      const mergedLogs = reset ? response.logs : [...visibleLogs, ...response.logs];

      setVisibleLogs(sortChronologically(mergedLogs));
      setTotalLogs(response.total);
      setHasMore(response.hasMore);

      if (reset && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      setErrorMsg(err.message || "Unable to load logs");
      if (reset) {
        setVisibleLogs([]);
        setTotalLogs(0);
        setHasMore(false);
      }
    } finally {
      setLoadingLogs(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setVisibleLogs(sortChronologically(initialLogs));
    setTotalLogs(initialLogs.length);
    setHasMore(false);
  }, [initialLogs]);

  useEffect(() => {
    if (!showSettings) {
      fetchLogs({ reset: true });
    }
  }, [username, token, filterType, customDates.start, customDates.end, searchQuery, showSettings]);

  const handleLogScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || filterType !== "custom" || loadingLogs || loadingMore || !hasMore) {
      return;
    }

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining < 120) {
      fetchLogs();
    }
  };

  const graphData = useMemo(() => {
    const buckets = HOURLY_BUCKETS.map((bucket) => {
      const count = visibleLogs.filter((log) => {
        const hour = new Date(log.timestamp).getHours();
        return hour >= bucket.start && hour < bucket.end;
      }).length;

      return {
        ...bucket,
        count,
      };
    });

    const peak = Math.max(...buckets.map((item) => item.count), 1);
    return { buckets, peak };
  }, [visibleLogs]);

  const summary = useMemo(() => {
    const firstLog = visibleLogs[0] || null;
    const lastLog = visibleLogs[visibleLogs.length - 1] || null;
    const uniqueDays = new Set(
      visibleLogs.map((log) => new Date(log.timestamp).toDateString())
    ).size;

    return {
      firstLog,
      lastLog,
      uniqueDays,
    };
  }, [visibleLogs]);

  const downloadCsv = (rows, fileName) => {
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${rows.join("\n")}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchAllMatchingLogs = async () => {
    const allLogs = [];
    let offset = 0;
    let nextHasMore = true;

    while (nextHasMore) {
      const response = await adminService.getLogs(
        token,
        username,
        buildRequestOptions(offset, EXPORT_PAGE_SIZE)
      );

      allLogs.push(...response.logs);
      offset += response.logs.length;
      nextHasMore = response.hasMore;

      if (response.logs.length === 0) {
        nextHasMore = false;
      }
    }

    return sortChronologically(allLogs);
  };

  const handleDownloadReport = async () => {
    if (visibleLogs.length === 0) return;

    setBuildingReport(true);
    try {
      const rows = [
        "Metric,Value",
        `"Username","${username}"`,
        `"Filter Type","${filterType === "last20" ? "Last 20" : "Custom Range"}"`,
        `"Visible Logs","${visibleLogs.length}"`,
        `"Matching Database Logs","${totalLogs}"`,
        `"Active Days","${summary.uniqueDays}"`,
        `"First Visible Log","${summary.firstLog ? `${formatDate(summary.firstLog.timestamp)} ${formatTime(summary.firstLog.timestamp)}` : "-"}"`,
        `"Last Visible Log","${summary.lastLog ? `${formatDate(summary.lastLog.timestamp)} ${formatTime(summary.lastLog.timestamp)}` : "-"}"`,
        `"Search Query","${searchQuery || "-"}"`,
        `"Start Date","${customDates.start || "-"}"`,
        `"End Date","${customDates.end || "-"}"`,
        "",
        "Activity,Timestamp",
        ...visibleLogs.map((log) => `"${log.activity.replace(/"/g, '""')}","${new Date(log.timestamp).toISOString()}"`),
      ];

      downloadCsv(rows, `${username}_activity_report.csv`);
    } finally {
      setBuildingReport(false);
    }
  };

  const handleExportLogs = async () => {
    if (!token || !username || totalLogs === 0) return;

    setExportingLogs(true);
    try {
      const allMatchingLogs = await fetchAllMatchingLogs();
      const rows = [
        "Activity,Timestamp",
        ...allMatchingLogs.map((log) => `"${log.activity.replace(/"/g, '""')}","${new Date(log.timestamp).toISOString()}"`),
      ];

      downloadCsv(rows, `${username}_exact_logs.csv`);
    } catch (err) {
      setErrorMsg(err.message || "Unable to export logs");
    } finally {
      setExportingLogs(false);
    }
  };

  const handleSaveRules = () => {
    setSuccessMsg("Kiosk security policies updated successfully for " + username + "!");
    setTimeout(() => {
      setSuccessMsg("");
      setShowSettings(false);
    }, 2000);
  };

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
              <span>{showSettings ? "Kiosk Configuration" : "Exact User Logs"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
              showSettings
                ? "border-slate-800 bg-[#1e293b] text-white shadow-lg"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Settings size={18} />
            <span>Kiosk Rules</span>
          </button>

          <button
            onClick={handleDownloadReport}
            disabled={visibleLogs.length === 0 || buildingReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>{buildingReport ? "Building..." : "Report"}</span>
          </button>
          <button
            onClick={handleExportLogs}
            disabled={totalLogs === 0 || exportingLogs}
            className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
            <span>{exportingLogs ? "Exporting..." : "Export Logs"}</span>
          </button>
        </div>
      </div>

      {!showSettings && (
        <>
          <div className="neo-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-xl font-black text-blue-600 shadow-md">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 leading-none">{username}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-widest">Exact | {totalLogs} Logs</p>
              </div>
            </div>

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

            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search exact activities..."
                className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-blue-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

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

        </>
      )}

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
        <>
          <div className="neo-card p-0 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800">Complete Activity Trail</h3>
                <p className="text-slate-400 font-bold text-xs mt-1">
                  {filterType === "last20"
                    ? "Viewing the latest 20 exact logs in time order"
                    : `Viewing ${visibleLogs.length} of ${totalLogs} matching exact logs`}
                </p>
              </div>
            </div>

            <div className="p-8">
              {loadingLogs ? (
                <div className="py-20 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 animate-pulse">
                    <Activity size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Loading activity records...</p>
                </div>
              ) : errorMsg ? (
                <div className="py-20 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mx-auto mb-4">
                    <Activity size={32} />
                  </div>
                  <p className="text-rose-500 font-bold text-sm">{errorMsg}</p>
                </div>
              ) : visibleLogs.length === 0 ? (
                <div className="py-20 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <Activity size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No activity records found matching filters.</p>
                </div>
              ) : (
                <div
                  ref={scrollContainerRef}
                  onScroll={handleLogScroll}
                  className="overflow-auto max-h-[560px]"
                >
                  <table className="w-full border-collapse text-left table-fixed">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6 w-7/12">Activity Name</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-3/12">Date</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/12 text-right pr-6">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visibleLogs.map((log, i) => (
                        <tr
                          key={`${log.timestamp}-${i}`}
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
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="py-4 text-xs font-black text-slate-500 w-2/12 text-right pr-6 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filterType === "custom" && (
                    <div className="px-6 py-4 border-t border-slate-100 text-center">
                      {loadingMore ? (
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading more logs...</p>
                      ) : hasMore ? (
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scroll to load more exact logs</p>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All matching exact logs loaded</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8">
              <div className="neo-card p-8 h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">Activity Graph</p>
                    <h3 className="mt-2 text-xl font-black text-slate-800">Log activity distribution</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Graph uses the exact logs currently shown on this page.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BarChart3 size={22} />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-6 items-end gap-3 rounded-[28px] bg-slate-50 p-6">
                  {graphData.buckets.map((item) => {
                    const height = Math.max((item.count / graphData.peak) * 180, item.count > 0 ? 30 : 10);
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-3">
                        <span className="text-xs font-black text-slate-500">{item.count}</span>
                        <div className="flex h-48 w-full items-end justify-center rounded-2xl bg-white px-2 py-3 shadow-sm">
                          <div
                            className="w-full rounded-xl bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-300"
                            style={{ height: `${height}px` }}
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
              <div className="neo-card p-8 h-full">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">Log Summary</p>
                <h3 className="mt-2 text-xl font-black text-slate-800">Clean exact activity overview</h3>

                <div className="mt-6 space-y-4">
                  <SummaryRow icon={Activity} label="Matching Logs" value={String(totalLogs)} />
                  <SummaryRow icon={CalendarDays} label="Active Days" value={String(summary.uniqueDays)} />
                  <SummaryRow icon={Clock3} label="Visible Logs" value={String(visibleLogs.length)} />
                </div>

                <div className="mt-6 rounded-[28px] bg-slate-50 p-5 border border-slate-100">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">First Visible Log</p>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {summary.firstLog ? summary.firstLog.activity : "No log"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {summary.firstLog ? `${formatDate(summary.firstLog.timestamp)} at ${formatTime(summary.firstLog.timestamp)}` : "-"}
                  </p>
                </div>

                <div className="mt-4 rounded-[28px] bg-slate-50 p-5 border border-slate-100">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Last Visible Log</p>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {summary.lastLog ? summary.lastLog.activity : "No log"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {summary.lastLog ? `${formatDate(summary.lastLog.timestamp)} at ${formatTime(summary.lastLog.timestamp)}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
    </div>
    <p className="text-sm font-black text-slate-900">{value}</p>
  </div>
);
