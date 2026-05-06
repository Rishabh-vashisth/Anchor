import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Task, Reflection, DailyTodo } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Lightbulb, Bookmark, AlertTriangle, Calendar as CalendarIcon, Check } from 'lucide-react';

interface StatsPageProps {
  key?: string;
  tasks: Task[];
  reflections: Reflection[];
  dailyTodos: { [date: string]: DailyTodo[] };
  onToggleDailyTodo: (date: string, id: string) => void;
  onDeleteDailyTodo: (date: string, id: string) => void;
}

export function StatsPage({ 
  tasks = [], 
  reflections = [], 
  dailyTodos = {},
  onToggleDailyTodo,
  onDeleteDailyTodo
}: StatsPageProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completed = completedTasks.length;
  const pending = tasks.filter(t => t.status === 'pending' && t.category === 'KEEP').length;
  
  const sortedDates = Object.keys(dailyTodos).sort((a, b) => b.localeCompare(a));
  
  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Insight': return <Lightbulb className="w-3 h-3 text-blue-400" />;
      case 'Reminder': return <Bookmark className="w-3 h-3 text-green-400" />;
      case 'Mistake': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };
  
  const weeklyVerdict = () => {
    if (completed === 0) return "Zero execution. Start now.";
    if (completed < 3) return "Barely moving. Focus harder.";
    return "Steady progress. Don't get complacent.";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      <section className="text-center py-8">
        <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Reality Check</h2>
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">The numbers don't lie.</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Executed" value={completed} color="text-white" />
        <StatCard label="Drifting" value={pending} color="text-white/40" />
      </div>

      <section className="p-8 border border-white/10 space-y-6 bg-white/[0.01]">
        <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-white/10 pb-4">Inconsistency Patterns</h3>
        <div className="space-y-6">
          {completed > pending ? (
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-white/80 leading-relaxed">You are executing more than you are planning. Keep this momentum.</p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <p className="text-sm text-white/80 leading-relaxed">You are over-planning and under-executing. Reduce your list.</p>
            </div>
          )}
          
          {tasks.filter(t => t.category === 'DELAY').length > 5 && (
            <div className="flex gap-4 items-start">
              <Clock className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-white/80 leading-relaxed">Your 'Delay' list is becoming a graveyard. Delete items you won't actually do.</p>
            </div>
          )}
        </div>
      </section>

      <div className="p-8 bg-white text-black text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Weekly Verdict</p>
        <p className="text-xl font-black tracking-tight uppercase">
          {weeklyVerdict()}
        </p>
      </div>

      {sortedDates.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Past Days</h3>
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <CalendarIcon className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-4 border-l border-white/5">
                  {(dailyTodos[date] || []).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 group">
                      <div className={`w-3 h-3 border flex items-center justify-center ${todo.completed ? 'bg-white border-white' : 'border-white/20'}`}>
                        {todo.completed && <Check className="w-2 h-2 text-black" />}
                      </div>
                      <span className={`text-xs ${todo.completed ? 'text-white/20 line-through' : 'text-white/60'}`}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                  {(dailyTodos[date] || []).length === 0 && (
                    <span className="text-[10px] font-mono text-white/10 uppercase italic">Empty</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {reflections.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Personal Reflections</h3>
          <div className="space-y-3">
            {reflections.map(reflection => (
              <div 
                key={reflection.id}
                className="p-4 border border-white/5 bg-white/[0.01] space-y-2"
              >
                <div className="flex items-center gap-2">
                  {getTagIcon(reflection.tag)}
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{reflection.tag}</span>
                  <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest ml-auto">
                    {new Date(reflection.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic">"{reflection.text}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedTasks.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] block">Completed Tasks</h3>
          <div className="space-y-2">
            {completedTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).map(task => (
              <div 
                key={task.id}
                className="p-4 border border-white/5 bg-white/[0.02] flex justify-between items-center group"
              >
                <div className="space-y-1">
                  <p className="text-sm text-white/60 line-through decoration-white/20">{task.text}</p>
                  {task.completedAt && (
                    <p className="text-[10px] font-mono text-white/20 uppercase">
                      Executed {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
