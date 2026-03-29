import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ArrowRight, Lightbulb } from 'lucide-react';

interface IdeaCaptureProps {
  onCapture: (text: string) => void;
}

export function IdeaCapture({ onCapture }: IdeaCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onCapture(text.trim());
      setText('');
      setIsOpen(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center z-50 border-2 border-white"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-[#151619] border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Instant Idea Capture</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Capture the chaos..."
                    className="w-full bg-transparent border-b-2 border-white/10 p-4 text-xl font-medium focus:outline-none focus:border-white transition-all placeholder:text-white/10"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-all ${text.trim() ? 'text-white' : 'text-white/10'}`}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-4 bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-relaxed">
                    This idea will be parked for 24 hours. No immediate execution allowed.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
