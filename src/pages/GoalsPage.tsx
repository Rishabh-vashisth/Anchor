import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  FileText,
  HelpCircle,
  TrendingUp,
  XSquare,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2
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
  onUpdateGoalStatus,
  onToggleKeyResult,
  onDeleteGoal
}: GoalsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Form input states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState<'quarterly' | 'weekly'>('weekly');
  const [targetDate, setTargetDate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom milestones / key results
  const [krInputs, setKrInputs] = useState<string[]>(['', '', '']);

  // Handle adding custom key result input fields
  const handleAddKrField = () => {
    if (krInputs.length < 8) {
      setKrInputs([...krInputs, '']);
    }
  };

  const handleKrInputChange = (index: number, val: string) => {
    const updated = [...krInputs];
    updated[index] = val;
    setKrInputs(updated);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const keyResultTexts = krInputs.filter(k => k.trim() !== '');
    
    // Fallback date if none provided
    const finalTargetDate = targetDate || new Date(Date.now() + 30 * 86450000).toISOString().split('T')[0];

    onAddGoal(
      goalTitle.trim(),
      finalTargetDate,
      keyResultTexts,
      goalType,
      null, // parenId is suppressed to avoid complex nested hierarchy UI
      goalDescription.trim() || undefined,
      startDate || undefined
    );

    // Reset Form
    setGoalTitle('');
    setGoalDescription('');
    setGoalType('weekly');
    setTargetDate('');
    setKrInputs(['', '', '']);
    setShowAddForm(false);
  };

  // Filter to active or recently completed goals
  const activeGoals = useMemo(() => {
    return goals.filter(g => g.status === 'active');
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter(g => g.status === 'completed');
  }, [goals]);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Simplified Header with light details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#e25424] font-mono text-xs uppercase tracking-widest font-black mb-1">
              <Target className="w-4 h-4" />
              <span>Alignment Platform</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Objectives & Milestones</h1>
            <p className="text-zinc-500 text-xs font-sans mt-1">
              Establish top-level benchmarks. Connect your active focus tasks with long-term strategic results.
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="self-start md:self-center py-2 px-4 border border-[#e25424] bg-[#e25424]/10 text-white font-mono text-xs uppercase tracking-widest font-black flex items-center gap-2 hover:bg-[#e25424]/20 transition-all cursor-pointer"
          >
            {showAddForm ? <XSquare className="w-4 h-4 text-orange-400" /> : <Plus className="w-4 h-4 text-orange-400" />}
            <span>{showAddForm ? 'Close panel' : 'New Objective'}</span>
          </button>
        </div>

        {/* Add Goal Light-Themed Modal Card overlay */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white text-zinc-950 p-6 md:p-8 shadow-2xl space-y-6 border border-zinc-200 uppercase-no-more rounded-none"
            >
              <div className="border-b border-zinc-200 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#e25424] block mb-0.5">Define alignment node</span>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">CREATE STRATEGIC OBJECTIVE</h2>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 font-bold transition-colors text-xs font-mono"
                >
                  [DISMISS]
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4 font-sans text-sm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Goal Title / Milestone description *</label>
                    <input
                      required
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g. Launch Alpha Release of Core App"
                      className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-zinc-950 text-xs focus:ring-1 focus:ring-zinc-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Milestone Cadence</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGoalType('weekly')}
                        className={`flex-1 py-1.5 px-3 border text-center font-mono text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                          goalType === 'weekly'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'border-zinc-200 text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        Weekly Sprint
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalType('quarterly')}
                        className={`flex-1 py-1.5 px-3 border text-center font-mono text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                          goalType === 'quarterly'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'border-zinc-200 text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        Quarterly Target
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Short description (Optional Context)</label>
                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Provide supportive parameters or success thresholds..."
                    rows={2}
                    className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-zinc-950 text-xs focus:ring-1 focus:ring-zinc-900 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Start Calendar Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-zinc-950 text-xs focus:ring-1 focus:ring-zinc-900 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Target Complete Deadline</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 text-zinc-950 text-xs focus:ring-1 focus:ring-zinc-900 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Checklist Key Results Inputs in Light Theme */}
                <div className="space-y-2 pt-2 border-t border-zinc-150">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase font-black text-zinc-500 tracking-wider">Actionable Key Results Checklist</label>
                    {krInputs.length < 8 && (
                      <button
                        type="button"
                        onClick={handleAddKrField}
                        className="text-[9px] font-mono text-[#e25424] uppercase font-bold hover:underline"
                      >
                        + Add Checkpoint Key Result
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {krInputs.map((kr, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-[9px] font-mono text-zinc-400 w-4 font-bold">{index + 1}.</span>
                        <input
                          type="text"
                          value={kr}
                          onChange={(e) => handleKrInputChange(index, e.target.value)}
                          placeholder={`Key Result Action item #${index + 1}`}
                          className="flex-1 bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 text-zinc-955 text-xs outline-none focus:border-zinc-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2 px-4 border border-zinc-300 text-zinc-500 font-mono text-xs uppercase font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-zinc-950 hover:bg-zinc-900 text-white font-mono text-xs uppercase font-black tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Commit Milestone ➔
                  </button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative optional prompt banner if goals database empty */}
        {activeGoals.length === 0 && completedGoals.length === 0 && (
          <div className="border border-white/5 bg-zinc-950/40 p-10 text-center space-y-4">
            <div className="mx-auto w-10 h-10 border border-white/10 flex items-center justify-center text-zinc-400">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <span className="text-xs text-white uppercase font-black tracking-widest font-mono block">No active goals linked</span>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Unlock top-level precision. When you set a goal, you can bind focused daily tasks to it as checkpoints. This helps keep you aligned.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="py-1.5 px-3 border border-orange-500/25 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 font-mono text-[9px] uppercase font-black tracking-widest transition-all cursor-pointer"
            >
              Set First Milestone Objective
            </button>
          </div>
        )}

        {/* Goals Listing Section */}
        {activeGoals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-widest">
              <span>ACTIVE KEY OBJECTIVES</span>
              <span className="h-px bg-white/5 flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeGoals.map(goal => {
                const isExpanded = expandedGoalId === goal.id;
                
                // Calculate completion metrics
                const krs = goal.keyResults || [];
                const completedKrsCount = krs.filter(kr => kr.completed).length;
                const progressPercent = krs.length > 0 ? Math.round((completedKrsCount / krs.length) * 100) : 0;

                // Find linked tasks count
                const linkedTasks = allTasks.filter(t => t.goalId === goal.id);

                return (
                  <div 
                    key={goal.id}
                    className="bg-white text-zinc-950 shadow-md border border-zinc-200 overflow-hidden transition-all duration-300 rounded-none w-full"
                  >
                    {/* Goal Card Header / Condensed layout */}
                    <div 
                      onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-[8.5px] font-mono uppercase tracking-wider font-extrabold text-zinc-500">
                          <span className={`px-2 py-0.5 border ${goal.type === 'quarterly' ? 'border-[#e25424] text-[#e25424] bg-orange-50' : 'border-zinc-300 text-zinc-600 bg-zinc-100'}`}>
                            {goal.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            Target: {goal.targetDate}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-zinc-900 tracking-tight leading-snug">
                          {goal.title}
                        </h3>

                        {goal.description && (
                          <p className="text-[11px] text-zinc-500 line-clamp-1 truncate font-sans">
                            {goal.description}
                          </p>
                        )}
                      </div>

                      {/* Right Hand Side Progress Block */}
                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-zinc-100 pt-3 md:pt-0">
                        <div className="space-y-1 text-right min-w-[120px]">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-700">
                            <span>RESOLVED:</span>
                            <span>{progressPercent}%</span>
                          </div>
                          
                          {/* Symmetrical Light Theme Progress Slider */}
                          <div className="h-2 w-full bg-zinc-100 border border-zinc-200 overflow-hidden">
                            <div className="h-full bg-zinc-900 transition-all duration-300 font-mono" style={{ width: `${progressPercent}%` }} />
                          </div>

                          <div className="text-[9px] font-mono text-zinc-500 text-left flex justify-between pr-0.5">
                            <span>{completedKrsCount}/{krs.length} KRs</span>
                            <span>{linkedTasks.length} serving tasks</span>
                          </div>
                        </div>

                        <div className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Key Actions and Served list details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-zinc-200 bg-zinc-50 p-5 space-y-4 text-xs select-text font-sans text-zinc-800"
                        >
                          {/* Milestone Key Results Checklist */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#e25424]">Key Checkpoint Milestones</h4>
                            
                            {krs.length === 0 ? (
                              <p className="text-zinc-500 italic text-[11px]">No check-points defined. Click "Complete Goal" to close this target.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {krs.map(kr => (
                                  <div 
                                    key={kr.id}
                                    onClick={() => onToggleKeyResult(goal.id, kr.id)}
                                    className="border border-zinc-200 bg-white p-3 flex items-start gap-2.5 transition-colors cursor-pointer select-none hover:bg-zinc-100"
                                  >
                                    <button
                                      type="button"
                                      className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${
                                        kr.completed 
                                          ? 'bg-zinc-900 border-zinc-900 text-white' 
                                          : 'border-zinc-300 text-transparent'
                                      }`}
                                    >
                                      ✓
                                    </button>
                                    <span className={`text-[11.5px] leading-tight ${kr.completed ? 'line-through text-zinc-400 font-medium' : 'text-zinc-800 font-medium'}`}>
                                      {kr.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Served Tasks alignment listing */}
                          <div className="space-y-2 pt-3 border-t border-zinc-200/60">
                            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500">Currently Aligned Focus Activities ({linkedTasks.length})</h4>
                            {linkedTasks.length === 0 ? (
                              <p className="text-zinc-500 italic text-[10.5px]">No currently serving focus tasks. Link tasks inside your main task backlog editor.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {linkedTasks.map(task => (
                                  <div key={task.id} className="flex items-center gap-2 text-zinc-700 bg-white border border-zinc-150 p-2 font-mono text-[10px] uppercase-no-more">
                                    <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'abandoned' ? 'bg-zinc-300' : 'bg-amber-500'}`} />
                                    <span className={`font-sans flex-1 ${task.status === 'completed' ? 'line-through text-zinc-400' : ''}`}>{task.text}</span>
                                    <span className="text-[8px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 shrink-0 uppercase">
                                      {task.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions Footer - Complete, Delete */}
                          <div className="pt-4 border-t border-zinc-200 flex justify-between items-center gap-4 flex-wrap">
                            <span className="text-[10px] font-mono text-zinc-500">
                              Objective created {new Date(goal.createdAt).toLocaleDateString()}
                            </span>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => onUpdateGoalStatus(goal.id, 'completed')}
                                className="py-1.5 px-3 bg-zinc-900 border border-zinc-900 hover:bg-zinc-800 text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                              >
                                Complete Goal ✓
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this strategic objective? This action is permanent.")) {
                                    onDeleteGoal(goal.id);
                                  }
                                }}
                                className="py-1.5 px-3 border border-red-300 text-red-500 hover:bg-red-50 font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
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
        )}

        {/* Option to show completed / archived goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-600 font-bold tracking-widest">
              <span>COMPLETED ARCHIVE ({completedGoals.length})</span>
              <span className="h-px bg-white/5 flex-1" />
            </div>

            <div className="space-y-2">
              {completedGoals.map(goal => (
                <div key={goal.id} className="border border-white/5 bg-zinc-950/20 p-3 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-zinc-300 font-sans line-through">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500 uppercase">{goal.type}</span>
                    <button
                      onClick={() => onUpdateGoalStatus(goal.id, 'active')}
                      className="text-[#e25424] hover:underline uppercase text-[9px]"
                    >
                      Re-activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
