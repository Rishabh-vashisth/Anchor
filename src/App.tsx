/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Anchor, 
  Target, 
  Brain, 
  Clock, 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  Circle, 
  XCircle,
  Trash2, 
  ArrowRight,
  AlertCircle,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAnchorState } from './hooks/useAnchorState';
import { Task, TimeBlockType } from './types';

type View = 'FOCUS' | 'BLOCKS' | 'DUMP' | 'STATS';

export default function App() {
  const { state, addTask, categorizeTask, setPrimaryTask, assignToBlock, toggleTaskStatus, deleteTask, abandonTask } = useAnchorState();
  const [currentView, setCurrentView] = useState<View>('FOCUS');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);

  const primaryTask = state.tasks.find(t => t.id === state.primaryTaskId);

  const handleSetPrimary = (id: string) => {
    if (state.primaryTaskId && state.primaryTaskId !== id) {
      setShowSwitchConfirm(id);
    } else {
      setPrimaryTask(id);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-white" />
          <h1 className="text-xl font-black tracking-tighter uppercase">Anchor</h1>
        </div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {currentView === 'FOCUS' && (
            <FocusView 
              primaryTask={primaryTask} 
              tasks={state.tasks.filter(t => t.category === 'KEEP')}
              onSetPrimary={handleSetPrimary}
              onToggle={toggleTaskStatus}
            />
          )}
          {currentView === 'BLOCKS' && (
            <BlocksView 
              tasks={state.tasks.filter(t => t.category === 'KEEP')}
              onAssign={assignToBlock}
              onToggle={toggleTaskStatus}
              onAbandon={abandonTask}
            />
          )}
          {currentView === 'DUMP' && (
            <DumpView 
              tasks={state.tasks.filter(t => t.category === 'NONE')}
              onAdd={addTask}
              onCategorize={categorizeTask}
              onDelete={deleteTask}
            />
          )}
          {currentView === 'STATS' && (
            <StatsView 
              tasks={state.tasks}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-white/10 flex justify-around p-4 z-50">
        <NavButton active={currentView === 'FOCUS'} onClick={() => setCurrentView('FOCUS')} icon={<Target />} label="Focus" />
        <NavButton active={currentView === 'BLOCKS'} onClick={() => setCurrentView('BLOCKS')} icon={<Clock />} label="Blocks" />
        <NavButton active={currentView === 'DUMP'} onClick={() => setCurrentView('DUMP')} icon={<Brain />} label="Dump" />
        <NavButton active={currentView === 'STATS'} onClick={() => setCurrentView('STATS')} icon={<BarChart3 />} label="Stats" />
      </nav>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showSwitchConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#151619] border border-white/10 p-8 w-full max-w-xs text-center"
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-white" />
              <h2 className="text-xl font-bold mb-2">Switching Focus?</h2>
              <p className="text-white/60 text-sm mb-6">
                You are switching tasks. Is this intentional or avoidance?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setPrimaryTask(showSwitchConfirm);
                    setShowSwitchConfirm(null);
                  }}
                >
                  It's Intentional
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowSwitchConfirm(null)}
                >
                  I'm Drifting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-white' : 'text-white/30'}`}
    >
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
    </button>
  );
}

function FocusView({ primaryTask, tasks, onSetPrimary, onToggle }: { 
  primaryTask?: Task, 
  tasks: Task[], 
  onSetPrimary: (id: string) => void,
  onToggle: (id: string) => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <section>
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 block">Primary Focus</label>
        {primaryTask ? (
          <div className="space-y-6">
            <div className={`p-8 border-2 relative overflow-hidden group transition-all ${
              primaryTask.status === 'abandoned' ? 'border-white/10 bg-white/2 opacity-40' : 'border-white bg-white/5'
            }`}>
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-24 h-24 -mr-8 -mt-8" />
              </div>
              <h2 className={`text-3xl font-black leading-tight mb-4 ${primaryTask.status === 'abandoned' ? 'line-through' : ''}`}>
                {primaryTask.text}
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onToggle(primaryTask.id)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  {primaryTask.status === 'completed' ? (
                    <><CheckCircle2 className="w-4 h-4" /> Finished</>
                  ) : primaryTask.status === 'abandoned' ? (
                    <><XCircle className="w-4 h-4" /> Abandoned</>
                  ) : (
                    <><Circle className="w-4 h-4" /> Mark Complete</>
                  )}
                </button>
              </div>
            </div>
            <p className="text-center text-white/40 text-[11px] font-mono uppercase tracking-widest animate-pulse-subtle">
              This is your priority. Ignore everything else.
            </p>
          </div>
        ) : (
          <div className="p-8 border border-white/10 text-center space-y-4">
            <p className="text-white/40 italic">No primary focus locked.</p>
            <p className="text-sm">Select a task from below to anchor your day.</p>
          </div>
        )}
      </section>

      <section>
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 block">Available Tasks</label>
        <div className="space-y-2">
          {tasks.filter(t => t.id !== primaryTask?.id).map(task => (
            <motion.div 
              key={task.id} 
              initial={false}
              animate={{ 
                opacity: task.status === 'completed' ? 0.5 : 1,
                backgroundColor: task.status === 'completed' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0)'
              }}
              className="p-4 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all"
            >
              <span className={`text-sm transition-all duration-500 ${task.status === 'completed' ? 'line-through text-white/20 translate-x-2' : ''}`}>
                {task.text}
              </span>
              <button 
                onClick={() => onSetPrimary(task.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-widest bg-white text-black px-2 py-1"
              >
                Lock
              </button>
            </motion.div>
          ))}
          {tasks.filter(t => t.id !== primaryTask?.id).length === 0 && (
            <p className="text-white/20 text-xs text-center py-4">No other tasks. Use Brain Dump to add more.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function BlocksView({ tasks, onAssign, onToggle, onAbandon }: { 
  tasks: Task[], 
  onAssign: (id: string, block: TimeBlockType) => void,
  onToggle: (id: string) => void,
  onAbandon: (id: string) => void
}) {
  const [activeTimer, setActiveTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    let interval: any;
    if (activeTimer && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setActiveTimer(false);
    }
    return () => clearInterval(interval);
  }, [activeTimer, timeLeft]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const blocks: { type: TimeBlockType, label: string, desc: string }[] = [
    { type: 'DEEP', label: 'Deep Work', desc: 'No distractions. High intensity.' },
    { type: 'LIGHT', label: 'Light Work', desc: 'Admin, emails, quick tasks.' },
    { type: 'FREE', label: 'Free Time', desc: 'Rest. Recovery. No guilt.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="space-y-10"
    >
      {/* Timer Section */}
      <section className="bg-white/5 p-8 border border-white/10 text-center relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Deep Work Timer</label>
          {activeTimer && (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>
        
        <div className={`text-6xl font-black tracking-tighter mb-8 font-mono transition-all duration-500 ${activeTimer ? 'scale-105 text-white' : 'text-white/60'}`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center items-center gap-6">
          <button 
            onClick={() => { setActiveTimer(false); setTimeLeft(25 * 60); }}
            className="group flex flex-col items-center gap-2"
            title="Reset"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full group-hover:border-white/40 transition-all">
              <RotateCcw className="w-4 h-4 text-white/40 group-hover:text-white" />
            </div>
            <span className="text-[8px] uppercase font-bold tracking-widest text-white/20 group-hover:text-white/40">Reset</span>
          </button>

          {!activeTimer ? (
            <button 
              onClick={() => setActiveTimer(true)}
              className="group flex flex-col items-center gap-2"
              title="Start"
            >
              <div className="w-16 h-16 flex items-center justify-center border-2 border-white rounded-full bg-white text-black hover:bg-transparent hover:text-white transition-all">
                <Play className="w-6 h-6 fill-current ml-1" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Start</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTimer(false)}
              className="group flex flex-col items-center gap-2"
              title="Pause"
            >
              <div className="w-16 h-16 flex items-center justify-center border-2 border-white rounded-full hover:bg-white hover:text-black transition-all">
                <Pause className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Pause</span>
            </button>
          )}

          <div className="w-10 h-10" /> {/* Spacer to balance the layout */}
        </div>
      </section>

      {/* Blocks Section */}
      <div className="space-y-8">
        {blocks.map(block => (
          <section key={block.type}>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">{block.label}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{block.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.block === block.type).map(task => (
                <motion.div 
                  key={task.id} 
                  initial={false}
                  animate={{ 
                    backgroundColor: task.status === 'completed' ? 'rgba(255, 255, 255, 0.05)' : 
                                    task.status === 'abandoned' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0)',
                    borderColor: task.status === 'completed' ? 'rgba(255, 255, 255, 0.2)' : 
                                 task.status === 'abandoned' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    opacity: task.status === 'abandoned' ? 0.4 : 1
                  }}
                  className="p-4 border flex items-center justify-between transition-colors"
                >
                  <span className={`text-sm transition-all duration-500 ${
                    task.status === 'completed' ? 'line-through text-white/20 translate-x-2' : 
                    task.status === 'abandoned' ? 'line-through text-white/40' : ''
                  }`}>
                    {task.text}
                  </span>
                  <div className="flex items-center gap-3">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => onAbandon(task.id)}
                        className="text-white/20 hover:text-white/60 transition-colors p-1"
                        title="Abandon Task"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => onToggle(task.id)} className="relative">
                      <AnimatePresence mode="wait">
                        {task.status === 'completed' ? (
                          <motion.div 
                            key="checked"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </motion.div>
                        ) : task.status === 'abandoned' ? (
                          <motion.div 
                            key="abandoned"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <XCircle className="w-4 h-4 text-white/40" />
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="unchecked"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Circle className="w-4 h-4 text-white/20" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {task.status === 'completed' && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          className="absolute inset-0 bg-white rounded-full pointer-events-none"
                        />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
              
              <div className="relative group">
                <select 
                  className="w-full p-3 bg-transparent border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer hover:border-white/30 transition-all"
                  onChange={(e) => {
                    if (e.target.value) onAssign(e.target.value, block.type);
                    e.target.value = "";
                  }}
                  value=""
                >
                  <option value="" className="bg-black">Assign Task...</option>
                  {tasks.filter(t => !t.block).map(t => (
                    <option key={t.id} value={t.id} className="bg-black">{t.text}</option>
                  ))}
                </select>
                <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-40" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}

function DumpView({ tasks, onAdd, onCategorize, onDelete }: { 
  tasks: Task[], 
  onAdd: (text: string) => void,
  onCategorize: (id: string, cat: any) => void,
  onDelete: (id: string) => void
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <section>
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4 block">Brain Dump</label>
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            placeholder="What is in your head?" 
            className="input-field pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        <p className="mt-4 text-[10px] text-white/30 italic">Dump everything. Filter later.</p>
      </section>

      <section className="space-y-4">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Unfiltered Thoughts ({tasks.length})</label>
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="p-6 border border-white/10 space-y-4">
              <p className="text-lg font-medium">{task.text}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => onCategorize(task.id, 'KEEP')}
                  className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all"
                >
                  Keep
                </button>
                <button 
                  onClick={() => onCategorize(task.id, 'DELAY')}
                  className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/20 hover:bg-white/10 transition-all"
                >
                  Delay
                </button>
                <button 
                  onClick={() => onDelete(task.id)}
                  className="p-2 border border-white/20 hover:border-red-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="py-12 text-center text-white/20">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-sm">Your mind is clear.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function StatsView({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending' && t.category === 'KEEP').length;
  const abandoned = tasks.filter(t => t.status === 'abandoned').length;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      <section className="text-center py-8">
        <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Reality Check</h2>
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">The numbers don't lie.</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Executed" value={completed} color="text-white" />
        <StatCard label="Drifting" value={pending} color="text-white/40" />
      </div>

      <section className="p-8 border border-white/10 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-4">Inconsistency Patterns</h3>
        <div className="space-y-4">
          {completed > pending ? (
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-white/80">You are executing more than you are planning. Keep this momentum.</p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <p className="text-sm text-white/80">You are over-planning and under-executing. Reduce your list.</p>
            </div>
          )}
          
          {tasks.filter(t => t.category === 'DELAY').length > 5 && (
            <div className="flex gap-4 items-start">
              <Clock className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-white/80">Your 'Delay' list is becoming a graveyard. Delete items you won't actually do.</p>
            </div>
          )}
        </div>
      </section>

      <div className="p-6 bg-white text-black text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Weekly Verdict</p>
        <p className="text-lg font-bold">
          {completed === 0 ? "Zero execution. Start now." : 
           completed < 3 ? "Barely moving. Focus harder." : 
           "Steady progress. Don't get complacent."}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="p-6 border border-white/10">
      <div className={`text-4xl font-black mb-1 ${color}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}
