import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Clock, 
  Play, 
  Pause, 
  CheckSquare, 
  Plus, 
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';
import { Task, DailyTodo, Reflection, Goal, TimeLog, ActiveTimer } from '../types';
import { GeminiAdvisor } from '../components/GeminiAdvisor';

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
  onSetPrimary: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddDailyTodo: (text: string) => void;
  onToggleDailyTodo: (id: string) => void;
  onDeleteDailyTodo: (id: string) => void;
  onSetStartDate?: (taskId: string, startDate: number | null) => void;
  onSetDependency?: (taskId: string, dependsOnId: string | null) => void;
  onLinkTaskToGoal?: (taskId: string, goalId: string | null) => void;

  timeTrackingEnabled?: boolean;
  timeLogs?: TimeLog[];
  dailyTimeBudget?: number;
  activeTimer?: ActiveTimer | null;
  onStartTimer?: (taskId: string, isPomodoro?: boolean, pomodoroDurationMinutes?: number) => void;
  onStopTimer?: () => void;
  onAddManualTimeLog?: (taskId: string, durationMinutes: number) => void;
  onUpdateTaskEstimate?: (taskId: string, estimatedMinutes: number) => void;
  
  onQuickCapture?: (type: 'TASK' | 'IDEA' | 'REFLECTION', text: string) => void;
  onSwitchView?: (view: any) => void;
}

