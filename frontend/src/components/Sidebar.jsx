import { 
  LayoutDashboard, 
  Grid, 
  Users, 
  UserCircle, 
  Briefcase, 
  Ticket, 
  Wallet, 
  FileText, 
  BarChart3, 
  Target, 
  GraduationCap, 
  TrendingUp,
  LogOut,
  ShieldAlert
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-all ${
    active 
      ? "bg-white/10 border-l-4 border-white font-bold" 
      : "opacity-70 hover:opacity-100 hover:bg-white/5"
  }`}>
    <Icon size={20} />
    <span className="text-[15px]">{label}</span>
  </div>
);

export const Sidebar = ({ activeTab = "Dashboard", onTabChange, onLogout, companyName = "Neo" }) => {
  return (
    <aside className="neo-sidebar overflow-y-auto">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-[#1b6ef3] rotate-45" />
          </div>
          <span className="text-xl font-black tracking-tighter truncate max-w-[140px]" title={companyName}>
            {companyName}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-6 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Main</span>
        </div>
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={activeTab === "Dashboard"} 
          onClick={() => onTabChange("Dashboard")}
        />
        <SidebarItem icon={Grid} label="Apps" />

        <div className="px-6 mb-2 mt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Employee</span>
        </div>
        <SidebarItem 
          icon={Users} 
          label="Employees" 
          active={activeTab === "Employees"} 
          onClick={() => onTabChange("Employees")}
        />
        <SidebarItem icon={UserCircle} label="Clients" />
        <SidebarItem icon={Briefcase} label="Projects" />
        <SidebarItem icon={Ticket} label="Tickets" />

        <div className="px-6 mb-2 mt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">HR</span>
        </div>
        <SidebarItem icon={Wallet} label="Accounts" />
        <SidebarItem icon={FileText} label="Payroll" />
        <SidebarItem icon={ShieldAlert} label="Policies" />
        <SidebarItem icon={BarChart3} label="Reports" />
        <SidebarItem icon={Target} label="Performance" />
        <SidebarItem icon={TrendingUp} label="Goals" />
        <SidebarItem icon={GraduationCap} label="Training" />
      </div>

      <div className="mt-auto p-6">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-100 rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </aside>
  );
};
