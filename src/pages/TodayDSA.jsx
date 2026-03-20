import { useState } from 'react';
import { Star, CheckCircle2, Plus, Zap } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { DifficultyBadge, StatusBadge, PlatformBadge } from '../components/Badges.jsx';
import ProblemModal from '../components/ProblemModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function TodayDSA() {
  const { problems, todayStr } = useStore();
  const [editProblem, setEditProblem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const potdProblems   = problems.filter(p => p.isPOTD);
  const solvedToday    = problems.filter(p => (p.dateSolved || p.solvedDate || '').substring(0, 10) === todayStr);
  const urgentRevision = problems.filter(p => p.status === 'Needs Revision' && p.revisionDate && p.revisionDate <= todayStr);

  const openAdd  = () => { setEditProblem(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProblem(p);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProblem(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
            <Zap className="text-amber-500" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Today's DSA
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{todayStr}</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Today's Problem</button>
      </div>

      {/* POTD */}
      <Section
        title="Problem of the Day"
        icon={<Star size={16} className="text-amber-400" fill="#f59e0b" />}
        count={potdProblems.length}
        empty={<EmptyState icon="search" title="No POTD problems" subtitle="Toggle the star in any problem to mark it as POTD." />}
        items={potdProblems}
        onEdit={openEdit}
        accentColor="border-amber-400/50"
        glowColor="rgba(245,158,11,0.08)"
      />

      {/* Solved Today */}
      <Section
        title="Solved Today"
        icon={<CheckCircle2 size={16} className="text-emerald-400" />}
        count={solvedToday.length}
        empty={<EmptyState icon="default" title="Nothing solved today yet" subtitle="Go solve something!" />}
        items={solvedToday}
        onEdit={openEdit}
        accentColor="border-emerald-400/50"
        glowColor="rgba(16,185,129,0.08)"
      />

      {/* Overdue Revision */}
      {urgentRevision.length > 0 && (
        <Section
          title={<span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Overdue Revision</span>}
          icon={null}
          count={urgentRevision.length}
          items={urgentRevision}
          onEdit={openEdit}
          accentColor="border-red-400/50"
          glowColor="rgba(239,68,68,0.08)"
        />
      )}

      <ProblemModal open={modalOpen} onClose={closeModal} editProblem={editProblem} />
    </div>
  );
}

function Section({ title, icon, count, empty, items, onEdit, accentColor, glowColor }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
        <span className="text-[10px] bg-surface-200 dark:bg-white/[0.06] px-2 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400">
          {count}
        </span>
      </div>

      {items.length === 0 ? (
        empty
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(p => (
            <button
              key={p.id}
              onClick={() => onEdit(p)}
              className={`text-left gradient-glass p-4 border-l-[3px] ${accentColor} transition-all duration-300 space-y-2
                         hover:-translate-y-0.5 hover:shadow-neon-sm`}
              style={{ '--hover-glow': glowColor }}
            >
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">{p.name}</p>
              <div className="flex flex-wrap gap-1.5">
                <DifficultyBadge difficulty={p.difficulty} />
                <StatusBadge status={p.status} />
                <PlatformBadge platform={p.platform} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>{p.person || '—'}</span>
                {p.timeTaken ? <span>⏱ {p.timeTaken}m</span> : null}
              </div>
              {p.approach && <p className="text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-2">{p.approach}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
