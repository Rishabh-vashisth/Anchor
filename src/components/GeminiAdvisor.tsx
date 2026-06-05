/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  LayoutDashboard, 
  Check, 
  CheckSquare, 
  Plus, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  Target, 
  ChevronRight, 
  Info,
  Clock,
  BatteryCharging,
  ThumbsDown,
  Trash2,
  Frown,
  Activity
} from 'lucide-react';
import { Task, Goal, Reflection, TimeBlock, GoogleCalendarEvent } from '../types';
import { 
  getTaskCompletionPrediction, 
  getOptimalTaskRecommendation, 
  getBlockerAnalysis, 
  getReflectionInsights, 
  getGoalBreakdown, 
  getSmartRetryBreakdown,
  TaskPrediction,
  OptimalTaskRecommendation,
  BlockerAnalysisResult,
  ReflectionInsightsResult,
  GoalBreakdownResult,
  SmartRetryResult
} from '../utils/geminiSuggestService';

const PREF_KEY = 'anchor_ai_suggestion_preferences';

interface GeminiAdvisorProps {
  tasks: Task[];
  allTasks: Task[];
  reflections: Reflection[];
  goals: Goal[];
  timeBlocks?: TimeBlock[];
  googleCalendarEvents?: GoogleCalendarEvent[];
  onSetPrimary?: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onAddMultipleSubtasks?: (taskId: string, titles: string[]) => void;
  onAddTask?: (text: string) => void;
  activeTaskId?: string | null;
  defaultTab?: 'DASHBOARD' | 'PREDICTION' | 'BLOCKERS' | 'REFLECTIONS' | 'RETRY';
}

interface SuggestionPreferences {
  prediction: number;
  optimal: number;
  blocker: number;
  insights: number;
  breakdown: number;
  retry: number;
}

const DEFAULT_PREFS: SuggestionPreferences = {
  prediction: 1.0,
  optimal: 1.0,
  blocker: 1.0,
  insights: 1.0,
  breakdown: 1.0,
  retry: 1.0
};

