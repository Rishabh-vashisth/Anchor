import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { Task, TimeBlockType } from '../types';
import { TaskItem } from '../components/TaskItem';

interface BlocksPageProps {
  key?: string;
  tasks: Task[];
  onAssign: (id: string, block: TimeBlockType) => void;
  onToggle: (id: string) => void;
  onAbandon: (id: string) => void;
}

export function BlocksPage({ tasks, onAssign, onToggle, onAbandon }: BlocksPageProps) {
  const [activeTimer, setActiveTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    let interval: any;
    if (activeTimer && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setActiveTimer(false);
    }
    return () => clearInterval(interval);
  }, [activeTimer, timeLeft]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const blocks: { type: TimeBlockType, label: string, desc: string }[] = [
    { type: 'DEEP', label: 'Deep Work', desc: 'No distractions. High intensity.' },
    { type: 'LIGHT', label: 'Light Work', desc: 'Admin, emails, quick tasks.' },
    { type: 'FREE', label: 'Free Time', desc: 'Rest. Recovery. No guilt.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-10"
    >
      {/* Timer Section */}
      <section className="bg-white/5 p-8 border border-white/10 text-center relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Deep Work Timer</label>
          {activeTimer && (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>
        
        <div className={`text-6xl font-black tracking-tighter mb-8 font-mono transition-all duration-500 ${activeTimer ? 'scale-105 text-white' : 'text-white/60'}`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center items-center gap-6">
          <button 
            onClick={() => { setActiveTimer(false); setTimeLeft(25 * 60); }}
            className="group flex flex-col items-center gap-2"
            title="Reset"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full group-hover:border-white/40 transition-all">
              <RotateCcw className="w-4 h-4 text-white/40 group-hover:text-white" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-widest text-white/20 group-hover:text-white/40">Reset</span>
          </button>

          {!activeTimer ? (
            <button 
              onClick={() => setActiveTimer(true)}
              className="group flex flex-col items-center gap-2"
              title="Start"
            >
              <div className="w-16 h-16 flex items-center justify-center border-2 border-white rounded-full bg-white text-black hover:bg-transparent hover:text-white transition-all">
                <Play className="w-6 h-6 fill-current ml-1" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Start</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTimer(false)}
              className="group flex flex-col items-center gap-2"
              title="Pause"
            >
              <div className="w-16 h-16 flex items-center justify-center border-2 border-white rounded-full hover:bg-white hover:text-black transition-all">
                <Pause className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Pause</span>
            </button>
          )}

          <div className="w-10 h-10" />
        </div>
      </section>

      {/* Blocks Section */}
      <div className="space-y-8">
        {blocks.map(block => (
          <section key={block.type}>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">{block.label}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{block.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.block === block.type).map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={onToggle} 
                  onAbandon={onAbandon} 
                />
              ))}
              
              <div className="relative group">
                <select 
                  className="w-full p-3 bg-transparent border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer hover:border-white/30 transition-all"
                  onChange={(e) => {
                    if (e.target.value) onAssign(e.target.value, block.type);
                    e.target.value = "";
                  }}
                  value=""
                >
                  <option value="" className="bg-black">Assign Task...</option>
                  {tasks.filter(t => !t.block).map(t => (
                    <option key={t.id} value={t.id} className="bg-black">{t.text}</option>
                  ))}
                </select>
                <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-40" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
