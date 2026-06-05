import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Trash2, 
  Check, 
  Sparkles, 
  Sun, 
  Clock, 
  Moon, 
  Zap, 
  Flame, 
  Trophy, 
  BarChart4, 
  Lightbulb, 
  Info,
  ChevronRight,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Mail,
  Printer
} from 'lucide-react';
import { AppNotification, Task, Goal, NotificationSettings } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  timeBlocks?: any[];
  tasks: Task[];
  goals: Goal[];
  streak: number;
  notificationSettings: NotificationSettings;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export function NotificationCenter({
  notifications = [],
  tasks = [],
  goals = [],
  streak = 0,
  notificationSettings,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClear,
  onAddNotification
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'STREAM' | 'SIMULATE'>('STREAM');
  const [quickEodNote, setQuickEodNote] = useState('');
  const [submittedEodNote, setSubmittedEodNote] = useState<string | null>(null);
  const [showDigestModal, setShowDigestModal] = useState(false);

  // Filter out read vs unread notifications
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Handle simulations
  const handleSimulate = (type: string) => {
    switch (type) {
      case 'MORNING': {
        const primaryTask = tasks.find(t => t.status === 'pending');
        const activeGoals = goals.filter(g => g.status === 'active');
        const goalPercent = activeGoals.length > 0 
          ? Math.round((activeGoals.filter(g => g.completed).length / activeGoals.length) * 100) 
          : 64;

        if (primaryTask) {
          onAddNotification({
            type: 'morning_brief',
            title: '☀️ Morning Briefing Now Ready',
            body: `Good morning! Today focus on: "${primaryTask.text}". Goals alignment looks strong at ${goalPercent}% current completion. Focus budget of 480 mins active.`,
            data: { taskId: primaryTask.id }
          });
        } else {
          onAddNotification({
            type: 'morning_brief',
            title: '☀️ Morning Briefing: Map Objectives',
            body: `Good morning! Today, try setting a primary focus task in your dashboard. Ground daily traction on high leverage targets.`,
          });
        }
        break;
      }
      case 'START_BLOCK':
        onAddNotification({
          type: 'task_reminder',
          title: '⚡ Focus Session alert',
          body: 'Your scheduled DEEP work block (Core System Architecting) starts in 5 minutes. Set status to Do Not Disturb.',
        });
        break;
      case 'DEADLINE': {
        const pendingTask = tasks.find(t => t.status === 'pending') || { text: 'Layout verification' };
        onAddNotification({
          type: 'task_reminder',
          title: '⏳ Approaching Deadline Warning',
          body: `Strategic alert: Task "${pendingTask.text}" is due in approximately 2 hours. Start deep sprint to complete on time.`,
        });
        break;
      }
      case 'ENERGY':
        onAddNotification({
          type: 'task_reminder',
          title: '🔋 High Productivity Energy Wave',
          body: 'Analytical logging shows you usually finish deep work at this time. Ready for next session, or ready to log a brief rest break?',
        });
        break;
      case 'EOD':
        onAddNotification({
          type: 'eod_prompt',
          title: '🌙 Reflection Prompt: End of Day',
          body: `How'd today go? Ready to reflect? Current streak: ${streak || 12} days solid. Log EOD quick notes here!`,
        });
        break;
      case 'STREAK_STRIKE':
        onAddNotification({
          type: 'milestone',
          title: '🔥 Cognitive Momentum Strike!',
          body: `${streak || 12}-day focus streak resolved! Keep going—your focus continuity is exceptional.`,
        });
        break;
      case 'GOAL_COMPLETE':
        onAddNotification({
          type: 'milestone',
          title: '🏆 Goal Completion Achievement!',
          body: 'Weekly objective "Integrate robust local storage with notification system" completed. Excellent delivery execution!',
        });
        break;
      case 'WEEKLY_MILESTONE': {
        const completedCount = tasks.filter(t => t.status === 'completed').length || 20;
        onAddNotification({
          type: 'milestone',
          title: '📊 Weekly Velocity Milestone',
          body: `Weekly metric satisfied! You have resolved ${completedCount} tactical items over the current sprint block.`,
        });
        break;
      }
      case 'INSIGHT_MORNING':
        onAddNotification({
          type: 'insight',
          title: '💡 Circadian Rhythm Insight',
          body: "You're becoming a morning person! Telemetry logs show 80% of tasks are resolved before noon.",
        });
        break;
      case 'INSIGHT_AGE':
        onAddNotification({
          type: 'insight',
          title: '⚠️ Aging Backlog Alert',
          body: "Diagnostic correlation: Tasks over 3 days old have a 40% lower completion rate. Recommend immediate pruning.",
        });
        break;
      case 'INSIGHT_SUBTASK':
        onAddNotification({
          type: 'insight',
          title: '💡 Completion Accelerator',
          body: "Telemetry insight: breaking objectives into granular subtasks boosts final task completion ratios by 30%.",
        });
        break;
      case 'WEEKLY_DIGEST':
        onAddNotification({
          type: 'weekly_digest',
          title: '📬 Sunday Evening Strategic Digest ready',
          body: `Detailed executive evaluation: 32 focus hours. Total resolved: ${tasks.filter(t => t.status === 'completed').length || 14} tasks. Click to launch full dashboard.`,
        });
        break;
      default:
        break;
    }
  };

  // Submit quick EOD note handler
  const handleQuickEodSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (quickEodNote.trim()) {
      setSubmittedEodNote(quickEodNote);
      setQuickEodNote('');
      // Mark as read after submission
      onMarkRead(id);
    }
  };

  // Icon selector per notification type
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'morning_brief':
        return <Sun className="w-4 h-4 text-orange-400" />;
      case 'task_reminder':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'eod_prompt':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'milestone':
        return <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'weekly_digest':
        return <Mail className="w-4 h-4 text-purple-400" />;
    }
  };

  // Notification type label mapper
  const getLabel = (type: AppNotification['type']) => {
    switch (type) {
      case 'morning_brief': return 'Morning Briefing';
      case 'task_reminder': return 'Task Reminder';
      case 'eod_prompt': return 'EOD Reflection';
      case 'milestone': return 'Milestone Celebration';
      case 'insight': return 'Insight Alert';
      case 'weekly_digest': return 'Weekly Digest';
    }
  };

  // Weekly Digest data calculator based on state (mocked if state is empty)
  const digestData = useMemo(() => {
    const completedThisWeek = tasks.filter(t => t.status === 'completed');
    const totalCount = completedThisWeek.length;
    
    // Categorize
    const categoryCounts = {
      KEEP: completedThisWeek.filter(t => t.category === 'KEEP').length,
      DELAY: completedThisWeek.filter(t => t.category === 'DELAY').length,
      DELETE: completedThisWeek.filter(t => t.category === 'DELETE').length,
      NONE: completedThisWeek.filter(t => t.category === 'NONE').length,
    };

    // Calculate simulated hours
    const estimatedMinutes = completedThisWeek.reduce((acc, t) => acc + (t.estimatedTime || 45), 0);
    const hoursInvested = (estimatedMinutes / 60).toFixed(1);

    return {
      totalTasksCount: totalCount || 18,
      categoryCounts: totalCount > 0 ? categoryCounts : { KEEP: 12, DELAY: 3, DELETE: 2, NONE: 1 },
      hoursInvested: totalCount > 0 ? hoursInvested : '24.5',
      blockers: [
        'Strategic OKR goal clarity missing on Tuesday sprint.',
        'High meetings volume Wednesday morning creating context switching.',
      ],
      insights: [
        'Pruning delay backlog increases afternoon focus momentum.',
        'Using Pomodoro sprint block structures kept deep energy focused.',
      ],
      nextWeekPreview: [
        '3 quarterly goals arriving at quarterly target milestone deadlines.',
        'Scheduled DEEP work blocks on Monday & Wednesday have high priority.',
      ]
    };
  }, [tasks]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-mono text-white">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
            
            <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#050505] border-l border-white/10 flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/60 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-orange-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black font-mono">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">Notification Control</h3>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Active Telemetry Channels</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 px-2 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> CLOSE
                </button>
              </div>

              {/* Sub navigation Tabs */}
              <div className="grid grid-cols-2 border-b border-white/5 bg-zinc-950/30">
                <button
                  onClick={() => setActiveTab('STREAM')}
                  className={`py-2 text-[10px] uppercase font-mono tracking-widest text-center transition-all ${
                    activeTab === 'STREAM' 
                      ? 'border-b-2 border-white bg-zinc-900/30 text-white font-bold' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  🔔 Alert Stream ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('SIMULATE')}
                  className={`py-2 text-[10px] uppercase font-mono tracking-widest text-center transition-all ${
                    activeTab === 'SIMULATE' 
                      ? 'border-b-2 border-white bg-zinc-900/30 text-white font-bold' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  🛠️ Simulate Triggers
                </button>
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
                
                {activeTab === 'STREAM' ? (
                  <div className="space-y-3.5 pb-20">
                    
                    {/* Bulk Action Controls */}
                    {notifications.length > 0 && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 flex-wrap gap-2">
                        <span className="text-[9px] uppercase font-mono text-zinc-500">Live feed stream</span>
                        <div className="flex gap-2">
                          <button
                            onClick={onMarkAllRead}
                            className="bg-transparent text-[8px] font-mono hover:text-white border border-white/10 hover:border-white/20 px-2 py-0.5 text-zinc-400 uppercase tracking-wider"
                          >
                            Mark All Read
                          </button>
                          <button
                            onClick={onClear}
                            className="bg-transparent text-[8px] font-mono text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Clear All
                          </button>
                        </div>
                      </div>
                    )}

                    {notifications.length === 0 ? (
                      <div className="py-24 text-center space-y-3 max-w-xs mx-auto">
                        <Info className="w-8 h-8 text-zinc-700 mx-auto opacity-30 animate-pulse-subtle" />
                        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Alert register completely clear</p>
                        <p className="text-[9px] text-zinc-600 font-sans leading-normal">
                          All quiet is normal. When strategic events fire, notification telemetry updates will display here.
                        </p>
                        <button
                          onClick={() => setActiveTab('SIMULATE')}
                          className="px-3.5 py-1.5 text-[9px] font-mono uppercase bg-white text-black font-black tracking-widest mt-2"
                        >
                          Trigger Simulation
                        </button>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const isRead = notif.read;
                        return (
                          <div
                            key={notif.id}
                            className={`p-3.5 border transition-all relative group select-none ${
                              isRead 
                                ? 'bg-zinc-950/20 border-white/5 text-zinc-400' 
                                : 'bg-zinc-900/40 border-white/15 text-white shadow-[0_0_8px_rgba(255,255,255,0.03)]'
                            }`}
                          >
                            
                            {/* Accent Dot indicating Unread Notification */}
                            {!isRead && (
                              <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-orange-500 rounded-none animate-pulse" />
                            )}

                            {/* Sub category header */}
                            <div className="flex items-center gap-2 mb-1">
                              {getIcon(notif.type)}
                              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">
                                {getLabel(notif.type)}
                              </span>
                              <span className="text-[8px] text-zinc-600">
                                • {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Title & Body */}
                            <h4 className={`text-xs font-bold leading-tight ${isRead ? 'text-zinc-300' : 'text-white'}`}>
                              {notif.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed mt-1">
                              {notif.body}
                            </p>

                            {/* CONDITIONAL COMPONENT: EOD QUICK NOTES CAPTURE */}
                            {notif.type === 'eod_prompt' && !isRead && (
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-500">EOD Micro-Journal logging</span>
                                <form onSubmit={(e) => handleQuickEodSubmit(e, notif.id)} className="flex gap-1.5 select-text">
                                  <input
                                    type="text"
                                    value={quickEodNote}
                                    onChange={(e) => setQuickEodNote(e.target.value)}
                                    placeholder="e.g. Cleared backend bugs, feeling high energy!"
                                    className="flex-1 bg-zinc-950 border border-white/10 px-2 py-1 text-[10px] text-white focus:border-white/30 outline-none placeholder-zinc-700 h-7"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    type="submit"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 bg-white text-black font-black text-[9px] font-mono uppercase tracking-wider h-7 shrink-0 transition-opacity hover:opacity-90 active:scale-95"
                                  >
                                    Log ✓
                                  </button>
                                </form>
                              </div>
                            )}

                            {/* Confirmation display of submitted EOD note */}
                            {notif.type === 'eod_prompt' && submittedEodNote && (
                              <div className="mt-2.5 p-2 bg-emerald-950/10 border border-emerald-500/15 text-[9px] font-mono text-emerald-400">
                                ✓ Micro note logged: "{submittedEodNote}" (stored as EOD reflection fragment).
                              </div>
                            )}

                            {/* CONDITIONAL COMPONENT: WEEKLY DIGEST DETAILED MODAL TRIGGER */}
                            {notif.type === 'weekly_digest' && (
                              <button
                                onClick={() => {
                                  setShowDigestModal(true);
                                  onMarkRead(notif.id);
                                }}
                                className="mt-3 w-full py-1 text-center bg-zinc-950 border border-white/10 font-black text-[9px] tracking-widest text-zinc-300 hover:text-white uppercase hover:border-white transition-all flex items-center justify-center gap-1"
                              >
                                📊 Launch PDF executive Digest overview <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                              </button>
                            )}

                            {/* Mark read toggle per item */}
                            {!isRead && (
                              <div className="mt-3.5 flex justify-end">
                                <button
                                  onClick={() => onMarkRead(notif.id)}
                                  className="text-[8px] font-mono text-zinc-500 hover:text-white uppercase flex items-center gap-1 hover:underline px-2 py-0.5 border border-white/5 hover:border-white/15"
                                >
                                  <Check className="w-2.5 h-2.5" /> Read
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  
                  /* PANEL B: TELEMETRY RULES SIMULATORS */
                  <div className="space-y-4 pb-20 select-none">
                    <div className="p-3 bg-zinc-950 border border-white/5 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Developer Sandbox Mode</span>
                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                        Manually trigger simulated analytical parameters with live database metrics to verify Anchor notification integrity, typography layouts, and interactive handlers under quiet hours boundaries.
                      </p>
                    </div>

                    <div className="space-y-3">
                      
                      {/* Simulators checklist category */}
                      <div className="space-y-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block border-b border-white/5 pb-10">Circadian Briefings</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSimulate('MORNING')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-orange-400 shrink-0">☀️</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Morning Brief</span>
                              <span className="text-[8px] text-zinc-500">8:00 AM dynamic</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleSimulate('EOD')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-indigo-400 shrink-0">🌙</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">EOD Reflection</span>
                              <span className="text-[8px] text-zinc-500">5:00 PM feedback</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block border-b border-white/5 pb-1">Contextual Task Reminders</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSimulate('START_BLOCK')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-blue-400 shrink-0">⚡</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Block Start</span>
                              <span className="text-[8px] text-zinc-500">In 5 min alert</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleSimulate('DEADLINE')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-amber-500 shrink-0">⏳</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Due in 2h</span>
                              <span className="text-[8px] text-zinc-500">Pruning deadline</span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSimulate('ENERGY')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase col-span-2 text-left flex items-start gap-2"
                          >
                            <span className="text-purple-400 shrink-0">🔋</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Energy Wave recommendation</span>
                              <span className="text-[8px] text-zinc-500">Suggested peak focus transitions</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block border-b border-white/5 pb-1">Cognitive Achievements</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSimulate('STREAK_STRIKE')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-red-500 shrink-0">🔥</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Flame Streak</span>
                              <span className="text-[8px] text-zinc-500">Continuous logs</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleSimulate('GOAL_COMPLETE')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-emerald-500 shrink-0">🏆</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Goal Resolve</span>
                              <span className="text-[8px] text-zinc-500">OKR completed</span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSimulate('WEEKLY_MILESTONE')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase col-span-2 text-left flex items-start gap-2"
                          >
                            <span className="text-violet-400 shrink-0">📊</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Weekly Velocity Indicator</span>
                              <span className="text-[8px] text-zinc-500">Completed count metrics</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block border-b border-white/5 pb-1">Pragmatic Insights</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSimulate('INSIGHT_MORNING')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-yellow-400 shrink-0">⚡</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Early Rhythm</span>
                              <span className="text-[8px] text-zinc-500">Morning completion</span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSimulate('INSIGHT_AGE')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase text-left flex items-start gap-2"
                          >
                            <span className="text-red-400 shrink-0">⚠️</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Aging Backlog</span>
                              <span className="text-[8px] text-zinc-500">3-day old dropoff</span>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSimulate('INSIGHT_SUBTASK')}
                            className="p-2 border border-white/10 hover:border-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase col-span-2 text-left flex items-start gap-2"
                          >
                            <span className="text-yellow-500 shrink-0">💡</span>
                            <div>
                              <span className="font-bold block text-white text-[9px]">Boost with Subtasks</span>
                              <span className="text-[8px] text-zinc-500">+30% resolve optimization</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block border-b border-white/5 pb-1">Digest Briefs</span>
                        <button
                          onClick={() => handleSimulate('WEEKLY_DIGEST')}
                          className="w-full p-2.5 border border-white/10 hover:border-white bg-[#050505] text-zinc-300 hover:text-white hover:bg-white/[0.01] transition-all text-[9.5px] font-mono uppercase tracking-widest text-left flex items-start gap-2.5"
                        >
                          <span className="text-purple-400 shrink-0">📬</span>
                          <div>
                            <span className="font-bold block text-white text-[9.5px]">Generate Weekly Sunday Executive Digest</span>
                            <span className="text-[8px] text-zinc-500">Comprehensive summary of the complete 30-day focus logs</span>
                          </div>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* WEEKLY DIGEST DETAILED EXEC MODAL VIEW */}
      <AnimatePresence>
        {showDigestModal && (
          <div className="fixed inset-0 z-55 overflow-y-auto font-mono text-white p-4 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDigestModal(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-[#0a0a0b] border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl z-10"
            >
              {/* Top Controls */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-purple-400 font-bold block">
                    Sunday Evening Corporate Review
                  </span>
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">
                    Weekly Cognitive Digest Briefing
                  </h3>
                  <span className="text-[9.5px] font-mono text-zinc-500">
                    Schedules covered: Sunday {new Date(Date.now() - 3600 * 24 * 6 * 1000).toLocaleDateString()} - Sunday {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="p-1 px-3 border border-white/10 hover:border-white text-zinc-400 hover:text-white transition-all text-[9px] uppercase font-mono flex items-center gap-1.5"
                    title="Print executive summary report"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF Print
                  </button>
                  <button 
                    onClick={() => setShowDigestModal(false)}
                    className="p-1 px-3 border border-red-500/10 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-all text-[9px] uppercase font-mono flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Close
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual Indicators */}
                <div className="bg-zinc-950 p-4 border border-white/5 text-center flex flex-col justify-center space-y-2">
                  <div className="text-4xl font-black text-purple-400 tracking-tight">
                    {digestData.totalTasksCount}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Tasks Resolved</span>
                  
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <div className="text-3xl font-black text-white">
                      {digestData.hoursInvested} <span className="text-xs text-zinc-500 uppercase">Hrs</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mt-1">Focus Logged</span>
                  </div>
                </div>

                {/* Categories share stats */}
                <div className="col-span-2 space-y-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Sprint Category Distribution</span>
                  <div className="space-y-2.5">
                    
                    <div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>Keep (Objective alignment)</span>
                        <span className="font-bold">{digestData.categoryCounts.KEEP} resolves</span>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full mt-1">
                        <div className="h-full bg-orange-500" style={{ width: `${(digestData.categoryCounts.KEEP / Math.max(1, digestData.totalTasksCount)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>Delay (Backlog delay reserves)</span>
                        <span className="font-bold">{digestData.categoryCounts.DELAY} resolves</span>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full mt-1">
                        <div className="h-full bg-amber-500" style={{ width: `${(digestData.categoryCounts.DELAY / Math.max(1, digestData.totalTasksCount)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>Pruned (Pruning activities)</span>
                        <span className="font-bold">{digestData.categoryCounts.DELETE} resolves</span>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full mt-1">
                        <div className="h-full bg-red-500" style={{ width: `${(digestData.categoryCounts.DELETE / Math.max(1, digestData.totalTasksCount)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>Raw Dump (None category triggers)</span>
                        <span className="font-bold">{digestData.categoryCounts.NONE} resolves</span>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full mt-1">
                        <div className="h-full bg-zinc-500" style={{ width: `${(digestData.categoryCounts.NONE / Math.max(1, digestData.totalTasksCount)) * 100}%` }} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Blocking and diagnostic review */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-[11px] leading-relaxed">
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest block font-bold">⚠️ High Friction Blockers Analyzed</span>
                  <ul className="list-disc leading-relaxed pl-4 space-y-1 text-zinc-400 font-sans">
                    {digestData.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block font-bold">💡 Dynamic Performance Insights</span>
                  <ul className="list-disc leading-relaxed pl-4 space-y-1 text-zinc-400 font-sans">
                    {digestData.insights.map((bi, i) => (
                      <li key={i}>{bi}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Week Outlook Preview plan */}
              <div className="bg-zinc-950 p-4 border border-zinc-900 border-dashed space-y-2">
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block font-bold">🚀 Strategic Outlook (Next week schedule load)</span>
                <ul className="list-disc leading-relaxed pl-4 space-y-1 text-xs text-zinc-400 font-sans">
                  {digestData.nextWeekPreview.map((pr, i) => (
                    <li key={i}>{pr}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-600 border-t border-white/5 pt-4">
                <span>Telemetry stream authorized secure global proxy</span>
                <span className="uppercase text-purple-400">Anchor Intelligence Analytics</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
