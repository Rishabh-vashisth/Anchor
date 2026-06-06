import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Sparkles, 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Task, Idea, Reflection, ReflectionTag } from '../types';

interface CapturePageProps {
  key?: string;
  tasks: Task[];
  ideas: Idea[];
  reflections: Reflection[];
  onAddTask: (text: string) => void;
  onAddIdea: (text: string) => void;
}

export function CapturePage({
  tasks = [],
  ideas = [],
  reflections = [],
  onAddTask,
  onAddIdea
}: CapturePageProps) {
  const [activeMode, setActiveMode] = useState<'TASK' | 'IDEA'>('TASK');
  const [inputText, setInputText] = useState('');
  const [justCaptured, setJustCaptured] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeMode === 'TASK') {
      onAddTask(inputText.trim());
    } else if (activeMode === 'IDEA') {
      onAddIdea(inputText.trim());
    }

    setInputText('');
    setJustCaptured(true);
    setTimeout(() => setJustCaptured(false), 2000);
  };

  // Combine and sort recent updates for timeline retrieval
  const recentlyCapturedTimeline = useMemo(() => {
    const mappedTasks = tasks.map(t => ({
      id: t.id,
      text: t.text,
      type: 'Task',
      timestamp: t.createdAt,
      badge: 'Workload'
    }));

    const mappedIdeas = ideas.map(i => ({
      id: i.id,
      text: i.text,
      type: 'Idea',
      timestamp: i.createdAt,
      badge: i.status === 'parked' ? 'Aged Spark' : 'Processed'
    }));

    const mappedReflections = reflections.map(r => ({
      id: r.id,
      text: r.text,
      type: 'Note',
      timestamp: r.createdAt,
      badge: r.tag
    }));

    const combined = [...mappedTasks, ...mappedIdeas, ...mappedReflections];
    return combined.sort((a,b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [tasks, ideas, reflections]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-12 py-8"
    >
      
      {/* Title */}
      <div className="space-y-1 text-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold block">
          Latency Zero Capture
        </span>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
          Signal Stream
        </h2>
        <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto leading-relaxed">
          Shed mental loads instantly. Fast cache buffer locks references immediately. Anchor is watching the files for you.
        </p>
      </div>

      {/* Mode selectors */}
      <div className="flex justify-center gap-1.5 p-1 border border-white/5 bg-zinc-950 max-w-md mx-auto">
        {(['TASK', 'IDEA'] as const).map(mode => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                setActiveMode(mode);
                setInputText('');
              }}
              className={`flex-1 py-2 text-[10px] font-mono uppercase font-black tracking-widest text-center transition-all cursor-pointer ${
                isActive ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Primary Capture Box */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative border-b-2 border-white/10 hover:border-white focus-within:border-white transition-all pb-2">
            <input
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeMode === 'TASK' ? 'I need to code indexing queries...' :
                'A cognitive notes pipeline concept...'
              }
              className="w-full bg-transparent text-xl md:text-2xl font-mono text-white placeholder:text-zinc-800 text-center focus:outline-none py-4"
            />
            
            {/* Soft inline validation signals */}
            <AnimatePresence>
              {justCaptured && (
                <motion.div 
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-[9px] font-mono text-emerald-400 font-bold capitalize flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Signal Locked to Buffer
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-8 py-3 bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-black text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all hover:bg-zinc-200"
            >
              PULL TO MEMORY
            </button>
          </div>
        </form>
      </div>

      {/* Recently Captured Stream */}
      <div className="space-y-4 pt-12 border-t border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold block text-left">
          Buffer Timeline Feed (Recently Collected)
        </span>
        
        <div className="space-y-2">
          {recentlyCapturedTimeline.map(item => (
            <div 
              key={item.id} 
              className="p-3.5 bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between text-left font-mono"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[8.5px] px-1.5 py-0.5 border font-bold uppercase shrink-0 ${
                  item.type === 'Task' ? 'border-orange-500/20 bg-orange-950/15 text-orange-400' :
                  item.type === 'Idea' ? 'border-blue-500/20 bg-blue-950/15 text-blue-400' :
                  'border-emerald-500/20 bg-emerald-950/15 text-emerald-400'
                }`}>
                  {item.badge}
                </span>

                <p className="text-xs text-zinc-300 truncate font-sans">
                  {item.text}
                </p>
              </div>

              <span className="text-[9px] text-zinc-650 shrink-0 ml-4 font-mono font-bold">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {recentlyCapturedTimeline.length === 0 && (
            <div className="text-center py-6 border border-zinc-900 border-dashed">
              <p className="text-[10px] text-zinc-600 font-mono text-center">No cached signals detected in workspace arrays.</p>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
}
