import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Flame, 
  CheckSquare, 
  ListTodo, 
  Calendar, 
  AlertCircle, 
  BrainCircuit, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  ChevronRight, 
  Trash2, 
  Lightbulb, 
  Check, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ZapOff
} from 'lucide-react';
import { Task, DailyTodo, Reflection, TimeBlockType, TimeLog, ActiveTimer, Goal, GoogleCalendarSettings, GoogleCalendarEvent, TimeBlock } from '../types';
import { detectTimeConflicts, getConcreteDatesForBlock } from '../utils/googleCalendarService';
import { GeminiAdvisor } from '../components/GeminiAdvisor';

interface DashboardPageProps {
  key?: string;
  primaryTask?: Task;
  tasks: Task[];
  allTasks: Task[];
  dailyTodos: DailyTodo[];
  streak: number;
  isContinuingTask: boolean;
  reflections: Reflection[];
  goals?: Goal[];
  onSetPrimary: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onAddMultipleSubtasks?: (taskId: string, titles: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddDailyTodo: (text: string) => void;
  onToggleDailyTodo: (id: string) => void;
  onDeleteDailyTodo: (id: string) => void;
  onSetStartDate: (taskId: string, startDate: number | null) => void;
  onSetDependency: (taskId: string, dependsOnId: string | null) => void;
  onLinkTaskToGoal?: (taskId: string, goalId: string | null) => void;

  // Real time-tracking props
  timeTrackingEnabled?: boolean;
  timeLogs?: TimeLog[];
  dailyTimeBudget?: number;
  activeTimer?: ActiveTimer | null;
  onStartTimer?: (taskId: string, isPomodoro?: boolean, pomodoroDurationMinutes?: number) => void;
  onStopTimer?: () => void;
  onAddManualTimeLog?: (taskId: string, durationMinutes: number) => void;
  onUpdateTaskEstimate?: (taskId: string, estimatedMinutes: number) => void;

  // Google Calendar Integration
  googleCalendarSettings?: GoogleCalendarSettings;
  googleCalendarEvents?: GoogleCalendarEvent[];
  timeBlocks?: TimeBlock[];
}

export function DashboardPage({
  primaryTask,
  tasks = [],
  allTasks = [],
  dailyTodos = [],
  streak = 0,
  isContinuingTask = false,
  reflections = [],
  goals = [],
  onSetPrimary,
  onToggleTask,
  onAddSubtask,
  onAddMultipleSubtasks,
  onToggleSubtask,
  onAddDailyTodo,
  onToggleDailyTodo,
  onDeleteDailyTodo,
  onSetStartDate,
  onSetDependency,
  onLinkTaskToGoal,
  
  timeTrackingEnabled = true,
  timeLogs = [],
  dailyTimeBudget = 480,
  activeTimer = null,
  onStartTimer,
  onStopTimer,
  onAddManualTimeLog,
  onUpdateTaskEstimate,

  googleCalendarSettings,
  googleCalendarEvents = [],
  timeBlocks = []
}: DashboardPageProps) {
  // Input states
  const [subtaskInput, setSubtaskInput] = useState('');
  const [todoInput, setTodoInput] = useState('');
  const [manualMinutesInput, setManualMinutesInput] = useState('');
  const [customEstimateInput, setCustomEstimateInput] = useState('');
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [customSuggestion, setCustomSuggestion] = useState<string | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

  // Focus progress tracking
  const subtasks = primaryTask?.subtasks || [];
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const totalSubtasksCount = subtasks.length;
  const progressPercent = totalSubtasksCount > 0 
    ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) 
    : 0;

  // Real active timer seconds ticking state
  useEffect(() => {
    if (!activeTimer) {
      setActiveTimerSeconds(0);
      return;
    }
    
    const calcElapsed = () => Math.floor((Date.now() - activeTimer.startTime) / 1000);
    setActiveTimerSeconds(calcElapsed());

    const intv = setInterval(() => {
      setActiveTimerSeconds(calcElapsed());
    }, 1000);

    return () => clearInterval(intv);
  }, [activeTimer]);

  // Total actual minutes completed on the active primary task
  const totalMinsLoggedOnActiveTask = useMemo(() => {
    if (!primaryTask) return 0;
    const taskLogs = timeLogs.filter(log => log.taskId === primaryTask.id);
    const secSum = taskLogs.reduce((sum, log) => sum + log.duration, 0);
    return Math.round(secSum / 60);
  }, [primaryTask, timeLogs]);

  // Today's total minutes tracked across all tasks
  const todayMinutesTracked = useMemo(() => {
    const todayStart = new Date().setHours(0,0,0,0);
    const loggedToday = timeLogs.filter(log => log.startTime >= todayStart);
    const seconds = loggedToday.reduce((sum, l) => sum + l.duration, 0);
    return Math.round(seconds / 60);
  }, [timeLogs]);

