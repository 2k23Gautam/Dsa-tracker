import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext.jsx';
import { SEED_PROBLEMS } from './data.js';

const STORAGE_KEY = 'dsa_tracker_v1';
const THEME_KEY   = 'dsa_theme';

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

// ─── Context ────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { authUser } = useAuth();

  // ── Problems ──────────────────────────────────────────────────────────────
  const [problems, setProblems] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setProblems([]);
      return;
    }
    const fetchProblems = async () => {
      try {
        const res = await fetch('/api/problems', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (err) {
        console.error('Failed to fetch problems', err);
      }
    };
    fetchProblems();
  }, [token]);

  const addProblem = useCallback(async (data) => {
    if (!token) return null;
    try {
      const p = { ...data, revisionCount: data.revisionCount ?? 0 };
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(p)
      });
      if (res.ok) {
        const saved = await res.json();
        setProblems(prev => [saved, ...prev]);
        return saved;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, [token]);

  const updateProblem = useCallback(async (id, updates) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const saved = await res.json();
        setProblems(prev => prev.map(p => p.id === id ? saved : p));
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const deleteProblem = useCallback(async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProblems(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // ── Filters & View State ──────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    difficulty: 'All',
    status: 'All',
    topic: 'All',
    pattern: 'All',
    potd: false,
    showPanel: false,
    dateRange: { start: null, end: null },
    sortBy: 'dateSolved',
    sortDesc: true,
  });

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const togglePOTD = useCallback((arg) => {
    if (typeof arg === 'boolean') {
      setFilters(prev => ({ ...prev, potd: arg }));
    } else {
      updateProblem(arg, { isPOTD: !problems.find(p => p.id === arg)?.isPOTD });
    }
  }, [problems, updateProblem]);

  const setDateRange = useCallback((start, end) => {
    setFilters(prev => ({ ...prev, dateRange: { start, end } }));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
    solved: problems.filter(p => p.status === 'Solved' || p.status === 'Revised').length,
    today: problems.filter(p => p.dateSolved && p.dateSolved.substring(0, 10) === todayStr).length,
    needsRevision: problems.filter(p => p.status === 'Needs Revision').length,
    streak: calcStreak(problems),
  };

  const activityData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = problems.filter(p => p.dateSolved && p.dateSolved.substring(0, 10) === dateStr).length;
      data.push({ date: format(d, 'MMM dd'), count });
    }
    return data;
  }, [problems]);

  // ── Global Activity Detection ───────────────────────────────────────────
  const [rawAllSubmissions, setRawAllSubmissions] = useState([]);
  const [dismissedSlugs, setDismissedSlugs] = useState([]);

  const checkGlobalSubmissions = useCallback(async () => {
    if (!token) return;
    try {
      let combined = [];

      // 1. LeetCode
      if (authUser?.leetcodeUsername) {
        const res = await fetch(`/api/leetcode/recent/${authUser.leetcodeUsername}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const recent = await res.json();
          combined = [...combined, ...recent.map(s => ({ ...s, platform: 'LeetCode' }))];
        }
      }

      setRawAllSubmissions(combined);
    } catch (err) {
      console.error('Detection error:', err);
    }
  }, [token, authUser]);

  const detectedSubmissions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    return rawAllSubmissions.filter(rs => {
      const isLeetCode = rs.platform === 'LeetCode';
      if (!isLeetCode) return false;

      // Must be from today
      const ts = parseInt(rs.timestamp) / 1000; // Normalizing to seconds if it was ms
      if (ts < todayTimestamp && rs.timestamp > 10000000000) { // If it was ms, check accordingly
          if (rs.timestamp / 1000 < todayTimestamp) return false;
      } else if (ts < todayTimestamp) {
          return false;
      }
      
      if (dismissedSlugs.includes(rs.titleSlug)) return false;
      
      // Link check (approximate for generic platforms)
      const isAlreadyTracked = problems.some(p => 
        p.name.toLowerCase() === rs.title.toLowerCase() || 
        (p.link && p.link.includes(rs.titleSlug))
      );
      
      return !isAlreadyTracked;
    });
  }, [rawAllSubmissions, problems, dismissedSlugs]);

  const syncAllPlatformStats = useCallback(async () => {
    if (!token) return;
    try {
      // Automated sync for LeetCode (keeps the existing dedicated sync if desired)
      if (authUser?.leetcodeUsername) {
        const res = await fetch(`/api/leetcode/stats/${authUser.leetcodeUsername}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const stats = await res.json();
          await fetch('/api/leetcode/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ leetcodeUsername: authUser.leetcodeUsername, stats })
          });
        }
      }
    } catch (err) {
      console.error('Auto-sync error:', err);
    }
  }, [token, authUser]);

  useEffect(() => {
    checkGlobalSubmissions();
    syncAllPlatformStats();
    
    const interval = setInterval(() => {
      checkGlobalSubmissions();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkGlobalSubmissions, syncAllPlatformStats]);

  const dismissSubmission = (titleSlug) => {
    setDismissedSlugs(prev => [...prev, titleSlug]);
  };

  const value = {
    problems, addProblem, updateProblem, deleteProblem,
    theme, toggleTheme,
    stats, todayStr, activityData,
    filters, setFilter, togglePOTD, setDateRange, authUser,
    detectedSubmissions, dismissSubmission, checkGlobalSubmissions,
    syncAllPlatformStats
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcStreak(problems) {
  const solvedDates = [...new Set(
    problems.filter(p => p.dateSolved).map(p => p.dateSolved.substring(0, 10))
  )].sort().reverse();

  if (!solvedDates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let check = today;

  for (const d of solvedDates) {
    if (d === check) {
      streak++;
      const dt = new Date(check);
      dt.setDate(dt.getDate() - 1);
      check = dt.toISOString().slice(0, 10);
    } else if (d < check) {
      break;
    }
  }
  return streak;
}
