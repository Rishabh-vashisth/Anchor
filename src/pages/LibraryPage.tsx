import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  BookOpen, 
  CheckCircle2, 
  Trash2, 
  Compass, 
  Clock, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  History
} from 'lucide-react';
import { Goal, Task, Idea, Reflection } from '../types';

interface LibraryPageProps {
  key?: string;
  goals: Goal[];
  tasks: Task[];
  ideas: Idea[];
  reflections: Reflection[];
  onDeleteGoal?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

type LibrarySector = 'COMPLETED_PROJECTS' | 'COMPLETED_TASKS' | 'ARCHIVED_IDEAS' | 'HISTORIC_JOURNAL';

export function LibraryPage({
  goals = [],
  tasks = [],
  ideas = [],
  reflections = [],
  onDeleteGoal,
  onDeleteTask
}: LibraryPageProps & any) {
  const [activeSector, setActiveSector] = useState<LibrarySector>('COMPLETED_PROJECTS');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Completed goals/initiatives
  const archivedGoals = useMemo(() => {
    return goals.filter(g => g.status === 'completed' || g.status === 'abandoned');
  }, [goals]);

  // 2. Completed/archived workload elements
  const archivedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'completed');
  }, [tasks]);

  // 3. Ideas archived/parked
  const archivedIdeas = useMemo(() => {
    return ideas.filter(i => i.status === 'executed' || i.status === 'deleted' || i.status === 'delayed');
  }, [ideas]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (activeSector === 'COMPLETED_PROJECTS') {
      return archivedGoals.filter(g => 
        g.title.toLowerCase().includes(query) || 
        (g.description || '').toLowerCase().includes(query)
      );
    }
    
    if (activeSector === 'COMPLETED_TASKS') {
      return archivedTasks.filter(t => 
        t.text.toLowerCase().includes(query)
      );
    }

    if (activeSector === 'ARCHIVED_IDEAS') {
      return archivedIdeas.filter(i => 
        i.text.toLowerCase().includes(query)
      );
    }

    return reflections.filter(r => 
      r.text.toLowerCase().includes(query) ||
      (r.whatWorked || '').toLowerCase().includes(query) ||
      (r.whatBlocked || '').toLowerCase().includes(query)
    );
  }, [activeSector, searchQuery, archivedGoals, archivedTasks, archivedIdeas, reflections]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-8 py-4 text-left"
    >
      {/* Pristine Minimalist Archival Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold block">
          Pristine Long-Term Archive Vault
        </span>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
          Library Sector
        </h2>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          The memory is permanent. Completed initiatives, captured ideas, and historic lessons reside safely in the Anchor registries.
        </p>
      </div>

      {/* Grid: Search Query & Sector Switches */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-white/5 pb-4">
        
        {/* Sector Tabs */}
        <div className="flex gap-1 bg-zinc-950 p-1 border border-white/5 overflow-x-auto">
          {[
            { id: 'COMPLETED_PROJECTS' as LibrarySector, label: 'Projects Archive' },
            { id: 'COMPLETED_TASKS' as LibrarySector, label: 'Workloads Done' },
            { id: 'ARCHIVED_IDEAS' as LibrarySector, label: 'Arc Sparks' },
            { id: 'HISTORIC_JOURNAL' as LibrarySector, label: 'Clarity Journal' }
          ].map(sector => (
            <button
              key={sector.id}
              onClick={() => setActiveSector(sector.id)}
              className={`py-1.5 px-3 text-[9px] font-mono uppercase font-black tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeSector === sector.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {sector.label}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter Vault records..."
          className="bg-transparent border-b border-white/10 py-1 px-2 text-xs font-mono text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-800 md:w-64"
        />
      </div>

      {/* Vault List Output */}
      <div className="space-y-4">
        <div className="text-[9px] font-mono text-zinc-500 uppercase flex justify-between">
          <span>Record Matrix</span>
          <span>{filteredItems.length} Footprints Preserved</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredItems.map(item => {
              if (activeSector === 'COMPLETED_PROJECTS') {
                const goal = item as Goal;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-zinc-950/20 border border-white/5 hover:border-white/10 transition-all text-left space-y-2 relative"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-semibold font-mono py-0.5 px-1.5 border uppercase ${
                        goal.status === 'completed' ? 'border-emerald-500/20 bg-emerald-950/15 text-emerald-400' : 'border-zinc-500/20 bg-zinc-900/15 text-zinc-400'
                      }`}>
                        {goal.status}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">{new Date(goal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-sans">{goal.title}</h3>
                    {goal.description && <p className="text-xs text-zinc-400 font-sans italic">{goal.description}</p>}
                    
                    {goal.keyResults.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.03] space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">Orbit Milestones Resolved:</span>
                        {goal.keyResults.map(kr => (
                          <div key={kr.id} className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                            <span className="text-emerald-500">✓</span>
                            <span>{kr.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              }

              if (activeSector === 'COMPLETED_TASKS') {
                const t = item as Task;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-zinc-950/20 border border-white/5 hover:border-white/10 transition-all flex justify-between items-center text-left"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-300 font-sans">{t.text}</p>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block">
                        CREATED {new Date(t.createdAt).toLocaleDateString()} • COMPLETED {new Date(t.completedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    {onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(t.id)}
                        className="text-zinc-650 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                );
              }

              if (activeSector === 'ARCHIVED_IDEAS') {
                const idea = item as Idea;
                return (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-zinc-950/20 border border-white/5 hover:border-white/10 transition-all text-left flex justify-between items-center"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-300 font-sans">{idea.text}</p>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block">
                        SPARK INDEX {idea.status.toUpperCase()} • {new Date(idea.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                );
              }

              // Journal Entries
              const journal = item as Reflection;
              return (
                <motion.div
                  key={journal.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-zinc-950/20 border border-white/5 hover:border-white/10 transition-all text-left space-y-2"
                >
                  <div className="flex gap-2 text-[8px] font-mono uppercase">
                    <span className="border border-white/10 px-1 py-0.5 text-zinc-400">{journal.tag}</span>
                    <span className="text-zinc-500">{new Date(journal.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">{journal.text}</p>
                  
                  {(journal.whatWorked || journal.whatBlocked) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.03] text-[9px] font-mono text-zinc-400">
                      {journal.whatWorked && <span><b className="text-zinc-500 font-bold font-mono">RESOLVED:</b> {journal.whatWorked}</span>}
                      {journal.whatBlocked && <span><b className="text-zinc-500 font-bold font-mono">BLOCKED:</b> {journal.whatBlocked}</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 border border-dashed border-zinc-900">
                <p className="text-xs text-zinc-650 font-mono italic">Vault partition is silent.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
}
