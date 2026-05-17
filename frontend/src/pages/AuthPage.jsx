import { useState } from "react";
import { User, Lock, ChevronRight, Building2, LayoutPanelLeft } from "lucide-react";

export const AuthPage = ({ onLogin, loading }) => {
  const [auth, setAuth] = useState({ username: "", password: "" });

  const handleLoginClick = (e) => {
    e.preventDefault();
    onLogin(auth.username, auth.password);
  };

  return (
    <main className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] neo-card p-12 shadow-2xl shadow-blue-500/5 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-[#1b6ef3] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 cursor-pointer">
            <LayoutPanelLeft className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome to Neo</h1>
          <p className="text-slate-400 font-bold text-sm mt-2">Sign in to manage your kiosk network</p>
        </div>

        <form className="space-y-6" onSubmit={handleLoginClick}>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-slate-300" />
              </div>
              <input
                type="text"
                placeholder="Enter your username"
                className="premium-input pl-12 h-[54px]"
                value={auth.username}
                onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-300" />
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className="premium-input pl-12 h-[54px]"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="premium-btn w-full h-[56px] text-lg font-black group mt-4 shadow-xl shadow-blue-500/20"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            {!loading && <ChevronRight className="w-6 h-6 ml-1 transition-transform group-hover:translate-x-1" />}
          </button>

          <div className="pt-4 text-center">
            <p className="text-xs font-bold text-slate-400">
              Need help? Contact your system administrator
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};
