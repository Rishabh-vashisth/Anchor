import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Clock, 
  Play, 
  Pause, 
  Check, 
  ArrowRight, 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  Award, 
  Flame, 
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { Task, Goal } from '../types';

interface OnboardingTourProps {
  onAddTask: (text: string, category: 'KEEP' | 'NONE', isPrimary: boolean) => void;
  onSetPrimary: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onAddReflection: (
    text: string,
    tag: any,
    whatWorked?: string,
    whatBlocked?: string,
    whatSurprised?: string,
    whatToDoDifferently?: string,
    moodEnergy?: number
  ) => void;
  onStartTimer: (taskId: string, isPomodoro?: boolean, pomodoroDurationMinutes?: number) => void;
  onStopTimer: () => void;
  onComplete: () => void;
  tasks: Task[];
}

export function OnboardingTour({
  onAddTask,
  onSetPrimary,
  onAddSubtask,
  onAddReflection,
  onStartTimer,
  onStopTimer,
  onComplete,
  tasks
}: OnboardingTourProps) {
  const [step, setStep] = useState(1);
  const [taskText, setTaskText] = useState('');
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const [checklist, setChecklist] = useState([
    { id: 'c-1', text: 'Define the system architecture bounds', completed: false },
    { id: 'c-2', text: 'Outline first 3 endpoints', completed: false }
  ]);

  // EOD parameters
  const [reflectionWhatWorked, setReflectionWhatWorked] = useState('Setting a single primary focus decoupled my attention from Slack/noise and allowed me to finish the specification.');
  const [reflectionWhatBlocked, setReflectionWhatBlocked] = useState('A minor 10-minute email drift, resolved by immediately switching off tabs.');
  const [reflectionWhatSurprised, setReflectionWhatSurprised] = useState('How quickly flow state activates when there is a running clock visual next to the task.');
  const [reflectionWhatToDoDifferently, setReflectionWhatToDoDifferently] = useState('Schedule the deep block immediately at 09:00 AM instead of answering messages.');
  const [moodEnergy, setMoodEnergy] = useState(8);

  // Run ticking timer when step 5 is active (working state)
  useEffect(() => {
    let intv: any;
    if (step === 5 && isTimerRunning) {
      intv = setInterval(() => {
        setSimulatedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intv);
  }, [step, isTimerRunning]);

  // Find the added task if any
  useEffect(() => {
    if (taskText.trim() && step === 3) {
      const added = tasks.find(t => t.text === taskText.trim());
      if (added) {
        setCreatedTaskId(added.id);
      }
    }
  }, [tasks, step]);

  const handleStepNext = () => {
    setStep(prev => prev + 1);
  };

  const handleSkip = () => {
    // Skip everything, just close
    localStorage.setItem('anchor_onboarding_completed', 'true');
    onComplete();
  };

  // Step 2 submit: creates the real task in the system
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskText.trim()) {
      onAddTask(taskText.trim(), 'KEEP', true);
      setStep(3); // Go to concept explanation
    }
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleEodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add real reflection using callback
    onAddReflection(
      `Daily Reflection (Mood: ${moodEnergy}/10)`,
      'Insight',
      reflectionWhatWorked.trim(),
      reflectionWhatBlocked.trim(),
      reflectionWhatSurprised.trim(),
      reflectionWhatToDoDifferently.trim(),
      moodEnergy
    );
    setStep(7); // Show insight preview
  };

  return (
    <div className="fixed inset-0 bg-[#050505]/98 z-[200] flex items-center justify-center p-4 md:p-8 font-mono select-none overflow-y-auto py-10">
      {/* Accent Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-32 left-1/3 w-[300px] h-[300px] bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/3 w-[300px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[550px] bg-[#0c0d0f] border border-white/10 p-6 md:p-8 text-white shadow-[0_0_60px_rgba(0,0,0,0.9)] rounded-none flex flex-col justify-between min-h-[480px]"
      >
        {/* Header Indicator */}
        <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-white/5">
          <span className="text-[9px] font-bold text-orange-500 tracking-[0.2em] uppercase flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            System Calibration • Step {step} of 8
          </span>
          <button 
            onClick={handleSkip}
            className="text-[8px] text-zinc-500 hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer font-bold tracking-wider"
          >
            Skip Tour <X className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Dynamic Content Window */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Welcome Screen */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans leading-none">
                    Welcome to Anchor.
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">
                    Neuro-Flow Productivity Instrument
                  </p>
                </div>
                
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Modern productivity tools flood you with bloated backlogs, chat pings, and vanity features that destroy deep focus.
                </p>

                <div className="p-3 bg-white/[0.01] border border-white/5 space-y-2">
                  <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider block">
                    The Single Focus Principle:
                  </span>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Anchor is engineered around a single constraint: <strong className="text-white font-extrabold">you must lock exactly one primary focus at a time</strong>. Secondary noise is silenced. You enter the zone, track the sprint, and lock the outcomes.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStepNext}
                    className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    Set My First Task <ArrowRight className="w-3.5 h-3.5 fill-black" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Set First Task */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase font-sans">
                    Declare Your First Anchor Focus
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                    Define a locked objective
                  </p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  What is the <strong className="text-white font-bold">single most critical deliverable</strong> you need to coordinate today? Choose something concrete that requires high neurological clarity.
                </p>

                <form onSubmit={handleTaskSubmit} className="space-y-3 pt-1">
                  <input
                    type="text"
                    required
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="e.g., Draft core system endpoints & refactor db rules"
                    maxLength={70}
                    className="w-full bg-zinc-950 border border-white/10 py-3 px-4 text-xs text-white uppercase font-mono tracking-widest focus:outline-none focus:border-white placeholder:text-zinc-700 transition-colors rounded-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!taskText.trim()}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Secure This Anchor <Compass className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: Explain Primary Task Concept */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-1">
                  <div className="text-[9px] font-mono tracking-[0.2em] text-orange-400 font-black uppercase">
                    Focus Secured
                  </div>
                  <h3 className="text-base font-black text-white leading-tight uppercase font-sans">
                    The Primary Focus constraint
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Your workspace matches your intention. By setting <strong className="text-white font-bold">"{taskText}"</strong> as your anchor, you've locked down your prefrontal cortex.
                </p>

                <div className="p-4 border border-[#e45423]/15 bg-[#e45423]/5 space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-black text-orange-400 uppercase tracking-widest">
                    <Compass className="w-3.5 h-3.5 animate-pulse" />
                    <span>Active Anchor Focus Lock</span>
                  </div>
                  <span className="text-sm font-bold text-white block truncate leading-tight font-sans">
                    "{taskText}"
                  </span>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Checkboxes, metrics, and temporal structures on your dashboard are now calibrated strictly to complete this single core mission.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStepNext}
                    className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Activate Flow Timer <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Try "Start" Focus */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase font-sans">
                    Trigger Attention Sprint
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                    Learn the stopwatch engine
                  </p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Anchor operates with a continuous, clean stopwatch that measures focus allocation. Click the <strong className="text-orange-400">Start Focus</strong> button below to activate the cognitive environment simulation.
                </p>

                <div className="py-4 flex justify-center items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsTimerRunning(true);
                      setStep(5);
                    }}
                    className="bg-[#e45423] hover:bg-[#c74519] text-white font-mono text-[11px] font-black uppercase tracking-widest px-8 py-4 flex items-center gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(228,84,35,0.2)] border border-orange-500/20"
                  >
                    <Play className="w-4 h-4 fill-white" /> Start Focus Now
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Working State */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8px] tracking-widest text-[#e45423] font-bold uppercase">
                    <span className="flex items-center gap-1.5 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
                      Flow Active • Deep Calibration
                    </span>
                    <span className="font-mono text-zinc-500 bg-white/5 py-0.5 px-2 font-bold select-none border border-white/5">
                      ACTIVE TIMER s
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-tight font-sans block truncate py-1">
                    "{taskText}"
                  </h3>
                </div>

                {/* Simulated Ticking Screen */}
                <div className="border border-white/5 bg-[#050505] p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                  <div className="text-4xl font-mono font-black text-white tracking-widest">
                    {formatSecs(simulatedTime)}
                  </div>
                  
                  {/* Visual checklist */}
                  <div className="w-full text-left space-y-1.5 border-t border-white/5 pt-3">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wide block mb-1">
                      CHECKPOINT ALIGNMENTS:
                    </span>
                    {checklist.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleChecklist(item.id)}
                        className="w-full flex items-center gap-2 text-left py-1 text-[11px] hover:text-white transition-all font-mono"
                      >
                        <span className={`w-3.5 h-3.5 border flex items-center justify-center ${
                          item.completed ? 'bg-white text-black border-white' : 'border-zinc-800 text-transparent'
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        <span className={`truncate ${item.completed ? 'line-through text-zinc-650' : 'text-zinc-300'}`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed text-center">
                  Notice how the stopwatch ticks and checklist objectives provide immediate dopamine loops. Click checkpoint items above to try checking them off!
                </p>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setStep(6);
                    }}
                    className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Commit Reflection Close <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Simple Reflection at End of Day */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase font-sans">
                    End-of-Day Cognitive Reflection
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                    Consolidate Neural Pathways
                  </p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Continuous execution without strategic audit causes burnouts. Anchor prompts you to execute a quick 4-step reflection to capture cognitive patterns before the day ends.
                </p>

                <form onSubmit={handleEodSubmit} className="space-y-3 font-mono text-left bg-zinc-950/40 p-3.5 border border-white/5">
                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-500 uppercase font-black block">
                      What worked exceptionally well?
                    </label>
                    <input
                      type="text"
                      value={reflectionWhatWorked}
                      onChange={(e) => setReflectionWhatWorked(e.target.value)}
                      className="w-full bg-black border border-white/10 text-[10px] px-2 py-1 text-white focus:border-white outline-none rounded-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-500 uppercase font-black block">
                      What blocked your momentum?
                    </label>
                    <input
                      type="text"
                      value={reflectionWhatBlocked}
                      onChange={(e) => setReflectionWhatBlocked(e.target.value)}
                      className="w-full bg-black border border-white/10 text-[10px] px-2 py-1 text-white focus:border-white outline-none rounded-none"
                    />
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <label className="text-[8px] text-zinc-500 uppercase font-black">
                      Discipline & Energy vital gauge
                    </label>
                    <span className="text-[9px] text-[#e45423] font-black">
                      {moodEnergy}/10 rating
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodEnergy}
                    onChange={(e) => setMoodEnergy(Number(e.target.value))}
                    className="w-full accent-[#e45423] cursor-pointer h-1"
                  />

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#e45423] hover:bg-orange-600 text-white font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer border border-orange-500/10"
                  >
                    💾 Save & Compile Signals
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 7: Show One Insight */}
            {step === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-base font-black text-white uppercase font-sans">
                    Unlocking Smart Insights
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                    Data-driven Neurological profiles
                  </p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  By logging timers and answering daily micro audits, Anchor’s telemetry engine deciphers your exact performance triggers and blocks.
                </p>

                {/* Insight visual card */}
                <div className="border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500/40" />
                  <div className="flex justify-between items-center text-[8px] text-emerald-400 font-black font-mono tracking-widest uppercase">
                    <span>💡 TELEMETRY PATTERN INDUCTION</span>
                    <span>94% CONFIDENCE</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white font-sans uppercase">
                      Circadian Focus Surge Window Identified
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      Your absolute primary peak productivity hour slot occurs during <strong className="text-emerald-300">09:30 AM - 11:30 AM</strong> on average. Tasks started before 10:00 AM have a <strong className="text-emerald-300">45% higher completion rate</strong> and experience zero reported blockers.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStepNext}
                    className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Next: Finalize Calibration <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 8: Done - Ready to use! */}
            {step === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-center"
              >
                <div className="py-2 flex justify-center">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                    <ZawadIcon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase font-sans">
                    System Fully Operational
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest block font-black">
                    Anchor is Calibrated to Your Brain
                  </p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                  You have unlocked the pure focus instrument. All secondary navigation channels, streak meters, smart alerts, and goals are now live. Run clean, single-task blocks daily.
                </p>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('anchor_onboarding_completed', 'true');
                      onComplete();
                    }}
                    className="w-full py-3.5 bg-[#e45423] hover:bg-orange-600 text-white font-black uppercase text-[10.5px] tracking-widest flex items-center justify-center gap-2 transition-all animate-pulse shadow-2xl cursor-pointer border border-orange-500/20"
                  >
                    Enter My Workspace ➔
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info stamp & step bubbles */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[8.5px] font-mono text-zinc-500 uppercase">
          <span>ANCHOR • v3.5 Stable</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <span 
                key={i}
                className={`w-1.5 h-1.5 rounded-none border transition-all ${
                  step === i ? 'bg-orange-500 border-orange-500' : 'border-zinc-800 bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple placeholder icon to represent beautiful calibration
function ZawadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
