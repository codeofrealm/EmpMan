import { Shield, Key } from "lucide-react";

export const ProfilePage = ({ loggedInAdmin, companyName }) => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Admin Profile</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Manage your active administrator credentials</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="xl:col-span-1">
          <div className="neo-card p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[32px] bg-blue-100 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-blue-600 mb-6">
              {loggedInAdmin ? loggedInAdmin.charAt(0).toUpperCase() : "A"}
            </div>
            <h3 className="text-xl font-black text-slate-800">{loggedInAdmin || "Administrator"}</h3>
            <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-full uppercase tracking-wider">
              Super Admin
            </span>

            <div className="w-full border-t border-slate-100 mt-8 pt-6 space-y-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400">Company</span>
                <span className="font-black text-slate-700">{companyName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400">Role</span>
                <span className="font-black text-slate-700">Workspace Master</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400">Status</span>
                <span className="font-black text-emerald-500">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Details */}
        <div className="xl:col-span-2 space-y-8">
          <div className="neo-card p-8">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-blue-500" />
              <span>Workspace Authorization Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Workspace Administrator</p>
                <p className="text-base font-black text-slate-800 mt-1">{loggedInAdmin}</p>
              </div>
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Organization</p>
                <p className="text-base font-black text-slate-800 mt-1">{companyName}</p>
              </div>
            </div>

            <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-50 mt-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0">
                <Key size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Security Hash</p>
                <p className="text-xs font-mono font-bold text-slate-600 mt-1.5 break-all">
                  scrypt:32768:8:1$PBKDF2-Scrypt-Active-Auth-Session-Key
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Authentication hashes generated on our server are 100% backward-compatible with local kiosk validation nodes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
