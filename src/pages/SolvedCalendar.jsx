import { useMemo, useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, parseISO, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge } from '../components/Badges.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SolvedCalendar() {
  const { problems } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const byDate = useMemo(() => {
    const map = {};
    problems.filter(p => p.dateSolved || p.solvedDate).forEach(p => {
      const d = (p.dateSolved || p.solvedDate).substring(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(p);
    });
    return map;
  }, [problems]);

  const max = useMemo(() => Math.max(...Object.values(byDate).map(a => a.length), 1), [byDate]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(current);
    const monthEnd   = endOfMonth(current);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end:   endOfWeek(monthEnd),
    });
  }, [current]);

  const prev = () => setCurrent(c => subMonths(c, 1));
  const next = () => setCurrent(c => addMonths(c, 1));

  const selectedProblems = selected ? (byDate[selected] || []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
          <CalendarDays className="text-brand-500" size={22} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Solved Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-5">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="btn-ghost"><ChevronLeft size={18} /></button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
              {format(current, 'MMMM yyyy')}
            </h2>
            <button onClick={next} className="btn-ghost"><ChevronRight size={18} /></button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const ds = format(day, 'yyyy-MM-dd');
              const count = byDate[ds]?.length || 0;
              const inMonth = isSameMonth(day, current);
              const isToday = ds === format(new Date(), 'yyyy-MM-dd');
              const isSelected = ds === selected;

              const intensity = count === 0 ? 0 : Math.ceil((count / max) * 4);
              const bgClass = !inMonth ? 'opacity-20' : [
                '',
                'bg-brand-500/15',
                'bg-brand-500/30',
                'bg-brand-500/50',
                'bg-brand-500/70',
              ][intensity];

              return (
                <button
                  key={ds}
                  onClick={() => inMonth && setSelected(isSelected ? null : ds)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all duration-200
                    ${bgClass}
                    ${isToday ? 'ring-2 ring-brand-400 shadow-neon-sm' : ''}
                    ${isSelected ? 'ring-2 ring-neon-cyan scale-110 shadow-neon-cyan' : ''}
                    ${inMonth ? 'hover:ring-1 hover:ring-brand-400/50 cursor-pointer' : 'cursor-default'}
                    ${!inMonth ? 'text-slate-600' : count > 0 ? 'text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {count > 0 && inMonth && (
                    <span className="text-[9px] font-bold leading-none opacity-80">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Less</span>
            {['bg-brand-500/15', 'bg-brand-500/30', 'bg-brand-500/50', 'bg-brand-500/70'].map((c, i) => (
              <div key={i} className={`w-4 h-4 rounded-md ${c}`} />
            ))}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">More</span>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="glass-card p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 dark:text-white tracking-tight">
                  {format(parseISO(selected), 'dd MMM yyyy')}
                </h3>
                <button onClick={() => setSelected(null)} className="btn-ghost p-1"><X size={14} /></button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
                {selectedProblems.length} problem{selectedProblems.length !== 1 ? 's' : ''} solved
              </p>
              <div className="space-y-2 overflow-y-auto max-h-80">
                {selectedProblems.map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-surface-50 dark:bg-white/[0.03] border border-surface-200/50 dark:border-white/[0.04] space-y-1.5 transition-all duration-200 hover:border-brand-500/20">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{p.name}</p>
                    <div className="flex flex-wrap gap-1">
                      <DifficultyBadge difficulty={p.difficulty} />
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{p.person || '—'}</span>
                      <span>{p.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/8 dark:bg-brand-500/10 flex items-center justify-center mb-4 animate-float">
                <CalendarDays size={24} className="text-brand-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Click a day</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">to see problems solved that day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
