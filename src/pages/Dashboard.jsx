import { useMemo, useState } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import { Target, CheckCircle2, AlertTriangle, Flame, TrendingUp } from 'lucide-react';
import { useStore } from '../store/StoreContext.jsx';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis, CartesianGrid } from 'recharts';

const randomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
const BAR_COLORS = {
  solved: randomColor(),
  revised: randomColor(),
  needsRevision: randomColor(),
  others: randomColor()
};

export default function Dashboard() {
  const { stats, problems } = useStore();
  const [timeRange, setTimeRange] = useState('14 Days');

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
          Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm tracking-wide">
          Your DSA progress at a glance
        </p>
      </div>

      {/* Grid: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          label="TOTAL PROBLEMS"
          value={totalProblems}
          icon={<Target size={18} />}
          colorClass="text-brand-600 dark:text-brand-400"
          bgClass="bg-brand-50  dark:bg-brand-500/10"
        />
        <StatCard
          label="EASY"
          value={stats.easy}
          icon={<div className="w-2 h-2 rounded-full border-2 border-emerald-500" />}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          label="MEDIUM"
          value={stats.medium}
          icon={<div className="w-2 h-2 rounded-full border-2 border-amber-500" />}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          label="HARD"
          value={stats.hard}
          icon={<div className="w-2 h-2 rounded-full border-2 border-rose-500" />}
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-50 dark:bg-rose-500/10"
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
            colorClass="text-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-5 md:p-6 flex flex-col h-[340px]">
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
                  className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded-md transition-colors ${timeRange === btn ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
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

        {/* Topic Mastery Graph */}
        <div className="glass-card p-5 md:p-6 flex flex-col h-[340px]">
          <h2 className="section-title mb-6">Topic Mastery</h2>
          <div className="flex-1 w-full min-h-0 -ml-4">
            {topicProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicProgress} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                  <Bar name="Solved" dataKey="solved" stackId="a" fill={BAR_COLORS.solved} />
                  <Bar name="Revised" dataKey="revised" stackId="a" fill={BAR_COLORS.revised} />
                  <Bar name="Needs Revision" dataKey="needsRevision" stackId="a" fill={BAR_COLORS.needsRevision} />
                  <Bar name="Others" dataKey="others" stackId="a" fill={BAR_COLORS.others} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center mt-10">Add problems with topics to see your breakdown.</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className="glass-card p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight mt-2">
        {value}
      </p>
    </div>
  );
}

function SmallStatCard({ label, value, icon, colorClass }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
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

const BarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] shadow-bento px-3 py-2 rounded-lg text-sm min-w-[140px]">
        <span className="text-slate-900 dark:text-white font-bold block mb-2">{data.label}</span>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-md" style={{ backgroundColor: BAR_COLORS.solved }}/> Solved</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{data.solved}</span>
          </span>
          <span className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-md" style={{ backgroundColor: BAR_COLORS.revised }}/> Revised</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{data.revised}</span>
          </span>
          <span className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-md" style={{ backgroundColor: BAR_COLORS.needsRevision }}/> Needs Revision</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{data.needsRevision}</span>
          </span>
          <span className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-md" style={{ backgroundColor: BAR_COLORS.others }}/> Others</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{data.others}</span>
          </span>
          <div className="border-t border-slate-100 dark:border-white/[0.06] mt-1 pt-1 flex items-center justify-between gap-6">
            <span className="font-medium text-slate-400">Total Tracked</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.tracked}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] shadow-bento px-3 py-2 rounded-lg text-sm flex flex-col gap-1">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">{label}</span>
        <span className="text-slate-900 dark:text-white font-bold">{payload[0].value} Solved</span>
      </div>
    );
  }
  return null;
};