export function TodayPage({
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
  onToggleSubtask,
  onAddDailyTodo,
  onToggleDailyTodo,
  onDeleteDailyTodo,
  
  timeTrackingEnabled = true,
  timeLogs = [],
  dailyTimeBudget = 480,
  activeTimer = null,
  onStartTimer,
  onStopTimer,
  onAddManualTimeLog,
  onUpdateTaskEstimate,
  onQuickCapture,
  onSwitchView
}: TodayPageProps) {
  const [subtaskInput, setSubtaskInput] = useState('');
  const [todoInput, setTodoInput] = useState('');
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [localCaptureText, setLocalCaptureText] = useState('');

  // Ticking active timer seconds
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

  // Find linked Goal/Project
  const linkedProject = useMemo(() => {
    if (!primaryTask?.goalId) return null;
    return goals.find(g => g.id === primaryTask.goalId);
  }, [primaryTask, goals]);

  // Active projects list
  const activeProjects = useMemo(() => {
    return goals.filter(g => g.status === 'active');
  }, [goals]);

  // Last Activity or completions
  const lastCompletedTask = useMemo(() => {
    const completed = allTasks.filter(t => t.status === 'completed' && t.completedAt);
    if (completed.length === 0) return null;
    return completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  }, [allTasks]);

  // Recommended next actions (Exclude primary task if set)
  const recommendations = useMemo(() => {
    const available = tasks.filter(t => t.status === 'pending' && t.id !== primaryTask?.id);
    return available.slice(0, 3);
  }, [tasks, primaryTask]);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskInput.trim() && primaryTask) {
      onAddSubtask(primaryTask.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  const handleAddTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (todoInput.trim()) {
      onAddDailyTodo(todoInput.trim());
      setTodoInput('');
    }
  };

  const handleQuickLocalCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (localCaptureText.trim() && onQuickCapture) {
      onQuickCapture('TASK', localCaptureText.trim());
      setLocalCaptureText('');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Subtask calculations
  const subtasks = primaryTask?.subtasks || [];
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 
    ? Math.round((completedSubtasksCount / subtasks.length) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-12 py-4"
    >
      {/* Editorial Greetings Banner & Focus state */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">
            Workspace Day Shell
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-orange-400 font-bold bg-orange-950/20 px-2.5 py-0.5 border border-orange-500/10">
              <Flame className="w-3.5 h-3.5 fill-orange-500/10" /> {streak} DAY STREAK
            </span>
          )}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans max-w-2xl leading-[1.15]">
          A calm workspace that <span className="text-zinc-400">remembers what matters</span>.
        </h2>
      </div>

      {/* Grid: Resume Work Panel vs Next Focus Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Primary Focus & Context Retrieval (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {primaryTask ? (
            <div className="border border-white/5 bg-[#0a0a0c]/80 p-6 md:p-8 flex flex-col justify-between relative group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-mono uppercase text-zinc-500">
                  <span className="flex items-center gap-1.5 font-bold tracking-wider text-orange-400">
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    Active Anchor Focus Task
                  </span>
                  {linkedProject && (
                    <span className="bg-zinc-900 border border-white/10 px-2 py-0.5 text-[8px] text-zinc-400">
                      Project: {linkedProject.title}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    {primaryTask.text}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Initiated context {new Date(primaryTask.createdAt).toLocaleDateString()}. Work focus has been anchored deep.
                  </p>
                </div>

                {/* Subtask checklist progress */}
                {subtasks.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Subtask Checkpoints</span>
                      <span>{completedSubtasksCount}/{subtasks.length} Resolved ({progressPercent}%)</span>
                    </div>
                    
                    <div className="h-1 bg-zinc-900 border border-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="space-y-1 pt-1.5">
                      {subtasks.map(s => (
                        <button
                          key={s.id}
                          onClick={() => onToggleSubtask(primaryTask.id, s.id)}
                          className="w-full flex items-center gap-3 text-left p-2 hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all text-xs font-mono"
                        >
                          <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                            s.completed ? 'bg-white text-black border-white' : 'border-zinc-700 text-transparent'
                          }`}>
                            ✓
                          </span>
                          <span className={`flex-1 ${s.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            {s.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Add Subtask In-Context */}
                <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    placeholder="Add focus checklist checkpoint..."
                    className="flex-1 bg-transparent border-b border-white/15 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
                  />
                  <button 
                    type="submit"
                    className="p-1 px-3 bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800 text-xs text-white font-mono uppercase"
                  >
                    + Add
                  </button>
                </form>
              </div>

              {/* Work Continuity Session controls */}
              <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-5 mt-6 gap-4">
                <div className="flex items-center gap-4">
                  {activeTimer && activeTimer.taskId === primaryTask.id ? (
                    <button
                      onClick={onStopTimer}
                      className="bg-white hover:bg-zinc-200 text-black font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Pause className="w-3 h-3 fill-black" /> Scroll Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartTimer && onStartTimer(primaryTask.id, false)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-2 cursor-pointer transition-all border border-orange-500/10"
                    >
                      <Play className="w-3 h-3 fill-white" /> Focus Session
                    </button>
                  )}
                  
                  <button
                    onClick={() => onToggleTask(primaryTask.id)}
                    className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 cursor-pointer transition-all"
                  >
                    Complete Node
                  </button>
                </div>

                <div className="flex items-center gap-2.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {activeTimer && activeTimer.taskId === primaryTask.id ? (
                    <span className="text-sm font-black text-white">{formatTimer(activeTimerSeconds)}</span>
                  ) : (
                    <span className="text-xs text-zinc-500 font-bold">Session Rest</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 p-8 flex flex-col justify-center items-center text-center space-y-4 py-12">
              <span className="text-xl">⚓</span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No Active Anchor Set</h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                  Anchor requires exactly one cognitive load to act as your primary direction. Select a next step from recommendations below or create one.
                </p>
              </div>
              
              {recommendations.length > 0 ? (
                <div className="w-full max-w-sm space-y-2 pt-2">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase font-black block tracking-widest text-left">Set active anchor from index:</span>
                  {recommendations.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onSetPrimary(t.id)}
                      className="w-full text-left p-2.5 border border-white/5 hover:border-white/10 bg-zinc-950/40 text-xs font-mono text-zinc-400 hover:text-white flex justify-between items-center transition-all"
                    >
                      <span className="truncate flex-1 pr-4">{t.text}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => onSwitchView && onSwitchView('CAPTURE')}
                  className="bg-white text-black font-mono text-[9px] font-black uppercase tracking-widest py-2 px-4 transition-all"
                >
                  Quickly Capture Node
                </button>
              )}
            </div>
          )}

          {/* Continuity memory section (Recent completed note) */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold block">
              Last Registered Memory Completes
            </span>
            {lastCompletedTask ? (
              <div className="p-4 bg-zinc-900/30 border border-white/5 flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  ✓
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">COMPLETED SECONDS AGO</span>
                  <p className="text-xs text-zinc-300 font-mono truncate">{lastCompletedTask.text}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                  {new Date(lastCompletedTask.completedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            ) : (
              <div className="p-4 bg-zinc-900/10 border border-white/5 text-center text-xs text-zinc-600 font-mono uppercase">
                Initialize actions to stamp activity footprints.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Mini Checklist Todos + Quick Capture (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Capture Panel on Screen */}
          <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block font-bold">
              Instant Thought Buffer
            </span>
            <form onSubmit={handleQuickLocalCapture} className="space-y-3">
              <input
                type="text"
                value={localCaptureText}
                onChange={(e) => setLocalCaptureText(e.target.value)}
                placeholder="What popped into your head?"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
              />
              <button
                type="submit"
                disabled={!localCaptureText.trim()}
                className="w-full py-2 bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-black text-center font-mono text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all"
              >
                Stream to Buffer
              </button>
            </form>
          </div>

          {/* Sticky Daily Checkpoints / Simple Scratchpad checklist */}
          <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-b border-white/5 pb-2">
              <span className="uppercase font-bold tracking-[0.15em]">Daily Scratch List</span>
              <span className="text-[9px] text-zinc-500">{dailyTodos.filter(t => t.completed).length}/{dailyTodos.length} Completed</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dailyTodos.length > 0 ? (
                dailyTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 group justify-between">
                    <button
                      onClick={() => onToggleDailyTodo(todo.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                        todo.completed ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'border-zinc-700 text-transparent'
                      }`}>
                        ✕
                      </span>
                      <span className={`text-[11px] font-sans truncate ${todo.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {todo.text}
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-600 font-mono italic">No items on scratchpad today.</p>
              )}
            </div>

            <form onSubmit={handleAddTodoSubmit} className="flex gap-2">
              <input
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                placeholder="Scratch a point down..."
                className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
              />
              <button 
                type="submit"
                className="p-1 px-2 text-white hover:text-white/60 transition-colors uppercase font-mono text-xs"
              >
                +
              </button>
            </form>
          </div>

          {/* Active Projects Overview Node count */}
          <div className="p-5 border border-white/5 bg-zinc-950/40 space-y-3.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400 font-bold block">
              Active Project Portals
            </span>
            
            <div className="space-y-2">
              {activeProjects.map(p => {
                const linkedTasks = allTasks.filter(t => t.goalId === p.id);
                const completedTasks = linkedTasks.filter(t => t.status === 'completed');
                const projectProgress = linkedTasks.length > 0 
                  ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
                  : 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => onSwitchView && onSwitchView('PROJECTS')}
                    className="w-full text-left p-3 border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all duration-300 block space-y-2 cursor-pointer"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">{p.title}</span>
                      <span className="text-[8px] font-mono text-zinc-500">{projectProgress}% Focus</span>
                    </div>
                    {/* Micro gauge */}
                    <div className="h-1 bg-zinc-900 rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-zinc-400"
                        style={{ width: `${projectProgress}%` }}
                      />
                    </div>
                  </button>
                );
              })}

              {activeProjects.length === 0 && (
                <div className="text-center py-4 border border-zinc-900 border-dashed">
                  <p className="text-[10px] text-zinc-600 font-mono">No active projects. Map project space in node universe.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Recommended Next Actions Checklist */}
      {recommendations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold block">
            Recommended Focus Trajectories
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div 
                key={rec.id} 
                className="p-4 bg-[#0a0a0c] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-32"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="text-[10px] font-sans font-medium text-zinc-300 leading-snug line-clamp-2">
                    {rec.text}
                  </p>
                </div>
                
                <button
                  onClick={() => onSetPrimary(rec.id)}
                  className="text-white hover:text-orange-400 font-mono text-[9px] uppercase tracking-widest flex items-center justify-between w-full pt-4 group transition-colors cursor-pointer"
                >
                  <span>Anchor Focus</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini Cognitive Intelligence Advisor Section */}
      <div className="border-t border-white/5 pt-8">
        <GeminiAdvisor 
          tasks={tasks}
          allTasks={allTasks}
          reflections={reflections}
          goals={goals}
          onSetPrimary={onSetPrimary}
        />
      </div>

    </motion.div>
  );
}
