import { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge, PatternChip } from '../components/Badges.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ExternalLink, Clock4, User, FolderKanban } from 'lucide-react';

export default function TopicBoard() {
  const { problems } = useStore();
  const [editProblem, setEditProblem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [diffFilter, setDiffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = problems.filter(p => {
    if (diffFilter && p.difficulty !== diffFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const topicMap = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      (p.topics || []).forEach(t => {
        if (!map[t]) map[t] = [];
        map[t].push(p);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const openEdit = (p) => { setEditProblem(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
            <FolderKanban className="text-brand-500" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Topic Board
          </h1>
        </div>
        <div className="flex gap-2">
          <select className="input-field w-auto" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
            <option value="">All Difficulties</option>
            {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Not Started', 'Solved', 'Needs Revision', 'Revised'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {topicMap.length === 0 ? (
        <EmptyState icon="book" title="No problems yet" subtitle="Add problems with topics to see the board." />
      ) : (
        <div className="kanban-board">
          {topicMap.map(([topic, ps]) => (
            <div key={topic} className="kanban-col">
              {/* Column header */}
              <div className="glass-card px-3 py-3 flex items-center justify-between sticky top-0 z-10 relative overflow-hidden">
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-neon-cyan opacity-30" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{topic}</span>
                <span className="ml-2 text-[10px] bg-brand-500/10 text-brand-400 font-bold px-2 py-0.5 rounded-full">
                  {ps.length}
                </span>
              </div>

              {/* Cards */}
              {ps.map(p => (
                <button
                  key={p.id}
                  onClick={() => openEdit(p)}
                  className={`w-full text-left gradient-glass p-3.5 hover:border-brand-500/30 transition-all duration-200 cursor-pointer
                    hover:-translate-y-0.5 hover:shadow-neon-sm
                    ${p.status === 'Needs Revision' ? 'border-amber-400/30' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <DifficultyBadge difficulty={p.difficulty} />
                    <StatusBadge status={p.status} />
                  </div>
                  {p.patterns?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.patterns.slice(0, 2).map(pt => <PatternChip key={pt} label={pt} small />)}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Clock4 size={10} />{p.timeTaken || 0}m</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
    </div>
  );
}
