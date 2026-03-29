import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, X, Trash2, ArrowRight, AlertCircle, History, Lightbulb } from 'lucide-react';
import { Idea, IdeaStatus } from '../types';

interface IdeaParkingLotProps {
  key?: string;
  ideas: Idea[];
  onProcess: (id: string, action: 'EXECUTE' | 'DELAY' | 'DELETE') => void;
  canConvert: boolean;
}

export function IdeaParkingLot({ ideas, onProcess, canConvert }: IdeaParkingLotProps) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [realityCheckStep, setRealityCheckStep] = useState(1);

  const now = Date.now();
  const DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

  const parkedIdeas = ideas.filter(i => i.status === 'parked');
  const readyToReview = parkedIdeas.filter(i => now - i.createdAt >= DELAY_MS);
  const stillWaiting = parkedIdeas.filter(i => now - i.createdAt < DELAY_MS);
  const historyIdeas = ideas.filter(i => i.status !== 'parked');

  const handleExecuteClick = (idea: Idea) => {
    if (!canConvert) {
      alert("Daily limit reached. Only 1 new idea can become a task per day.");
      return;
    }
    setSelectedIdea(idea);
    setRealityCheckStep(1);
    setShowRealityCheck(true);
  };

  const confirmExecution = () => {
    if (selectedIdea) {
      onProcess(selectedIdea.id, 'EXECUTE');
      setShowRealityCheck(false);
      setSelectedIdea(null);
    }
  };

  const formatTimeRemaining = (createdAt: number) => {
    const remaining = DELAY_MS - (now - createdAt);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Review Section */}
      {readyToReview.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold uppercase tracking-tighter">Review Parked Ideas</h2>
          </div>
          <div className="grid gap-4">
            {readyToReview.map(idea => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-black p-6 shadow-xl"
              >
                <p className="text-xl font-medium mb-6 leading-tight">{idea.text}</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExecuteClick(idea)}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Execute
                    </button>
                    <button
                      onClick={() => onProcess(idea.id, 'DELAY')}
                      className="flex items-center gap-2 border border-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors"
                    >
                      <Clock className="w-3 h-3" /> Delay
                    </button>
                  </div>
                  <button
                    onClick={() => onProcess(idea.id, 'DELETE')}
                    className="p-2 text-black/40 hover:text-black transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Waiting Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold uppercase tracking-tighter text-white/40">Parked (Cooling Down)</h2>
          </div>
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{stillWaiting.length} Active</span>
        </div>
        <div className="grid gap-3">
          {stillWaiting.length === 0 ? (
            <div className="p-12 border border-dashed border-white/10 text-center">
              <p className="text-white/20 text-xs uppercase tracking-widest">No ideas currently cooling down.</p>
            </div>
          ) : (
            stillWaiting.map(idea => (
              <div key={idea.id} className="bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between group">
                <p className="text-white/60 text-sm">{idea.text}</p>
                <div className="flex items-center gap-2 text-white/20 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeRemaining(idea.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* History Section */}
      {historyIdeas.length > 0 && (
        <section className="space-y-6 opacity-40">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" />
            <h2 className="text-xl font-bold uppercase tracking-tighter">Idea History</h2>
          </div>
          <div className="grid gap-2">
            {historyIdeas.map(idea => (
              <div key={idea.id} className="flex items-center justify-between p-3 border border-white/5 text-[10px] uppercase tracking-widest font-bold">
                <span className={idea.status === 'executed' ? 'text-white' : 'text-white/40'}>{idea.text}</span>
                <span className="text-white/20">{idea.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reality Check Modal */}
      <AnimatePresence>
        {showRealityCheck && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white text-black p-10 shadow-2xl space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Reality Check</span>
                <h3 className="text-2xl font-bold leading-tight">
                  {realityCheckStep === 1 
                    ? "Do you still want to do this, or was this a moment of excitement?" 
                    : "Will you actually work on this today?"}
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (realityCheckStep === 1) setRealityCheckStep(2);
                    else confirmExecution();
                  }}
                  className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2"
                >
                  {realityCheckStep === 1 ? "I still want this" : "Yes, I will work on it"} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowRealityCheck(false)}
                  className="w-full border border-black/10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all"
                >
                  Actually, nevermind
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
