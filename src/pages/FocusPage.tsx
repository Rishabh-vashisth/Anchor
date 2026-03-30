import React from 'react';
import { motion } from 'motion/react';
import { Task } from '../types';
import { FocusCard } from '../components/FocusCard';
import { TaskItem } from '../components/TaskItem';
import { Calendar } from '../components/Calendar';

interface FocusPageProps {
  key?: string;
  primaryTask?: Task;
  tasks: Task[];
  allTasks: Task[];
  onSetPrimary: (id: string) => void;
  onToggle: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSetDependency: (taskId: string, dependsOnId: string | null) => void;
  onSetStartDate: (taskId: string, startDate: number | null) => void;
}

export function FocusPage({ 
  primaryTask, 
  tasks = [], 
  allTasks = [], 
  onSetPrimary, 
  onToggle,
  onAddSubtask,
  onToggleSubtask,
  onSetDependency,
  onSetStartDate
}: FocusPageProps) {
  const activeTasks = tasks.filter(t => {
    const isPrimary = t.id === primaryTask?.id;
    const isLocked = t.dependsOn && allTasks.find(at => at.id === t.dependsOn)?.status !== 'completed';
    const isFuture = t.startDate && t.startDate > Date.now();
    return !isPrimary && !isLocked && !isFuture;
  });

  const lockedTasks = tasks.filter(t => {
    const isPrimary = t.id === primaryTask?.id;
    const isLocked = t.dependsOn && allTasks.find(at => at.id === t.dependsOn)?.status !== 'completed';
    return !isPrimary && isLocked;
  });

  const futureTasks = tasks.filter(t => {
    const isPrimary = t.id === primaryTask?.id;
    const isFuture = t.startDate && t.startDate > Date.now();
    return !isPrimary && isFuture;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <section>
        {primaryTask ? (
          <FocusCard 
            task={primaryTask} 
            onToggle={onToggle} 
            onToggleSubtask={onToggleSubtask}
            dependency={allTasks.find(at => at.id === primaryTask.dependsOn)}
          />
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
        <Calendar tasks={allTasks} />
      </section>

      {activeTasks.length > 0 && (
        <section>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-4 block">Active Tasks</label>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={onToggle} 
                onAction={onSetPrimary}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onSetDependency={onSetDependency}
                onSetStartDate={onSetStartDate}
                actionLabel="Lock"
                dependency={allTasks.find(at => at.id === task.dependsOn)}
                allTasks={allTasks}
              />
            ))}
          </div>
        </section>
      )}

      {lockedTasks.length > 0 && (
        <section>
          <label className="text-[10px] font-mono text-red-400/40 uppercase tracking-[0.2em] mb-4 block">Locked (Dependencies)</label>
          <div className="space-y-2">
            {lockedTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={onToggle} 
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onSetDependency={onSetDependency}
                onSetStartDate={onSetStartDate}
                dependency={allTasks.find(at => at.id === task.dependsOn)}
                allTasks={allTasks}
              />
            ))}
          </div>
        </section>
      )}

      {futureTasks.length > 0 && (
        <section>
          <label className="text-[10px] font-mono text-blue-400/40 uppercase tracking-[0.2em] mb-4 block">Future Tasks</label>
          <div className="space-y-2">
            {futureTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={onToggle} 
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onSetDependency={onSetDependency}
                onSetStartDate={onSetStartDate}
                allTasks={allTasks}
              />
            ))}
          </div>
        </section>
      )}

      {activeTasks.length === 0 && lockedTasks.length === 0 && futureTasks.length === 0 && (
        <section>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-4 block">Tasks</label>
          <div className="p-8 border border-white/5 text-center">
            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Clear Horizon</p>
          </div>
        </section>
      )}
    </motion.div>
  );
}
