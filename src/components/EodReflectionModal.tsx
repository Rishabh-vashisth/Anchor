import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  RefreshCw, 
  Smile,
  X
} from 'lucide-react';

interface EodReflectionModalProps {
  isOpen: boolean;
  onSave: (
    whatWorked: string,
    whatBlocked: string,
    whatSurprised: string,
    whatToDoDifferently: string,
    moodEnergy: number
  ) => void;
  onSkip: () => void;
}

export const EodReflectionModal: React.FC<EodReflectionModalProps> = ({
  isOpen,
  onSave,
  onSkip
}) => {
  const [whatWorked, setWhatWorked] = useState('');
  const [whatBlocked, setWhatBlocked] = useState('');
  const [whatSurprised, setWhatSurprised] = useState('');
  const [whatToDoDifferently, setWhatToDoDifferently] = useState('');
  const [moodEnergy, setMoodEnergy] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(whatWorked, whatBlocked, whatSurprised, whatToDoDifferently, moodEnergy);
    // Reset state values
    setWhatWorked('');
    setWhatBlocked('');
    setWhatSurprised('');
    setWhatToDoDifferently('');
    setMoodEnergy(5);
  };

  if (!isOpen) return null;

  return (
    <div id="eod-reflection-modal-container" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-default" />

      <motion.div
        id="eod-reflection-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-[#090a0c] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-orange-500 font-bold block uppercase">
              End of Day Audit
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Reflect on today?
            </h2>
            <p className="text-xs text-zinc-500">
              Spend a minute logging your cognitive state to decompress and optimize tomorrow's focus.
            </p>
          </div>
          <button 
            onClick={onSkip}
            className="p-1 border border-white/5 hover:border-white/20 text-zinc-500 hover:text-white transition-all cursor-pointer"
            title="Skip reflection for today"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Question 1 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              1. What worked today?
            </label>
            <textarea
              required
              rows={2}
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Successes, completed milestones, tactics that yielded results..."
              className="w-full bg-black border border-white/5 p-3 text-xs sm:text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 focus:bg-white/[0.01] transition-all resize-none font-sans"
            />
          </div>

          {/* Question 2 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-405" />
              2. What blocked you?
            </label>
            <textarea
              required
              rows={2}
              value={whatBlocked}
              onChange={(e) => setWhatBlocked(e.target.value)}
              placeholder="Technical obstacles, distractions, attention leakage..."
              className="w-full bg-black border border-white/5 p-3 text-xs sm:text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 focus:bg-white/[0.01] transition-all resize-none font-sans"
            />
          </div>

          {/* Question 3 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              3. What surprised you?
            </label>
            <textarea
              required
              rows={2}
              value={whatSurprised}
              onChange={(e) => setWhatSurprised(e.target.value)}
              placeholder="Patterns, discovered micro lessons, unexpected developments..."
              className="w-full bg-black border border-white/5 p-3 text-xs sm:text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 focus:bg-white/[0.01] transition-all resize-none font-sans"
            />
          </div>

          {/* Question 4 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
              4. What to do differently?
            </label>
            <textarea
              required
              rows={2}
              value={whatToDoDifferently}
              onChange={(e) => setWhatToDoDifferently(e.target.value)}
              placeholder="Micro adjustments, plan revisions, timing/scheduling strategies for tomorrow..."
              className="w-full bg-black border border-white/5 p-3 text-xs sm:text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 focus:bg-white/[0.01] transition-all resize-none font-sans"
            />
          </div>

          {/* Question 5 */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                5. Vitality & Focus Alignment
              </label>
              <span className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 border border-white/10">
                SCORE: {moodEnergy}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={moodEnergy}
              onChange={(e) => setMoodEnergy(Number(e.target.value))}
              className="w-full accent-orange-500 bg-zinc-900 cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-550">
              <span>Low Energy</span>
              <span>Synchronized Flow</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3 font-mono">
            <button
              id="eod-skip-btn"
              type="button"
              onClick={onSkip}
              className="px-4 py-2 text-[10px] sm:text-xs tracking-wider uppercase font-bold text-zinc-400 hover:text-white border border-transparent hover:border-white/5 bg-transparent transition-all cursor-pointer"
            >
              Skip
            </button>
            <button
              id="eod-save-btn"
              type="submit"
              className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-[10px] sm:text-xs tracking-widest uppercase font-black transition-all cursor-pointer"
            >
              Save Reflection
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
