import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Task, Reflection, DailyTodo } from '../types';
import { FocusCard } from '../components/FocusCard';
import { TaskItem } from '../components/TaskItem';
import { Calendar } from '../components/Calendar';
import { DailyTodoList } from '../components/DailyTodoList';
import { Lightbulb, Bookmark, AlertTriangle } from 'lucide-react';

interface FocusPageProps {
  key?: string;
  primaryTask?: Task;
  tasks: Task[];
  allTasks: Task[];
  reflections: Reflection[];
  dailyTodos: DailyTodo[];
  streak: number;
  isContinuingTask: boolean;
  onSetPrimary: (id: string) => void;
  onToggle: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onSetDependency: (taskId: string, dependsOnId: string | null) => void;
  onSetStartDate: (taskId: string, startDate: number | null) => void;
  onAddDailyTodo: (text: string) => void;
  onToggleDailyTodo: (id: string) => void;
  onDeleteDailyTodo: (id: string) => void;
}

export function FocusPage({ 
  primaryTask, 
  tasks = [], 
  allTasks = [], 
  reflections = [],
  dailyTodos = [],
  streak = 0,
  isContinuingTask = false,
  onSetPrimary, 
  onToggle,
  onAddSubtask,
  onToggleSubtask,
  onSetDependency,
  onSetStartDate,
  onAddDailyTodo,
  onToggleDailyTodo,
  onDeleteDailyTodo
}: FocusPageProps) {
  const randomReflection = useMemo(() => {
    if (reflections.length === 0) return null;
    // Use a simple hash of the date to keep the same reflection for the day if possible, 
    // or just random for now as requested.
    return reflections[Math.floor(Math.random() * reflections.length)];
  }, [reflections]);

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Insight': return <Lightbulb className="w-3 h-3 text-blue-400" />;
      case 'Reminder': return <Bookmark className="w-3 h-3 text-green-400" />;
      case 'Mistake': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };
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
      <section className="flex justify-between items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Anchor</label>
          {isContinuingTask && (
            <p className="text-[10px] text-zinc-500 font-medium italic">Continuing yesterday's task</p>
          )}
        </div>
        {streak > 0 && (
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-zinc-500" />
            Honesty Streak: {streak}d
          </div>
        )}
      </section>

      {randomReflection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/[0.02] border border-white/5 flex items-start gap-3"
        >
          <div className="mt-0.5">{getTagIcon(randomReflection.tag)}</div>
          <p className="text-xs text-white/60 leading-relaxed italic">"{randomReflection.text}"</p>
        </motion.div>
      )}

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

      <DailyTodoList 
        todos={dailyTodos}
        onAdd={onAddDailyTodo}
        onToggle={onToggleDailyTodo}
        onDelete={onDeleteDailyTodo}
      />

      {activeTasks.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Active Tasks</label>
            {activeTasks.length > 3 && (
              <span className="text-[10px] font-mono text-white/20 uppercase">+{activeTasks.length - 3} hidden</span>
            )}
          </div>
          <div className="space-y-2">
            {activeTasks.slice(0, 3).map(task => (
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
          <div className="p-8 border border-white/5 text-center space-y-4">
            {randomReflection ? (
              <div className="space-y-2">
                <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Reflection</p>
                <p className="text-sm text-white/40 italic leading-relaxed">"{randomReflection.text}"</p>
              </div>
            ) : (
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Clear Horizon</p>
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
}
