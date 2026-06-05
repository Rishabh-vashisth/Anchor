import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  CheckSquare, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Zap,
  Layers,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Goal, GoalKeyResult, Task, GoalStatus, GoalType } from '../types';

interface GoalsPageProps {
  key?: string;
  goals: Goal[];
  allTasks: Task[];
  onAddGoal: (
    title: string,
    targetDate: string,
    keyResultTexts: string[],
    type: 'quarterly' | 'weekly',
    parentId?: string | null,
    description?: string,
    startDate?: string
  ) => void;
  onEditGoal: (
    goalId: string,
    updates: {
      title?: string;
      description?: string;
      targetDate?: string;
      startDate?: string;
      parentId?: string | null;
      type?: 'quarterly' | 'weekly';
    }
  ) => void;
  onUpdateGoalStatus: (goalId: string, status: 'active' | 'completed' | 'abandoned') => void;
  onToggleKeyResult: (goalId: string, krId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function GoalsPage({
  goals = [],
  allTasks = [],
  onAddGoal,
  onEditGoal,
  onUpdateGoalStatus,
  onToggleKeyResult,
  onDeleteGoal
}: GoalsPageProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'REVIEW' | 'ARCHIVE'>('ACTIVE');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form input states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('weekly');
  const [parentId, setParentId] = useState<string>('');
  const [targetDate, setTargetDate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom milestones key results
  const [kr1, setKr1] = useState('');
  const [kr2, setKr2] = useState('');
  const [kr3, setKr3] = useState('');

  // Weekly review simulation wizard steps
  const [reviewStep, setReviewStep] = useState(1);
  const [weeklyAccomplishText, setWeeklyAccomplishText] = useState('');
  const [weeklyCorrectionText, setWeeklyCorrectionText] = useState('');

  // Filtering lists
  const activeQuarterlyGoals = goals.filter(g => g.type === 'quarterly' && g.status === 'active');
  const activeWeeklyObjectives = goals.filter(g => g.type === 'weekly' && g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const abandonedGoals = goals.filter(g => g.status === 'abandoned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim()) {
      const krs = [kr1, kr2, kr3].filter(t => t.trim() !== '');
      onAddGoal(
        goalTitle.trim(),
        targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1050).toISOString().split('T')[0],
        krs,
        goalType,
        goalType === 'weekly' && parentId ? parentId : null,
        goalDescription.trim(),
        startDate
      );
      
      // Reset
      setGoalTitle('');
      setGoalDescription('');
      setGoalType('weekly');
      setParentId('');
      setTargetDate('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setKr1('');
      setKr2('');
      setKr3('');
      setShowAddForm(false);
    }
  };

  const getSubProgressPercent = (goal: Goal) => {
    if (!goal.keyResults || goal.keyResults.length === 0) return goal.status === 'completed' ? 100 : 0;
    const completed = goal.keyResults.filter(k => k.completed).length;
    return Math.round((completed / goal.keyResults.length) * 100);
  };

  // Check alignment: list any active tasks that don't have a goalId linked
  const currentTasks = allTasks.filter(t => t.category === 'KEEP' && t.status === 'pending');
  const unalignedTasks = currentTasks.filter(t => !t.goalId);

  // Weekly review process handlers
  const handleWeeklyReviewSubmit = () => {
    // Generate a beautiful EOD or weekly summary output
    alert("Weekly Objective Review logged. Progress synced. Your reflections table is armed for the next weekly horizon.");
    setReviewStep(1);
    setActiveTab('ACTIVE');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6 text-white"
    >
      {/* Header section */}
      <section className="flex justify-between items-center bg-zinc-950/20 py-2 border-b border-white/5">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-orange-500 font-bold block">
            STRATEGIC EXECUTIVE ANCHORING
          </span>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-white">
            Objective Alignment Map
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 px-3 border border-white/20 hover:border-white font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-all text-white bg-transparent"
        >
          {showAddForm ? 'Cancel Form' : '+ New Objective Node'}
        </button>
      </section>

      {/* Tabs navigation */}
      <div className="grid grid-cols-3 border border-white/5 bg-zinc-950/20 p-1">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
            activeTab === 'ACTIVE' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          🎯 Active Objectives ({activeQuarterlyGoals.length + activeWeeklyObjectives.length})
        </button>
        <button
          onClick={() => setActiveTab('REVIEW')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all relative ${
            activeTab === 'REVIEW' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          ⚔️ Weekly Review Cycle
          {activeWeeklyObjectives.length > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-orange-500 animate-ping-slow" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ARCHIVE')}
          className={`py-2 text-[10px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
            activeTab === 'ARCHIVE' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          📚 Archive ({completedGoals.length + abandonedGoals.length})
        </button>
      </div>

      {/* Dynamic contents section */}
      <AnimatePresence mode="wait">
        {/* GOAL CREATION FORM */}
        {showAddForm && (
          <motion.div
            key="add-goal-box"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-white/10 bg-zinc-950 p-5 space-y-4"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Horizon Type</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full bg-[#050505] p-2.5 border border-white/10 text-xs text-white outline-none font-mono tracking-wider uppercase font-bold"
                  >
                    <option value="weekly">Weekly Operational Objective</option>
                    <option value="quarterly">Quarterly Strategic Goal (Macro)</option>
                  </select>
                </div>

                {goalType === 'weekly' && activeQuarterlyGoals.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Parent Quarterly Goal alignment</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full bg-[#050505] p-2.5 border border-white/10 text-xs text-zinc-300 outline-none font-mono"
                    >
                      <option value="">-- Standalone Operational Target (No Parent) --</option>
                      {activeQuarterlyGoals.map(qg => (
                        <option key={qg.id} value={qg.id}>🎯 QG: {qg.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Objective Summary Headline</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Code high-fidelity OKR goal mapper module"
                  className="w-full bg-[#050505] p-3 border border-white/10 text-xs text-white focus:border-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Objective Context/Description (Optional)</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Contextual details defining what success looks like..."
                  rows={2}
                  className="w-full bg-[#050505] p-3 border border-white/10 text-xs text-white focus:border-white outline-none font-mono"
                />
              </div>

              {/* Advanced OKR metrics key milestones */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-[0.2em] block font-bold">Quantifiable Key Results (OKR Metrics)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-mono text-xs">KR 1:</span>
                    <input
                      type="text"
                      value={kr1}
                      onChange={(e) => setKr1(e.target.value)}
                      placeholder="e.g. Complete 5 backend interface specs integrations"
                      className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-zinc-300 focus:border-white outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-mono text-xs">KR 2:</span>
                    <input
                      type="text"
                      value={kr2}
                      onChange={(e) => setKr2(e.target.value)}
                      placeholder="e.g. Resolve all 3 pending manual timers"
                      className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-zinc-300 focus:border-white outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-mono text-xs">KR 3:</span>
                    <input
                      type="text"
                      value={kr3}
                      onChange={(e) => setKr3(e.target.value)}
                      placeholder="e.g. Expose 100% test-complete clean exit rates"
                      className="flex-1 bg-transparent border-b border-white/10 py-1 text-xs text-zinc-300 focus:border-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule and Timelines block range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Operational Start Bound</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#050505] p-2.5 border border-white/10 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Deadline (Target Date Boundary)</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-[#050505] p-2.5 border border-white/10 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white text-black font-black font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Launch Objective Node
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 1: ACTIVE OBJECTIVES LISTS */}
        {activeTab === 'ACTIVE' && (
          <motion.div
            key="active-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Task alignment checking notification panel */}
            {unalignedTasks.length > 0 && (
              <div className="p-4 border border-amber-500/20 bg-amber-950/10 flex items-start gap-3.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">UNALIGNED FLIGHT CHECK ACTIVE ({unalignedTasks.length} NODES)</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    You have {unalignedTasks.length} active tasks not linked to any weekly objective. Link them in the task manager settings or focus card selector to drive focused strategic momentum.
                  </p>
                </div>
              </div>
            )}

            {/* QUARTERLY GOALS SECTIONS */}
            <div className="space-y-3">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.25em] block font-black">
                LEVEL 1: QUARTERLY GOALS (Macro Horizon 3 Months)
              </label>

              <div className="grid grid-cols-1 gap-4">
                {activeQuarterlyGoals.map(goal => {
                  const progress = getSubProgressPercent(goal);
                  const childObjectives = activeWeeklyObjectives.filter(w => w.parentId === goal.id);
                  const linkedTasks = allTasks.filter(t => t.goalId === goal.id);
                  const completedTasksCount = linkedTasks.filter(t => t.status === 'completed').length;

                  return (
                    <div key={goal.id} className="p-5 border border-white/10 bg-zinc-950/40 relative group space-y-4 overflow-hidden">
                      {/* Status badges */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono bg-white/10 text-white py-0.5 px-2 uppercase tracking-widest font-black rounded-none">
                            Quarterly Horizon Node
                          </span>
                          <h3 className="text-base font-black uppercase text-white tracking-tight mt-1 group-hover:text-amber-500 transition-colors">
                            {goal.title}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onUpdateGoalStatus(goal.id, 'completed')}
                            className="p-1 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-950/20 text-emerald-400 text-[9px] font-mono uppercase tracking-widest px-2"
                          >
                            Conclude
                          </button>
                          <button
                            onClick={() => onUpdateGoalStatus(goal.id, 'abandoned')}
                            className="p-1 border border-red-500/10 hover:border-red-500 bg-red-950/20 text-red-400 text-[9px] font-mono uppercase tracking-widest px-2"
                          >
                            Abandon
                          </button>
                          <button
                            onClick={() => onDeleteGoal(goal.id)}
                            className="p-1 px-1.5 text-zinc-600 hover:text-red-500 transition-colors border border-transparent hover:border-white/5"
                            title="Delete Node permanately"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1 bg-white/[0.01] p-3 border border-white/5">
                          {goal.description}
                        </p>
                      )}

                      {/* Milestones bar */}
                      <div className="space-y-1 bg-zinc-950 p-2.5 border border-white/5">
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                          <span>Incremental Milestone Rate</span>
                          <span>{progress}% Completed</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full">
                          <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* OKR checkboxes */}
                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="space-y-1.5 pt-1 pl-1">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Associated Key Results</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {goal.keyResults.map(kr => (
                              <button
                                key={kr.id}
                                onClick={() => onToggleKeyResult(goal.id, kr.id)}
                                className="flex items-center gap-2 text-left p-2 border border-white/5 bg-zinc-950 hover:bg-white/[0.02] transition-colors"
                              >
                                <div className={`w-3 h-3 border flex items-center justify-center shrink-0 ${kr.completed ? 'bg-orange-500 border-orange-500 text-black' : 'border-zinc-700'}`}>
                                  {kr.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className={`text-[10px] font-mono truncate ${kr.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                                  {kr.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alignments and relations metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-white/5 pt-3 flex-wrap text-[10px] font-mono text-zinc-500">
                        <div className="flex items-center gap-1.5 bg-white/[0.01] p-1.5 border border-white/5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Horizon: {goal.startDate || 'N/A'} — {goal.targetDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.01] p-1.5 border border-white/5">
                          <Layers className="w-3.5 h-3.5 text-orange-500/80" />
                          <span>Child Objectives: {childObjectives.length} Active</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.01] p-1.5 border border-white/5 justify-between">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Linked Tasks: {linkedTasks.length} ({completedTasksCount} solved)</span>
                          </span>
                        </div>
                      </div>

                      {/* Display child objectives as connected sub-nodes */}
                      {childObjectives.length > 0 && (
                        <div className="mt-3 bg-zinc-950/60 p-3 pt-2.5 border-t border-white/10 space-y-2">
                          <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest block">Level 1 operational subsidiaries mapping</span>
                          <div className="space-y-1.5">
                            {childObjectives.map(obj => (
                              <div key={obj.id} className="flex justify-between items-center bg-zinc-950/90 py-1.5 px-2.5 border-l-2 border-orange-500 text-xs text-zinc-300 font-mono">
                                <span className="truncate flex-1 pr-4">⚡ Weekly: {obj.title}</span>
                                <span className="text-[9px] text-zinc-500 uppercase">{getSubProgressPercent(obj)}% KR Resolved</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeQuarterlyGoals.length === 0 && (
                  <p className="text-center py-10 border border-dashed border-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                    No active Level 1 macro Quarterly goals defined. Define one to align daily operations.
                  </p>
                )}
              </div>
            </div>

            {/* WEEKLY OBJECTIVES SECTIONS */}
            <div className="space-y-3">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.25em] block font-black">
                LEVEL 2: WEEKLY OBJECTIVES (OKR Operational Sprint 1-2 Weeks)
              </label>

              <div className="grid grid-cols-1 gap-4">
                {activeWeeklyObjectives.map(goal => {
                  const progress = getSubProgressPercent(goal);
                  const parentGoal = activeQuarterlyGoals.find(qg => qg.id === goal.parentId);
                  const associatedTasks = allTasks.filter(t => t.goalId === goal.id);
                  const associatedCompletedTasks = associatedTasks.filter(t => t.status === 'completed');

                  return (
                    <div key={goal.id} className="p-4 border border-zinc-800 bg-zinc-900/10 relative group space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono bg-orange-950/50 border border-orange-500/20 text-orange-400 py-0.5 px-2 uppercase tracking-widest font-bold">
                              Operational Weekly Node
                            </span>
                            {parentGoal && (
                              <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                Parent: QG {parentGoal.title.substring(0, 18)}...
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-black uppercase text-white tracking-tight leading-tight mt-1.5">
                            {goal.title}
                          </h3>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => onUpdateGoalStatus(goal.id, 'completed')}
                            className="p-1 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-950/20 text-emerald-400 text-[9px] font-mono uppercase tracking-widest px-2"
                          >
                            Mark Solved
                          </button>
                          <button
                            onClick={() => onUpdateGoalStatus(goal.id, 'abandoned')}
                            className="p-1 border border-red-500/10 hover:border-red-500 bg-red-950/20 text-red-400 text-[9px] font-mono uppercase tracking-widest px-2"
                          >
                            Abandon
                          </button>
                          <button
                            onClick={() => onDeleteGoal(goal.id)}
                            className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-[11px] text-zinc-400 leading-normal font-sans bg-zinc-950 py-2 px-3 border border-white/5">
                          {goal.description}
                        </p>
                      )}

                      {/* Milestones bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                          <span>Completeness Rate</span>
                          <span>{progress}% Completed</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full">
                          <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* Key results Checklist */}
                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="space-y-1.5 bg-zinc-950 p-2.5 border border-white/5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Objectives Key Milestones</span>
                          <div className="space-y-1">
                            {goal.keyResults.map(kr => (
                              <button
                                key={kr.id}
                                onClick={() => onToggleKeyResult(goal.id, kr.id)}
                                className="flex items-center gap-2 text-left p-1 text-[11px] hover:bg-white/[0.01] w-full"
                              >
                                <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${kr.completed ? 'bg-white border-white text-black' : 'border-zinc-700'}`}>
                                  {kr.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className={`font-mono text-[11px] ${kr.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                                  {kr.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task association display */}
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-500 animate-pulse-subtle" />
                          <span>Timeline bounds: {goal.startDate || 'Immediate' } — {goal.targetDate}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/[0.02] py-0.5 px-2 border border-white/5">
                          <span>Tasks Linked: {associatedTasks.length} ({associatedCompletedTasks.length} done)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeWeeklyObjectives.length === 0 && (
                  <p className="text-center py-10 border border-dashed border-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                    No active Level 2 Operational Objectives found. Link individual actions here to protect daily focus!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: WEEKLY GUIDED REVIEW ENGINE */}
        {activeTab === 'REVIEW' && (
          <motion.div
            key="review-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 border border-white/10 bg-zinc-950 space-y-6"
          >
            <div className="border-b border-white/5 pb-3">
              <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest font-black block">Weekly OKR Accountability Engine</span>
              <h3 className="text-lg font-black uppercase text-white tracking-tight">Active Horizon Review Cycle</h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Let's audit last week's objective success rates, record mistakes, and recalibrate future milestones.</p>
            </div>

            {/* Stepper display */}
            <div className="flex items-center gap-3 font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2">
              <span className={reviewStep >= 1 ? 'text-white' : ''}>1. Audit Goals</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className={reviewStep >= 2 ? 'text-white' : ''}>2. Reflection Logs</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className={reviewStep >= 3 ? 'text-white' : ''}>3. Recalibrate Horizon</span>
            </div>

            {/* STEP 1: AUDIT OF GOALS */}
            {reviewStep === 1 && (
              <div className="space-y-4">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">Review progression rates of your current operational targets:</p>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {goals.map(obj => {
                    const rate = getSubProgressPercent(obj);
                    return (
                      <div key={obj.id} className="p-3 border border-white/5 bg-white/[0.01] flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white uppercase">{obj.type === 'quarterly' ? 'QG' : 'WO'}: {obj.title}</span>
                          <p className="text-[10px] text-zinc-500 font-mono">Bound: {obj.targetDate} ({obj.status.toUpperCase()})</p>
                        </div>
                        <div className="text-right font-mono text-xs text-orange-400 font-bold shrink-0">
                          {rate}% Completed
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <p className="text-zinc-600 mt-2 italic text-xs">No goals currently defined. Skip audit to define milestones.</p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setReviewStep(2)}
                    className="py-2.5 px-6 bg-white text-black font-mono font-bold text-[10px] uppercase tracking-widest hover:opacity-90"
                  >
                    Next Step: Reflect
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOG REFLECTION NOTES */}
            {reviewStep === 2 && (
              <div className="space-y-4 font-mono">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-black block">What were your major breakthroughs this week? (Growth Notes)</label>
                  <textarea
                    value={weeklyAccomplishText}
                    onChange={(e) => setWeeklyAccomplishText(e.target.value)}
                    placeholder="We crushed establishing the database framework and hit 100% of milestones..."
                    rows={3}
                    className="w-full bg-[#050505] p-3 border border-white/10 text-xs text-white focus:border-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-black block">What common blockers threw off execution timelines? (Mistakes Logs)</label>
                  <textarea
                    value={weeklyCorrectionText}
                    onChange={(e) => setWeeklyCorrectionText(e.target.value)}
                    placeholder="Delayed API documentation and browser context switching over deep work blocks..."
                    rows={3}
                    className="w-full bg-[#050505] p-3 border border-white/10 text-xs text-white focus:border-white outline-none"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setReviewStep(1)}
                    className="py-2 px-4 border border-white/10 hover:border-white font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={() => setReviewStep(3)}
                    className="py-2.5 px-6 bg-white text-black font-bold font-mono text-[10px] uppercase tracking-widest hover:opacity-90"
                  >
                    Next Step: Recalibrate
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RE-ALIGNS HORIZON TARGET BOUNDARIES */}
            {reviewStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 border border-orange-500/10 bg-orange-950/15 text-orange-400/90 text-xs leading-relaxed space-y-1 font-sans">
                  <p className="font-bold">Horizon recalibration recommendation:</p>
                  <p>Shift deadline bounds or add new key subtask segments below. Make sure unaligned tasks are mapped to goals before starting your next weekly horizon.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-mono text-zinc-500 uppercase font-extrabold pb-1">Edit Deadline Boundaries on Active Goals</p>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {goals.filter(g => g.status === 'active').map(goal => (
                      <div key={goal.id} className="p-2 border border-white/5 bg-zinc-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <span className="text-xs truncate font-mono font-bold">{goal.title}</span>
                        <input
                          type="date"
                          value={goal.targetDate}
                          onChange={(e) => onEditGoal(goal.id, { targetDate: e.target.value })}
                          className="bg-black border border-white/10 py-1 px-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setReviewStep(2)}
                    className="py-2 px-4 border border-white/10 hover:border-white font-mono text-[10px] uppercase tracking-widest text-[#999] hover:text-white"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleWeeklyReviewSubmit}
                    className="py-3 px-8 bg-white text-black font-black font-mono text-xs uppercase tracking-widest hover:opacity-95 text-center transition-all"
                  >
                    Complete Goal Review Range
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: ARCHIVE OF GOALS */}
        {activeTab === 'ARCHIVE' && (
          <motion.div
            key="archive-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <section className="space-y-3">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
                Completed Strategic Targets ({completedGoals.length})
              </label>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="p-3 border border-emerald-500/20 bg-emerald-950/10 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-xs text-zinc-400 font-bold block">{goal.title}</span>
                      <span className="text-[8px] text-zinc-500">CONCLUDED BOUND: {goal.targetDate}</span>
                    </div>
                    <div className="flex gap-2">
                       <button
                         onClick={() => onUpdateGoalStatus(goal.id, 'active')}
                         className="p-1 px-2 border border-white/15 hover:border-white hover:text-white text-[9px] text-zinc-400 uppercase tracking-wider"
                       >
                         Reactivate
                       </button>
                       <CheckSquare className="w-4 h-4 text-emerald-400 mt-1" />
                    </div>
                  </div>
                ))}
                {completedGoals.length === 0 && (
                  <p className="p-4 border border-zinc-850 bg-zinc-950 text-center text-[10px] font-mono text-zinc-650 uppercase italic">No completed targets.</p>
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-white/5 pt-4">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.25em] block">
                Abandoned (Aborted) Objectives ({abandonedGoals.length})
              </label>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {abandonedGoals.map(goal => (
                  <div key={goal.id} className="p-3 border border-red-500/10 bg-red-950/5 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-xs text-zinc-500 block font-light">{goal.title}</span>
                      <span className="text-[8px] text-zinc-650">ABORTED TIME RANGE: {goal.targetDate}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateGoalStatus(goal.id, 'active')}
                        className="p-1 px-2 border border-white/15 hover:border-white hover:text-white text-[9px] text-zinc-400 uppercase tracking-widest"
                      >
                        Reactivate Target
                      </button>
                      <XCircle className="w-4 h-4 text-red-500/60 mt-1" />
                    </div>
                  </div>
                ))}
                {abandonedGoals.length === 0 && (
                  <p className="p-4 border border-zinc-850 bg-zinc-950 text-center text-[10px] font-mono text-zinc-650 uppercase italic">No abandoned objectives.</p>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
