import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { Task } from '../types';

interface FocusCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

export function FocusCard({ task, onToggle, onToggleSubtask, dependency }: FocusCardProps & { dependency?: Task | null }) {
  const isAbandoned = task.status === 'abandoned';
  const isCompleted = task.status === 'completed';
  const isLocked = dependency && dependency.status !== 'completed' && !isCompleted;
  const isFuture = task.startDate && task.startDate > Date.now() && !isCompleted;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-[1px] flex-1 bg-white/10" />
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Today's Focus</span>
        <div className="h-[1px] flex-1 bg-white/10" />
      </div>

      <motion.div 
        layoutId="primary-focus-card"
        className={`p-10 border-2 relative overflow-hidden group transition-all duration-500 text-center ${
          isAbandoned ? 'border-white/10 bg-white/2 opacity-40' : 
          isCompleted ? 'border-white/20 bg-white/[0.03]' : 'border-white bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Target className="w-32 h-32 -mr-12 -mt-12" />
        </div>
        
        <h2 className={`text-4xl font-black leading-tight mb-8 tracking-tighter ${isAbandoned || isCompleted ? 'line-through text-white/40' : 'text-white'}`}>
          {task.text}
        </h2>

        {(isLocked || isFuture) && (
          <div className="mb-8 p-4 border border-white/10 bg-white/[0.02] inline-block">
            {isLocked ? (
              <div className="flex items-center gap-2 text-red-400/60 font-mono text-[10px] uppercase tracking-widest">
                <Target className="w-3 h-3" /> Prerequisite: {dependency?.text}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-400/60 font-mono text-[10px] uppercase tracking-widest">
                <Clock className="w-3 h-3" /> Not Active Yet (Starts {new Date(task.startDate!).toLocaleDateString()})
              </div>
            )}
          </div>
        )}

        {totalSubtasks > 0 && !isCompleted && !isAbandoned && !isLocked && !isFuture && (
          <div className="mb-8 space-y-3 max-w-xs mx-auto">
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
              <span>Execution Progress</span>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="h-1 bg-white/5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                className="h-full bg-white"
              />
            </div>
            <div className="space-y-2 pt-2">
              {subtasks.map(subtask => (
                <button 
                  key={subtask.id}
                  onClick={() => onToggleSubtask && onToggleSubtask(task.id, subtask.id)}
                  className="flex items-center gap-2 w-full text-left group/sub"
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-white/60" />
                  ) : (
                    <Circle className="w-3 h-3 text-white/20 group-hover/sub:text-white/40" />
                  )}
                  <span className={`text-[11px] ${subtask.completed ? 'text-white/20 line-through' : 'text-white/60'}`}>
                    {subtask.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button 
            onClick={() => !isLocked && !isFuture && onToggle(task.id)}
            disabled={isLocked || isFuture}
            className={`flex items-center gap-3 py-4 px-8 border-2 transition-all uppercase font-black tracking-widest text-xs ${
              isCompleted ? 'bg-white text-black border-white' : 
              isAbandoned ? 'border-white/20 text-white/40' : 
              isLocked || isFuture ? 'border-white/10 text-white/10 cursor-not-allowed' :
              'border-white text-white hover:bg-white hover:text-black'
            }`}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Finished
                </motion.div>
              ) : isAbandoned ? (
                <motion.div key="abandoned" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Abandoned
                </motion.div>
              ) : (
                <motion.div key="todo" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Circle className="w-5 h-5" /> Mark Complete
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
      
      {!isCompleted && !isAbandoned && (
        <p className="text-center text-white/40 text-[11px] font-mono uppercase tracking-widest animate-pulse-subtle">
          Stay anchored. Ignore the noise.
        </p>
      )}
    </div>
  );
}
