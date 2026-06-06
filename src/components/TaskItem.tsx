import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, XCircle, Lock, Clock, ChevronDown, ChevronUp, Plus, Target } from 'lucide-react';
import { Task, Goal } from '../types';

interface TaskItemProps {
  key?: string;
  task: Task;
  goals?: Goal[];
  onToggle: (id: string) => void;
  onAbandon?: (id: string) => void;
  onAction?: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onSetDependency?: (taskId: string, dependsOnId: string | null) => void;
  onSetStartDate?: (taskId: string, startDate: number | null) => void;
  onLinkGoal?: (taskId: string, goalId: string | null) => void;
  actionLabel?: string;
  dependency?: Task | null;
  allTasks?: Task[];
}

export function TaskItem({ 
  task, 
  goals = [],
  onToggle, 
  onAbandon, 
  onAction, 
  onAddSubtask,
  onToggleSubtask,
  onSetDependency,
  onSetStartDate,
  onLinkGoal,
  actionLabel,
  dependency,
  allTasks
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  
  const isCompleted = task.status === 'completed';
  const isAbandoned = task.status === 'abandoned';
  const isLocked = dependency && dependency.status !== 'completed' && !isCompleted;
  const isFuture = task.startDate && task.startDate > Date.now() && !isCompleted;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim() && onAddSubtask) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const linkedGoal = goals.find(g => g.id === task.goalId);

  return (
    <motion.div 
      layout
      initial={false}
      animate={{ 
        backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.05)' : 
                        isAbandoned ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0)',
        borderColor: isCompleted ? 'rgba(255, 255, 255, 0.2)' : 
                     isAbandoned ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        opacity: isAbandoned ? 0.4 : (isLocked || isFuture) ? 0.6 : isCompleted ? 0.6 : 1
      }}
      className="border flex flex-col transition-colors group overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/20 hover:text-white/60 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <div className="flex flex-col">
            <span className={`text-sm transition-all duration-500 ${
              isCompleted ? 'line-through text-white/20 translate-x-2' : 
              isAbandoned ? 'line-through text-white/40' : ''
            }`}>
              {task.text}
            </span>
            {totalSubtasks > 0 && (
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                {completedSubtasks}/{totalSubtasks} Subtasks
              </span>
            )}
            {isLocked && (
              <span className="text-[9px] font-mono text-red-400/60 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-2 h-2" /> Prerequisite: {dependency?.text}
              </span>
            )}
            {isFuture && (
              <span className="text-[9px] font-mono text-blue-400/60 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2 h-2" /> Starts {new Date(task.startDate!).toLocaleDateString()}
              </span>
            )}

            {linkedGoal && (
              <div className="mt-1.5 flex flex-col gap-1.5 align-baseline">
                <div className="inline-flex items-center gap-1.5 text-[10.5px]">
                  <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wide">This serves:</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGoalDetails(!showGoalDetails);
                    }}
                    className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors font-mono font-bold text-left flex items-center gap-1 text-[10px]"
                    title="Click to view goal progress details"
                  >
                    <Target className="w-3 h-3 text-[#e25424] animate-pulse" />
                    <span>{linkedGoal.title}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showGoalDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 bg-white border border-zinc-200 p-3 shadow-2xl relative overflow-hidden text-zinc-900 rounded-none w-full max-w-md font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-start border-b border-zinc-100 pb-1.5 mb-2">
                        <div>
                          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#e25424]">Goal Alignment Status</span>
                          <h4 className="text-xs font-extrabold text-zinc-900 mt-0.5 leading-tight">{linkedGoal.title}</h4>
                        </div>
                        <span className="text-[8px] font-mono font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 uppercase tracking-wider text-zinc-655 shrink-0 ml-2">
                          {linkedGoal.type}
                        </span>
                      </div>
                      
                      {(() => {
                        const krs = linkedGoal.keyResults || [];
                        const completedKrs = krs.filter(kr => kr.completed).length;
                        const progress = krs.length > 0 ? Math.round((completedKrs / krs.length) * 100) : 0;
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                              <span>Objective Progress:</span>
                              <span className="font-bold text-zinc-950">{progress}%</span>
                            </div>
                            <div className="h-1 bg-zinc-100 border border-zinc-200/50 overflow-hidden">
                              <div className="h-full bg-zinc-900 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>

                            <div className="flex justify-between text-[9px] text-zinc-450 font-mono border-t border-zinc-100 pt-1.5">
                              <span>Target complete:</span>
                              <span className="text-zinc-700 font-bold">{linkedGoal.targetDate}</span>
                            </div>

                            {krs.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-zinc-100">
                                <span className="text-[8.5px] uppercase font-bold text-zinc-450 block font-mono">Key Actions Checklist:</span>
                                <div className="space-y-1">
                                  {krs.map(kr => (
                                    <div key={kr.id} className="flex items-start gap-1.5 text-[10.5px] text-zinc-700">
                                      <span className={`w-3 h-3 border flex items-center justify-center shrink-0 mt-0.5 ${kr.completed ? 'bg-zinc-800 border-zinc-800 text-white' : 'border-zinc-300 text-transparent'}`}>
                                        ✓
                                      </span>
                                      <span className={kr.completed ? 'line-through text-zinc-400' : ''}>{kr.text}</span>
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
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onAction && !isCompleted && !isAbandoned && !isLocked && !isFuture && (
            <button 
              onClick={() => onAction(task.id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-widest bg-white text-black px-2 py-1 transition-opacity"
            >
              {actionLabel}
            </button>
          )}

          {onAbandon && task.status === 'pending' && (
            <button 
              onClick={() => onAbandon(task.id)}
              className="text-white/20 hover:text-white/60 transition-colors p-1"
              title="Abandon Task"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={() => !isLocked && !isFuture && onToggle(task.id)} 
            className={`relative ${isLocked || isFuture ? 'cursor-not-allowed' : ''}`}
            disabled={isLocked || isFuture}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div 
                  key="checked"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </motion.div>
              ) : isAbandoned ? (
                <motion.div 
                  key="abandoned"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <XCircle className="w-4 h-4 text-white/40" />
                </motion.div>
              ) : isLocked ? (
                <motion.div 
                  key="locked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Lock className="w-4 h-4 text-white/10" />
                </motion.div>
              ) : isFuture ? (
                <motion.div 
                  key="future"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Clock className="w-4 h-4 text-white/10" />
                </motion.div>
              ) : (
                <motion.div 
                  key="unchecked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Circle className="w-4 h-4 text-white/20" />
                </motion.div>
              )}
            </AnimatePresence>
            {isCompleted && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 bg-white rounded-full pointer-events-none"
              />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-white/[0.02]"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  {showSettings ? 'Task Settings' : 'Subtasks'}
                </span>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-[9px] font-mono text-white/20 hover:text-white/60 uppercase tracking-widest underline underline-offset-4"
                >
                  {showSettings ? 'View Subtasks' : 'Edit Settings'}
                </button>
              </div>

              {!showSettings ? (
                <div className="space-y-3">
                  {(task.subtasks || []).map(subtask => (
                    <div key={subtask.id} className="flex items-center justify-between group/sub">
                      <span className={`text-xs ${subtask.completed ? 'text-white/20 line-through' : 'text-white/60'}`}>
                        {subtask.title}
                      </span>
                      <button 
                        onClick={() => onToggleSubtask && onToggleSubtask(task.id, subtask.id)}
                        className="text-white/20 hover:text-white/60 transition-colors"
                      >
                        {subtask.completed ? <CheckCircle2 className="w-3 h-3 text-white/40" /> : <Circle className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                  
                  {(task.subtasks || []).length < 5 && (
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-4">
                      <input 
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add subtask..."
                        className="flex-1 bg-transparent border-b border-white/10 text-[10px] py-1 focus:outline-none focus:border-white/30 text-white/60"
                      />
                      <button type="submit" className="text-white/20 hover:text-white/60">
                        <Plus className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Prerequisite Task</label>
                    <select 
                      value={task.dependsOn || ''}
                      onChange={(e) => onSetDependency && onSetDependency(task.id, e.target.value || null)}
                      className="w-full bg-black border border-white/10 text-[10px] p-2 focus:outline-none focus:border-white/30 text-white"
                    >
                      <option value="">None</option>
                      {allTasks?.filter(t => t.id !== task.id).map(t => (
                        <option key={t.id} value={t.id}>{t.text}</option>
                      ))}
                    </select>
                  </div>

                  {onLinkGoal && goals.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Strategic Goal Alignment</label>
                      <select 
                        value={task.goalId || ''}
                        onChange={(e) => onLinkGoal(task.id, e.target.value || null)}
                        className="w-full bg-black border border-white/10 text-[10px] p-2 focus:outline-none focus:border-white/30 text-white"
                      >
                        <option value="">None (Unlinked)</option>
                        {goals.map(g => (
                          <option key={g.id} value={g.id}>🎯 {g.title} ({g.type})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Start Date</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onSetStartDate && onSetStartDate(task.id, null)}
                        className={`flex-1 py-2 border text-[9px] uppercase font-bold tracking-widest transition-all ${!task.startDate ? 'bg-white text-black border-white' : 'border-white/10 text-white/40'}`}
                      >
                        Immediate
                      </button>
                      <button 
                        onClick={() => onSetStartDate && onSetStartDate(task.id, Date.now() + 86400000)}
                        className={`flex-1 py-2 border text-[9px] uppercase font-bold tracking-widest transition-all ${task.startDate ? 'bg-white text-black border-white' : 'border-white/10 text-white/40'}`}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
