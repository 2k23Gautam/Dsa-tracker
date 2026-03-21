import { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { format, subDays, subMonths } from 'date-fns';
import { Target, CheckCircle2, Flame, TrendingUp, Globe, ExternalLink, CalendarDays } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ProblemModal from '../components/ProblemModal.jsx';
import CircularProgress from '../components/CircularProgress.jsx';

import { BAR_COLORS } from '../store/data.js';

export default function Dashboard() {
  const { stats, problems, detectedSubmissions, dismissSubmission, lastSyncTime } = useStore();
  const { authUser } = useAuth();
  const [timeRange, setTimeRange] = useState('14 Days');
  const [modalOpen, setModalOpen] = useState(false);
  const [initialModalData, setInitialModalData] = useState(null);
  const [contests, setContests] = useState([]);
  const [contestError, setContestError] = useState(false);
  const { token } = useAuth();

  const fetchContests = async () => {
    setContestError(false);
    try {
      const res = await fetch('/api/platforms/contests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setContests(await res.json());
      } else {
        setContestError(true);
      }
    } catch (e) {
      console.error('Contest fetch error:', e);
      setContestError(true);
    }
  };

  // Re-fetch on every mount so data is always fresh
  useEffect(() => {
    if (token) fetchContests();
  }, [token]);

  const handleRegister = async (contestId, link) => {
    window.open(link, '_blank');
    try {
      await fetch('/api/platforms/contests/dismiss', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ contestId })
      });
      // Refresh list
      fetchContests();
    } catch (e) { console.error('Dismiss error:', e); }
  };

  const connectedPlatforms = useMemo(() => {
    const list = [];
    if (authUser?.leetcodeUsername) list.push({ name: 'LeetCode', handle: authUser.leetcodeUsername, stats: authUser.leetcodeStats });
    return list;
  }, [authUser]);

  const activityData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (timeRange === '14 Days') {
      for (let i = 13; i >= 0; i--) {
        const d = subDays(now, i);
        const ds = format(d, 'yyyy-MM-dd');
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.substring(0,10) === ds).length;
        data.push({ date: format(d, 'MMM dd'), count });
      }
    } else if (timeRange === 'Month') {
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i);
        const ds = format(d, 'yyyy-MM-dd');
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.substring(0,10) === ds).length;
        data.push({ date: format(d, 'MMM dd'), count });
      }
    } else if (timeRange === 'Year') {
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const monthPrefix = format(d, 'yyyy-MM');
        const count = problems.filter(p => (p.dateSolved || p.solvedDate)?.startsWith(monthPrefix)).length;
        data.push({ date: format(d, 'MMM'), count });
      }
    }
    return data;
  }, [problems, timeRange]);

  const topicProgress = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      (p.topics || []).forEach(t => {
        if (!map[t]) map[t] = { tracked: 0, solved: 0, revised: 0, needsRevision: 0, others: 0 };
        map[t].tracked += 1;
        
        if (p.status === 'Solved') map[t].solved += 1;
        else if (p.status === 'Revised') map[t].revised += 1;
        else if (p.status === 'Needs Revision') map[t].needsRevision += 1;
        else map[t].others += 1;
      });
    });
    return Object.entries(map)
      .map(([label, counts]) => ({ label, ...counts }))
      .sort((a, b) => b.tracked - a.tracked)
      .slice(0, 6);
  }, [problems]);


  const totalProblems = useMemo(() => problems.length, [problems]);
  
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const next = lastSyncTime + (5 * 60 * 1000);
      const diff = next - now;

      if (diff <= 0) {
        setTimeLeft('Refresh available');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`Refreshing in ${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
            Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm tracking-wide">
            Your DSA progress at a glance
          </p>
        </div>
        {contests.length > 0 && (
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
             <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
             <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{contests.length} Upcoming Contests</span>
           </div>
        )}
      </div>

      {/* Contest Monitor Cards */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="section-title mb-0">Upcoming Contests (Next 48h)</h2>
        <button 
          onClick={fetchContests}
          className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:text-brand-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest) => (
            <div key={contest.id} className="relative group overflow-hidden rounded-3xl border border-brand-500/10 bg-white dark:bg-white/[0.03] p-5 transition-all hover:border-brand-500/40 shadow-xl shadow-brand-500/5">
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="px-3 py-0.5 rounded-full bg-brand-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20">
                  {contest.platform}
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
                  <CalendarDays size={12} className="text-brand-500" />
                  {format(new Date(contest.startTime), 'MMM dd, HH:mm')}
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 line-clamp-1 relative z-10">
                {contest.name}
              </h3>

              <div className="flex items-center justify-between relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Starts in {Math.max(0, Math.round((contest.startTime - Date.now()) / (1000 * 60 * 60)))}h
                </p>
                <button 
                  onClick={() => handleRegister(contest.id, contest.link)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:shadow-lg shadow-brand-500/20"
                >
                  Register
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-all" />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-200 dark:border-white/[0.08]">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${contestError ? 'bg-red-50 dark:bg-red-500/[0.08] text-red-400' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-600'}`}>
             <CalendarDays size={32} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {contestError ? 'Could Not Load Contests' : 'No Upcoming Contests'}
            </h3>
            <p className="text-xs text-slate-500 max-w-[260px] mt-1">
              {contestError
                ? 'The contest data source is temporarily unavailable. Please try refreshing.'
                : 'There are no contests scheduled on supported platforms in the next 48 hours.'}
            </p>
          </div>
          <button onClick={fetchContests} className="px-4 py-2 rounded-xl bg-brand-500/10 text-brand-600 text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/20 transition-all">
            {contestError ? 'Retry' : 'Check Now'}
          </button>
        </div>
      )}

      {/* Grid: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <CircularProgress
          label="Total Tracked"
          value={totalProblems}
          max={totalProblems || 1}
          color="#3b82f6"
          icon={<Target size={14} />}
        />
        <CircularProgress
          label="Easy"
          value={stats.easy}
          max={totalProblems || 1}
          color="#10b981"
          icon={<div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        />
        <CircularProgress
          label="Medium"
          value={stats.medium}
          max={totalProblems || 1}
          color="#f59e0b"
          icon={<div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
        />
        <CircularProgress
          label="Hard"
          value={stats.hard}
          max={totalProblems || 1}
          color="#ef4444"
          icon={<div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
        />
        
        <div className="col-span-2 md:col-span-4 lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <SmallStatCard
            label="SOLVED TODAY"
            value={stats.today}
            icon={<CheckCircle2 size={16} />}
            colorClass="text-slate-600 dark:text-slate-300"
          />
          <SmallStatCard
            label="STREAK"
            value={`${stats.streak}d`}
            icon={<Flame size={16} />}
            colorClass="text-orange-600 dark:text-orange-500"
          />
        </div>
      </div>

      {/* Platform Insights Hub */}
      <div className="gradient-glass p-5 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-brand-500/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Platform Insights</h2>
              {authUser?.leetcodeUsername && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">LeetCode</span>}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {authUser?.leetcodeUsername
                ? `Your LeetCode progress is unified and real-time. ${timeLeft}`
                : "Connect your LeetCode account in Profile to see automated insights"}
            </p>
          </div>
        </div>

        {connectedPlatforms.length > 0 ? (
          <div className="flex flex-wrap items-center gap-6 md:gap-8 pr-4 w-full md:w-auto">
            {connectedPlatforms.map((platform) => {
              const stats = platform.stats?.matchedUser?.submitStats?.acSubmissionNum || [];
              const solved = stats[0]?.count || 0;
              const rating = platform.stats?.userContestRanking ? Math.round(platform.stats.userContestRanking.rating) : null;
              const rank = platform.stats?.userContestRanking?.globalRanking || null;

              return (
                <div key={platform.name} className="flex items-center gap-6 py-2 border-r last:border-0 border-slate-200 dark:border-white/10 pr-6 mr-2">
                   <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{platform.name} ({platform.handle})</p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-xl font-black text-slate-900 dark:text-white">{solved > 0 ? solved : '--'}</p>
                       <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Solved</span>
                    </div>
                  </div>

                  {rating && (
                    <div className="text-center opacity-80 pt-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rating</p>
                      <p className="text-sm font-bold text-brand-500">{rating}</p>
                    </div>
                  )}
                  {rank && (
                    <div className="text-center opacity-80 pt-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rank</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        #{rank.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <a href={`https://leetcode.com/${authUser.leetcodeUsername}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors ml-auto">
              <ExternalLink size={18} />
            </a>
          </div>
        ) : (
          <NavLink to="/profile" className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/20">
            Connect Now
          </NavLink>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Submission Banner */}
          {detectedSubmissions.length > 0 && (
            <div className="gradient-glass p-4 border-l-4 border-brand-500 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500`}>
                    <Globe size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {detectedSubmissions.length > 1 
                        ? `You solved ${detectedSubmissions.length} problems today!` 
                        : `New ${detectedSubmissions[0].platform} Submission!`}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {detectedSubmissions.length > 1
                        ? `Track them one by one. Starting with `
                        : `You solved `}
                      <span className="font-bold text-brand-500">"{detectedSubmissions[0].title}"</span>. Track it now?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => dismissSubmission(detectedSubmissions[0].titleSlug)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Ignore
                  </button>
                  <button 
                    onClick={() => {
                      const s = detectedSubmissions[0];
                      setInitialModalData({
                        name: s.title,
                        link: s.platform === 'LeetCode' 
                          ? `https://leetcode.com/problems/${s.titleSlug}/` 
                          : s.platform === 'Codeforces'
                          ? `https://codeforces.com/contest/${s.titleSlug.split('-')[0]}/problem/${s.titleSlug.split('-')[1]}`
                          : s.platform === 'CodeChef'
                          ? `https://www.codechef.com/problems/${s.titleSlug}`
                          : '',
                        platform: s.platform,
                        difficulty: s.difficulty || 'Medium'
                      });
                      setModalOpen(true);
                      dismissSubmission(s.titleSlug);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all"
                  >
                    Track It
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-5 md:p-6 flex flex-col h-[340px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title flex items-center gap-2 mb-0">
                <TrendingUp size={18} className="text-brand-500" />
                Activity Overview
              </h2>
              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {['14 Days', 'Month', 'Year'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => setTimeRange(btn)}
                    className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded-md transition-colors ${timeRange === btn ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    dy={10}
                    minTickGap={20}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="glass-card p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Topic Mastery</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {topicProgress.length} Topics
            </span>
          </div>

          {topicProgress.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[290px] pr-0.5">
              {topicProgress.map((topic) => {
                const total = topic.tracked || 1;
                const solvedPct = Math.round((topic.solved / total) * 100);

                // Color based on completion
                const pctColor =
                  solvedPct === 100 ? BAR_COLORS.solved :
                  solvedPct >= 60   ? '#3b82f6' :
                  solvedPct >= 30   ? BAR_COLORS.needsRevision :
                                      '#ef4444';

                const bgAlpha = '18';

                return (
                  <div
                    key={topic.label}
                    className="relative overflow-hidden rounded-2xl p-3.5 border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] flex flex-col gap-2 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
                  >
                    {/* Faint glow blob */}
                    <div
                      className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-40"
                      style={{ backgroundColor: pctColor }}
                    />

                    {/* Top: name + percentage */}
                    <div className="flex items-start justify-between gap-1 relative z-10">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                        {topic.label}
                      </span>
                      <span
                        className="text-base font-black leading-none flex-shrink-0 ml-1"
                        style={{ color: pctColor }}
                      >
                        {solvedPct}%
                      </span>
                    </div>

                    {/* Progress fill bar */}
                    <div className="relative h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden z-10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{
                          width: `${solvedPct}%`,
                          background: `linear-gradient(90deg, ${pctColor}cc, ${pctColor})`
                        }}
                      />
                    </div>

                    {/* Bottom: status dots + count */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1">
                        {topic.solved > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.solved }} title="Solved" />
                        )}
                        {topic.revised > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.revised }} title="Revised" />
                        )}
                        {topic.needsRevision > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BAR_COLORS.needsRevision }} title="Needs Revision" />
                        )}
                        {topic.others > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" title="Not Started" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                        {topic.solved}/{topic.tracked}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-400 dark:text-slate-600 text-center mt-10">
              Add problems with topics to see your breakdown.
            </p>
          )}
        </div>
        
      </div>

      <ProblemModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialData={initialModalData} 
      />
    </div>
  );
}

function SmallStatCard({ label, value, icon, colorClass }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider block mb-1">
          {label}
        </span>
        <p className="text-xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
          {value}
        </p>
      </div>
      <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}



const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] shadow-bento px-3 py-2 rounded-lg text-sm flex flex-col gap-1">
        <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">{label}</span>
        <span className="text-slate-900 dark:text-white font-bold">{payload[0].value} Solved</span>
      </div>
    );
  }
  return null;
};
