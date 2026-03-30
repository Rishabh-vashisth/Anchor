import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, XCircle, Lock, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Task } from '../types';

interface TaskItemProps {
  key?: string;
  task: Task;
  onToggle: (id: string) => void;
  onAbandon?: (id: string) => void;
  onAction?: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onSetDependency?: (taskId: string, dependsOnId: string | null) => void;
  onSetStartDate?: (taskId: string, startDate: number | null) => void;
  actionLabel?: string;
  dependency?: Task | null;
  allTasks?: Task[];
}

export function TaskItem({ 
  task, 
  onToggle, 
  onAbandon, 
  onAction, 
  onAddSubtask,
  onToggleSubtask,
  onSetDependency,
  onSetStartDate,
  actionLabel,
  dependency,
  allTasks
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
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
                      className="w-full bg-black border border-white/10 text-[10px] p-2 focus:outline-none focus:border-white/30"
                    >
                      <option value="">None</option>
                      {allTasks?.filter(t => t.id !== task.id).map(t => (
                        <option key={t.id} value={t.id}>{t.text}</option>
                      ))}
                    </select>
                  </div>

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
