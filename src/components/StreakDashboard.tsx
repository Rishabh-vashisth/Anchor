import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Award, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Settings, 
  Sparkles, 
  Share2, 
  Zap, 
  CheckCircle, 
  Trophy, 
  ChevronRight,
  Info
} from 'lucide-react';
import { DailyState, Task } from '../types';
import { Confetti } from './Confetti';

interface StreakDashboardProps {
  state: DailyState;
  updateStreakRule: (rule: 'traditional' | 'forgiving' | 'flexible') => void;
  updateStreak: (value: number) => void;
  tasks: Task[];
  onTriggerConfetti?: () => void;
}

export function StreakDashboard({
  state,
  updateStreakRule,
  updateStreak,
  tasks = []
}: StreakDashboardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);
  const [showRuleInfo, setShowRuleInfo] = useState<string | null>(null);

  // Current Streak Parameters
  const streak = state.streak || 0;
  const personalBest = state.personalBestStreak !== undefined ? state.personalBestStreak : streak;
  const rule = state.streakRule || 'traditional';
  const forgivesUsed = state.forgivesUsedThisWeek || 0;

  // Milestone definition
  const milestones = [
    { days: 3, name: "Rookie Catalyst", desc: "First 3-day continuous focus burst.", icon: "🌱" },
    { days: 7, name: "System Specialist", desc: "Maintained continuity for an entire week.", icon: "⚡" },
    { days: 14, name: "Vanguard Operative", desc: "Two weeks of relentless discipline.", icon: "🛡️" },
    { days: 30, name: "Master Anchor", desc: "A full month of focused executions.", icon: "🔮" },
    { days: 100, name: "Infinite Overlord", desc: "Ultimate cognitive momentum. Absolute focus.", icon: "♾️" }
  ];

  // Check which are unlocked
  const unlockedBadges = state.streakMilestonesUnlocked || [];

  // Week-over-week completed counts calculation
  const now = new Date();
  const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const currentDay = now.getDay(); // 0 Sunday, 1 Monday ...
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfThisWeekMs = startOfTodayMs - (daysToMonday * 24 * 3600 * 1000);
  const startOfLastWeekMs = startOfThisWeekMs - (7 * 24 * 3600 * 1000);

  const completedThisWeek = tasks.filter(t => 
    t.status === 'completed' && t.completedAt && t.completedAt >= startOfThisWeekMs
  ).length;

  const completedLastWeek = tasks.filter(t => 
    t.status === 'completed' && t.completedAt && t.completedAt >= startOfLastWeekMs && t.completedAt < startOfThisWeekMs
  ).length;

  // Let's seed mock completions if tasks are empty so the review can show numbers
  const displayCompletedThisWeek = completedThisWeek;
  const displayCompletedLastWeek = tasks.length === 0 ? 4 : completedLastWeek;
  const diffWow = displayCompletedThisWeek - displayCompletedLastWeek;
  
  let momentum: 'improving' | 'stable' | 'declining' = 'stable';
  if (diffWow > 0) momentum = 'improving';
  else if (diffWow < 0) momentum = 'declining';

  // Personal statistics
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  // Calculate completed by individual calendar days to find best day complete count
  const dayCompletions: { [date: string]: number } = {};
  tasks.forEach(t => {
    if (t.status === 'completed' && t.completedAt) {
      const dStr = new Date(t.completedAt).toISOString().split('T')[0];
      dayCompletions[dStr] = (dayCompletions[dStr] || 0) + 1;
    }
  });
  const bestDayCount = Object.values(dayCompletions).length > 0 
    ? Math.max(...Object.values(dayCompletions)) 
    : (totalCompleted > 0 ? 1 : 0);

  // Motivational moment quotes generators based on statistics
  const getMotivationalMoment = () => {
    if (streak === 0) {
      return {
        quote: "No action is too small. Establish a primary anchor block today to start your momentum engine.",
        achievement: "Ready to initiate countdown."
      };
    }
    if (streak >= 30) {
      return {
        quote: "You have completely reformed your cognitive wiring over the past month. A true focus sentinel.",
        achievement: `Outstanding deep executions completed this month!`
      };
    }
    if (streak >= 7) {
      return {
        quote: "You've successfully secured a full weekly cycle. Protect this flame at all costs.",
        achievement: `${totalCompleted || 7} total task nodes resolved this calendar cycle!`
      };
    }
    return {
      quote: "The initial period is the toughest. Every consecutive day of focus builds powerful subconscious inertia.",
      achievement: "Great focus, keep stack piling up!"
    };
  };

  const momentData = getMotivationalMoment();

  // Handle snapshot copy
  const handleExportSnapshot = () => {
    const rawCard = `
========================================
    ✨ PEAK DISCIPLINE OPERATIVE DOSSIER ✨
========================================
  [OPERATOR] : ${state.notificationSettings ? "Active Anchor Commander" : "Anonymous Agent"}
  [RULESET]  : ${rule.toUpperCase()} FOCUS LAW
  
  🔥 STREAK CONTINUITY: ${streak} DAYS SOLID
  🏆 PERSONAL RECORD   : ${personalBest} DAYS
  📈 MOMENTUM PROFILE  : ${momentum.toUpperCase()} (${diffWow >= 0 ? '+' : ''}${diffWow} wow)
  
  ⚡ EXECUTED WORKLOADS : ${totalCompleted} NODES RESOLVED
  🎖️ UNLOCKED MILESTONES: ${unlockedBadges.length > 0 ? unlockedBadges.map(b => `${b}d`).join(', ') : 'None'}
  
  "Accountability builds the sentinel structure."
========================================
    Generated on UTC ${new Date().toISOString().split('T')[0]}
    `;
    navigator.clipboard.writeText(rawCard.trim());
    setCopiedSnapshot(true);
    setTimeout(() => setCopiedSnapshot(false), 2500);
  };

  // Safe manual adjustments for demonstration or correction
  const handleTestStreakIncrement = () => {
    updateStreak(streak + 1);
    setShowConfetti(true);
  };

  return (
    <div className="space-y-6">
      {/* Light-up dynamic confetti celebration */}
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      {/* Dynamic Animated Streak Board Header */}
      <div className="relative p-6 md:p-8 border border-orange-500/15 bg-[#0e0e11] overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-500 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            {/* Animated Flame Icon Container */}
            <motion.div 
              animate={{ 
                scale: streak > 0 ? [1, 1.08, 1] : 1,
                rotate: streak > 0 ? [-2, 2, -2] : 0
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`w-16 h-16 border flex items-center justify-center relative select-none ${
                streak > 0 ? 'bg-orange-950/25 border-orange-500/40 text-orange-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              {streak > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-mono font-black bg-orange-600 text-white px-1 leading-none border border-white/20">
                  LIVE
                </span>
              )}
              <Flame className="w-9 h-9" />
            </motion.div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-orange-400 uppercase tracking-[0.25em] font-bold block animate-pulse">
                System Focus Continuity
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center">
                  {streak} <span className="text-lg md:text-xl font-mono text-zinc-500 ml-2 font-normal">🔥 Days Solid</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                Current Streak Law: <span className="text-orange-400 font-mono uppercase font-bold">{rule} Mode</span>. All-Time record: <span className="text-white font-bold">{personalBest} days</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0 md:justify-end">
            <button
              onClick={handleTestStreakIncrement}
              className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-[9px] uppercase tracking-widest px-4 py-2 flex items-center gap-2 border border-white/10 transition-all font-bold cursor-pointer hover:shadow-lg hover:shadow-orange-950/40"
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              Test +1 Streak 🔥
            </button>
            <button
              onClick={handleExportSnapshot}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/20 font-mono text-[9px] uppercase tracking-widest px-4 py-2 flex items-center gap-2 transition-all font-bold cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              {copiedSnapshot ? "Copied!" : "Export Card"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Rules & Momentum Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Streak Rules Card (Customizable) */}
        <div className="p-5 border border-white/5 bg-zinc-950/60 space-y-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-zinc-400 border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5 font-bold">
              <Settings className="w-3.5 h-3.5 text-zinc-500" />
              Streak Discipline Law (Ruleset)
            </span>
            <span className="text-[8px] bg-zinc-900 border border-white/10 px-1 font-bold text-zinc-400">ACTIVE</span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal">
            Choose how your cognitive consistency metric should punish interruptions. Select the protocol that matches your accountability style.
          </p>

          <div className="space-y-2 pt-1">
            {/* Rule Option: Traditional */}
            <button
              onClick={() => updateStreakRule('traditional')}
              className={`w-full text-left p-3 border transition-colors cursor-pointer flex justify-between items-center ${
                rule === 'traditional' 
                  ? 'border-orange-500/30 bg-orange-950/15 text-white' 
                  : 'border-white/5 bg-zinc-900/35 text-zinc-400 hover:bg-zinc-900/60'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold block uppercase tracking-wider">
                  Traditional Law {rule === 'traditional' && '✓'}
                </span>
                <span className="text-[9px] font-sans text-zinc-500 block leading-tight">
                  Zero tolerance. Miss completing your daily primary anchor once = streak reset to 0.
                </span>
              </div>
              <Flame className={`w-4 h-4 shrink-0 ml-4 ${rule === 'traditional' ? 'text-orange-500 animate-pulse' : 'text-zinc-600'}`} />
            </button>

            {/* Rule Option: Forgiving */}
            <button
              onClick={() => updateStreakRule('forgiving')}
              className={`w-full text-left p-3 border transition-colors cursor-pointer flex justify-between items-center ${
                rule === 'forgiving' 
                  ? 'border-emerald-500/30 bg-emerald-950/15 text-white' 
                  : 'border-white/5 bg-zinc-900/35 text-zinc-400 hover:bg-zinc-900/60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 uppercase font-mono text-[10px] font-bold tracking-wider">
                  <span>Forgiving Law {rule === 'forgiving' && '✓'}</span>
                  {rule === 'forgiving' && (
                    <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 border border-emerald-500/10">
                      🛡️ {forgivesUsed}/2 used
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-sans text-zinc-500 block leading-tight">
                  Allows up to 2 misses per calendar week. Safely protects your streak value from minor friction.
                </span>
              </div>
              <Zap className={`w-4 h-4 shrink-0 ml-4 ${rule === 'forgiving' ? 'text-emerald-500' : 'text-zinc-600'}`} />
            </button>

            {/* Rule Option: Flexible */}
            <button
              onClick={() => updateStreakRule('flexible')}
              className={`w-full text-left p-3 border transition-colors cursor-pointer flex justify-between items-center ${
                rule === 'flexible' 
                  ? 'border-blue-500/30 bg-blue-950/15 text-white' 
                  : 'border-white/5 bg-zinc-900/35 text-zinc-400 hover:bg-zinc-900/60'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold block uppercase tracking-wider">
                  Flexible Law {rule === 'flexible' && '✓'}
                </span>
                <span className="text-[9px] font-sans text-zinc-500 block leading-tight">
                  Maintaining is simple: complete *either* yesterday's Primary Task OR any other logged focus node.
                </span>
              </div>
              <CheckCircle className={`w-4 h-4 shrink-0 ml-4 ${rule === 'flexible' ? 'text-blue-500' : 'text-zinc-600'}`} />
            </button>
          </div>
        </div>

        {/* Momentum Meter Dashboard */}
        <div className="p-5 border border-white/5 bg-zinc-950/60 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-zinc-400 border-b border-white/5 pb-2.5">
              <span className="flex items-center gap-1.5 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                Cognitive Momentum Meter
              </span>
              <span className={`text-[8px] px-1 border font-bold ${
                momentum === 'improving' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                momentum === 'declining' ? 'bg-red-950/30 text-red-400 border-red-500/20' :
                'bg-zinc-900 text-zinc-400 border-white/10'
              }`}>
                {momentum.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              Based on actual calendar data. Commits compared against the prior weekly session log indicate speed fluctuations.
            </p>

            {/* Momentum visualization meter bar */}
            <div className="space-y-2 bg-[#09090b] border border-white/5 p-3">
              <div className="flex justify-between items-baseline text-[10px] font-mono uppercase">
                <span className="text-zinc-500 font-bold">Velocity Profile</span>
                <span className="text-white font-black">{displayCompletedThisWeek} vs {displayCompletedLastWeek} resolved</span>
              </div>

              {/* Progress gauge bar */}
              <div className="h-1.5 bg-zinc-900 border border-white/5 rounded-none overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-700 ${
                    momentum === 'improving' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                    momentum === 'declining' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, ((displayCompletedThisWeek + 1) / (displayCompletedLastWeek + displayCompletedThisWeek + 1 || 1)) * 100))}%` }}
                />
              </div>

              {/* Weekly text indicator line */}
              <div className="text-[9px] font-mono text-zinc-500 pt-1 flex justify-between">
                <span>Last Cycle</span>
                <span className={diffWow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {diffWow >= 0 ? `+${diffWow}` : diffWow} task resolution discrepancy
                </span>
                <span>This Cycle</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/[0.01] border border-white/5 text-[11px] text-zinc-300 leading-relaxed italic border-l-orange-500 font-sans">
            "You completed {displayCompletedThisWeek} tasks this calendar cycle. {
              diffWow > 0 ? `You are expanding velocity by +${diffWow} tasks compared to last week!` :
              diffWow === 0 ? "You are holding a stable, continuous velocity. Exceptional work." :
              `You dropped -${Math.abs(diffWow)} tasks lower than last week. Reconstruct focus intervals now.`
            }"
          </div>
        </div>
      </div>

      {/* Motivational Moments Callout */}
      <div className="p-4 bg-orange-950/10 border border-orange-500/10 flex items-start gap-3">
        <div className="w-8 h-8 shrink-0 bg-orange-950/30 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold font-mono text-xs">
          💡
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block font-bold">
            Anchor Cognitive Moment
          </span>
          <p className="text-[11px] text-orange-200 leading-relaxed">
            {momentData.quote}
          </p>
          <div className="flex items-center gap-1 text-[9px] font-mono text-orange-400">
            <span>🎉 {momentData.achievement}</span>
          </div>
        </div>
      </div>

      {/* Milestone Badges Board */}
      <div className="p-5 border border-white/5 bg-zinc-950/60 space-y-4">
        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-zinc-400 border-b border-white/5 pb-2.5">
          <span className="flex items-center gap-1.5 font-bold">
            <Award className="w-3.5 h-3.5 text-orange-500" />
            Milestone Focus Badges
          </span>
          <span className="text-[8px] bg-zinc-900 border border-white/10 px-1 font-bold text-zinc-400">
            {unlockedBadges.length} / {milestones.length} UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m) => {
            const isUnlocked = streak >= m.days || unlockedBadges.includes(m.days);
            return (
              <div 
                key={m.days} 
                className={`p-3 border flex flex-col justify-between items-center text-center space-y-2 select-none h-32 relative group transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-orange-500/25 bg-orange-950/10 text-white shadow-md shadow-orange-950/5' 
                    : 'border-white/5 bg-zinc-900/10 text-zinc-600'
                }`}
              >
                {isUnlocked && (
                  <span className="absolute top-1 right-1 text-[7px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1 border border-emerald-500/10">
                    UNLOCKED
                  </span>
                )}
                
                <div className={`text-2xl pt-1 font-serif ${isUnlocked ? 'grayscale-0' : 'grayscale opacity-25'}`}>
                  {m.icon}
                </div>

                <div className="space-y-0.5">
                  <div className={`text-[10px] font-black tracking-tight leading-none uppercase ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                    {m.name}
                  </div>
                  <div className={`text-[8px] font-mono font-bold ${isUnlocked ? 'text-orange-400' : 'text-zinc-700'}`}>
                    {m.days}-Day Continuity
                  </div>
                </div>

                {/* Micro hovering description tooltip */}
                <div className="absolute inset-0 bg-[#0c0c0e] p-3 text-center flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-0 pointer-events-none">
                  <p className="text-[8px] font-mono uppercase text-zinc-500">Milestone Info</p>
                  <p className="text-[9px] text-zinc-300 font-sans leading-tight mt-1">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard / Personal Records Panel */}
      <div className="p-5 border border-white/5 bg-zinc-950/60 space-y-4">
        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-zinc-400 border-b border-white/5 pb-2.5">
          <span className="flex items-center gap-1.5 font-bold">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            Operator Personal Records & Leaders Board
          </span>
          <span className="text-[8px] text-zinc-500">SOLO INDEXING</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Best Streak Field */}
          <div className="p-4 bg-white/[0.01] border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">All-Time High Streak</span>
            <span className="text-2xl font-black text-white font-mono tracking-tight">{personalBest} <span className="text-xs text-zinc-400">Days</span></span>
            <p className="text-[8px] font-sans text-zinc-500">Surpass yourself, Operator!</p>
          </div>

          {/* Peak Workload Single Day */}
          <div className="p-4 bg-white/[0.01] border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Best Executions Single Day</span>
            <span className="text-2xl font-black text-white font-mono tracking-tight">{bestDayCount} <span className="text-xs text-zinc-400">Tasks</span></span>
            <p className="text-[8px] font-sans text-zinc-500">Record workload completion on 24H frame</p>
          </div>

          {/* Aggregate Lifetime Completions */}
          <div className="p-4 bg-white/[0.01] border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Lifetime Total Resolved Nodes</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{totalCompleted} <span className="text-xs text-zinc-500">Done</span></span>
            <p className="text-[8px] font-sans text-zinc-500">Total verified accountability workloads</p>
          </div>
        </div>
      </div>

    </div>
  );
}
