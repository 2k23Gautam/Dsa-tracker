import { format } from 'date-fns';
import { Flame, CheckCircle2, Clock4, LogOut } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';

export default function TopBar() {
  const { stats } = useStore();
  const { authUser, logout } = useAuth();

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="shrink-0 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl
                       border-b border-slate-200 dark:border-white/[0.06]
                       px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4
                       z-20 transition-all duration-300 sticky top-0">
      
      {/* Left — date */}
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">{today}</p>
      </div>

      {/* Center — stats */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 justify-start sm:justify-center overflow-x-auto no-scrollbar py-1">
        <StatPill icon={<CheckCircle2 size={14} />} label="Today" value={stats.today} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatPill icon={<Clock4 size={14} />} label="Revision" value={stats.needsRevision} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-500/10" />
        <StatPill icon={<Flame size={14} />} label="Streak" value={`${stats.streak}d`} colorClass="text-rose-600 dark:text-rose-400" bgClass="bg-rose-50 dark:bg-rose-500/10" />
      </div>

      {/* Right — user name & logout */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 tracking-tight">
            {authUser?.name}
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-white/[0.08]">
            {authUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.08] hidden md:block"></div>
        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center justify-center p-2 rounded-lg
                     text-slate-400 hover:text-slate-900 dark:hover:text-white
                     hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function StatPill({ icon, label, value, colorClass, bgClass }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.04] ${bgClass}`}>
      <span className={colorClass}>{icon}</span>
      <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300 hidden md:inline">{label}</span>
      <span className={`text-[12px] font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
