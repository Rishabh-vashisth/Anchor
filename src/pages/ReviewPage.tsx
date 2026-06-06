import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Frown, 
  BookOpen, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Heart,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  CheckCircle,
  ThumbsUp,
  Sliders,
  History
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { Task, Reflection, DailyTodo, TimeLog, ReflectionTag } from '../types';

interface ReviewPageProps {
  key?: string;
  tasks: Task[];
  reflections: Reflection[];
  dailyTodos: { [date: string]: DailyTodo[] };
  timeLogs?: TimeLog[];
  onDeleteReflection: (id: string) => void;
}

type ReviewSubTab = 'THIS_WEEK' | 'PATTERNS' | 'REFLECTIONS' | 'ATTENTION_REPORT';

export function ReviewPage({
  tasks = [],
  reflections = [],
  dailyTodos = {},
  timeLogs = [],
  onDeleteReflection
}: ReviewPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<ReviewSubTab>('THIS_WEEK');

  // 1. Calculations: This Week
  const thisWeekStats = useMemo(() => {
    const now = Date.now();
    const startOfWeekMs = now - 7 * 24 * 3600 * 1000;
    
    const weekTasks = tasks.filter(t => t.createdAt >= startOfWeekMs);
    const completed = tasks.filter(t => t.status === 'completed' && t.completedAt && t.completedAt >= startOfWeekMs);
    const abandoned = tasks.filter(t => t.status === 'abandoned' && t.completedAt && t.completedAt >= startOfWeekMs);
    
    const durationSumSec = timeLogs
      .filter(l => l.startTime >= startOfWeekMs)
      .reduce((sum, l) => sum + l.duration, 0);

    return {
      createdCount: weekTasks.length,
      completedCount: completed.length,
      abandonedCount: abandoned.length,
      hoursSpent: parseFloat((durationSumSec / 3600).toFixed(1)),
    };
  }, [tasks, timeLogs]);

  // 2. Calculations: What Received Attention vs What Was Ignored
  const attentionStats = useMemo(() => {
    // Received Attention = Completed tasks with logged times, or primary focus keys
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // What Was Ignored = Delayed, idle pending tasks older than 3 days, or abandoned nodes
    const threeDaysAgoMs = Date.now() - 3 * 24 * 3600 * 1000;
    const ignoredTasks = tasks.filter(t => 
      (t.status === 'pending' && t.createdAt < threeDaysAgoMs) ||
      (t.category === 'DELAY') ||
      (t.status === 'abandoned')
    );

    return {
      attended: completedTasks.slice(0, 5),
      ignored: ignoredTasks.slice(0, 5),
    };
  }, [tasks]);

  // 3. Chart Data: Focus Patterns Mood vs Stress
  const chartPatternData = useMemo(() => {
    if (reflections.length === 0) {
      // Mock historical averages centered on 12 days for a clean line display
      return Array.from({ length: 6 }).map((_, idx) => ({
        day: `Seq ${idx + 1}`,
        Energy: 6 + (idx % 2 === 0 ? 1 : -1),
        Stress: 4 + (idx % 3 === 0 ? -1 : 1),
      }));
    }

    return [...reflections]
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .slice(-7)
      .map((r) => ({
        day: new Date(r.createdAt || r.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        Energy: r.moodEnergy || 5,
        Stress: r.stressLevel || 4,
      }));
  }, [reflections]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-8 py-4 text-left"
    >
      
      {/* Editorial Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
          Self-Correction & Clarity index
        </span>
        <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
          Review Console
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Avoid standard velocity scores. Look back on where your attention flowed and where it faltered to preserve cognitive clarity.
        </p>
      </div>

      {/* Primary Subtabs */}
      <div className="flex border-b border-white/5 bg-zinc-950/40 p-1 gap-1">
        {[
          { key: 'THIS_WEEK' as ReviewSubTab, label: 'This Cycle' },
          { key: 'PATTERNS' as ReviewSubTab, label: 'Patterns & Stress' },
          { key: 'ATTENTION_REPORT' as ReviewSubTab, label: 'Attention Tracker' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 py-2 text-[9px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer ${
              activeSubTab === tab.key ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: This Cycle Metrics summary */}
        {activeSubTab === 'THIS_WEEK' && (
          <motion.div
            key="this-week"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-5 border border-white/5 bg-zinc-950/30 text-center space-y-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Cycle Tasks Created</span>
                <span className="text-3xl font-black text-white font-mono">{thisWeekStats.createdCount}</span>
                <p className="text-[8px] text-zinc-600 font-mono">Current 7-day scale</p>
              </div>

              <div className="p-5 border border-white/5 bg-zinc-950/30 text-center space-y-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Resolved Tasks</span>
                <span className="text-3xl font-black text-white font-mono">{thisWeekStats.completedCount}</span>
                <p className="text-[8px] text-zinc-600 font-mono">Footprints indexed done</p>
              </div>

              <div className="p-5 border border-white/5 bg-zinc-950/30 text-center space-y-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Focused Time Record</span>
                <span className="text-3xl font-black text-orange-400 font-mono">{thisWeekStats.hoursSpent} <span className="text-xs text-zinc-500 font-sans font-normal">H</span></span>
                <p className="text-[8px] text-zinc-600 font-mono">Actual stopwatch logging active</p>
              </div>

            </div>

            {/* Micro weekly prose */}
            <div className="p-4 bg-white/[0.01] border border-white/5 text-xs text-zinc-300 leading-relaxed italic font-sans border-l-zinc-500">
              "Over the past 7 days, you resolved {thisWeekStats.completedCount} work nodes over {thisWeekStats.hoursSpent} verified deep focus hours. {
                thisWeekStats.abandonedCount > 0 ? `You cleanly abandoned ${thisWeekStats.abandonedCount} task nodes, freeing up strategic capacity. Perfect cognitive health.` :
                "Your capacity remained tightly allocated with zero friction leak."
              }"
            </div>

          </motion.div>
        )}

        {/* TAB 2: Patterns & Stress Chart */}
        {activeSubTab === 'PATTERNS' && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="p-5 border border-white/5 bg-zinc-950/60 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block font-bold">Mental Energy Log vs Stress Index</span>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPatternData}>
                    <defs>
                      <linearGradient id="clrEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="clrStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} domain={[1, 10]} />
                    <Tooltip cursor={{ strokeDasharray: '3' }} contentStyle={{ backgroundColor: '#090a0f', borderColor: '#ffffff20', color: '#fff', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="Energy" stroke="#ffffff" fillOpacity={1} fill="url(#clrEnergy)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Stress" stroke="#f97316" fillOpacity={1} fill="url(#clrStress)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 text-[9px] font-mono">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2.5 h-1 bg-white inline-block" /> Energy & Motivation Coefficient
                </span>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2.5 h-1 bg-orange-500 inline-block" /> Overload Pressure Index
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/10 border border-white/5 text-xs text-zinc-400 space-y-1">
                <h4 className="text-white font-bold font-sans">Strategic Insight</h4>
                <p className="leading-relaxed">
                  Focus peaks when stress levels stay below index 5. Breaking complex projects into highly isolated micro-milestones acts as a pressure release system.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/10 border border-white/5 text-xs text-zinc-400 space-y-1">
                <h4 className="text-white font-bold font-sans">Self-Care Directive</h4>
                <p className="leading-relaxed">
                  If energy trends downward, switch your anchor law to "Forgiving Mode" to safely preserve streaks and buffer mental capacity.
                </p>
              </div>
            </div>

          </motion.div>
        )}


        {/* TAB 4: What Received Attention vs What Was Ignored */}
        {activeSubTab === 'ATTENTION_REPORT' && (
          <motion.div
            key="attention-report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Left: What Received Attention (Completed nodes) */}
            <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-4">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF] font-bold">What Received Attention</span>
                <span className="text-[8px] font-mono text-zinc-600 font-bold">RESOLVED</span>
              </div>
              
              <ul className="space-y-3">
                {attentionStats.attended.map(t => (
                  <li key={t.id} className="p-3 bg-[#050507] border border-white/5 text-left font-mono">
                    <p className="text-xs text-zinc-300 leading-snug font-sans">{t.text}</p>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-1.5">
                      Completed {new Date(t.completedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </li>
                ))}

                {attentionStats.attended.length === 0 && (
                  <p className="text-[10px] text-zinc-600 font-mono italic text-center py-4">No logged focus footprints.</p>
                )}
              </ul>
            </div>

            {/* Right: What Was Ignored (Delay queue, old tasks) */}
            <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-4">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">What Was Ignored</span>
                <span className="text-[8px] font-mono text-zinc-600 font-bold">DETERIORATING</span>
              </div>
              
              <ul className="space-y-3">
                {attentionStats.ignored.map(t => (
                  <li key={t.id} className="p-3 bg-[#050507] border border-white/5 text-left font-mono">
                    <p className="text-xs text-zinc-300 leading-snug font-sans">{t.text}</p>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-1.5">
                      {t.status === 'abandoned' ? 'Cleanly Abandoned' : 'Awaiting attention for 3+ days'}
                    </span>
                  </li>
                ))}

                {attentionStats.ignored.length === 0 && (
                  <p className="text-[10px] text-zinc-600 font-mono italic text-center py-4">No tasks suffering drift decay. Stellar momentum!</p>
                )}
              </ul>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
}
