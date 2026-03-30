import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Task } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface StatsPageProps {
  key?: string;
  tasks: Task[];
}

export function StatsPage({ tasks = [] }: StatsPageProps) {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending' && t.category === 'KEEP').length;
  
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
    </motion.div>
  );
}
