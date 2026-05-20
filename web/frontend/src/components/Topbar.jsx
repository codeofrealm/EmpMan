export const Topbar = ({ adminName }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1" />

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
