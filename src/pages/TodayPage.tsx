import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  Zap,
  Check,
  Edit2,
  Sliders,
  X
} from 'lucide-react';
import { Task, DailyTodo, Reflection, Goal, TimeLog, ActiveTimer } from '../types';
import { ActiveFocusSession } from '../components/ActiveFocusSession';

interface TodayPageProps {
  key?: string;
  primaryTask?: Task;
  tasks: Task[];
  allTasks: Task[];
  dailyTodos: DailyTodo[];
  streak: number;
  isContinuingTask: boolean;
  reflections: Reflection[];
  goals?: Goal[];
  timeLogs?: TimeLog[];
  activeTimer?: ActiveTimer | null;
  notificationSettings?: any;
  onAddReflection?: (
    text: string,
    tag: any,
    whatWorked?: string,
    whatBlocked?: string,
    whatSurprised?: string,
    whatToDoDifferently?: string,
    moodEnergy?: number,
    stressLevel?: number,
    photo?: string | null,
    relatedTaskId?: string | null,
    templateId?: string | null
  ) => void;
  onSetPrimary: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddDailyTodo?: (text: string) => void;
  onToggleDailyTodo?: (id: string) => void;
  onDeleteDailyTodo?: (id: string) => void;

  timeTrackingEnabled?: boolean;
  dailyTimeBudget?: number;
  onStartTimer?: (taskId: string, isPomodoro?: boolean, pomodoroDurationMinutes?: number) => void;
  onStopTimer?: () => void;
  onAddManualTimeLog?: (taskId: string, durationMinutes: number) => void;
  onUpdateTaskEstimate?: (taskId: string, estimatedMinutes: number) => void;
  onUpdateTaskText?: (taskId: string, text: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAbandonTask?: (taskId: string) => void;
  onLinkTaskToGoal?: (taskId: string, goalId: string | null) => void;
  onSetTaskDependency?: (taskId: string, dependsOnId: string | null) => void;
  onAssignBlock?: (taskId: string, block: any) => void;
  
  onQuickCapture?: (type: 'TASK' | 'IDEA' | 'REFLECTION', text: string) => void;
  onSwitchView?: (view: any) => void;
  
  // Custom parameters to bind beautifully
  onAddTask?: (text: string, category: 'KEEP' | 'NONE', isPrimary: boolean) => void;
  onExploreMore?: () => void;
}

export function TodayPage({
  primaryTask,
  tasks = [],
  allTasks = [],
  streak = 0,
  timeLogs = [],
  activeTimer = null,
  goals = [],
  reflections = [],
  notificationSettings,
  onAddReflection,
  onSetPrimary,
  onToggleTask,
  onAddSubtask,
  onToggleSubtask,
  onStartTimer,
  onStopTimer,
  onUpdateTaskEstimate,
  onSwitchView,
  onAddTask,
  onExploreMore,
  onUpdateTaskText,
  onDeleteTask,
  onAbandonTask,
  onLinkTaskToGoal,
  onSetTaskDependency,
  onAssignBlock
}: TodayPageProps) {
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [isFocusDismissed, setIsFocusDismissed] = useState(false);
  const [showPrimaryGoalDetails, setShowPrimaryGoalDetails] = useState(false);

  const primaryLinkedGoal = useMemo(() => {
    if (!primaryTask || !primaryTask.goalId || !goals) return null;
    return goals.find(g => g.id === primaryTask.goalId);
  }, [primaryTask, goals]);

  // Automatically open Focus Workspace Session when an active timer begins on the primary task
  useEffect(() => {
    if (activeTimer && primaryTask && activeTimer.taskId === primaryTask.id) {
      setIsFocusDismissed(false);
    }
  }, [activeTimer?.taskId, primaryTask?.id]);

  // User details persistence
  const [name, setName] = useState(() => localStorage.getItem('anchor_user_name') || 'Rishabh');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  // Run ticking timer for active workspace sessions
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

  // Format date elegantly: Friday, June 5, 2026
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Determine standard greeting segment from temporal metrics
  const greetingSegment = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute Weekly Statistics
  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const startOfWeekMs = now - 7 * 24 * 3600 * 1000;
    
    const weekCompletions = allTasks.filter(
      t => t.status === 'completed' && t.completedAt && t.completedAt >= startOfWeekMs
    );
    
    const weekTaskCount = allTasks.filter(t => t.createdAt >= startOfWeekMs).length;
    
    const weekLogsSumSec = (timeLogs || [])
      .filter(log => log.startTime >= startOfWeekMs)
      .reduce((sum, log) => sum + log.duration, 0);

    const hoursLogged = parseFloat((weekLogsSumSec / 3600).toFixed(1));

    return {
      completions: weekCompletions.length,
      totalCount: weekTaskCount,
      hours: hoursLogged
    };
  }, [allTasks, timeLogs]);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskInput.trim() && primaryTask) {
      onAddSubtask(primaryTask.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  const handleCreateAndAnchorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskInput.trim()) {
      if (onAddTask) {
        onAddTask(newTaskInput.trim(), 'KEEP', true);
      }
      setNewTaskInput('');
    }
  };

  const formatTimerVal = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter possible recommendations to select as primary anchor focus
  const alternativeRecommendations = useMemo(() => {
    return allTasks
      .filter(t => t.status === 'pending' && t.id !== primaryTask?.id)
      .slice(0, 3);
  }, [allTasks, primaryTask]);

  const subtasks = primaryTask?.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : 0;

  if (primaryTask && activeTimer && activeTimer.taskId === primaryTask.id && !isFocusDismissed) {
    return (
      <ActiveFocusSession
        task={primaryTask}
        allTasks={allTasks}
        goals={goals}
        timeLogs={timeLogs}
        activeTimer={activeTimer}
        activeTimerSeconds={activeTimerSeconds}
        streak={streak}
        weeklyStats={weeklyStats}
        onStopTimer={onStopTimer || (() => {})}
        onStartTimer={onStartTimer || (() => {})}
        onToggleTask={onToggleTask}
        onToggleSubtask={onToggleSubtask}
        onAddSubtask={onAddSubtask}
        onUpdateTaskEstimate={onUpdateTaskEstimate}
        onUpdateTaskText={onUpdateTaskText}
        onDeleteTask={onDeleteTask}
        onAbandonTask={onAbandonTask}
        onLinkTaskToGoal={onLinkTaskToGoal}
        onSetTaskDependency={onSetTaskDependency}
        onAssignBlock={onAssignBlock}
        onDismiss={() => setIsFocusDismissed(true)}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="max-w-[520px] mx-auto space-y-8 py-6 md:py-12 px-4 select-none"
    >
      {/* 1. Greeting Section (Date + Name) */}
      <div className="space-y-2 text-center md:text-left">
        <p className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase font-bold">
          {formattedDate}
        </p>
        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2.5 justify-center md:justify-start">
          {isEditingName ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (nameInput.trim()) {
                  setName(nameInput.trim());
                  localStorage.setItem('anchor_user_name', nameInput.trim());
                  setIsEditingName(false);
                }
              }}
              className="flex items-center gap-2 justify-center md:justify-start pt-1"
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                className="bg-zinc-900/50 border border-zinc-800 text-xl font-black text-white px-2.5 py-0.5 outline-none focus:border-zinc-500 rounded-none w-44 font-sans text-center md:text-left"
                autoFocus
                onBlur={() => {
                  if (nameInput.trim()) {
                    setName(nameInput.trim());
                    localStorage.setItem('anchor_user_name', nameInput.trim());
                  }
                  setIsEditingName(false);
                }}
              />
              <button 
                type="submit" 
                className="px-2 py-1 bg-white text-black font-mono text-[9px] uppercase font-bold"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="group flex items-center gap-1.5 justify-center md:justify-start">
              <h1 className="text-3xl font-black tracking-tight text-white leading-none">
                {greetingSegment}, <span className="text-zinc-300 font-extrabold">{name}</span>.
              </h1>
              <button 
                onClick={() => {
                  setNameInput(name);
                  setIsEditingName(true);
                }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-white transition-opacity p-1 cursor-pointer"
                title="Edit visual profile name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Primary Task Card (Focused, Clean) */}
      {activeTimer && primaryTask && activeTimer.taskId === primaryTask.id && isFocusDismissed && (
        <motion.button
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsFocusDismissed(false)}
          className="w-full bg-[#e45423]/10 hover:bg-[#e45423]/20 border border-[#e45423]/30 p-3 text-center text-[10px] text-white font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 animate-pulse cursor-pointer transition-colors"
          title="Return back to Active Focus Workspace"
        >
          <span className="w-2 h-2 rounded-full bg-[#e45423] inline-block animate-ping" />
          <span>Session Active in Background • Click to Resume Workspace</span>
        </motion.button>
      )}

      <div className="border border-white/5 bg-zinc-950/40 p-5 md:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {primaryTask ? (
          <div className="space-y-4">
            {/* Header label */}
            <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-[#e25424] font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                Active Focus Anchor
              </span>
              <button
                onClick={() => onSetPrimary('')}
                className="text-zinc-500 hover:text-white transition-colors uppercase font-mono text-[8px] tracking-wider cursor-pointer"
                title="Change active task anchor"
              >
                Change Anchor
              </button>
            </div>

            {/* Core Task Description */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white leading-snug tracking-tight font-sans">
                {primaryTask.text}
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">
                Initiated {new Date(primaryTask.createdAt).toLocaleDateString()}
              </p>
            </div>

            {primaryLinkedGoal && (
              <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5 align-baseline">
                <div className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wide">This serves:</span>
                  <button 
                    type="button"
                    onClick={() => setShowPrimaryGoalDetails(!showPrimaryGoalDetails)}
                    className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors font-mono font-bold text-left flex items-center gap-1.5 text-[10.5px]"
                    title="Click to view core goal alignment details"
                  >
                    <span>🎯 {primaryLinkedGoal.title}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showPrimaryGoalDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-zinc-200 p-4 shadow-2xl relative overflow-hidden text-zinc-900 rounded-none w-full font-sans"
                    >
                      <div className="flex justify-between items-start border-b border-zinc-100 pb-2 mb-2">
                        <div>
                          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#e25424]">Goal Alignment Status</span>
                          <h4 className="text-sm font-extrabold text-zinc-900 mt-0.5 leading-tight">{primaryLinkedGoal.title}</h4>
                        </div>
                        <span className="text-[8.5px] font-mono font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 uppercase tracking-wider text-zinc-655 shrink-0 ml-2">
                          {primaryLinkedGoal.type}
                        </span>
                      </div>
                      
                      {(() => {
                        const krs = primaryLinkedGoal.keyResults || [];
                        const completedKrs = krs.filter(kr => kr.completed).length;
                        const progress = krs.length > 0 ? Math.round((completedKrs / krs.length) * 100) : 0;
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10.5px] text-zinc-650 font-mono">
                              <span>Objective Progress:</span>
                              <span className="font-bold text-zinc-950">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 overflow-hidden border border-zinc-200/40">
                              <div className="h-full bg-zinc-900 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>

                            <div className="flex justify-between text-[9px] text-zinc-450 font-mono pt-1">
                              <span>Target Complete Calendar Date:</span>
                              <span className="text-zinc-750 font-bold">{primaryLinkedGoal.targetDate}</span>
                            </div>

                            {krs.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                                <span className="text-[8.5px] uppercase font-bold text-zinc-400 block font-mono">Key Actions:</span>
                                <div className="space-y-1.5">
                                  {krs.map(kr => (
                                    <div key={kr.id} className="flex items-start gap-1.5 text-xs text-zinc-700">
                                      <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 mt-0.5 ${kr.completed ? 'bg-zinc-950 border-zinc-800 text-white' : 'border-zinc-300 text-transparent'}`}>
                                        ✓
                                      </span>
                                      <span className={kr.completed ? 'line-through text-zinc-400 font-sans font-medium' : 'font-sans font-medium'}>{kr.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Progress gauge for checklist */}
            {subtasks.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                  <span>Checkpoint Progress</span>
                  <span>{completedSubtasks}/{subtasks.length} Resolved ({progressPercent}%)</span>
                </div>
                <div className="h-1 bg-zinc-900 border border-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Subtask items checklist */}
                <div className="space-y-1 pt-1">
                  {subtasks.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => onToggleSubtask(primaryTask.id, sub.id)}
                      className="w-full flex items-center gap-2.5 text-left p-1.5 hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all text-xs font-mono"
                    >
                      <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                        sub.completed ? 'bg-white text-black border-white' : 'border-zinc-800 text-transparent'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={`flex-1 truncate ${sub.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {sub.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Subtask In-Context Form */}
            <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-1 border-t border-white/5">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Declare micro checkpoint..."
                maxLength={45}
                className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
              />
              <button 
                type="submit"
                disabled={!subtaskInput.trim()}
                className="px-2.5 text-zinc-400 hover:text-white disabled:text-zinc-800 transition-colors uppercase font-mono text-[9px]"
              >
                + ADD
              </button>
            </form>

            {/* Control Strip (Timer, Stop, Complete) */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                {activeTimer && activeTimer.taskId === primaryTask.id ? (
                  <button
                    onClick={onStopTimer}
                    className="bg-white hover:bg-zinc-200 text-black font-mono text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Pause className="w-2.5 h-2.5 fill-black" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={() => onStartTimer && onStartTimer(primaryTask.id, false)}
                    className="bg-[#e45423] hover:bg-[#c74519] text-white font-mono text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all border border-orange-500/10"
                  >
                    <Play className="w-2.5 h-2.5 fill-white" /> Start Focus
                  </button>
                )}
                
                <button
                  onClick={() => onToggleTask(primaryTask.id)}
                  className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-300 font-mono text-[9px] font-bold uppercase tracking-widest px-3.5 py-1.5 cursor-pointer transition-all"
                >
                  Complete
                </button>
              </div>

              {/* Focus duration log */}
              <div className="flex items-center gap-2 font-mono text-zinc-400 text-xs font-bold bg-white/[0.01] px-2.5 py-1.5 border border-white/5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {activeTimer && activeTimer.taskId === primaryTask.id ? (
                  <span className="text-sm font-black text-white">{formatTimerVal(activeTimerSeconds)}</span>
                ) : (
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">IDLE</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500 font-black block">WORKSPACE SESSION INTEGRITY</span>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Clear cognitive overhead. Declare or select exactly <span className="text-white font-bold">one primary task</span> to focus on.
              </p>
            </div>

            {/* Capture New Focus Box */}
            <form onSubmit={handleCreateAndAnchorSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="What is your immediate anchor focus?"
                  maxLength={70}
                  className="w-full bg-zinc-900/40 border border-white/10 py-2.5 pl-3.5 pr-14 text-xs text-white font-mono focus:outline-none focus:border-white placeholder:text-zinc-700 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newTaskInput.trim()}
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-white disabled:bg-zinc-900 disabled:text-zinc-700 text-black rounded-none text-[8px] font-mono uppercase font-black transition-all"
                >
                  Anchor
                </button>
              </div>
            </form>

            {/* Backlog Quick Selection */}
            {alternativeRecommendations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[8px] font-mono text-zinc-600 uppercase font-black tracking-widest block">
                  OR CHOOSE FROM BACKLOG:
                </span>
                <div className="space-y-1.5">
                  {alternativeRecommendations.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => onSetPrimary(alt.id)}
                      className="w-full text-left p-2 border border-white/5 hover:border-white/10 bg-zinc-950/20 text-xs font-mono text-zinc-400 hover:text-white flex justify-between items-center transition-all"
                    >
                      <span className="truncate pr-4">{alt.text}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Weekly Stats (Compact) */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-black text-zinc-500 block text-center md:text-left">
          WEEKLY DISCIPLINE PROFILE
        </span>
        <div className="grid grid-cols-3 gap-3">
          {/* Completion Stat */}
          <div className="border border-white/5 bg-zinc-950/25 p-3 flex flex-col justify-between h-20 md:h-22">
            <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider font-bold">COMPLETES</span>
            <div className="flex items-baseline gap-1 mt-1">
              <h4 className="text-xl md:text-2xl font-mono font-black text-white">{weeklyStats.completions}</h4>
              <span className="text-[10px] font-mono text-zinc-600">tasks</span>
            </div>
          </div>

          {/* Time Stat */}
          <div className="border border-white/5 bg-zinc-950/25 p-3 flex flex-col justify-between h-20 md:h-22">
            <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider font-bold">TIME SPENT</span>
            <div className="flex items-baseline gap-0.5 mt-1">
              <h4 className="text-xl md:text-2xl font-mono font-black text-white">{weeklyStats.hours}</h4>
              <span className="text-[10px] font-mono text-zinc-600">hrs</span>
            </div>
          </div>

          {/* Streak Stat */}
          <div className="border border-white/5 bg-zinc-950/25 p-3 flex flex-col justify-between h-20 md:h-22 relative group">
            <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider font-bold flex items-center gap-1">
              STREAK <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-500/10" />
            </span>
            <div className="flex items-baseline gap-0.5 mt-1">
              <h4 className="text-xl md:text-2xl font-mono font-black text-orange-400">{streak}</h4>
              <span className="text-[10px] font-mono text-zinc-600">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Explore More Button */}
      <div className="pt-4 text-center">
        <button
          onClick={() => {
            if (onExploreMore) {
              onExploreMore();
            } else if (onSwitchView) {
              onSwitchView('PROJECTS');
            }
          }}
          className="w-full py-2.5 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] text-xs font-mono font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Explore Workspace Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
