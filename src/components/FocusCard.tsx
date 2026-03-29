import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Task } from '../types';

interface FocusCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function FocusCard({ task, onToggle }: FocusCardProps) {
  const isAbandoned = task.status === 'abandoned';
  const isCompleted = task.status === 'completed';

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

        <div className="flex justify-center">
          <button 
            onClick={() => onToggle(task.id)}
            className={`flex items-center gap-3 py-4 px-8 border-2 transition-all uppercase font-black tracking-widest text-xs ${
              isCompleted ? 'bg-white text-black border-white' : 
              isAbandoned ? 'border-white/20 text-white/40' : 'border-white text-white hover:bg-white hover:text-black'
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
