import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Brain, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  FolderPlus, 
  Sliders, 
  Clock, 
  CheckSquare, 
  ListTodo,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  Target
} from 'lucide-react';
import { Task, Category, TimeBlockType, Goal, TimeBlock, BlockTemplate, GoogleCalendarSettings, GoogleCalendarEvent } from '../types';
import { TaskItem } from '../components/TaskItem';
import { SmartBlockScheduler } from '../components/SmartBlockScheduler';

interface ManagePageProps {
  key?: string;
  tasks: Task[]; // active tasks (KEEP category)
  unfilteredTasks: Task[]; // NONE category brain dump tasks
  allTasks: Task[]; // all items including completed/abandoned
  goals?: Goal[];
  timeBlocks?: TimeBlock[];
  blockTemplates?: BlockTemplate[];
  onAdd: (text: string) => void;
  onCategorize: (id: string, cat: Category) => void;
  onDelete: (id: string) => void;
  onAssignBlock: (id: string, block: TimeBlockType) => void;
  onToggleTaskStatus: (id: string) => void;
  onAbandonTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onAddMultipleSubtasks?: (taskId: string, titles: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSetDependency: (taskId: string, dependsOnId: string | null) => void;
  onSetStartDate: (taskId: string, startDate: number | null) => void;
  onLinkTaskToGoal?: (taskId: string, goalId: string | null) => void;
  onAddTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onUpdateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onApplyBlockTemplate: (templateId: string, dayOfWeek: number) => void;
  onSaveBlockAsTemplate: (name: string, description: string, dayOfWeek: number) => void;

  googleCalendarEvents?: GoogleCalendarEvent[];
  googleCalendarSettings?: GoogleCalendarSettings;
}

export function ManagePage({
  tasks = [],
  unfilteredTasks = [],
  allTasks = [],
  goals = [],
  timeBlocks = [],
  blockTemplates = [],
  onAdd,
  onCategorize,
  onDelete,
  onAssignBlock,
  onToggleTaskStatus,
  onAbandonTask,
  onAddSubtask,
  onAddMultipleSubtasks,
  onToggleSubtask,
  onSetDependency,
  onSetStartDate,
  onLinkTaskToGoal,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onApplyBlockTemplate,
  onSaveBlockAsTemplate,
  googleCalendarEvents = [],
  googleCalendarSettings
}: ManagePageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'DUMP' | 'BLOCKS' | 'EDIT'>('DUMP');
  
  // 1. Brain Dump input stats
  const [dumpInput, setDumpInput] = useState('');
  const dumpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSubTab === 'DUMP') {
      dumpInputRef.current?.focus();
    }
  }, [activeSubTab]);

  const handleDumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dumpInput.trim()) {
      onAdd(dumpInput.trim());
      setDumpInput('');
      setTimeout(() => {
        dumpInputRef.current?.focus();
      }, 0);
    }
  };

  // 2. Pomodoro Timer implementation
  const [activeTimer, setActiveTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setActiveTimer(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const blocks: { type: TimeBlockType; label: string; desc: string; color: string }[] = [
    { type: 'DEEP', label: 'Deep Work', desc: 'No distractions. High intensity.', color: 'border-orange-500/20' },
    { type: 'LIGHT', label: 'Light Work', desc: 'Admin, emails, quick tasks.', color: 'border-blue-500/20' },
    { type: 'FREE', label: 'Free Time', desc: 'Rest. Recovery. No guilt.', color: 'border-emerald-500/15' }
  ];

  // 3. Task Edit states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [startDateStr, setStartDateStr] = useState('');

  const selectedTask = allTasks.find(t => t.id === selectedTaskId);

  const handleAddSubtaskLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaskId && subtaskTitle.trim()) {
      onAddSubtask(selectedTaskId, subtaskTitle.trim());
      setSubtaskTitle('');
    }
  };

  const currentKeepPendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Page Title Header */}
      <section className="space-y-1">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-orange-500 font-bold block">
          Anchor Node Manager
        </span>
        <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
          Manage Priority Vectors
        </h2>
        <p className="text-[11px] text-zinc-500">
          Dump unfiltered raw thinking, map them into blocks, or schedule dependencies.
        </p>
      </section>

      {/* Sub tabs selectors */}
      <div className="grid grid-cols-3 border border-white/5 bg-zinc-950/20 p-1">
        <button
          onClick={() => setActiveSubTab('DUMP')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
            activeSubTab === 'DUMP' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          1. Brain Dump ({unfilteredTasks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('BLOCKS')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
            activeSubTab === 'BLOCKS' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          2. Block Organize
        </button>
        <button
          onClick={() => setActiveSubTab('EDIT')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
            activeSubTab === 'EDIT' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          3. Tacticals & Links
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: BRAIN DUMP PANEL */}
        {activeSubTab === 'DUMP' && (
          <motion.div
            key="dump-panel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Input field */}
            <div className="bg-zinc-950/40 p-4 border border-white/5 space-y-4">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                Instant stream of consciousness logger
              </label>
              
              <form onSubmit={handleDumpSubmit} className="relative">
                <input
                  ref={dumpInputRef}
                  type="text"
                  value={dumpInput}
                  onChange={(e) => setDumpInput(e.target.value)}
                  placeholder="Record chaotic thought structure..."
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg focus:border-white focus:outline-none transition-all placeholder:text-zinc-700 font-mono text-white"
                />
                <button
                  type="submit"
                  className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 ${
                    dumpInput.trim() ? 'text-white' : 'text-white/10'
                  }`}
                  disabled={!dumpInput.trim()}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <span className="text-[8px] font-mono text-zinc-600 block italic">
                Hit Enter to stash. Organized thinking is sequential work.
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] block">
                Unfiltered Node Queues ({unfilteredTasks.length})
              </label>

              <div className="space-y-3">
                {unfilteredTasks.map(task => (
                  <motion.div
                    layout
                    key={task.id}
                    className="p-5 border border-white/5 bg-zinc-950/60 flex flex-col gap-3 group hover:border-white/10 transition-all"
                  >
                    <p className="text-sm font-medium text-white/95">{task.text}</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCategorize(task.id, 'KEEP')}
                        className="flex-1 py-2 text-[9px] font-mono uppercase bg-white text-black font-black tracking-widest hover:opacity-90"
                      >
                        Organize / Keep
                      </button>
                      
                      <button
                        onClick={() => onCategorize(task.id, 'DELAY')}
                        className="flex-1 py-2 text-[9px] font-mono uppercase border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white"
                      >
                        Delay Archive
                      </button>
                      
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 border border-white/10 hover:border-red-500 hover:text-red-500 text-zinc-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {unfilteredTasks.length === 0 && (
                  <div className="py-12 border border-dashed border-white/5 text-center text-zinc-600 max-w-xs mx-auto space-y-2">
                    <Brain className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Mind cache cleared</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: BLOCKS ORGANIZER PANEL */}
        {activeSubTab === 'BLOCKS' && (
          <motion.div
            key="blocks-panel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <SmartBlockScheduler
              tasks={tasks}
              allTasks={allTasks}
              timeBlocks={timeBlocks}
              blockTemplates={blockTemplates}
              onAddTimeBlock={onAddTimeBlock}
              onUpdateTimeBlock={onUpdateTimeBlock}
              onDeleteTimeBlock={onDeleteTimeBlock}
              onApplyBlockTemplate={onApplyBlockTemplate}
              onSaveBlockAsTemplate={onSaveBlockAsTemplate}
              onAssignToBlock={onAssignBlock}
              googleCalendarEvents={googleCalendarEvents}
              googleCalendarSettings={googleCalendarSettings}
            />
          </motion.div>
        )}

        {/* SUBTAB 3: TACTICALS & LINKS EDITING PANEL */}
        {activeSubTab === 'EDIT' && (
          <motion.div
            key="edit-panel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Pick a Target Task editing picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                Select Active Task to Link & Segment
              </label>
              
              <div className="relative">
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value || null)}
                  className="w-full bg-zinc-950 p-3 border border-white/10 text-xs text-white appearance-none outline-none font-mono tracking-wide"
                >
                  <option value="">-- Choose active prioritize node --</option>
                  {currentKeepPendingTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.text} {task.dependsOn ? '🔗 Linked' : ''}
                    </option>
                  ))}
                </select>
                <Sliders className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Editing Card detailed */}
            {selectedTask ? (
              <div className="p-5 border border-white/15 bg-zinc-950 space-y-6">
                <div>
                  <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest block">
                    Now organizating
                  </span>
                  <h3 className="text-base font-black uppercase text-white tracking-tight leading-tight mt-1">
                    {selectedTask.text}
                  </h3>
                </div>

                {/* Subtask segments configuration */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Define Steps Checklist ({selectedTask.subtasks?.length || 0}/5 limits)
                  </span>

                  {/* Checklist render */}
                  <div className="space-y-2">
                    {(selectedTask.subtasks || []).map(kr => (
                      <div key={kr.id} className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => onToggleSubtask(selectedTask.id, kr.id)}
                          className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 transition-all ${
                            kr.completed ? 'bg-white border-white text-black' : 'border-zinc-700'
                          }`}
                        >
                          {kr.completed && <CheckSquare className="w-2.5 h-2.5" />}
                        </button>
                        <span className={`font-mono text-xs ${kr.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                          {kr.title}
                        </span>
                      </div>
                    ))}

                    <form onSubmit={handleAddSubtaskLocal} className="flex gap-2 pt-1 border-t border-white/5">
                      <input
                        type="text"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        placeholder="Define mini sector objective..."
                        className="bg-transparent border-b border-white/10 py-1 text-xs outline-none focus:border-white text-white font-mono flex-1"
                        maxLength={35}
                      />
                      <button 
                        type="submit" 
                        disabled={!subtaskTitle.trim() || (selectedTask.subtasks || []).length >= 5}
                        className="py-1 px-3 border border-white/10 hover:border-white font-mono text-[9px] uppercase tracking-widest text-[#050505] bg-white"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>

                {/* Prerequisite dependencies lock linking */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Map Prerequisites Blockade
                  </span>
                  <div className="relative">
                    <select
                      value={selectedTask.dependsOn || ''}
                      onChange={(e) => onSetDependency(selectedTask.id, e.target.value || null)}
                      className="w-full bg-[#050505] p-2.5 border border-white/5 text-[10px] font-mono text-zinc-300 appearance-none outline-none"
                    >
                      <option value="">-- No linked blockers --</option>
                      {currentKeepPendingTasks.filter(t => t.id !== selectedTask.id).map(t => (
                        <option key={t.id} value={t.id}>Must complete first: {t.text}</option>
                      ))}
                    </select>
                    <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
                  </div>
                </div>

                {/* Link Task to Goals and Objectives */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Link Task to Strategic Objective
                  </span>
                  <div className="relative">
                    <select
                      value={selectedTask.goalId || ''}
                      onChange={(e) => onLinkTaskToGoal && onLinkTaskToGoal(selectedTask.id, e.target.value || null)}
                      className="w-full bg-[#050505] p-2.5 border border-white/5 text-[10px] font-mono text-zinc-300 appearance-none outline-none font-mono"
                    >
                      <option value="">-- No aligned objective (Unaligned Anchor) --</option>
                      {goals.filter(g => g.status === 'active').map(g => (
                        <option key={g.id} value={g.id}>
                          🎯 {g.type === 'quarterly' ? 'Quarterly' : 'Weekly'}: {g.title}
                        </option>
                      ))}
                    </select>
                    <Target className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-650 pointer-events-none" />
                  </div>
                </div>

                {/* Reschedule Timeline starting date */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Map Start Timing Schedule
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetStartDate(selectedTask.id, null)}
                      className={`flex-1 py-2 text-[9px] font-mono uppercase tracking-[0.1em] border text-center ${
                        selectedTask.startDate === null 
                          ? 'border-white bg-white text-black' 
                          : 'border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      Available Today
                    </button>
                    <button
                      onClick={() => onSetStartDate(selectedTask.id, Date.now() + 24 * 60 * 60 * 1000)}
                      className={`flex-1 py-2 text-[9px] font-mono uppercase tracking-[0.1em] border text-center ${
                        selectedTask.startDate !== null 
                          ? 'border-white bg-white text-black' 
                          : 'border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      Hold block Tomorrow
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-20 border border-dashed border-white/5 text-center text-zinc-600 max-w-xs mx-auto space-y-2">
                <Sliders className="w-8 h-8 mx-auto opacity-25 animate-pulse-subtle" />
                <p className="text-[10px] font-mono uppercase tracking-widest">No target node selected</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
