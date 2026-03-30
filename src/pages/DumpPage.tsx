import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Brain, Trash2 } from 'lucide-react';
import { Task, Category } from '../types';

interface DumpPageProps {
  key?: string;
  tasks: Task[];
  onAdd: (text: string) => void;
  onCategorize: (id: string, cat: Category) => void;
  onDelete: (id: string) => void;
}

export function DumpPage({ tasks = [], onAdd, onCategorize, onDelete }: DumpPageProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
      // Explicitly refocus to keep keyboard open on mobile
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <section className="sticky top-0 bg-[#050505] z-10 py-4">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 block">Brain Dump</label>
        <form onSubmit={handleSubmit} className="relative">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="What is in your head?" 
            className="input-field pr-12 text-xl"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white text-black">
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        <p className="mt-4 text-[10px] text-white/30 italic">Dump everything. Filter later.</p>
      </section>

      <section className="space-y-4">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Unfiltered Thoughts ({tasks.length})</label>
        <div className="space-y-4">
          {tasks.map(task => (
            <motion.div 
              layout
              key={task.id} 
              className="p-6 border border-white/10 space-y-4 bg-white/[0.01]"
            >
              <p className="text-lg font-medium leading-tight">{task.text}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => onCategorize(task.id, 'KEEP')}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all"
                >
                  Keep
                </button>
                <button 
                  onClick={() => onCategorize(task.id, 'DELAY')}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all"
                >
                  Delay
                </button>
                <button 
                  onClick={() => onDelete(task.id)}
                  className="p-3 border border-white/20 hover:border-red-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="py-20 text-center text-white/20">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-5" />
              <p className="text-sm font-mono uppercase tracking-widest">Mind Empty</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
