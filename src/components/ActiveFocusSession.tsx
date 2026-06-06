import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Pause, 
  Play, 
  Check, 
  ChevronDown, 
  Clock, 
  Sliders, 
  Target, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Flame,
  Plus,
  Trash2,
  Lock,
  Database,
  Calendar,
  ChevronRight,
  X,
  Activity,
  Archive,
  Edit3,
  Link,
  ChevronLeft
} from 'lucide-react';
import { Task, Subtask, Goal, ActiveTimer, TimeLog, TimeBlockType } from '../types';

interface ActiveFocusSessionProps {
  task: Task;
  allTasks: Task[];
  goals: Goal[];
  timeLogs?: TimeLog[];
  activeTimer: ActiveTimer | null;
  activeTimerSeconds: number;
  streak: number;
  weeklyStats: { completions: number; totalCount: number; hours: number };
  onStopTimer: () => void;
  onStartTimer: (taskId: string, isPomodoro?: boolean, pomodoroDurationMinutes?: number) => void;
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onUpdateTaskEstimate?: (taskId: string, estimatedMinutes: number) => void;
  onUpdateTaskText?: (taskId: string, text: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAbandonTask?: (taskId: string) => void;
  onLinkTaskToGoal?: (taskId: string, goalId: string | null) => void;
  onSetTaskDependency?: (taskId: string, dependsOnId: string | null) => void;
  onAssignBlock?: (taskId: string, block: TimeBlockType) => void;
  onDismiss: () => void;
}

export function ActiveFocusSession({
  task,
  allTasks = [],
  goals = [],
  timeLogs = [],
  activeTimer,
  activeTimerSeconds,
  streak,
  weeklyStats,
  onStopTimer,
  onStartTimer,
  onToggleTask,
  onToggleSubtask,
  onAddSubtask,
  onUpdateTaskEstimate,
  onUpdateTaskText,
  onDeleteTask,
  onAbandonTask,
  onLinkTaskToGoal,
  onSetTaskDependency,
  onAssignBlock,
  onDismiss
}: ActiveFocusSessionProps) {
  // Local notes/blockers notepad text
  const [notesText, setNotesText] = useState(() => {
    return localStorage.getItem(`anchor_task_notes_${task.id}`) || '';
  });

  // More options modal trigger
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isAdvancedPanelExpanded, setIsAdvancedPanelExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  
  // Advanced panel editing fields
  const [editedTitle, setEditedTitle] = useState(task.text);
  const [isTitleEditingActive, setIsTitleEditingActive] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  // Quick status copy feedback
  const [copiedId, setCopiedId] = useState(false);

  // Sync state notes and title input when task changes
  useEffect(() => {
    setNotesText(localStorage.getItem(`anchor_task_notes_${task.id}`) || '');
    setEditedTitle(task.text);
    setIsTitleEditingActive(false);
  }, [task.id, task.text]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesText(val);
    localStorage.setItem(`anchor_task_notes_${task.id}`, val);
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      onAddSubtask(task.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  const handleSaveTitleClick = () => {
    if (editedTitle.trim() && onUpdateTaskText) {
      onUpdateTaskText(task.id, editedTitle.trim());
      setIsTitleEditingActive(false);
    }
  };

  const formatTimerVal = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSecondsToMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : 0;

  // Task-specific analytics calculated from timeLogs
  const taskLogs = useMemo(() => {
    return (timeLogs || []).filter(log => log.taskId === task.id);
  }, [timeLogs, task.id]);

  const totalTaskFocusSeconds = useMemo(() => {
    return taskLogs.reduce((sum, log) => sum + log.duration, 0);
  }, [taskLogs]);

  const taskSessionsCount = taskLogs.length;

  // Find parent weekly goal / OKR
  const linkedGoal = useMemo(() => {
    if (!task.goalId) return null;
    return goals.find(g => g.id === task.goalId);
  }, [task.goalId, goals]);

  // Find dependency task
  const dependencyTask = useMemo(() => {
    if (!task.dependsOn) return null;
    return allTasks.find(t => t.id === task.dependsOn);
  }, [task.dependsOn, allTasks]);

  // Find other tasks available to depend upon
  const dependencyOptions = useMemo(() => {
    return allTasks.filter(t => t.id !== task.id && t.status === 'pending');
  }, [allTasks, task.id]);

  // Handle task id copying
  const copyTaskID = () => {
    navigator.clipboard.writeText(task.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isTimerRunning = activeTimer && activeTimer.taskId === task.id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="w-full text-white font-mono flex flex-col gap-6"
    >
      {/* 1. Header (Back button to return to overview dashboard) */}
      <div className="flex justify-between items-center bg-zinc-950/20 p-2.5 border border-white/5">
        <button
          onClick={onDismiss}
          className="flex items-center gap-2 outline-none p-2 px-3 hover:bg-white/5 hover:text-white text-zinc-400 group text-[10px] uppercase tracking-widest font-bold border border-transparent hover:border-white/10 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          title="Return back to Today Landing overview"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#e25424]" />
          <span>Back to Landing</span>
        </button>
        
        <div className="flex items-center gap-2">
          {task.block && (
            <span className={`text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 border ${
              task.block === 'DEEP' 
                ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                : task.block === 'LIGHT'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
            }`}>
              {task.block} Focus Block
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[8px] font-bold text-orange-500/90 tracking-widest uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block animate-ping" />
            Active Session Context
          </span>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-stretch">
        
        {/* PANEL A: Task Details (Col span 6 = 60% of width) */}
        <div className="md:col-span-6 border border-white/10 bg-zinc-950/60 p-6 flex flex-col justify-between space-y-6 relative rounded-none min-h-[500px]">
          
          <div className="space-y-6">
            {/* Tag / Objective category tracker label */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#e25424]">
                  Anchor Task Goal
                </span>
                {linkedGoal && (
                  <div className="flex items-center gap-1 text-[8px] border border-red-500/30 bg-red-500/5 text-red-400 font-bold px-2 py-0.5 uppercase tracking-wide">
                    <Target className="w-2.5 h-2.5" />
                    <span>{linkedGoal.title}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-500">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Title Block */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-sans font-black text-white leading-tight tracking-tight select-text">
                {task.text}
              </h1>
              {dependencyTask && (
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 border border-white/5 bg-zinc-950 p-2 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Required block dependency: <b className="text-white">{dependencyTask.text}</b></span>
                </div>
              )}
              <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                Avoid context-switching. Commit your focus single-mindedly to this active task item. Check off minor subtasks or add notes below.
              </p>
            </div>

            {/* Checkpoints & Subtasks checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
                <span>Micro checkpoints:</span>
                <span>{completedSubtasks} of {subtasks.length} Complete</span>
              </div>
              
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {subtasks.length > 0 ? (
                  subtasks.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => onToggleSubtask(task.id, sub.id)}
                      className="w-full flex items-center gap-3 text-left p-2.5 bg-zinc-950/30 hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all text-xs font-mono min-h-[44px] cursor-pointer"
                    >
                      <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                        sub.completed ? 'bg-white text-black border-white' : 'border-zinc-800 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span className={`flex-1 truncate ${sub.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {sub.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-zinc-600 italic py-2">
                    No minor checkpoints registered yet. Use the field below to construct a micro checkpoint action.
                  </p>
                )}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-1.5 border-t border-white/5">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Inscribe action checkpoint..."
                  maxLength={45}
                  className="flex-1 bg-zinc-900/40 border border-white/5 hover:border-white/10 py-2 px-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-white/30 rounded-none placeholder:text-zinc-700 transition-colors min-h-[44px]"
                />
                <button 
                  type="submit"
                  disabled={!subtaskInput.trim()}
                  className="px-4 border border-white/10 hover:border-white text-white hover:bg-white/5 disabled:border-white/5 disabled:text-zinc-800 disabled:hover:bg-transparent transition-all uppercase text-[9px] font-bold min-h-[44px] cursor-pointer"
                >
                  Confirm
                </button>
              </form>
            </div>

            {/* Blockers & Notes Notepad Area */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-[9px] uppercase tracking-widest text-zinc-400 font-black block">
                Session notes, observations, or blocker logs:
              </label>
              <textarea
                value={notesText}
                onChange={handleNotesChange}
                placeholder="Log active reminders, unexpected roadblocks, or brainstorm fragments here. Saved automatically..."
                className="w-full h-24 bg-[#090b0d] border border-white/5 hover:border-white/10 focus:border-white/20 p-3 text-xs font-sans leading-relaxed text-zinc-300 outline-none resize-none rounded-none placeholder:text-zinc-700 focus:placeholder:text-zinc-800 transition-all"
              />
            </div>
          </div>

          {/* Core Controller Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5 bg-zinc-950/20 p-3">
            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <button
                  onClick={onStopTimer}
                  className="bg-white hover:bg-zinc-200 text-black font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer active:scale-95 border-2 border-white min-h-[44px]"
                  title="Pause active focus session"
                >
                  <Pause className="w-3 h-3 fill-black text-black" /> 
                  <span>Pause Timer</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartTimer(task.id, false)}
                  className="bg-[#e45423] hover:bg-[#c74519] text-white font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer active:scale-95 border border-[#ff6633] min-h-[44px]"
                  title="Resume/Continue focus work session"
                >
                  <Play className="w-3 h-3 fill-white text-white" /> 
                  <span>Continue Session</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  onToggleTask(task.id);
                  onDismiss();
                }}
                className="border border-white/20 hover:border-white hover:bg-white/5 text-zinc-200 font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2.5 cursor-pointer active:scale-95 transition-all min-h-[44px]"
                title="Settle anchor as completed and close workspace session"
              >
                Mark Complete
              </button>
            </div>

            {/* Redesigned More options button to access full settings and analytics modal */}
            <div>
              <button
                onClick={() => {
                  setEditedTitle(task.text);
                  setIsMoreOptionsOpen(true);
                }}
                className="p-2 border border-[#e45423]/30 hover:border-[#e45423] bg-[#e45423]/5 hover:bg-[#e45423]/10 text-orange-400 hover:text-white transition-all flex items-center gap-1.5 uppercase font-mono text-[9px] font-bold min-h-[44px] cursor-pointer"
                title="Open advanced options drawer for settings, metrics, and parameters"
              >
                <Sliders className="w-3.5 h-3.5 text-[#e25424]" />
                <span>More Options</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANEL B: Analytics, Timer, Progress Context (Col span 3 = 30% of width) */}
        <div className="md:col-span-3 border border-white/10 bg-zinc-950/20 p-6 flex flex-col justify-between space-y-6 rounded-none min-h-[500px]">
          
          {/* Main Visual Clock Area */}
          <div className="space-y-6 text-center">
            <span className="text-[9px] font-sans font-black tracking-widest text-zinc-500 uppercase block">
              WORKSPACE TIMER
            </span>

            {/* Giant Monospace Timer display with circular styling */}
            <div className="relative group w-44 h-44 mx-auto border border-white/5 bg-zinc-950/40 rounded-full flex flex-col items-center justify-center space-y-1 shadow-[0_0_40px_rgba(255,255,255,0.01)]">
              {/* Outer ticking border */}
              <div className={`absolute inset-1.5 rounded-full border border-dashed transition-all duration-1000 ${
                isTimerRunning ? 'border-[#e45423]/40 animate-spin' : 'border-zinc-800'
              }`} style={{ animationDuration: '40s' }} />

              <Clock className={`w-5 h-5 ${isTimerRunning ? 'text-[#e45423] animate-pulse' : 'text-zinc-600'}`} />
              
              <h2 className="text-2xl font-mono font-black tracking-tighter text-white">
                {formatTimerVal(activeTimerSeconds)}
              </h2>

              <span className={`text-[8.5px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 ${
                isTimerRunning ? 'text-emerald-500 bg-emerald-500/5' : 'text-zinc-500 bg-zinc-900/30'
              }`}>
                {isTimerRunning ? 'FOCUSING' : 'PAUSED'}
              </span>
            </div>

            {/* Visual Progress bar */}
            <div className="space-y-2 text-left pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-zinc-500 font-bold uppercase">
                <span>Task Progress Checklist</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-zinc-950 border border-white/5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isTimerRunning ? 'bg-[#e45423]' : 'bg-zinc-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Continuous Discipline & Metrics Summary */}
          <div className="space-y-3.5 pt-4 border-t border-white/5">
            <span className="text-[8.5px] font-sans font-black tracking-widest text-zinc-500 uppercase block">
              PEAK momentum logs:
            </span>
            
            <div className="space-y-2">
              {/* Streak info */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-white/5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">Honesty Streak</span>
                </div>
                <span className="text-[11px] font-black text-orange-400">{streak} Days</span>
              </div>

              {/* Weekly completions */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-white/5">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">Week completions</span>
                </div>
                <span className="text-[11px] font-bold text-white">{weeklyStats.completions} Tasks</span>
              </div>

              {/* Weekly focus hours */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-white/5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">Week Focus Hours</span>
                </div>
                <span className="text-[11px] font-bold text-white">{weeklyStats.hours} hrs</span>
              </div>
            </div>
            
            <div className="p-2.5 bg-zinc-950/40 border border-white/5 text-[8.5px] leading-relaxed text-zinc-600 font-sans">
              "Task metrics aggregate cumulative seconds directly into weekly productivity analytics models."
            </div>
          </div>
        </div>

        {/* PANEL C: Custom Technical Dev Rail (Col span 1 = 10% of width) */}
        <div className="md:col-span-1 flex flex-col justify-center items-center">
          <button
            onClick={() => setIsAdvancedPanelExpanded(!isAdvancedPanelExpanded)}
            className={`w-full py-3 border flex flex-col items-center justify-center gap-1 text-[8.5px] font-mono uppercase tracking-[0.2em] font-extrabold transition-all min-h-[140px] cursor-pointer ${
              isAdvancedPanelExpanded 
                ? 'bg-zinc-900 text-white border-white/50' 
                : 'bg-zinc-950/20 text-zinc-600 border-white/5 hover:border-white/10 hover:text-zinc-400'
            }`}
            title="Toggle details rail (10% of screen)"
          >
            <Database className="w-4 h-4 mb-1" />
            <span className="[writing-mode:vertical-lr] tracking-widest text-[#e25424]">METADATA</span>
            <ChevronRight className={`w-3.5 h-3.5 mt-2 transition-transform duration-200 ${isAdvancedPanelExpanded ? 'rotate-180 text-white' : ''}`} />
          </button>
        </div>

      </div>

      {/* Slide-out/Expandible Details section (10% expandable panel details panel) */}
      <AnimatePresence>
        {isAdvancedPanelExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border border-white/10 bg-[#090b0d] p-5 space-y-4 font-mono text-[9px]"
          >
            <span className="text-[8.5px] font-bold uppercase tracking-[0.25em] text-red-500/80 block">
              Low-Level Database Payload Diagnostic (Diagnostic 10%)
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Unique Task Identifier (UUID):</span>
                  <button 
                    onClick={copyTaskID}
                    className="p-1 border border-white/10 hover:bg-white/5 hover:border-white/30 text-white leading-none text-[8px] uppercase tracking-normal"
                  >
                    {copiedId ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2 bg-zinc-950 text-zinc-400 font-mono text-[8.5px] border border-white/5 select-all overflow-hidden truncate">
                  {task.id}
                </div>
                
                <div className="flex justify-between text-zinc-500">
                  <span>Category Code:</span>
                  <span className="text-white font-extrabold">{task.category}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>State Status Code:</span>
                  <span className="text-white font-extrabold">{task.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-500">Raw JSON Node Attributes:</div>
                <pre className="p-2 bg-zinc-950 text-emerald-500 font-mono text-[8.5px] max-h-[100px] overflow-auto border border-white/5 rounded-none leading-normal">
                  {JSON.stringify({ 
                    id: task.id, 
                    createdAt: task.createdAt, 
                    dependsOn: task.dependsOn,
                    goalId: task.goalId,
                    est: task.estimatedTime || 45,
                    hasSubtasks: subtasks.length
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Redesigned Grand Overlay Modal Window: "More options drawer" with Advanced configs */}
      <AnimatePresence>
        {isMoreOptionsOpen && (
          <>
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOptionsOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#090c0f] border border-white/10 p-6 md:p-8 z-[151] font-mono text-white shadow-[0_0_80px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto rounded-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-[#e25424]" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Advanced Task Options</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-normal">Modify configurations, track diagnostics & link OKRs</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMoreOptionsOpen(false)}
                  className="p-2 border border-white/5 hover:border-white/20 hover:bg-white/5 rounded-none transition-all text-zinc-400 hover:text-white cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Close Options Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* A. EDIT TASK SETTINGS (TITLE IN CONTEXT) */}
                <div className="space-y-2 border border-white/5 p-3.5 bg-zinc-950/40">
                  <label className="text-[9px] uppercase tracking-widest text-[#e25424] font-black block">
                    Edit Task Title Settings
                  </label>
                  {isTitleEditingActive ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-white/20 p-2.5 text-xs text-white outline-none focus:border-white/40"
                        placeholder="Inscribe revised task description..."
                        maxLength={100}
                      />
                      <button
                        onClick={handleSaveTitleClick}
                        disabled={!editedTitle.trim() || editedTitle.trim() === task.text}
                        className="px-4 border border-emerald-500 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 font-bold uppercase text-[9px] cursor-pointer min-h-[40px] disabled:opacity-40"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          setEditedTitle(task.text);
                          setIsTitleEditingActive(false);
                        }}
                        className="px-3 border border-white/10 hover:bg-white/5 text-zinc-400 font-bold uppercase text-[9px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 bg-zinc-950/80 p-3 border border-white/5">
                      <span className="text-xs text-zinc-300 flex-1 truncate font-sans font-bold leading-normal">{task.text}</span>
                      <button
                        onClick={() => setIsTitleEditingActive(true)}
                        className="p-2 border border-white/10 hover:border-white/25 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center gap-1.5 uppercase text-[8px] font-bold shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-zinc-500" />
                        <span>Edit Description</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* B. ANALYTICS FOR THIS TASK */}
                <div className="space-y-2.5 border border-white/5 p-3.5 bg-zinc-950/40">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#e25424]" />
                    <span className="text-[9px] uppercase tracking-widest text-[#e25424] font-black">
                      Focused Analytics & Logs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-zinc-950/80 p-3 border border-white/5">
                      <span className="text-[8px] text-zinc-500 uppercase block pb-1">Total Focus Logged</span>
                      <span className="text-sm font-bold text-white block">
                        {formatSecondsToMinutes(totalTaskFocusSeconds)}
                      </span>
                    </div>

                    <div className="bg-zinc-950/80 p-3 border border-white/5">
                      <span className="text-[8px] text-zinc-500 uppercase block pb-1">Sustained Sessions</span>
                      <span className="text-sm font-bold text-white block">
                        {taskSessionsCount} times
                      </span>
                    </div>

                    <div className="bg-zinc-950/80 p-3 border border-white/5 col-span-2 sm:col-span-1">
                      <span className="text-[8px] text-zinc-500 uppercase block pb-1">Checklist Ratio</span>
                      <span className="text-sm font-bold text-white block">
                        {completedSubtasks}/{subtasks.length} ({progressPercent}%)
                      </span>
                    </div>
                  </div>

                  {taskLogs.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      <span className="text-[8px] text-zinc-600 uppercase font-bold block">Historic focus timeline:</span>
                      <div className="max-h-[85px] overflow-y-auto border border-white/5 bg-zinc-950 p-2 space-y-1 text-[8.5px]">
                        {taskLogs.map((log) => (
                          <div key={log.id} className="flex justify-between text-zinc-400">
                            <span>{new Date(log.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-extrabold text-white">{formatSecondsToMinutes(log.duration)} ({log.manual ? 'Manual' : 'Timer'})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[8.5px] text-zinc-600 italic leading-normal">
                      No numeric time tracking log found in database for this specific task. Complete active sessions to compile statistical graphs.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* C. LINKED GOAL */}
                  <div className="space-y-2 border border-white/5 p-3.5 bg-zinc-950/40 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[9px] uppercase tracking-widest text-red-500 font-black">
                          Linked Weekly Goal
                        </span>
                      </div>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        Bind this micro focus anchor directly to a major weekly objective.
                      </p>
                    </div>

                    <div className="pt-2">
                      {onLinkTaskToGoal ? (
                        <select
                          value={task.goalId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            onLinkTaskToGoal(task.id, val === '' ? null : val);
                          }}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-white outline-none font-mono cursor-pointer transition-colors focus:border-white/30"
                        >
                          <option value="">-- UNLINKED (No associated objective) --</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>
                              [{g.type === 'weekly' ? 'Weekly' : 'Quarterly'}] {g.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[8.5px] text-zinc-600 italic">Inter-goal bindings locked.</div>
                      )}
                    </div>
                  </div>

                  {/* D. DEPENDENCIES */}
                  <div className="space-y-2 border border-white/5 p-3.5 bg-zinc-950/40 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#e25424]" />
                        <span className="text-[9px] uppercase tracking-widest text-[#e25424] font-black">
                          Block Dependency
                        </span>
                      </div>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        Pre-requisites: Prevent finalizing this task until the dependency anchor is completed.
                      </p>
                    </div>

                    <div className="pt-2">
                      {onSetTaskDependency ? (
                        <select
                          value={task.dependsOn || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            onSetTaskDependency(task.id, val === '' ? null : val);
                          }}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-white outline-none font-mono cursor-pointer transition-colors focus:border-white/30"
                        >
                          <option value="">-- NO PRE-REQUISITE DEPENDENCY --</option>
                          {dependencyOptions.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.text} (Pending)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[8.5px] text-zinc-600 italic">Pre-requisite options locked.</div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* E. BLOCK TYPE ASSIGNMENT */}
                  <div className="space-y-2 border border-white/5 p-3.5 bg-zinc-950/40 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-orange-400 font-black block">
                        Task Focus Schedule Block Type
                      </span>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        Categorize task style to synchronize with corresponding block segments.
                      </p>
                    </div>

                    <div className="pt-2">
                      {onAssignBlock ? (
                        <div className="flex gap-1">
                          {(['DEEP', 'LIGHT', 'FREE'] as TimeBlockType[]).map((blk) => {
                            const isSelected = task.block === blk;
                            return (
                              <button
                                key={blk}
                                onClick={() => onAssignBlock(task.id, blk)}
                                className={`flex-1 py-1.5 px-1 border uppercase text-[8px] font-bold transition-all text-center cursor-pointer ${
                                  isSelected 
                                    ? 'border-orange-500 bg-orange-600/10 text-orange-400 font-extrabold' 
                                    : 'border-white/5 bg-zinc-950 text-zinc-500 hover:text-white'
                                }`}
                              >
                                {blk}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[8.5px] text-zinc-600 italic">Schedule assignments locked.</div>
                      )}
                    </div>
                  </div>

                  {/* F. ESTIMATED TIME BUDGET */}
                  <div className="space-y-2 border border-white/5 p-3.5 bg-zinc-950/40 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-blue-400 font-black block">
                        Estimated Budget Time
                      </span>
                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        Set expected minutes budget required for focus optimization check-in.
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between gap-1.5 bg-zinc-900 border border-white/10 p-1 font-mono">
                        <button
                          onClick={() => {
                            const curr = task.estimatedTime || 45;
                            if (curr > 15 && onUpdateTaskEstimate) {
                              onUpdateTaskEstimate(task.id, curr - 15);
                            }
                          }}
                          className="p-1 text-xs font-bold hover:text-white text-zinc-500 min-w-[28px] text-center cursor-pointer"
                          title="Subtract 15m"
                        >
                          -15m
                        </button>
                        <span className="text-xs text-white font-extrabold font-mono">
                          {task.estimatedTime || 45} mins
                        </span>
                        <button
                          onClick={() => {
                            const curr = task.estimatedTime || 45;
                            if (curr < 480 && onUpdateTaskEstimate) {
                              onUpdateTaskEstimate(task.id, curr + 15);
                            }
                          }}
                          className="p-1 text-xs font-bold hover:text-white text-zinc-500 min-w-[28px] text-center cursor-pointer"
                          title="Add 15m"
                        >
                          +15m
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* G. DESTRUCTIVE ACTIONS ZONE */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 block">
                    Task Demolition & Abandonment Safeguards
                  </span>

                  <div className="flex flex-wrap gap-2">
                    
                    {/* Abandon Task */}
                    {showAbandonConfirm ? (
                      <div className="flex items-center gap-2 border border-[#e45423]/40 bg-[#e45423]/5 p-2 flex-1">
                        <span className="text-[8px] text-orange-400 uppercase font-bold">Abandon?</span>
                        <button
                          onClick={() => {
                            if (onAbandonTask) {
                              onAbandonTask(task.id);
                              setIsMoreOptionsOpen(false);
                              onDismiss();
                            }
                          }}
                          className="bg-orange-600 text-white font-bold text-[8px] uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowAbandonConfirm(false)}
                          className="border border-white/10 hover:bg-white/5 text-zinc-400 text-[8px] uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowAbandonConfirm(true);
                          setShowDeletionConfirm(false);
                        }}
                        className="p-2.5 border border-amber-600/30 hover:border-amber-600 bg-amber-600/5 hover:bg-amber-600/10 text-amber-500 hover:text-white transition-all flex items-center justify-center gap-1 px-4 text-[9px] font-bold uppercase cursor-pointer"
                        title="Abandon active task scheduling"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-500" />
                        <span>Abandon / Archive</span>
                      </button>
                    )}

                    {/* Delete Task */}
                    {showDeletionConfirm ? (
                      <div className="flex items-center gap-2 border border-red-500/40 bg-red-950/10 p-2 flex-1">
                        <span className="text-[8px] text-red-400 uppercase font-bold">Delete?</span>
                        <button
                          onClick={() => {
                            if (onDeleteTask) {
                              onDeleteTask(task.id);
                              setIsMoreOptionsOpen(false);
                              onDismiss();
                            }
                          }}
                          className="bg-red-600 text-white font-bold text-[8px] uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setShowDeletionConfirm(false)}
                          className="border border-white/10 hover:bg-white/5 text-zinc-400 text-[8px] uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowDeletionConfirm(true);
                          setShowAbandonConfirm(false);
                        }}
                        className="p-2.5 border border-red-800/30 hover:border-red-600 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-white transition-all flex items-center justify-center gap-1 px-4 text-[9px] font-bold uppercase cursor-pointer"
                        title="Fully eliminate this task payload"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Delete Permanently</span>
                      </button>
                    )}

                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
