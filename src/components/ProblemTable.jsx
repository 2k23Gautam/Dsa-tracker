import { ArrowUpDown, Maximize2, Edit2, CheckCircle2, Star } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, PlatformBadge, TopicBadge, PatternBadge } from './Badges.jsx';

export default function ProblemTable({ problems, onEdit }) {
  const { filters, setFilter, togglePOTD } = useStore();

  const handleSort = (key) => {
    if (filters.sortBy === key) {
      setFilter('sortDesc', !filters.sortDesc);
    } else {
      setFilter('sortBy', key);
      setFilter('sortDesc', false);
    }
  };

  const SortIcon = ({ sortKey }) => (
    <ArrowUpDown size={12} className={`inline ml-1 transition-colors ${filters.sortBy === sortKey ? 'text-brand-500' : 'text-slate-300 dark:text-slate-600'}`} />
  );

  if (problems.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <table className="w-full text-left min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
            <th className="table-th w-10"></th>
            <th className="table-th" onClick={() => handleSort('name')}>Problem <SortIcon sortKey="name"/></th>
            <th className="table-th" onClick={() => handleSort('platform')}>Platform <SortIcon sortKey="platform"/></th>
            <th className="table-th" onClick={() => handleSort('difficulty')}>Difficulty <SortIcon sortKey="difficulty"/></th>
            <th className="table-th hidden md:table-cell">Topics</th>
            <th className="table-th" onClick={() => handleSort('status')}>Status <SortIcon sortKey="status"/></th>
            <th className="table-th hidden sm:table-cell" onClick={() => handleSort('person')}>Person <SortIcon sortKey="person"/></th>
            <th className="table-th" onClick={() => handleSort('dateSolved')}>Solved <SortIcon sortKey="dateSolved"/></th>
            <th className="table-th hidden lg:table-cell" onClick={() => handleSort('timeComplexity')}>Time (Min) <SortIcon sortKey="timeComplexity"/></th>
            <th className="table-th hidden sm:table-cell" onClick={() => handleSort('revisionCount')}>Rev# <SortIcon sortKey="revisionCount"/></th>
            <th className="table-th text-center">POTD</th>
            <th className="table-th w-20 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.id} className="table-row group">
              <td className="table-td pl-4">
                {p.status === 'Solved' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
              </td>
              <td className="table-td font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-2 flex items-center gap-1.5 transition-colors">
                    {p.name}
                    <Maximize2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : p.name}
              </td>
              <td className="table-td"><PlatformBadge platform={p.platform} /></td>
              <td className="table-td"><DifficultyBadge difficulty={p.difficulty} /></td>
              <td className="table-td hidden md:table-cell">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {p.topics?.slice(0, 2).map(t => <TopicBadge key={t} topic={t} />)}
                  {p.patterns?.slice(0, 1).map(pt => <PatternBadge key={pt} pattern={pt} />)}
                  {(p.topics?.length > 2 || p.patterns?.length > 1) && (
                    <span className="text-[10px] text-slate-500 font-medium px-1">+{ (p.topics?.length || 0) + (p.patterns?.length || 0) - 3 }</span>
                  )}
                </div>
              </td>
              <td className="table-td">
                <span className={`text-xs font-semibold ${p.status === 'Solved' ? 'text-emerald-600 dark:text-emerald-400' : p.status === 'Attempted' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  {p.status}
                </span>
              </td>
              <td className="table-td hidden sm:table-cell text-sm text-slate-600 dark:text-slate-300">{p.person}</td>
              <td className="table-td text-xs text-slate-500 font-mono tracking-tight">{(p.dateSolved || p.solvedDate || '').substring(0, 10)}</td>
              <td className="table-td hidden lg:table-cell text-xs text-slate-500 font-mono">{p.timeComplexity || '—'}</td>
              <td className="table-td hidden sm:table-cell text-center font-bold text-slate-700 dark:text-slate-200">{p.revisionCount}</td>
              <td className="table-td text-center">
                <button 
                  onClick={() => togglePOTD(p.id)}
                  className={`p-1.5 rounded-lg transition-colors ${p.isPOTD ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/[0.04]'}`}
                  title={p.isPOTD ? "Remove from POTD" : "Mark as POTD"}
                >
                  <Star size={16} className={p.isPOTD ? "fill-current" : ""} />
                </button>
              </td>
              <td className="table-td text-right pr-4">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(p)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="py-3 px-4 text-xs text-slate-500 font-medium">
        {problems.length} problem{problems.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  );
}
