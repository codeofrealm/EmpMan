import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
  Download,
  Activity,
  UserPlus
} from "lucide-react";

export const EmployeesPage = ({ users, onLoadLogs, onCreateUser, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Alphabetical");
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateUser(newUser.username, newUser.password);
    setNewUser({ username: "", password: "" });
    setShowAddModal(false);
  };

  const filteredEmployees = users
    .filter(emp =>
      emp.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Alphabetical") return a.username.localeCompare(b.username);
      return 0;
    });

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Employee Directory</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Dashboard / Employees</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#1b6ef3] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Members" value={users.length} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active Kiosk" value={users.length} icon={Briefcase} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Recent Provision" value="Today" icon={Plus} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="System Status" value="Online" icon={Activity} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="neo-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search members..."
              className="w-full bg-[#f8fafc] rounded-xl py-3 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
              <Filter size={18} />
            </button>
            <span className="text-sm font-bold text-slate-400 mx-2">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-200"
            >
              <option>Alphabetical</option>
              <option>Newest First</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-400 text-[11px] font-black uppercase tracking-widest">
                <th className="p-4 px-6">Member</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.username} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => onLoadLogs(emp.username)}>
                  <td className="p-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm uppercase">
                        {emp.username.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{emp.username}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Kiosk Access</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-bold text-slate-500">
                    {emp.createdBy}
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600`}>
                      <div className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse`} />
                      Active
                    </span>
                  </td>
                  <td className="p-5 text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <div className="p-2 inline-flex rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#1b6ef3] group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="neo-card w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Add New Member</h3>
                  <p className="text-slate-400 text-sm font-medium">Create credentials for kiosk terminal</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kiosk Username</label>
                <input
                  type="text"
                  className="premium-input h-[54px]"
                  placeholder="Enter unique username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kiosk Password</label>
                <input
                  type="password"
                  className="premium-input h-[54px]"
                  placeholder="Enter security password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-[54px] bg-slate-50 text-slate-500 font-black rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] premium-btn h-[54px] font-black"
                  disabled={loading}
                >
                  {loading ? "Provisioning..." : "Provision Member"}
                </button>
              </div>
            </form>
          </div>
          {/* Click backdrop to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowAddModal(false)} />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="neo-card flex items-center gap-5">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);
