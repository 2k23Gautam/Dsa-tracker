import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, User, Users, Trello,
  AlertTriangle, Zap, CalendarDays, Sun, Moon, Code2,
} from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/all',       icon: List,            label: 'All Problems' },
  { to: '/topics',    icon: Trello,          label: 'Topic Board' },
  { to: '/revision',  icon: AlertTriangle,   label: 'Revision' },
  { to: '/today',     icon: Zap,             label: "Today's DSA" },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
];

export default function Sidebar() {
  const { theme, toggleTheme, stats } = useStore();

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0
                      bg-slate-50 dark:bg-[#020617]
                      border-r border-slate-200 dark:border-white/[0.06]
                      transition-all duration-300 z-20">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
          <Code2 size={16} className="text-white" />
        </div>
        <div>
          <p className="font-outfit font-bold text-slate-900 dark:text-white text-[15px] leading-tight tracking-tight">
            DSA Tracker
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-white dark:bg-white/[0.06] text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-150'
                } />
                <span className="tracking-tight">{label}</span>
                {to === '/revision' && stats.needsRevision > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    ${isActive
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/[0.08]'
                    }`}>
                    {stats.needsRevision}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
                     text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03]
                     hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-150"
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-slate-400 group-hover:text-slate-500" />
            : <Moon size={16} className="text-slate-400 group-hover:text-slate-500" />
          }
          <span className="tracking-tight">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
