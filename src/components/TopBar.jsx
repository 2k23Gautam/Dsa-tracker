import { format } from 'date-fns';
import { Flame, CheckCircle2, Clock4, LogOut, Menu } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';

export default function TopBar({ onMenuClick }) {
  const { stats } = useStore();
  const { authUser, logout } = useAuth();

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="shrink-0 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl
                       border-b border-slate-200 dark:border-white/[0.06]
                       px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4
                       z-20 transition-all duration-300 sticky top-0">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>
      <div className="hidden sm:block">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-tight">{today}</p>
      </div>

      {/* Center — stats */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 justify-start sm:justify-center overflow-x-auto no-scrollbar py-1">
        <StatPill icon={<CheckCircle2 size={14} />} label="Today" value={stats.today} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatPill icon={<Clock4 size={14} />} label="Revision" value={stats.needsRevision} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-500/10" />
        <StatPill icon={<Flame size={14} />} label="Streak" value={`${stats.streak}d`} colorClass="text-rose-600 dark:text-rose-400" bgClass="bg-rose-50 dark:bg-rose-500/10" />
      </div>

      {/* Right — logout button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center justify-center p-2 rounded-lg 
                     text-slate-400 hover:text-slate-900 dark:hover:text-white
                     hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          <LogOut size={18} />
          <span className="text-xs font-bold ml-1 hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

function StatPill({ icon, label, value, colorClass, bgClass }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.04] ${bgClass}`}>
      <span className={colorClass}>{icon}</span>
      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 hidden md:inline">{label}</span>
      <span className={`text-[12px] font-black ${colorClass}`}>{value}</span>
    </div>
  );
}
