import { Search, Menu } from "lucide-react";

export const Topbar = ({ adminName, searchValue = "", onSearchChange, searchPlaceholder = "Search employees..." }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-6 flex-1">
        <Menu className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-[#f4f7fe] rounded-full py-2.5 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 transition-all text-sm"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-none">{adminName}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Admin Account</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-blue-50 text-blue-600 flex items-center justify-center font-bold overflow-hidden">
            <img 
              src={`https://ui-avatars.com/api/?name=${adminName}&background=1b6ef3&color=fff`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
