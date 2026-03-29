import React from 'react';
import { motion } from 'motion/react';
import { Task } from '../types';
import { FocusCard } from '../components/FocusCard';
import { TaskItem } from '../components/TaskItem';

interface FocusPageProps {
  key?: string;
  primaryTask?: Task;
  tasks: Task[];
  onSetPrimary: (id: string) => void;
  onToggle: (id: string) => void;
}

export function FocusPage({ primaryTask, tasks, onSetPrimary, onToggle }: FocusPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <section>
        {primaryTask ? (
          <FocusCard task={primaryTask} onToggle={onToggle} />
        ) : (
          <div className="p-12 border border-dashed border-white/10 text-center space-y-6 bg-white/[0.01]">
            <div className="w-16 h-16 border-2 border-white/10 rounded-full flex items-center justify-center mx-auto">
              <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">No Anchor Set</p>
              <p className="text-sm text-white/60">Select a task below to define your day.</p>
            </div>
          </div>
        )}
      </section>

      <section>
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-4 block">Secondary Tasks</label>
        <div className="space-y-2">
          {tasks.filter(t => t.id !== primaryTask?.id).map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={onToggle} 
              onAction={onSetPrimary}
              actionLabel="Lock"
            />
          ))}
          {tasks.filter(t => t.id !== primaryTask?.id).length === 0 && (
            <div className="p-8 border border-white/5 text-center">
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Clear Horizon</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
