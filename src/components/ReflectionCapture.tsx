import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Bookmark, AlertTriangle, Plus, X } from 'lucide-react';
import { ReflectionTag } from '../types';

interface ReflectionCaptureProps {
  onCapture: (text: string, tag: ReflectionTag) => void;
}

export function ReflectionCapture({ onCapture }: ReflectionCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [tag, setTag] = useState<ReflectionTag>('Insight');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onCapture(text.trim().slice(0, 150), tag);
      setText('');
      setIsOpen(false);
    }
  };

  const tags: { id: ReflectionTag; icon: React.ReactNode; color: string }[] = [
    { id: 'Insight', icon: <Lightbulb className="w-3 h-3" />, color: 'text-blue-400' },
    { id: 'Reminder', icon: <Bookmark className="w-3 h-3" />, color: 'text-green-400' },
    { id: 'Mistake', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400' },
  ];

  return (
    <div className="fixed bottom-44 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-72 bg-[#151619] border border-white/10 p-4 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">New Reflection</span>
                <button type="button" onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you learn?"
                className="w-full bg-transparent border-b border-white/10 text-sm py-2 focus:outline-none focus:border-white/30 resize-none h-20"
                maxLength={150}
              />

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTag(t.id)}
                      className={`p-2 border transition-all ${
                        tag === t.id ? 'border-white/40 bg-white/5' : 'border-white/5 text-white/20'
                      } ${tag === t.id ? t.color : ''}`}
                      title={t.id}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="bg-white text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${
          isOpen ? 'bg-white text-black rotate-45' : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
