import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  Info, 
  Compass, 
  Target, 
  Flame, 
  BookOpen, 
  Sliders, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';

interface HelpPageProps {
  key?: string;
  onSwitchView?: (view: any) => void;
}

interface GuideItem {
  id: string;
  icon: React.ReactNode;
  category: string;
  title: string;
  summary: string;
  description: string;
  tips: string[];
}

export function HelpPage({ onSwitchView }: HelpPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>('pillar-anchor');

  const guides: GuideItem[] = [
    {
      id: 'pillar-anchor',
      icon: <Compass className="w-4 h-4 text-orange-500" />,
      category: 'CORE METHODOLOGY',
      title: 'Active Focus Anchoring',
      summary: 'Why single-tasking is the ultimate defense against cognitive drift and attention fragmentation.',
      description: 'Human psychology is susceptible to "shifting cost" penalty. Anchor enforces single-screen layout discipline: you declare precisely one primary active anchor task. All minor details belong as checkpoints under this main focus block.',
      tips: [
        'Before starting, break down your anchor into 3-5 minor sub-checkpoints.',
        'Launch the Pomodoro or continuous timer to lock your terminal environment.',
        'Do not close the page or switch tabs until the state is marked as Complete.',
        'Use the "Change Anchor" option if structural blockers arise.'
      ]
    },
    {
      id: 'pillar-insights',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      category: 'COGNITIVE INTELLIGENCE',
      title: 'Insights & Behavior Analytics',
      summary: 'Analyze productivity trends, stress logs, and day-of-week task metrics.',
      description: 'Productivity is not merely a quantitative task count; it is an optimization function. The Insights intelligence engine parses completion distributions, stress vs. energy coefficients, and highlights specific days where you suffer from attention exhaustion.',
      tips: [
        'Regularly log reflections to populate subjective stress and energy levels.',
        'Watch for the "exertion limits" recommendations in the advisor module.',
        'Compare your weekly focus hours with your daily time budget constraints.'
      ]
    },
    {
      id: 'pillar-reflections',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      category: 'RETROSPECTIVES',
      title: 'Structured Reflections Logs',
      summary: 'Record Insights, Reminders, and Mistakes to design continuous improvement scripts.',
      description: 'Mistakes are high-value telemetry when documented. The Reflections page provides templates (Quick, Standard, Exhaustive) to track lessons, pinpoint what blocked progress, and capture flashes of clarity.',
      tips: [
        'Draft reflections immediately after completing complex projects while active memory is fresh.',
        'Sort logs by "Mistakes" during your weekly review to identify recurring systemic bottlenecks.',
        'Tag reflections to related tasks to maintain full analytical context.'
      ]
    },
    {
      id: 'pillar-goals',
      icon: <Target className="w-4 h-4 text-red-500" />,
      category: 'STRATEGIC ALIGNMENT',
      title: 'OKRs & Objectives Tracking',
      summary: 'Bridge the gap between daily drift and high-level quarterly/weekly ambitions.',
      description: 'Without top-level objectives, our brains default to clicking low-effort tasks. OKRs allow you to define measurable key results and connect individual focus anchors directly to strategic long-term outcomes.',
      tips: [
        'Define 1-2 key results per objective with hard, quantifiable values.',
        'Create weekly goals to guide immediate incremental sprint achievements.',
        'Verify OKR completion criteria on Friday reviews before resetting streak targets.'
      ]
    },
    {
      id: 'pillar-streaks',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      category: 'SYSTEM INTEGRITY',
      title: 'Streak Ecosystem & Discipline',
      summary: 'Earn milestones and reinforce the psychological chain of daily completions.',
      description: 'Discipline thrives on immediate rewards. Anchoring streaks increment for every consecutive calendar date that you resolve a primary anchor. If a day passes without active completions, the system triggers the automatic calibration warning.',
      tips: [
        'Set up automated morning briefs via Settings to preview high-streak milestones.',
        'If state drifts, look at the EOD check modal to capture trailing task completions.'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-white font-mono max-w-2xl mx-auto pb-12"
    >
      {/* Page Header */}
      <section className="space-y-1">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 font-bold block">
          Knowledge Base & User Manual
        </span>
        <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
          Anchor System Help
        </h2>
        <p className="text-[11px] text-zinc-500">
          Understand cognitive single-tasking parameters, analytical telemetry, and system guides.
        </p>
      </section>

      {/* Main Philosophy statement */}
      <div className="p-5 border border-white/5 bg-zinc-950/40 relative overflow-hidden space-y-3">
        <div className="absolute right-3 top-3 opacity-10">
          <HelpCircle className="w-16 h-16 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
          <Info className="w-4 h-4" />
          <span>OPERATOR PHILOSOPHY</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed font-sans">
          Anchor rejects the multi-tasking fallacy. In a world optimized for attention capture, your most precious asset is an uninterrupted focus block. By limiting your interface scope and establishing structured, high-integrity feedback loops, you transform raw mental efforts into predictable, deep work outcomes.
        </p>
      </div>

      {/* Pillars Accordion list */}
      <div className="space-y-3 pt-2">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-black block">
          SYSTEM CORE GUIDES:
        </span>
        <div className="space-y-2">
          {guides.map((g) => {
            const isExpanded = expandedId === g.id;
            return (
              <div 
                key={g.id}
                className={`border transition-all duration-200 ${
                  isExpanded ? 'border-white bg-zinc-950/50' : 'border-white/5 hover:border-white/10 bg-zinc-950/20'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : g.id)}
                  className="w-full flex items-center justify-between p-4 text-left outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 px-1.5 border border-white/5 bg-white/[0.02]">
                      {g.icon}
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 tracking-wider block leading-none font-bold">
                        {g.category}
                      </span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans mt-0.5">
                        {g.title}
                      </h4>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-1 border-t border-white/5 space-y-4">
                        <p className="text-[10px] text-zinc-300 italic">
                          "{g.summary}"
                        </p>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          {g.description}
                        </p>
                        
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[8px] font-mono text-orange-400 font-bold uppercase tracking-wider block">
                            PRACTICAL SYSTEM ADVICE:
                          </span>
                          <ul className="space-y-1">
                            {g.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[10px] text-zinc-400 font-mono">
                                <span className="text-white">✓</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to action */}
      {onSwitchView && (
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-2 justify-between items-center text-xs font-mono text-zinc-500">
          <span>Need troubleshooting or hard resets?</span>
          <button
            onClick={() => onSwitchView('SETTINGS')}
            className="p-1 px-3 border border-white/10 hover:border-white text-white uppercase text-[10px] bg-white/5 hover:bg-white/10 transition-all font-bold"
          >
            Go to Settings System
          </button>
        </div>
      )}
    </motion.div>
  );
}
