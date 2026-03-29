import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskItemProps {
  key?: string;
  task: Task;
  onToggle: (id: string) => void;
  onAbandon?: (id: string) => void;
  onAction?: (id: string) => void;
  actionLabel?: string;
}

export function TaskItem({ task, onToggle, onAbandon, onAction, actionLabel }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isAbandoned = task.status === 'abandoned';

  return (
    <motion.div 
      layout
      initial={false}
      animate={{ 
        backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.05)' : 
                        isAbandoned ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0)',
        borderColor: isCompleted ? 'rgba(255, 255, 255, 0.2)' : 
                     isAbandoned ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        opacity: isAbandoned ? 0.4 : isCompleted ? 0.6 : 1
      }}
      className="p-4 border flex items-center justify-between transition-colors group"
    >
      <span className={`text-sm transition-all duration-500 ${
        isCompleted ? 'line-through text-white/20 translate-x-2' : 
        isAbandoned ? 'line-through text-white/40' : ''
      }`}>
        {task.text}
      </span>
      
      <div className="flex items-center gap-3">
        {onAction && !isCompleted && !isAbandoned && (
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

        <button onClick={() => onToggle(task.id)} className="relative">
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
    </motion.div>
  );
}