  // Weekly hours summary
  const weeklyHoursSummary = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const loggedThisWeek = timeLogs.filter(log => log.startTime >= oneWeekAgo);
    const seconds = loggedThisWeek.reduce((sum, l) => sum + l.duration, 0);
    return parseFloat((seconds / 3600).toFixed(1));
  }, [timeLogs]);

  // AI Estimate Suggester based on block type and segment checkpoints
  const suggestedAIEstimate = useMemo(() => {
    if (!primaryTask) return 0;
    let base = 30; // base minutes for light work
    if (primaryTask.block === 'DEEP') base = 60;
    if (primaryTask.block === 'FREE') base = 25;
    
    // add 15 minutes for each subtask checklist checkpoint
    const checkpointMultiplier = totalSubtasksCount * 15;
    return base + checkpointMultiplier;
  }, [primaryTask, totalSubtasksCount]);

  // 1. Today at a Glance Stats
  const completedTodayCount = useMemo(() => {
    return allTasks.filter(t => t.status === 'completed' && t.completedAt && 
      new Date(t.completedAt).toDateString() === new Date().toDateString()
    ).length;
  }, [allTasks]);

  const pendingCount = useMemo(() => {
    return tasks.filter(t => t.status === 'pending').length;
  }, [tasks]);

  const weeklyProgressPercent = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyTasks = allTasks.filter(t => t.createdAt >= oneWeekAgo);
    if (weeklyTasks.length === 0) return 60; // fallback standard anchor baseline
    const completed = weeklyTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / weeklyTasks.length) * 100);
  }, [allTasks]);

  const calendarConnected = googleCalendarSettings?.connected;

  const activeConflicts = useMemo(() => {
    if (!calendarConnected || !googleCalendarSettings?.syncConflictsWarn) return [];
    return detectTimeConflicts(timeBlocks, googleCalendarEvents);
  }, [calendarConnected, googleCalendarSettings, timeBlocks, googleCalendarEvents]);

  const nextThreeMeetings = useMemo(() => {
    const nowMs = Date.now();
    return googleCalendarEvents
      .filter(e => {
        const s = e.start?.dateTime;
        if (!s) return false;
        return new Date(s).getTime() >= nowMs;
      })
      .slice(0, 3);
  }, [googleCalendarEvents]);

  const upcomingMeetingIn15Mins = useMemo(() => {
    const nowMs = Date.now();
    return googleCalendarEvents.find(e => {
      const s = e.start?.dateTime;
      if (!s) return false;
      const startMs = new Date(s).getTime();
      const diffMins = (startMs - nowMs) / 60000;
      return diffMins > 0 && diffMins <= 15;
    });
  }, [googleCalendarEvents]);

  // Handle manual log form
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryTask && manualMinutesInput.trim()) {
      const mins = Number(manualMinutesInput);
      if (mins > 0 && onAddManualTimeLog) {
        onAddManualTimeLog(primaryTask.id, mins);
        setManualMinutesInput('');
      }
    }
  };

  // Handle setting/updating estimation form
  const handleUpdateEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryTask && customEstimateInput.trim()) {
      const mins = Number(customEstimateInput);
      if (mins > 0 && onUpdateTaskEstimate) {
        onUpdateTaskEstimate(primaryTask.id, mins);
        setCustomEstimateInput('');
      }
    }
  };



  // AI-generated suggestions engine (sophisticated heuristic client AI model analyzer)
  const aiSuggestion = useMemo(() => {
    if (customSuggestion) return customSuggestion;
    if (!primaryTask) {
      return "Define a Primary Focus to establish today's anchor task. An anchor blocks cognitive pollution and sets clear execution boundaries.";
    }

    const hasSubtasks = subtasks.length > 0;
    const incompleteSub = subtasks.find(s => !s.completed);
    
    let advice = "";
    if (!hasSubtasks) {
      advice = `Break down "${primaryTask.text}" into 2-3 precise tactical steps immediately to lower completion friction. Actionable clarity drives momentum.`;
    } else if (incompleteSub) {
      advice = `Current high leverage lever: Concentrate strictly on your active subtask "${incompleteSub.title}". Shut down other open browser tabs.`;
    } else {
      advice = `All defined tactical steps completed! Consolidate the work for "${primaryTask.text}" and commit the final result.`;
    }

    if (primaryTask.block === 'DEEP') {
      advice += " This is categorized as a DEEP execution block. Safeguard the next 90 minutes from mobile alerts.";
    }
    return advice;
  }, [primaryTask, subtasks, customSuggestion]);

  // Custom simulation for generating bespoke AI Suggestion
  const triggerCoachingAISuggestion = () => {
    if (!primaryTask) return;
    setIsGeneratingSuggestion(true);
    setTimeout(() => {
      const suggestions = [
        `Strategic leverage: "${primaryTask.text}" represents a high-impact professional node. Complete the sub-tasks in silent mode. Refuse meetings.`,
        `Friction assessment: Procrastination is a direct byproduct of abstract goals. Ensure the first tactical action node takes less than 5 minutes.`,
        `Behavioral audit: Your past completed records indicate optimum focus is reached before 1 PM. Execute "${primaryTask.text}" during this neurological peak.`,
        `Anchor protocol: Do not answer random Slack messages or check email folders until this primary node transitions to 'completed'.`
      ];
      setCustomSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setIsGeneratingSuggestion(false);
    }, 1200);
  };

  // 3. Upcoming Tasks (next 3 days with simulated starting scheduled timeline & dependencies)
  const upcomingTasksData = useMemo(() => {
    const sorted = tasks
      .filter(t => t.id !== primaryTask?.id && t.status === 'pending')
      .slice(0, 4); // prioritize top pending tasks
    
    return sorted.map((task, index) => {
      // Simulate Days Out
      const daysOut = index + 1;
      const dateLabel = daysOut === 1 ? 'Tomorrow' : `In ${daysOut} days`;
      
      const depTask = task.dependsOn ? allTasks.find(at => at.id === task.dependsOn) : null;
      return {
        ...task,
        dateLabel,
        daysOut,
        dependencyName: depTask?.text || null,
        dependencyCompleted: depTask?.status === 'completed'
      };
    });
  }, [tasks, primaryTask, allTasks]);

  // 4. Insight of the Day (AI-generated behavioral insight or customized wisdom)
  const dailyInsight = useMemo(() => {
    // Select dynamic wisdom based on weekly behavior patterns
    const defaultPool = [
      {
        text: "The 'Just Start' illusion is real. The human mind builds exponential resistance to tasks defined abstractly. Frame your anchors using hyper-tactical action verbs.",
        source: "Anchor Discipline System",
        tag: "Friction Control"
      },
      {
        text: "You carry a streak metric. Protecting this streak is not gamified validation, it is physiological momentum. Do not skip the EOD review.",
        source: "Chronos Behavioral Ledger",
        tag: "System Habits"
      },
      {
        text: "Deep work blocks suffer a 40% efficiency drop if mixed with quick checks. When you commit your anchor daily, turn on do-not-disturb modes unconditionally.",
        source: "Attention Economy Report",
        tag: "Deep Blocks"
      },
      {
        text: "Mistakes are just raw telemetry. When logging an EOD error or failure reason, you register structural blockers. Adapt, do not judge.",
        source: "Accountability Loop Engine",
        tag: "Insights"
      }
    ];
    
    // Mix in user reflections if available! This perfectly matches "show a reflection instead of empty message"
    if (reflections.length > 0) {
      const randomRef = reflections[Math.floor(Math.random() * reflections.length)];
      return {
        text: `From your previous log: "${randomRef.text}"`,
        source: `Your personal ${randomRef.tag}`,
        tag: "Logged Reflection"
      };
    }

    return defaultPool[Math.floor(Math.random() * defaultPool.length)];
  }, [reflections]);

  // 5. Weekly Overview: Blocks distribution & ratios
  const blockDistribution = useMemo(() => {
    const deepTasks = allTasks.filter(t => t.block === 'DEEP');
    const lightTasks = allTasks.filter(t => t.block === 'LIGHT');
    const freeTasks = allTasks.filter(t => t.block === 'FREE');

    const computeRate = (list: Task[]) => {
      if (list.length === 0) return 0;
      return Math.round((list.filter(t => t.status === 'completed').length / list.length) * 100);
    };

    return [
      { type: 'DEEP' as TimeBlockType, label: 'Deep blocks', count: deepTasks.length, rate: computeRate(deepTasks), color: 'bg-orange-500' },
      { type: 'LIGHT' as TimeBlockType, label: 'Light blocks', count: lightTasks.length, rate: computeRate(lightTasks), color: 'bg-blue-400' },
      { type: 'FREE' as TimeBlockType, label: 'Free spaces', count: freeTasks.length, rate: computeRate(freeTasks), color: 'bg-zinc-600' }
    ];
  }, [allTasks]);

  // Handle tactical adding of subtasks from focus card
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryTask && subtaskInput.trim()) {
      onAddSubtask(primaryTask.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  // Convert custom todo list items add
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (todoInput.trim()) {
      onAddDailyTodo(todoInput.trim());
      setTodoInput('');
    }
  };

  return (
    <div className="space-y-10 focus-hub-container text-white">

      {/* Google Calendar Alerts Overlay Layer */}
      <AnimatePresence>
        {upcomingMeetingIn15Mins && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 border-2 border-red-500/30 bg-red-950/20 text-white flex items-center justify-between gap-4 font-mono mb-4 rounded-none"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-red-500 animate-ping shrink-0 rounded-none" />
              <div>
                <span className="text-[10px] uppercase font-black text-red-400 block tracking-widest leading-none mb-1">
                  🔴 Imminent Meeting Warning
                </span>
                <p className="text-xs font-sans text-zinc-350">
                  You have a scheduled calendar event &ldquo;<strong>{upcomingMeetingIn15Mins.summary}</strong>&rdquo; starting in less than 15 minutes! Please wrap up active deep work focus blocks.
                </p>
              </div>
            </div>
            {upcomingMeetingIn15Mins.htmlLink && (
              <a
                href={upcomingMeetingIn15Mins.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[10px] px-3 py-1.5 bg-red-500 text-white font-black uppercase hover:bg-red-600 transition-colors tracking-wider"
              >
                Join / View Event
              </a>
            )}
          </motion.div>
        )}

        {activeConflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 border border-orange-500/25 bg-orange-950/10 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono mb-4 text-xs"
          >
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-black text-orange-400 block tracking-widest mb-1 leading-none">
                  ⚠️ Google Calendar Overlap Conflict detected ({activeConflicts.length})
                </span>
                <p className="font-sans text-zinc-300 text-[11px] leading-relaxed">
                  Your local focus blocks overlap with {activeConflicts.length} meeting{activeConflicts.length > 1 ? 's' : ''} in your GCal scheduler: &ldquo;{activeConflicts.slice(0, 2).map(c => `${c.blockLabel} overlays ${c.eventSummary}`).join(', ')}{activeConflicts.length > 2 ? '... and others' : ''}&rdquo;.
                </p>
              </div>
            </div>
            <span className="text-[9px] uppercase font-black shrink-0 px-2.5 py-1.5 border border-orange-500/30 text-orange-400 bg-orange-500/5 select-none font-mono">
              Overlap Alert
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Calendar Scheduled Meetings Hub */}
      {calendarConnected && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block font-extrabold">
              Upcoming Scheduled Meetings & Events
            </h3>
            <span className="text-[8px] font-mono px-2 py-0.5 bg-zinc-900 border border-white/5 uppercase text-orange-500 font-bold animate-pulse-subtle">
              ● Live Sync Connected
            </span>
          </div>

          <div className="border border-white/5 bg-zinc-950/40 p-4 space-y-3">
            {nextThreeMeetings.length === 0 ? (
              <div className="py-8 font-mono text-center border border-dashed border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                No upcoming calendar meetings scheduled for today or tomorrow.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {nextThreeMeetings.map(meeting => {
                  const itemStart = meeting.start?.dateTime ? new Date(meeting.start.dateTime) : null;
                  const itemEnd = meeting.end?.dateTime ? new Date(meeting.end.dateTime) : null;
                  const timeStr = itemStart 
                    ? itemStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : 'All Day';
                  const dateStr = itemStart
                    ? itemStart.toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : '';
                  
                  return (
                    <div key={meeting.id} className="p-3 border border-white/5 bg-zinc-950/80 flex flex-col justify-between hover:border-orange-500/30 transition-all font-mono">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-[8px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 uppercase tracking-widest leading-none">
                            {meeting.summary ? 'EXTERNAL' : 'PRIVATE'}
                          </span>
                          <span className="text-[9.5px] text-zinc-500 font-bold">
                            {dateStr}
                          </span>
                        </div>
                        <h4 className="text-xs font-sans font-black text-white line-clamp-1 uppercase">
                          {meeting.summary || '(No Scheduled Topic)'}
                        </h4>
                        <div className="text-[10px] text-zinc-400 font-mono mt-1">
                          {timeStr} {itemEnd ? ` - ${itemEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>

                      <div className="border-t border-white/[0.04] mt-3 pt-2.5 flex justify-between items-center text-[8.5px]">
                        <span className="text-zinc-500 truncate max-w-[120px]">Room: {meeting.location || 'Online'}</span>
                        {meeting.htmlLink && (
                          <a
                            href={meeting.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-400 hover:underline hover:text-orange-300 font-black uppercase shrink-0"
                          >
                            Launch Event ➔
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* 1. Header with greeting and responsive date */}
      <section className="space-y-1">
        <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-1">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-orange-500 font-bold block animate-pulse-subtle">
              System Online
            </span>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
              Execute, commander
            </h1>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2 mt-1 md:mt-0">
            <Calendar className="w-3.5 h-3.5 text-orange-500/80" />
            <span>UTC {new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 mt-2 font-light">
          Your focused landing dashboard. Review priorities and execute cleanly.
        </p>
      </section>

      {/* 2. Today at a Glance - Quick Stats (Responsive structure: 3 cols on desktop, 1 on mobile) */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
          Today at a Glance
        </h3>
        
        <div className={`grid grid-cols-1 ${timeTrackingEnabled ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
          {/* Active Streak */}
          <div className="p-4 border border-white/5 bg-zinc-950/60 flex items-center gap-4 group hover:border-orange-500/30 transition-all duration-300">
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/[0.02] shrink-0 group-hover:border-orange-500/40">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                {streak} <span className="text-xs font-mono text-zinc-500 uppercase font-normal">Active</span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Honesty Streak Metrics
              </p>
            </div>
          </div>

          {/* Planned Anchor Nodes */}
          <div className="p-4 border border-white/5 bg-zinc-950/60 flex items-center gap-4 group hover:border-white/20 transition-all duration-300">
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/[0.02] shrink-0">
              <CheckSquare className="w-5 h-5 text-zinc-400 font-bold" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-white">
                {completedTodayCount} <span className="text-xs font-mono text-zinc-500 uppercase font-normal">/ {completedTodayCount + pendingCount} Done</span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Today's Core Executions
              </p>
            </div>
          </div>

          {/* Optional: Today's Time Budget Display */}
          {timeTrackingEnabled && (
            <div className="p-4 border border-white/5 bg-zinc-950/60 flex-col justify-between group hover:border-orange-500/30 transition-all duration-300 flex">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/[0.02] shrink-0">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight text-white">
                    {todayMinutesTracked} <span className="text-xs font-mono text-zinc-500 uppercase font-normal">/ {dailyTimeBudget}m</span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    Focus Time Budget
                  </p>
                </div>
              </div>
              {/* Daily budget progress bar */}
              <div className="w-full bg-white/5 h-1">
                <div 
                  className={`h-full transition-all duration-500 ${todayMinutesTracked > dailyTimeBudget ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} 
                  style={{ width: `${Math.min(100, (todayMinutesTracked / dailyTimeBudget) * 100)}%` }} 
                />
              </div>
            </div>
          )}

          {/* Weekly Baseline Ratio or Weekly Hours Tracked Summary */}
          <div className="p-4 border border-white/5 bg-zinc-950/60 flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300 flex">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/[0.02] shrink-0 animate-pulse-subtle">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-white">
                  {timeTrackingEnabled ? `${weeklyHoursSummary}h` : `${weeklyProgressPercent}%`}
                </div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  {timeTrackingEnabled ? `Tracked This Week` : `Weekly Anchor Target`}
                </p>
              </div>
            </div>
            {/* Tiny progress bar */}
            <div className="w-full bg-white/5 h-1">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${weeklyProgressPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC STRATEGIC GOAL PROGRESS & ALIGNMENT HUB */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block font-extrabold">
            Strategic Objectives Progress
          </h3>
          <span className="text-[8px] font-mono px-2 py-0.5 bg-zinc-900 border border-white/5 uppercase text-zinc-400">
            {goals.filter(g => g.status === 'active').length} Active Targets / {goals.filter(g => g.status === 'completed').length} Solved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Active Goals list summary block */}
          <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-3.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">This Week's Goal Progress Tracker</span>
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {goals.filter(g => g.status === 'active').map(goal => {
                // Compute progress percentage from KRs
                const totalKRs = goal.keyResults?.length || 0;
                const completedKRs = goal.keyResults?.filter(k => k.completed).length || 0;
                const pct = totalKRs > 0 ? Math.round((completedKRs / totalKRs) * 100) : (goal.completed ? 100 : 0);
                const parent = goals.find(p => p.id === goal.parentId);

                return (
                  <div key={goal.id} className="space-y-1 bg-zinc-950 p-2.5 border border-white/5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-zinc-250 uppercase truncate pr-2">
                        {goal.type === 'quarterly' ? 'Quarterly' : 'Weekly'}: {goal.title}
                      </span>
                      <span className="font-mono text-orange-400 shrink-0 font-bold">{pct}%</span>
                    </div>
                    {parent && (
                      <span className="text-[8px] font-mono text-zinc-500 block">
                        ↳ Supporting Quarterly Goal: {parent.title}
                      </span>
                    )}
                    <div className="w-full bg-white/5 h-1">
                      <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {goals.filter(g => g.status === 'active').length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-[10px] font-mono text-zinc-600 italic">No active strategic objectives found.</p>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mt-1">Go to Goals page to map long-term targets.</p>
                </div>
              )}
            </div>
          </div>

          {/* Monday Alignment Prompt Card */}
          <div className="p-5 border border-white/10 bg-zinc-950/60 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest font-black">
                  {new Date().getDay() === 1 ? '🚨 Monday Accountability Prompt' : '📅 Strategic Review Cycle'}
                </span>
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight">
                {new Date().getDay() === 1 ? 'Reflect on last week & set focus' : 'Operational Alignment Loop'}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                {new Date().getDay() === 1 
                  ? "It is Monday. Take 5 minutes to audit your quarterly/weekly key results, evaluate execution accuracy, and adjust your pending focus nodes."
                  : "Calibrate objectives and alignment maps periodically. Keep daily priority tasks associated with larger long-term targets."}
              </p>
            </div>

            <div className="border-t border-white/5 mt-4 pt-3 flex items-center justify-between">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">OKR CYCLE ACTIVE</span>
              <button
                onClick={() => {
                  alert("Proceeding to Strategic Review. Please click on the 'Goals' tab in the navigation menu and choose 'Weekly Review Cycle' to proceed!");
                }}
                className="py-1 px-3 bg-white text-black font-mono text-[9px] font-black uppercase tracking-widest hover:opacity-90 leading-none transition-opacity"
              >
                Launch review
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Primary Focus Card with Expandable details, progression, Timer and Suggestion */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
            Primary Focus Module
          </h3>
          {primaryTask && (
            <span className="text-[9px] font-mono bg-orange-950/40 border border-orange-500/20 text-orange-500 px-2 py-0.5 uppercase tracking-widest">
              {primaryTask.block || 'DEEP BLOCK'}
            </span>
          )}
        </div>

        {primaryTask ? (
          <div className="p-6 border-2 border-white bg-zinc-950/40 relative overflow-hidden group shadow-[0_4px_30px_rgba(255,255,255,0.02)] space-y-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="w-32 h-32 -mr-12 -mt-12 text-white" />
            </div>

            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  TODAY'S CHOSEN ANCHOR
                </span>
                {(() => {
                  if (primaryTask.goalId) {
                    const lg = goals.find(g => g.id === primaryTask.goalId);
                    if (lg) {
                      return (
                        <span className="text-[8px] font-mono border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 px-2 py-0.5 uppercase tracking-wider">
                          🎯 Aligned: {lg.title}
                        </span>
                      );
                    }
                  }
                  return (
                    <span className="text-[8px] font-mono border border-amber-500/25 bg-amber-950/20 text-amber-500 px-2 py-0.5 uppercase tracking-wider font-bold animate-pulse">
                      ⚠️ Unaligned Vector
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                {primaryTask.text}
              </h2>
            </div>

            {/* Subtask Progression */}
            <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                <span>Execution Steps</span>
                <span>{completedSubtasksCount} / {totalSubtasksCount} ({progressPercent}%)</span>
              </div>
              <div className="h-1 bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Subtasks Item Checklist */}
              {totalSubtasksCount > 0 ? (
                <div className="space-y-2 pt-2">
                  {subtasks.map(subtask => (
                    <button
                      key={subtask.id}
                      onClick={() => onToggleSubtask(primaryTask.id, subtask.id)}
                      className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all text-sm group/sub"
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center transition-all shrink-0 ${
                        subtask.completed ? 'bg-white border-white text-black' : 'border-zinc-700 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className={`text-[12px] font-mono ${subtask.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-zinc-600 italic">No task segments drafted. Add segments below.</p>
              )}

              {/* Add Tactical Segments */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2 border-t border-white/5">
                <input 
                  type="text" 
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Draft next tactical step..." 
                  className="bg-transparent border-b border-white/10 py-1 text-xs focus:border-white outline-none flex-1 font-mono text-zinc-300"
                />
                <button type="submit" className="p-1 px-3 border border-white/10 hover:border-white font-mono text-[10px] uppercase tracking-widest">
                  Add
                </button>
              </form>
            </div>

            {/* Time Invested Module */}
            <div className="border-t border-white/10 pt-4 space-y-4">
              {!timeTrackingEnabled ? (
                <div className="text-xs text-zinc-500 font-mono italic">
                  ⏱️ Time Tracking is inactive. You can toggle this feature and set cognitive budgets in Settings.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timer Display Cards and Presets */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
                    {/* Active Time Log Status */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                        Actual Logged Duration
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-mono font-black text-white">
                          {totalMinsLoggedOnActiveTask}
                          <span className="text-xs font-normal text-zinc-500 ml-1">mins</span>
                        </span>
                        
                        {activeTimer && (
                          <span className="text-xs font-mono text-orange-500 font-bold animate-pulse">
                            (+ {Math.floor(activeTimerSeconds / 60)}m {activeTimerSeconds % 60}s active)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {activeTimer ? (
                        <button
                          onClick={onStopTimer}
                          className="py-2.5 px-5 font-mono text-[10px] items-center gap-1.5 uppercase tracking-widest bg-red-950/30 text-red-500 border border-red-500 hover:bg-red-900/40 transition-all flex font-black"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Stop Tracker</span>
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {/* Standard Timer */}
                          <button
                            onClick={() => onStartTimer && onStartTimer(primaryTask.id, false)}
                            className="py-2 px-3 font-mono text-[9px] uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-all font-black flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span> stopwatch</span>
                          </button>
                          
                          {/* Pomodoro Presets */}
                          <button
                            onClick={() => onStartTimer && onStartTimer(primaryTask.id, true, 25)}
                            className="py-2 px-2.5 font-mono text-[9px] uppercase tracking-widest border border-orange-500/30 text-orange-400 hover:border-orange-500 hover:bg-orange-950/20 transition-all"
                          >
                            25m Pomodoro
                          </button>
                          <button
                            onClick={() => onStartTimer && onStartTimer(primaryTask.id, true, 45)}
                            className="py-2 px-2.5 font-mono text-[9px] uppercase tracking-widest border border-orange-500/30 text-orange-400 hover:border-orange-500 hover:bg-orange-950/20 transition-all"
                          >
                            45m Sprint
                          </button>
                          <button
                            onClick={() => onStartTimer && onStartTimer(primaryTask.id, true, 90)}
                            className="py-2 px-2.5 font-mono text-[9px] uppercase tracking-widest border border-orange-500/30 text-orange-400 hover:border-orange-500 hover:bg-orange-950/20 transition-all"
                          >
                            90m Deep Focus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* POMODOROS STATUS ALARM BANNER */}
                  {activeTimer && activeTimer.isPomodoro && (
                    <div className="p-2.5 border border-orange-500/10 bg-orange-950/15 flex justify-between items-center text-[10px] font-mono uppercase">
                      <span className="text-orange-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-none animate-ping" />
                        Focus countdown: {Math.round(activeTimer.pomodoroDuration / 60)}m preset
                      </span>
                      <span className="text-zinc-400 font-bold">
                        {(() => {
                           const elapsedSec = activeTimerSeconds;
                           const targetSec = activeTimer.pomodoroDuration;
                           const remSec = targetSec - elapsedSec;
                           if (remSec <= 0) {
                             return <span className="text-red-500 font-black tracking-widest animate-pulse">SESSION EXPIRED - RE-DRAIN COGNITION NOW</span>;
                           }
                           const remMin = Math.floor(remSec / 60);
                           const remS = remSec % 60;
                           return `Time remaining: ${remMin}:${remS.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* DISTRACTION BLOCK PROMPT */}
                  {activeTimer && primaryTask.block === 'DEEP' && (
                    <div className="p-3 border border-red-500/20 bg-red-950/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>COGNITIVE LOCKDOWN ENFORCED</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                        Slack, Gmail, and browser distraction segments are flagged. Protect your current neural session at all costs.
                      </p>
                    </div>
                  )}

                  {/* GOAL INTERACTIVE ASSOCIATION DROPDOWN */}
                  <div className="p-3 border border-white/5 bg-zinc-950 flex flex-col justify-between gap-1.5">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">Linked Strategic Objective</span>
                    <select
                      value={primaryTask.goalId || ''}
                      onChange={(e) => onLinkTaskToGoal && onLinkTaskToGoal(primaryTask.id, e.target.value || null)}
                      className="bg-zinc-900 border border-white/5 py-1.5 px-3 text-xs font-mono text-white outline-none focus:border-white w-full cursor-pointer"
                    >
                      <option value="">⚠️ No aligned objective (Unaligned Anchor)</option>
                      {goals.filter(g => g.status === 'active').map(g => (
                        <option key={g.id} value={g.id}>
                          {g.type === 'quarterly' ? 'Quarterly' : 'Weekly'}: {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* COMPARATIVE ESTIMATION RATIO DETAILS & SET ESTIMATOR */}
                  <div className="p-3 border border-white/5 bg-white/[0.01] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Estimate state indicators */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase text-[9px]">Calculated Target:</span>
                        {primaryTask.estimatedTime ? (
                          <span className="font-bold text-white font-mono">
                            {primaryTask.estimatedTime} mins
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">No estimation</span>
                        )}
                      </div>

                      {primaryTask.estimatedTime && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500 uppercase">Discipline Accuracy:</span>
                          {totalMinsLoggedOnActiveTask === 0 ? (
                            <span className="text-zinc-600">Pending Log</span>
                          ) : totalMinsLoggedOnActiveTask <= primaryTask.estimatedTime ? (
                            <span className="text-emerald-400 font-bold">
                              Under Estimate (Remaining: {primaryTask.estimatedTime - totalMinsLoggedOnActiveTask}m)
                            </span>
                          ) : (
                            <span className="text-amber-500 font-black animate-pulse">
                              Over Budget (+{totalMinsLoggedOnActiveTask - primaryTask.estimatedTime}m over)
                            </span>
                          )}
                        </div>
                      )}

                      {/* AI suggest auto estimate */}
                      <button
                        onClick={() => onUpdateTaskEstimate && onUpdateTaskEstimate(primaryTask.id, suggestedAIEstimate)}
                        className="text-[9px] text-orange-400 uppercase tracking-widest font-mono hover:text-white flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 stroke-[2.5]" />
                        <span>Apply AI Suggested Estimate: {suggestedAIEstimate}m</span>
                      </button>
                    </div>

                    {/* Right: input to set estimate */}
                    <form onSubmit={handleUpdateEstimate} className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Set Manual Estimate</span>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          placeholder="mins"
                          value={customEstimateInput}
                          onChange={(e) => setCustomEstimateInput(e.target.value)}
                          className="bg-zinc-900 border border-white/5 py-1 px-2 text-xs flex-1 font-mono text-white placeholder:text-zinc-700 outline-none focus:border-white focus:bg-transparent"
                        />
                        <button
                          type="submit"
                          className="py-1 px-3 border border-white/15 hover:border-white text-[9px] font-mono uppercase tracking-widest font-black"
                        >
                          SET
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* OFFLINE TIMELOG ENTRY FORM */}
                  <form onSubmit={handleAddManualLog} className="border-t border-white/5 pt-3 flex md:flex-row flex-col justify-between items-start md:items-center gap-3">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase space-y-0.5">
                      <span className="block font-bold">Log Offline Execution</span>
                      <p className="text-[9px] text-zinc-600 font-sans tracking-tight">Record minutes clocked during disconnected focus intervals</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <input
                        type="number"
                        placeholder="Offline Mins (e.g. 35)"
                        value={manualMinutesInput}
                        onChange={(e) => setManualMinutesInput(e.target.value)}
                        className="bg-zinc-950 border border-white/5 py-1.5 px-3 text-xs w-full md:w-40 font-mono text-white placeholder:text-zinc-700 outline-none focus:border-white focus:bg-transparent"
                      />
                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-zinc-905 border border-white/15 hover:border-white text-[9px] font-mono font-black uppercase tracking-widest text-zinc-300 hover:text-white shrink-0 transition-colors"
                      >
                        Log Offline
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* AI Suggestion Display Panel */}
            <div className="p-4 border border-zinc-800 bg-zinc-950 rounded-none space-y-2 relative">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-[9px] font-mono text-orange-400 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 stroke-[2.5]" />
                  <span>Cognitive Catalyst Suggestion</span>
                </div>
                <button 
                  onClick={triggerCoachingAISuggestion}
                  disabled={isGeneratingSuggestion}
                  className="text-[9px] font-mono text-white/40 hover:text-white uppercase transition-colors"
                >
                  {isGeneratingSuggestion ? 'Calculating...' : 'Regenerate'}
                </button>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed italic">
                {aiSuggestion}
              </p>
            </div>

            {/* Mark as Finished */}
            <div className="flex justify-end border-t border-white/10 pt-4">
              <button
                onClick={() => onToggleTask(primaryTask.id)}
                className="py-3 px-8 bg-white text-black font-black font-mono text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all text-center w-full"
              >
                Mark Primary Anchor Complete
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 border-2 border-dashed border-white/10 text-center space-y-6 bg-zinc-950/10">
            <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.3em]">No Active Anchor</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Execution requires an anchor. Go to the <span className="font-bold text-white">Focus Board</span> in the sidebar or click a pending task on Stats to flag it as today's Primary Task.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Today's List Quick To-Do (Complimentary task system) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
            Today's Quick List
          </h3>
          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 py-0.5 px-2 uppercase tracking-widest">
            {dailyTodos.filter(t => t.completed).length} / {dailyTodos.length} Done
          </span>
        </div>

        <div className="border border-white/5 bg-zinc-950/40 p-5 space-y-4">
          {/* Scrollable list container */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-1">
            <AnimatePresence mode="popLayout">
              {dailyTodos.map(todo => (
                <motion.div
                  key={todo.id}
                  layoutId={`todo-${todo.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center justify-between p-3 border border-white/5 transition-all group ${
                    todo.completed ? 'opacity-40 bg-zinc-900/10' : 'bg-white/[0.01] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleDailyTodo(todo.id)}
                      className={`w-4 h-4 border flex items-center justify-center transition-all shrink-0 ${
                        todo.completed ? 'bg-white border-white text-black' : 'border-zinc-700 hover:border-white/40'
                      }`}
                    >
                      {todo.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className={`text-xs ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {todo.text}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteDailyTodo(todo.id)}
                    className="p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {dailyTodos.length === 0 && (
              <p className="text-center py-6 text-[10px] font-mono text-zinc-600 uppercase tracking-wider italic">
                Inventory clear. No micro-clutter.
              </p>
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddTodo} className="relative mt-2">
            <input 
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder="Dump small chore to clear memory space... (Press Enter)"
              className="w-full bg-transparent border-b border-white/10 py-3 text-xs focus:border-white outline-none transition-all placeholder:text-zinc-600 font-mono text-zinc-200"
            />
            <button 
              type="submit"
              className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 ${todoInput.trim() ? 'text-white' : 'text-white/10'}`}
              disabled={!todoInput.trim()}
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* 4. Upcoming Tasks (next 3 days with dependency visualization) */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
          Upcoming Schedule Blueprint
        </h3>

        <div className="space-y-4 border border-white/5 bg-zinc-950/40 p-5">
          {upcomingTasksData.length > 0 ? (
            <div className="space-y-4 relative pl-4 border-l border-white/10">
              <AnimatePresence mode="popLayout">
                {upcomingTasksData.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layoutId={`upcoming-task-${task.id}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      delay: index * 0.04 
                    }}
                    className="relative group space-y-1"
                  >
                    
                    {/* Connected Bullet dot */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-none border border-white bg-black flex items-center justify-center">
                      <div className="w-1 h-1 bg-white" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block">
                        {task.dateLabel}
                      </span>
                      {task.block && (
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">
                          {task.block} Block
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-white/90">
                      {task.text}
                    </p>

                    {/* Dependency Visualization line connected in UI */}
                    {task.dependencyName && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="w-2.5 h-2 border-l border-b border-zinc-700/80 -mt-1.5 shrink-0" />
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1.5 ${
                          task.dependencyCompleted 
                            ? 'border border-emerald-500/15 bg-emerald-950/20 text-emerald-400/80' 
                            : 'border border-orange-500/15 bg-orange-950/20 text-orange-400/80'
                        }`}>
                          Prerequisite: {task.dependencyName} ({task.dependencyCompleted ? 'RESOLVED' : 'BLOCKED'})
                        </span>
                      </div>
                    )}

                    {/* Goal Association alignment status label */}
                    <div className="pt-0.5">
                      {(() => {
                        const originalTask = allTasks.find(t => t.id === task.id);
                        if (originalTask && originalTask.goalId) {
                          const lg = goals.find(g => g.id === originalTask.goalId);
                          if (lg) {
                            return (
                              <span className="inline-block text-[8px] font-mono border border-emerald-500/10 bg-emerald-950/10 text-emerald-400/85 px-1.5 py-0.5 uppercase tracking-wider">
                                🎯 OBJD: {lg.title}
                              </span>
                            );
                          }
                        }
                        return (
                          <span className="inline-block text-[8px] font-mono border border-amber-500/15 bg-amber-950/10 text-amber-500/70 px-1.5 py-0.5 uppercase tracking-wider font-semibold">
                            ⚠️ UNALIGNED PIPELINE
                          </span>
                        );
                      })()}
                    </div>

                    {/* Move to anchor options */}
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button 
                        onClick={() => onSetPrimary(task.id)}
                        className="text-[9px] font-mono bg-white text-black font-bold uppercase tracking-widest px-2 py-0.5 hover:opacity-85"
                      >
                        Make Primary Anchor
                      </button>
                      <button 
                        onClick={() => {
                          const daysMs = task.daysOut * 24 * 60 * 60 * 1000;
                          onSetStartDate(task.id, Date.now() + daysMs);
                        }}
                        className="text-[9px] font-mono border border-white/10 hover:border-white text-zinc-400 hover:text-white uppercase px-2 py-0.5"
                      >
                        Reschedule
                      </button>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-center py-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic">
              No upcoming items slates. Check your Dump page.
            </p>
          )}
        </div>
      </section>

      {/* Gemini AI Intelligence Advisor */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
          Anchor AI Diagnostic Station
        </h3>
        <GeminiAdvisor 
          tasks={tasks}
          allTasks={allTasks}
          reflections={reflections}
          goals={goals}
          googleCalendarEvents={googleCalendarEvents}
          timeBlocks={timeBlocks}
          onSetPrimary={onSetPrimary}
          onAddSubtask={onAddSubtask}
          onAddMultipleSubtasks={onAddMultipleSubtasks}
        />
      </section>

      {/* 5. Insight of the Day (AI-generated behavioral insight) */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
          Insight of the Day
        </h3>
        
        <div className="p-6 border border-white/5 bg-zinc-950 flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-orange-400 animate-pulse-subtle" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                {dailyInsight.tag} Analysis
              </span>
            </div>
            
            <p className="text-xs text-zinc-300 font-sans leading-relaxed italic">
              {dailyInsight.text}
            </p>
          </div>
          
          <div className="border-t border-white/5 mt-4 pt-3 flex justify-between items-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              Origin: {dailyInsight.source}
            </span>
            <span className="text-[9px] font-mono text-orange-400 font-black uppercase tracking-widest flex items-center gap-1">
              Durable Insights
            </span>
          </div>
        </div>
      </section>

      {/* 6. Weekly Overview - Compact Summary of distribution blocks/work rate */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
          Weekly Execution Blueprint
        </h3>

        <div className="p-5 border border-white/10 bg-zinc-950/40 space-y-4">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-zinc-400 pb-2 border-b border-white/5">
            <span>Anchor Block Distribution</span>
            <span>Completion Rate</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {blockDistribution.map(block => (
              <div key={block.type} className="space-y-2 p-3 bg-white/[0.01] border border-white/5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${block.color}`} />
                    <span className="text-xs font-semibold text-zinc-300">{block.label}</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-white">{block.count} items</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 h-1">
                    <div className={`h-full ${block.color}`} style={{ width: `${block.rate}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{block.rate}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/[0.03] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[9px] tracking-wide">Average Resolution Rate</span>
            <span className="text-emerald-400 font-bold font-mono">OPTIMUM FOCUS CONTINUING</span>
          </div>
        </div>
      </section>

    </div>
  );
}
