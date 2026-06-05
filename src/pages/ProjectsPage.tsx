import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Map, 
  Hourglass, 
  History, 
  Compass, 
  Sparkles, 
  X, 
  ArrowRight, 
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  Archive,
  Compass as OrbitIcon
} from 'lucide-react';
import { Goal, GoalKeyResult, Task, GoalStatus, GoalType } from '../types';
import { getGoalBreakdown } from '../utils/geminiSuggestService';

interface ProjectsPageProps {
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
  onUpdateGoalStatus: (goalId: string, status: GoalStatus) => void;
  onToggleKeyResult: (goalId: string, krId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onAddTask?: (text: string, category?: string, goalId?: string) => void;
  onSetPrimary?: (id: string) => void;
}

export function ProjectsPage({
  goals = [],
  allTasks = [],
  onAddGoal,
  onEditGoal,
  onUpdateGoalStatus,
  onToggleKeyResult,
  onDeleteGoal,
  onAddTask,
  onSetPrimary
}: ProjectsPageProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form input states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('weekly');
  const [parentId, setParentId] = useState<string>('');
  const [targetDate, setTargetDate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [kr1, setKr1] = useState('');
  const [kr2, setKr2] = useState('');
  const [kr3, setKr3] = useState('');

  // AI Suggestion states
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<{
    breakdownTitle: string;
    keyResults: string[];
    subtasks: string[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quick Action form inside details
  const [quickTaskText, setQuickTaskText] = useState('');

  // Active or archived projects list
  const activeProjects = useMemo(() => {
    return goals.filter(g => g.status === 'active');
  }, [goals]);

  const selectedProject = useMemo(() => {
    return goals.find(g => g.id === selectedGoalId);
  }, [goals, selectedGoalId]);

  // Spatial alignment configurations for our Project Universe Map
  const spatialNodes = useMemo(() => {
    // Return centered coordinates and visual shapes mapped to goals
    return activeProjects.map((p, idx) => {
      const angle = (idx / (activeProjects.length || 1)) * 2 * Math.PI;
      const radius = 130 + (idx % 2 === 0 ? 30 : -30); // staggered orbitals
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);
      
      return {
        ...p,
        coords: { x, y },
        driftSpeedSec: 8 + (idx % 3) * 4,
        size: p.type === 'quarterly' ? 120 : 96,
      };
    });
  }, [activeProjects]);

  const handleAiBreakdown = async () => {
    if (!goalTitle.trim()) {
      alert("Please enter a Project Title first so Anchor AI has context!");
      return;
    }
    setIsBreakingDown(true);
    setAiError(null);
    try {
      const res = await getGoalBreakdown(goalTitle, goalDescription);
      setAiBreakdown(res);
    } catch (e: any) {
      setAiError(e.message || "Failed to call Gemini advisor.");
    } finally {
      setIsBreakingDown(false);
    }
  };

  const applyAiBreakdown = () => {
    if (aiBreakdown) {
      setGoalTitle(aiBreakdown.breakdownTitle);
      if (aiBreakdown.keyResults[0]) setKr1(aiBreakdown.keyResults[0]);
      if (aiBreakdown.keyResults[1]) setKr2(aiBreakdown.keyResults[1]);
      if (aiBreakdown.keyResults[2]) setKr3(aiBreakdown.keyResults[2]);
      setAiBreakdown(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim()) {
      const krs = [kr1, kr2, kr3].filter(t => t.trim() !== '');
      onAddGoal(
        goalTitle.trim(),
        targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        krs,
        goalType,
        goalType === 'weekly' && parentId ? parentId : null,
        goalDescription.trim(),
        startDate
      );
      
      // Cleanup inputs
      setGoalTitle('');
      setGoalDescription('');
      setGoalType('weekly');
      setParentId('');
      setTargetDate('');
      setKr1('');
      setKr2('');
      setKr3('');
      setShowAddForm(false);
    }
  };

  const handleQuickTaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTaskText.trim() && selectedGoalId && onAddTask) {
      onAddTask(quickTaskText.trim(), 'KEEP', selectedGoalId);
      setQuickTaskText('');
    }
  };

  // Continuity Calculations for the Detail Sidebar Panel
  const selectedProjectDetails = useMemo(() => {
    if (!selectedProject) return null;
    
    const tasks = allTasks.filter(t => t.goalId === selectedProject.id);
    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'pending');
    
    // Find last activity date
    let lastActiveDateStr = "Never";
    if (tasks.length > 0) {
      const sorted = [...tasks].sort((a,b) => b.createdAt - a.createdAt);
      lastActiveDateStr = new Date(sorted[0].createdAt).toLocaleDateString();
    }

    // Estimate restart energy
    let restartEffort: 'Low' | 'Medium' | 'High' = 'Low';
    if (pending.length > 5) restartEffort = 'High';
    else if (pending.length >= 3) restartEffort = 'Medium';

    return {
      tasks,
      completed,
      pending,
      lastActiveDateStr,
      restartEffort,
    };
  }, [selectedProject, allTasks]);

  return (
    <div className="space-y-8 select-none py-4 relative">
      
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium block">
            Project Space Interface
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Project Universe
          </h2>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Floating nodes structured by cognitive load. Select any project orbit to retrieve context and resume work.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-white hover:bg-zinc-200 text-black font-mono text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-2 cursor-pointer transition-all self-end md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Initialize Portal
        </button>
      </div>

      {/* Spatial Universe Map Canvas */}
      <div className="relative w-full h-[460px] border border-white/5 bg-[#070709] overflow-hidden flex items-center justify-center">
        
        {/* Starfields / Ambient grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        
        {/* Orbital concentric circles */}
        <div className="absolute w-[200px] h-[200px] border border-white/[0.02] rounded-full pointer-events-none" />
        <div className="absolute w-[340px] h-[340px] border border-white/[0.015] rounded-full pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] border border-dashed border-white/[0.01] rounded-full pointer-events-none" />

        <div className="absolute text-center select-none pointer-events-none z-10">
          <OrbitIcon className="w-8 h-8 text-zinc-700/60 mx-auto animate-spin" style={{ animationDuration: '60s' }} />
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600 block mt-1">Anchor Center</span>
        </div>

        {/* Spatial nodes mapped */}
        <div className="relative w-full h-full flex items-center justify-center">
          {spatialNodes.map((p) => {
            const isSelected = selectedGoalId === p.id;
            const completedCount = p.keyResults.filter(kr => kr.completed).length;
            const progress = p.keyResults.length > 0 ? Math.round((completedCount / p.keyResults.length) * 100) : 0;
            
            return (
              <motion.div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${p.coords.x}px - ${p.size / 2}px)`,
                  top: `calc(50% + ${p.coords.y}px - ${p.size / 2}px)`,
                }}
                animate={{
                  y: [0, -5, 5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: p.driftSpeedSec,
                  ease: "easeInOut",
                }}
                className="z-20 cursor-pointer"
              >
                <div
                  onClick={() => setSelectedGoalId(p.id)}
                  className={`rounded-full flex flex-col justify-center items-center text-center p-4 transition-all duration-300 relative ${
                    isSelected 
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)] border-2 border-white' 
                      : 'bg-zinc-950 hover:bg-[#0c0d10] text-white border border-white/10'
                  }`}
                  style={{ width: p.size, height: p.size }}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider block font-sans truncate w-20`}>
                    {p.title}
                  </span>
                  
                  {p.keyResults.length > 0 && (
                    <span className={`text-[8px] font-mono mt-1 ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      {completedCount}/{p.keyResults.length} Orbit
                    </span>
                  )}

                  {/* Micro completion ring border */}
                  <svg className="absolute inset-0 -m-[1px]" width={p.size} height={p.size}>
                    <circle
                      cx={p.size / 2}
                      cy={p.size / 2}
                      r={(p.size / 2) - 3}
                      fill="transparent"
                      stroke={isSelected ? "#0000000a" : "rgba(255,255,255,0.05)"}
                      strokeWidth="2"
                    />
                    <circle
                      cx={p.size / 2}
                      cy={p.size / 2}
                      r={(p.size / 2) - 3}
                      fill="transparent"
                      stroke={isSelected ? "#f97316" : "rgba(255,255,255,0.4)"}
                      strokeWidth="2"
                      strokeDasharray={Math.PI * (p.size - 6)}
                      strokeDashoffset={(1 - (progress / 100)) * Math.PI * (p.size - 6)}
                    />
                  </svg>
                </div>
              </motion.div>
            );
          })}

          {spatialNodes.length === 0 && (
            <div className="text-center space-y-2 z-10 max-w-xs p-6 bg-zinc-950/80 border border-white/5">
              <span className="text-lg">🌌</span>
              <p className="text-[10px] font-mono uppercase text-zinc-500">Universe Blank</p>
              <p className="text-xs text-zinc-400">Initialize a project portal above to expand spatial memory clusters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Interactive Detail Drawer overlay/sidebar or embedded block */}
      <AnimatePresence>
        {selectedProject && selectedProjectDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 md:p-8 border border-white/10 bg-[#09090b] relative space-y-6"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedGoalId(null)}
              className="absolute top-4 right-4 p-1 rounded-sm border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Project Detail Portal</span>
                <h3 className="text-xl font-bold text-white">{selectedProject.title}</h3>
                {selectedProject.description && (
                  <p className="text-xs text-zinc-400 italic max-w-xl">{selectedProject.description}</p>
                )}
              </div>

              {/* Status and Actions Toggle */}
              <div className="flex items-center gap-2 font-mono text-[9px]">
                <button
                  onClick={() => onUpdateGoalStatus(selectedProject.id, 'completed')}
                  className={`px-3 py-1 border uppercase font-bold transition-colors ${
                    selectedProject.status === 'completed' 
                      ? 'bg-emerald-600 text-white border-emerald-500' 
                      : 'border-white/10 hover:border-white/30 text-zinc-400'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => onDeleteGoal(selectedProject.id)}
                  className="px-3 py-1 border border-red-500/10 hover:border-red-500/40 text-red-400 font-bold uppercase transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Grid Layout: Continuity metrics (Left) vs Tasks checklist (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Context Reconstructor (Anchor flagged Continuity System!) */}
              <div className="space-y-6">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase font-bold block">Anchor Continuity Reconstructor</span>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Last active indicator */}
                  <div className="p-3 border border-white/5 bg-zinc-950/20 rounded-none space-y-1 text-left">
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">Last Activity Stamp</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                      <History className="w-3.5 h-3.5 text-zinc-500" />
                      {selectedProjectDetails.lastActiveDateStr}
                    </span>
                  </div>

                  {/* Estimated restart effort indicator */}
                  <div className="p-3 border border-white/5 bg-zinc-950/20 rounded-none space-y-1 text-left">
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">Estimated Restart Effort</span>
                    <span className={`text-sm font-bold flex items-center gap-1.5 font-mono ${
                      selectedProjectDetails.restartEffort === 'High' ? 'text-orange-500' :
                      selectedProjectDetails.restartEffort === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'
                    }`}>
                      <Hourglass className="w-3.5 h-3.5" />
                      {selectedProjectDetails.restartEffort} Effort
                    </span>
                  </div>
                </div>

                {/* Progress Journey orbits (Milestones/Key Results of project) */}
                <div className="p-4 border border-white/5 bg-[#050507] space-y-3 text-left">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Progress Journey Milestones</span>
                  
                  {selectedProject.keyResults.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.keyResults.map(kr => (
                        <button
                          key={kr.id}
                          onClick={() => onToggleKeyResult(selectedProject.id, kr.id)}
                          className="w-full flex items-center gap-3 text-left p-2 hover:bg-white/[0.01] border border-transparent hover:border-white/5 transition-all text-xs font-mono"
                        >
                          <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                            kr.completed ? 'bg-white text-black border-white' : 'border-zinc-800 text-transparent'
                          }`}>
                            ✓
                          </span>
                          <span className={`${kr.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            {kr.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-zinc-600 italic font-mono">No milestone key results mapped. Add them in the system.</p>
                  )}
                </div>

                {/* Recent notes detail */}
                <div className="p-4 bg-zinc-900/10 border border-white/5 text-[11px] text-zinc-400 space-y-1 leading-relaxed text-left">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">Spatial Notes Log</span>
                  <p className="font-sans italic">
                    "Cognitive focus index tracking is active on this portal. To optimize context, write micro tasks that anchor the brain to this space."
                  </p>
                </div>
              </div>

              {/* Right Column: Suggested Next Actions checklist */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase font-bold block">Current Focus Node Queue</span>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedProjectDetails.tasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-2.5 bg-[#050507] border border-white/5 hover:border-white/10 transition-all font-mono">
                      <div className="space-y-0.5">
                        <span className={`text-[11px] leading-snug block ${t.status === 'completed' ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                          {t.text}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase">
                          {t.status.toUpperCase()} • Created {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {t.status === 'pending' && onSetPrimary && (
                        <button
                          onClick={() => onSetPrimary(t.id)}
                          className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-white text-[9px] uppercase tracking-wider text-zinc-300 font-bold transition-all"
                        >
                          Anchor Day Focus
                        </button>
                      )}
                    </div>
                  ))}

                  {selectedProjectDetails.tasks.length === 0 && (
                    <div className="text-center py-6 border border-zinc-900 border-dashed">
                      <p className="text-[10px] text-zinc-600 font-mono">No active workload tasks mapped to this portal.</p>
                    </div>
                  )}
                </div>

                {/* Quickly append node form */}
                <form onSubmit={handleQuickTaskAdd} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={quickTaskText}
                    onChange={(e) => setQuickTaskText(e.target.value)}
                    placeholder="Briefly index a next workload step..."
                    className="flex-1 bg-transparent border-b border-white/10 p-2 text-xs font-mono text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-800"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-white text-black font-mono text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                  >
                    Append Task
                  </button>
                </form>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Project Form Drawer Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowAddForm(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0e0e11] border border-white/10 p-6 md:p-8 shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em]">Portal Initialization Wizard</span>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-400 hover:text-white transition-all p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest block">Project Title Headline</label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Redesign Cloud SQL PostgreSQL database indexes"
                    className="w-full bg-zinc-950 border border-white/5 p-3 text-xs font-mono text-white focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest block">Project Description Statement</label>
                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Briefly state why this project matters and where you intend to take it..."
                    className="w-full bg-zinc-950 border border-white/5 p-3 text-xs font-mono text-white h-20 resize-none focus:outline-none focus:border-white transition-all"
                  />
                </div>

                {/* AI suggested breakdown module */}
                <div className="space-y-2 text-left bg-zinc-950 p-4 border border-white/5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-wider block">Advisor Breakdown</span>
                    <button
                      type="button"
                      disabled={isBreakingDown}
                      onClick={handleAiBreakdown}
                      className="text-[9px] font-mono text-orange-400 hover:text-orange-300 font-bold uppercase transition-colors"
                    >
                      {isBreakingDown ? "Deconstructing..." : "⚡ Run Advisor Breakdown"}
                    </button>
                  </div>

                  {aiBreakdown ? (
                    <div className="space-y-2 p-2 border border-dashed border-white/5 mt-2">
                      <p className="text-[10px] text-zinc-400">Advisor suggest milestones:</p>
                      <ul className="list-disc pl-4 text-[9px] text-zinc-500 space-y-1">
                        {aiBreakdown.keyResults.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      <button
                        type="button"
                        onClick={applyAiBreakdown}
                        className="bg-white text-black py-1 px-3 text-[9px] font-mono uppercase tracking-widest"
                      >
                        Apply Suggested Milestones
                      </button>
                    </div>
                  ) : (
                    <p className="text-[8px] text-zinc-700 font-mono">Let AI Suggest milestones and decompose your projects based on Title.</p>
                  )}
                </div>

                {/* Milestones key results manually add */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest block">Project Milestones (Max 3)</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={kr1}
                      onChange={(e) => setKr1(e.target.value)}
                      placeholder="Milestone Node A"
                      className="w-full bg-zinc-950 border border-white/5 p-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                    <input
                      type="text"
                      value={kr2}
                      onChange={(e) => setKr2(e.target.value)}
                      placeholder="Milestone Node B"
                      className="w-full bg-zinc-950 border border-white/5 p-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                    <input
                      type="text"
                      value={kr3}
                      onChange={(e) => setKr3(e.target.value)}
                      placeholder="Milestone Node C"
                      className="w-full bg-zinc-950 border border-white/5 p-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest block">Target Deadline</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 p-3 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest block">Objective Scope</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as GoalType)}
                      className="w-full bg-zinc-950 border border-white/5 p-3 text-xs font-mono text-white focus:outline-none focus:border-white"
                    >
                      <option value="weekly">Weekly Core Project</option>
                      <option value="quarterly">Quarterly Grand Portal</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-black font-mono text-xs uppercase tracking-widest hover:opacity-95 mt-4"
                >
                  Map to Spatial Universe Array
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
