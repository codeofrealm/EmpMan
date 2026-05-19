import { useState } from "react";
import { Settings, Save, ShieldAlert, Sliders } from "lucide-react";

export const SettingsPage = ({ companyName, onUpdateCompanyName, showToast }) => {
  const [tempCompanyName, setTempCompanyName] = useState(companyName);
  const [policies, setPolicies] = useState({
    enforceTimeout: true,
    lockOnClose: true,
    realtimeLogs: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (tempCompanyName.trim() === "") {
      showToast("Company Name cannot be empty!", "error");
      return;
    }
    onUpdateCompanyName(tempCompanyName);
    showToast("Workspace configuration saved successfully!");
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Workspace Settings</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Configure workspace rules and system policies</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Settings Forms */}
        <div className="xl:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="neo-card p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <Sliders size={20} className="text-blue-500" />
              <span>Workspace Customization</span>
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Organization Name</label>
              <input
                type="text"
                placeholder="Enter organization name"
                className="premium-input h-[50px] w-full"
                value={tempCompanyName}
                onChange={(e) => setTempCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Kiosk Security Policies</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-700">Enforce Local Lock Timeout</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Locks workstation automatically after idle duration</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={policies.enforceTimeout}
                    onChange={(e) => setPolicies({ ...policies, enforceTimeout: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-700">Lock Workstation on Service Close</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Triggers Windows lockscreen immediately if service is terminated</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={policies.lockOnClose}
                    onChange={(e) => setPolicies({ ...policies, lockOnClose: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-700">Real-Time Activity Stream</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Streams kiosk lock action events directly to the dashboard live</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={policies.realtimeLogs}
                    onChange={(e) => setPolicies({ ...policies, realtimeLogs: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="premium-btn h-[50px] font-black w-full flex items-center justify-center gap-2 mt-4"
            >
              <Save size={18} />
              <span>Save Workspace Configuration</span>
            </button>
          </form>
        </div>

        {/* Security Alerts Card */}
        <div className="xl:col-span-1">
          <div className="neo-card p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ShieldAlert size={20} className="text-amber-500" />
              <span>Compliance Status</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your workstation lock security systems are running in high compliance mode. Custom configuration changes saved here are applied immediately to standard database policies.
            </p>

            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-black uppercase tracking-wider text-center">
              System Shield Secured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
