import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { EodReason } from '../types';

interface EodCheckModalProps {
  isOpen: boolean;
  taskText: string;
  onComplete: (reason?: EodReason) => void;
}

export const EodCheckModal: React.FC<EodCheckModalProps> = ({ isOpen, taskText, onComplete }) => {
  const [step, setStep] = useState<'INITIAL' | 'REASON'>('INITIAL');

  const reasons: { id: EodReason; label: string }[] = [
    { id: 'TOO_BIG', label: 'Task was too big' },
    { id: 'DISTRACTED', label: 'Got distracted' },
    { id: 'DIDNT_START', label: "Didn't start" },
    { id: 'LOST_INTEREST', label: 'Lost interest' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === 'INITIAL' ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-zinc-400" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-white">End of Day Check</h2>
                <p className="text-zinc-400 text-sm">
                  Did you complete your primary task yesterday?
                </p>
                <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <p className="text-zinc-200 italic">"{taskText}"</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onComplete()}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Yes
                </button>
                <button
                  onClick={() => setStep('REASON')}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  <XCircle className="w-5 h-5" />
                  No
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reason"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-white">What happened?</h2>
                <p className="text-zinc-400 text-sm">
                  Be honest. Accountability builds consistency.
                </p>
              </div>

              <div className="space-y-2">
                {reasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => onComplete(reason.id)}
                    className="w-full text-left p-4 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700/50"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('INITIAL')}
                className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
              >
                Go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