export function GeminiAdvisor({
  tasks = [],
  allTasks = [],
  reflections = [],
  goals = [],
  timeBlocks = [],
  googleCalendarEvents = [],
  onSetPrimary,
  onAddSubtask,
  onAddMultipleSubtasks,
  onAddTask,
  activeTaskId,
  defaultTab = 'DASHBOARD'
}: GeminiAdvisorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'DASHBOARD' | 'PREDICTION' | 'BLOCKERS' | 'REFLECTIONS' | 'RETRY'>(defaultTab);

  // Suggested item stats
  const pendingTasks = useMemo(() => allTasks.filter(t => t.status === 'pending'), [allTasks]);
  const abandonedTasks = useMemo(() => allTasks.filter(t => t.status === 'abandoned'), [allTasks]);

  // Suggestion preference (ignored categories learning logic)
  const [prefs, setPrefs] = useState<SuggestionPreferences>(() => {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_PREFS;
      }
    }
    return DEFAULT_PREFS;
  });

  const savePrefs = (updated: SuggestionPreferences) => {
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
  };

  const handleDismissType = (type: keyof SuggestionPreferences) => {
    const updated = { ...prefs, [type]: Math.max(0, parseFloat((prefs[type] - 0.25).toFixed(2))) };
    savePrefs(updated);
  };

  const handleResetPrefs = () => {
    savePrefs(DEFAULT_PREFS);
  };

  // --- Suggestion Type 1: Task Completion Prediction ---
  const [predictTaskId, setPredictTaskId] = useState<string>('');
  const [prediction, setPrediction] = useState<TaskPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handlePredict = async (tid: string) => {
    const selectedTask = allTasks.find(t => t.id === tid);
    if (!selectedTask) return;

    setIsPredicting(true);
    setPredictionError(null);
    try {
      const hist = allTasks.filter(t => t.id !== tid);
      const res = await getTaskCompletionPrediction(selectedTask, hist);
      setPrediction(res);
    } catch (e: any) {
      setPredictionError(e.message || "Failed to query Gemini API.");
    } finally {
      setIsPredicting(false);
    }
  };

  // --- Suggestion Type 2: Optimal Task for Now ---
  const [availableMinutes, setAvailableMinutes] = useState<number>(60);
  const [currentEnergy, setCurrentEnergy] = useState<number>(7);
  const [optimalRec, setOptimalRec] = useState<OptimalTaskRecommendation | null>(null);
  const [isOptimalLoading, setIsOptimalLoading] = useState(false);

  const handleFindOptimal = async () => {
    if (pendingTasks.length === 0) return;
    setIsOptimalLoading(true);
    try {
      const today = new Date().getDay();
      const dayBlocks = timeBlocks.filter(b => b.dayOfWeek === today);
      const res = await getOptimalTaskRecommendation(
        pendingTasks,
        availableMinutes,
        currentEnergy,
        dayBlocks,
        googleCalendarEvents
      );
      setOptimalRec(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimalLoading(false);
    }
  };

  // --- Suggestion Type 3: Blocker Analysis ---
  const [blockerInsights, setBlockerInsights] = useState<BlockerAnalysisResult | null>(null);
  const [isBlockersLoading, setIsBlockersLoading] = useState(false);

  const handleAnalyzeBlockers = async () => {
    setIsBlockersLoading(true);
    try {
      const res = await getBlockerAnalysis(abandonedTasks, reflections);
      setBlockerInsights(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBlockersLoading(false);
    }
  };

  // --- Suggestion Type 4: Reflection Summary Insights ---
  const [reflectionSummary, setReflectionSummary] = useState<ReflectionInsightsResult | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  const handleAnalyzeReflections = async () => {
    setIsInsightsLoading(true);
    try {
      const res = await getReflectionInsights(reflections);
      setReflectionSummary(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  // --- Suggestion Type 6: Smart Retry ---
  const [retryTaskId, setRetryTaskId] = useState<string>('');
  const [retryResult, setRetryResult] = useState<SmartRetryResult | null>(null);
  const [isRetryLoading, setIsRetryLoading] = useState(false);

  // Filter tasks carried over multiple times (let's assume any abandoned task or task we select is eligible for a retry breakdown)
  const carryoverTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'abandoned' || t.category === 'DELAY');
  }, [allTasks]);

  const handleGetRetryBreakdown = async (tid: string) => {
    const selectedTask = allTasks.find(t => t.id === tid);
    if (!selectedTask) return;

    setIsRetryLoading(true);
    try {
      // Find EOD reason labels if we can find EOD check matches
      const reasons: string[] = [];
      if (selectedTask.category === 'DELAY') reasons.push('Delayed past deadline / carried over');
      if (selectedTask.status === 'abandoned') reasons.push('Task marked abandoned');
      
      const res = await getSmartRetryBreakdown(selectedTask.text, 2, reasons);
      setRetryResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetryLoading(false);
    }
  };

  // Auto-fill active task prediction if activeTaskId is passed
  useEffect(() => {
    if (activeTaskId) {
      setPredictTaskId(activeTaskId);
      handlePredict(activeTaskId);
    }
  }, [activeTaskId]);

  return (
    <div className="border border-white/10 bg-zinc-950 p-6 space-y-6 select-text">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-orange-600 text-white text-[10px] uppercase font-black tracking-widest font-mono">
              Anchor AI
            </div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1">
              Smart Diagnostics <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            </h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mt-1">
            Real-time behavior diagnostics using direct Gemini model synthesis.
          </p>
        </div>

        {/* Suggestion Preferences learning panel info */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-white/[0.02] border border-white/5 p-2 px-3 self-start sm:self-center">
          <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Ignored Pref: </span>
          <div className="flex gap-1.5">
            {Object.entries(prefs).map(([key, val]) => (
              <span key={key} className={`px-1 rounded-sm text-[8px] font-bold ${(val as number) < 0.6 ? 'bg-orange-950/40 text-orange-400 line-through' : 'bg-zinc-800 text-zinc-300'}`} title={`${key}: ${val}`}>
                {key[0].toUpperCase()}
              </span>
            ))}
          </div>
          {(Object.values(prefs) as number[]).some((v: number) => v < 1.0) && (
            <button 
              onClick={handleResetPrefs}
              className="ml-1 text-[8px] text-orange-400 border border-orange-500/10 bg-orange-950/20 px-1 py-0.5 hover:bg-orange-900/30 font-black cursor-pointer uppercase font-mono"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Mini Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 p-1 bg-white/[0.02] border border-white/5">
        <button
          onClick={() => setActiveSubTab('DASHBOARD')}
          className={`py-2 px-1 text-center text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'DASHBOARD' ? 'bg-white text-black font-heavy' : 'text-zinc-400 hover:text-white bg-white/[0.01]'}`}
        >
          Optimal Task
        </button>
        <button
          onClick={() => setActiveSubTab('PREDICTION')}
          className={`py-2 px-1 text-center text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'PREDICTION' ? 'bg-white text-black font-heavy' : 'text-zinc-400 hover:text-white bg-white/[0.01]'}`}
        >
          Likelihood
        </button>
        <button
          onClick={() => {
            setActiveSubTab('BLOCKERS');
            if (!blockerInsights) handleAnalyzeBlockers();
          }}
          className={`py-2 px-1 text-center text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'BLOCKERS' ? 'bg-white text-black font-heavy' : 'text-zinc-400 hover:text-white bg-white/[0.01]'}`}
        >
          Blockers
        </button>
        <button
          onClick={() => {
            setActiveSubTab('REFLECTIONS');
            if (!reflectionSummary) handleAnalyzeReflections();
          }}
          className={`py-2 px-1 text-center text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'REFLECTIONS' ? 'bg-white text-black font-heavy' : 'text-zinc-400 hover:text-white bg-white/[0.01]'}`}
        >
          Weekly Logs
        </button>
        <button
          onClick={() => setActiveSubTab('RETRY')}
          className={`py-2 px-1 text-center text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'RETRY' ? 'bg-white text-black font-heavy' : 'text-zinc-400 hover:text-white bg-white/[0.01]'}`}
        >
          Smart Retry
        </button>
      </div>

      {/* Output Sections */}
      <div className="bg-zinc-950 border border-white/5 p-4 min-h-[160px] relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Optimal Task Recomendation */}
          {activeSubTab === 'DASHBOARD' && (
            <motion.div
              key="optimal-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Optimal Task For Right Now</span>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Bio-Cognitive Dynamic Sizer</h3>
                </div>
                <button 
                  onClick={() => handleDismissType('optimal')}
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Dismiss / Lower this suggestion priority"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {prefs.optimal < 0.4 && (
                <div className="p-3 border border-orange-500/10 bg-orange-950/10 flex items-center justify-between text-[11px] font-sans text-orange-400">
                  <span>This suggestion category was downgraded due to multiple ignores.</span>
                  <button onClick={() => savePrefs({...prefs, optimal: 1.0})} className="underline uppercase text-[9px] font-mono font-bold cursor-pointer">Reset Preference</button>
                </div>
              )}

              {/* Sliders layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.01] border border-white/[0.03] p-4 text-[11px]">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> Time Available:</span>
                    <span className="text-white font-bold">{availableMinutes} min</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={availableMinutes}
                    onChange={(e) => setAvailableMinutes(parseInt(e.target.value))}
                    className="w-full accent-orange-600 bg-zinc-800 cursor-pointer h-1 rounded-none outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                    <span>15M (LIGHT CHORE)</span>
                    <span>180M (DEEP SESSION)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><BatteryCharging className="w-3.5 h-3.5 text-zinc-500" /> Executive Energy:</span>
                    <span className="text-white font-bold">{currentEnergy} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentEnergy}
                    onChange={(e) => setCurrentEnergy(parseInt(e.target.value))}
                    className="w-full accent-orange-600 bg-zinc-800 cursor-pointer h-1 rounded-none outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                    <span>1 (EXHAUSTED)</span>
                    <span>10 (HYPER FOCUS)</span>
                  </div>
                </div>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-500 uppercase italic">
                  Backlog is empty! Log pending items in the Dump tab to unlock optimal planning.
                </div>
              ) : (
                <div className="pt-2">
                  {isOptimalLoading ? (
                    <div className="flex justify-center items-center py-6 gap-2">
                      <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Querying Anchor AI Engine...</span>
                    </div>
                  ) : optimalRec ? (
                    <div className="border border-white/5 bg-zinc-950 p-4 space-y-3 font-sans">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-orange-950 border border-orange-500/20 text-orange-400 font-mono text-[9px] font-heavy font-black uppercase">
                            RECOMMENDED ANCHOR
                          </span>
                          {optimalRec._fallback && <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-wider">(Local Sizer)</span>}
                          {optimalRec._cached && <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">(Cached)</span>}
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider ${optimalRec.confidence === 'High' ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' : optimalRec.confidence === 'Medium' ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400' : 'bg-red-950/40 border border-red-500/20 text-red-400'}`}>
                          Confidence: {optimalRec.confidence}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white/95">
                          {optimalRec.taskText}
                        </h4>
                        <p className="text-[11.5px] text-zinc-350 leading-relaxed italic">
                          "{optimalRec.reason}"
                        </p>
                      </div>

                      {optimalRec.taskId && onSetPrimary && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => {
                              onSetPrimary(optimalRec.taskId!);
                              setActiveSubTab('DASHBOARD');
                            }}
                            className="bg-white text-black hover:opacity-85 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 cursor-pointer"
                          >
                            Set Active Primary Anchor ✦
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleFindOptimal}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-heavy font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Analyze Optimal Focus Anchor
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Task Completion Prediction */}
          {activeSubTab === 'PREDICTION' && (
            <motion.div
              key="predict-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Completion Predictor</span>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Dynamic Odds Synthesis</h3>
                </div>
                <button 
                  onClick={() => handleDismissType('prediction')}
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Dismiss / Lower this suggestion priority"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {prefs.prediction < 0.4 && (
                <div className="p-3 border border-orange-500/10 bg-orange-950/10 flex items-center justify-between text-[11px] font-sans text-orange-400">
                  <span>This suggestion category was downgraded due to multiple ignores.</span>
                  <button onClick={() => savePrefs({...prefs, prediction: 1.0})} className="underline uppercase text-[9px] font-mono font-bold cursor-pointer">Reset Preference</button>
                </div>
              )}

              {/* Selector wrapper */}
              <div className="space-y-3">
                <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Select target backlog item to analyze:</label>
                <div className="flex gap-2">
                  <select
                    value={predictTaskId}
                    onChange={(e) => setPredictTaskId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-white/10 text-white text-[11px] p-2 font-mono outline-none focus:border-white"
                  >
                    <option value="">-- Choose Pending Task --</option>
                    {pendingTasks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.text.length > 55 ? `${t.text.substring(0, 55)}...` : t.text} ({t.category || 'NONE'})
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!predictTaskId || isPredicting}
                    onClick={() => handlePredict(predictTaskId)}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-[10px] font-mono uppercase tracking-widest px-4 cursor-pointer font-bold border border-white/5"
                  >
                    {isPredicting ? 'Synthesizing...' : 'Predict ✦'}
                  </button>
                </div>
              </div>

              {predictionError && (
                <div className="p-3 border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono">
                  Analysis Failure: {predictionError}
                </div>
              )}

              {isPredicting && (
                <div className="flex justify-center items-center py-6 gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Generating model synthesis...</span>
                </div>
              )}

              {prediction && !isPredicting && (
                <div className="border border-white/5 bg-zinc-950 p-4 space-y-3.5 text-xs font-sans">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Prediction Outcome:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 border ${
                        prediction.rating === 'High' 
                          ? 'border-emerald-500/20 bg-emerald-950/30 text-emerald-400' 
                          : prediction.rating === 'Medium' 
                            ? 'border-amber-500/20 bg-amber-950/30 text-amber-400' 
                            : 'border-red-500/20 bg-red-950/30 text-red-400'
                      }`}>
                        {prediction.rating} Likelihood
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Behavior Reason:</span>
                    <p className="text-zinc-350 leading-relaxed font-sans italic text-[11.5px]">
                      "{prediction.reason}"
                    </p>
                  </div>

                  {prediction.suggestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Model Action suggestions:</span>
                      <ul className="space-y-1 font-mono text-[9px] text-zinc-400">
                        {prediction.suggestions.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-orange-500 shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Automatic breakdown action trigger if they want AI to split it! */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSubTab('RETRY');
                        setRetryTaskId(predictTaskId);
                        handleGetRetryBreakdown(predictTaskId);
                      }}
                      className="text-[9px] font-mono text-orange-400 border border-orange-500/10 bg-orange-950/20 px-2.5 py-1 hover:bg-orange-900/30 font-bold uppercase cursor-pointer"
                    >
                      Need checklist breakdown? Ask Gemini Retry helper ✦
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Blocker Analysis */}
          {activeSubTab === 'BLOCKERS' && (
            <motion.div
              key="blockers-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Blocker Assessment</span>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Cognitive Friction Diagnostics</h3>
                </div>
                <button 
                  onClick={() => handleDismissType('blocker')}
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Dismiss / Lower this suggestion priority"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {prefs.blocker < 0.4 && (
                <div className="p-3 border border-orange-500/10 bg-orange-950/10 flex items-center justify-between text-[11px] font-sans text-orange-400">
                  <span>This suggestion category was downgraded due to multiple ignores.</span>
                  <button onClick={() => savePrefs({...prefs, blocker: 1.0})} className="underline uppercase text-[9px] font-mono font-bold cursor-pointer">Reset Preference</button>
                </div>
              )}

              {isBlockersLoading ? (
                <div className="flex justify-center items-center py-6 gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Scanning logs ...</span>
                </div>
              ) : blockerInsights ? (
                <div className="border border-white/5 bg-zinc-950 p-4 space-y-4 font-sans text-xs">
                  
                  {/* Patterns discovered */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Recurrent Friction Patterns:</span>
                    {blockerInsights.patterns.length > 0 ? (
                      <div className="space-y-2">
                        {blockerInsights.patterns.map((pat, idx) => (
                          <div key={idx} className="p-2.5 border border-red-500/10 bg-red-950/10 text-zinc-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span className="font-sans text-[11.5px] leading-relaxed">{pat}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-zinc-600 font-mono text-[10px]">No visible carry-over blocker patterns found. Excellent system flow!</p>
                    )}
                  </div>

                  {/* Strategic Action Plan */}
                  {blockerInsights.actionPlan.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Strategic Resolution Path:</span>
                      <div className="space-y-1.5 font-mono text-[9px] text-zinc-400">
                        {blockerInsights.actionPlan.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-white/[0.01] p-1.5 border border-white/[0.03]">
                            <span className="px-1 text-[8px] bg-zinc-800 text-zinc-300 rounded font-black shrink-0">STEP {idx + 1}</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeBlockers}
                    className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-Scan History
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={handleAnalyzeBlockers}
                    className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-mono uppercase tracking-widest text-[9px] cursor-pointer"
                  >
                    Synthesize Blocker History
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: Weekly Insights Summary */}
          {activeSubTab === 'REFLECTIONS' && (
            <motion.div
              key="reflections-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Journals Synthesis</span>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Cognitive & Mood Trends</h3>
                </div>
                <button 
                  onClick={() => handleDismissType('insights')}
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Dismiss / Lower this suggestion priority"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {prefs.insights < 0.4 && (
                <div className="p-3 border border-orange-500/10 bg-orange-950/10 flex items-center justify-between text-[11px] font-sans text-orange-400">
                  <span>This suggestion category was downgraded due to multiple ignores.</span>
                  <button onClick={() => savePrefs({...prefs, insights: 1.0})} className="underline uppercase text-[9px] font-mono font-bold cursor-pointer">Reset Preference</button>
                </div>
              )}

              {reflections.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-500 uppercase italic">
                  Complete a personal reflection log (under Reflections tab) first to allow personal weekly mood diagnostics and focus synthesis.
                </div>
              ) : (
                <div className="space-y-3">
                  {isInsightsLoading ? (
                    <div className="flex justify-center items-center py-6 gap-2">
                      <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Parsing reflections ...</span>
                    </div>
                  ) : reflectionSummary ? (
                    <div className="border border-white/5 bg-zinc-950 p-4 space-y-4 font-sans text-xs">
                      
                      {/* Summary */}
                      <div className="space-y-1 bg-white/[0.01] p-3 border border-white/[0.02]">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Cognitive Diagnostic Summary:</span>
                        <p className="text-zinc-300 italic leading-relaxed text-[11.5px]">
                          "{reflectionSummary.summary}"
                        </p>
                      </div>

                      {/* Patterns */}
                      {reflectionSummary.patterns.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Vibe & Habit Correlative Patterns:</span>
                          <ul className="space-y-1 font-sans text-[11px] text-zinc-400">
                            {reflectionSummary.patterns.map((p, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-orange-500 shrink-0">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Plan */}
                      {reflectionSummary.actionPlan.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Structural Focus Adjustments:</span>
                          <div className="space-y-1 text-zinc-400 font-mono text-[9px]">
                            {reflectionSummary.actionPlan.map((act, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 p-1 bg-zinc-900 border border-white/[0.02]">
                                <span className="text-orange-400 font-bold shrink-0">✦</span>
                                <span>{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleAnalyzeReflections}
                        className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-Synthesize Journal
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <button
                        onClick={handleAnalyzeReflections}
                        className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-mono uppercase tracking-widest text-[9px] cursor-pointer"
                      >
                        Synthesize Reflection Insights
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: Smart Retry Breakdown (carried over/failed tasks helper) */}
          {activeSubTab === 'RETRY' && (
            <motion.div
              key="retry-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Smart Retry Assistant</span>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Carry-over Deconstruct Engine</h3>
                </div>
                <button 
                  onClick={() => handleDismissType('retry')}
                  className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Dismiss / Lower this suggestion priority"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {prefs.retry < 0.4 && (
                <div className="p-3 border border-orange-500/10 bg-orange-950/10 flex items-center justify-between text-[11px] font-sans text-orange-400">
                  <span>This suggestion category was downgraded due to multiple ignores.</span>
                  <button onClick={() => savePrefs({...prefs, retry: 1.0})} className="underline uppercase text-[9px] font-mono font-bold cursor-pointer">Reset Preference</button>
                </div>
              )}

              {/* Retry Selector */}
              <div className="space-y-3">
                <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Select struggling or carried over task to break down:</label>
                <div className="flex gap-2">
                  <select
                    value={retryTaskId}
                    onChange={(e) => setRetryTaskId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-white/10 text-white text-[11px] p-2 font-mono outline-none focus:border-white"
                  >
                    <option value="">-- Choose Struggle Item --</option>
                    {/* Fallback to any pending task if no carryovers, to let them try it regardless */}
                    {(carryoverTasks.length > 0 ? carryoverTasks : pendingTasks).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.text.length > 55 ? `${t.text.substring(0, 55)}...` : t.text} ({t.status.toUpperCase()})
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!retryTaskId || isRetryLoading}
                    onClick={() => handleGetRetryBreakdown(retryTaskId)}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-[10px] font-mono uppercase tracking-widest px-4 cursor-pointer font-bold border border-white/5"
                  >
                    {isRetryLoading ? 'Refining...' : 'Breakdown ✦'}
                  </button>
                </div>
              </div>

              {isRetryLoading && (
                <div className="flex justify-center items-center py-6 gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Computing tactical subdivisions...</span>
                </div>
              )}

              {retryResult && !isRetryLoading && (
                <div className="border border-white/5 bg-zinc-950 p-4 space-y-4 text-xs font-sans">
                  
                  {/* Encouragement */}
                  <div className="p-3 border border-orange-500/20 bg-orange-950/20 text-orange-400 italic font-sans text-[11.5px] leading-relaxed">
                    "{retryResult.encouragementText}"
                  </div>

                  {/* Subtask additions */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Suggested Tactical Subdivisions (Bite-sized):</span>
                    <div className="space-y-1 font-mono text-[9px] text-zinc-300">
                      {retryResult.suggestedBreakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 border border-white/[0.03] bg-white/[0.01]">
                          <span className="text-orange-500 font-bold font-mono">[{idx + 1}]</span>
                          <span className="flex-1 truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Automatic insertion callback! */}
                  {onAddMultipleSubtasks && retryTaskId && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onAddMultipleSubtasks(retryTaskId, retryResult.suggestedBreakdown);
                          setRetryResult(null); // Clear after adding
                          const taskName = allTasks.find(t => t.id === retryTaskId)?.text || "";
                          alert(`Added ${retryResult.suggestedBreakdown.length} subtask items to: "${taskName}"!`);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heavy font-black uppercase text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4" /> Inject Subtasks Directly into Checklist Checklist Item ✓
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
