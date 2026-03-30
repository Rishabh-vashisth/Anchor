/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Anchor, 
  Target, 
  Brain, 
  Clock, 
  BarChart3, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { useAnchorState } from './hooks/useAnchorState';
import { NavButton } from './components/ui/NavButton';
import { FocusPage } from './pages/FocusPage';
import { BlocksPage } from './pages/BlocksPage';
import { DumpPage } from './pages/DumpPage';
import { StatsPage } from './pages/StatsPage';
import { IdeaCapture } from './components/IdeaCapture';
import { IdeaParkingLot } from './components/IdeaParkingLot';
import { EodCheckModal } from './components/EodCheckModal';

type View = 'FOCUS' | 'BLOCKS' | 'DUMP' | 'PARKING' | 'STATS';

export default function App() {
  const { 
    state, 
    addTask, 
    addIdea,
    processIdea,
    categorizeTask, 
    setPrimaryTask, 
    assignToBlock, 
    toggleTaskStatus, 
    addSubtask,
    toggleSubtask,
    setTaskDependency,
    setTaskStartDate,
    completeEodCheck,
    deleteTask, 
    abandonTask 
  } = useAnchorState();
  
  const [currentView, setCurrentView] = useState<View>('FOCUS');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);

  const primaryTask = state.tasks?.find(t => t.id === state.primaryTaskId);
  const today = new Date().toISOString().split('T')[0];
  const canConvertIdea = state.lastIdeaConvertedDate !== today;

  const handleSetPrimary = (id: string) => {
    if (state.primaryTaskId && state.primaryTaskId !== id) {
      setShowSwitchConfirm(id);
    } else {
      setPrimaryTask(id);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black shadow-2xl">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-white" />
          <h1 className="text-xl font-black tracking-tighter uppercase">Anchor</h1>
        </div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          {currentView === 'FOCUS' && (
            <FocusPage 
              key="focus"
              primaryTask={primaryTask} 
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              allTasks={state.tasks || []}
              streak={state.streak}
              isContinuingTask={state.isContinuingTask}
              onSetPrimary={handleSetPrimary}
              onToggle={toggleTaskStatus}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onSetDependency={setTaskDependency}
              onSetStartDate={setTaskStartDate}
            />
          )}
          {currentView === 'BLOCKS' && (
            <BlocksPage 
              key="blocks"
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              allTasks={state.tasks || []}
              onAssign={assignToBlock}
              onToggle={toggleTaskStatus}
              onAbandon={abandonTask}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onSetDependency={setTaskDependency}
              onSetStartDate={setTaskStartDate}
            />
          )}
          {currentView === 'DUMP' && (
            <DumpPage 
              key="dump"
              tasks={state.tasks?.filter(t => t.category === 'NONE') || []}
              onAdd={addTask}
              onCategorize={categorizeTask}
              onDelete={deleteTask}
            />
          )}
          {currentView === 'PARKING' && (
            <IdeaParkingLot
              key="parking"
              ideas={state.ideas || []}
              onProcess={processIdea}
              canConvert={canConvertIdea}
            />
          )}
          {currentView === 'STATS' && (
            <StatsPage 
              key="stats"
              tasks={state.tasks || []}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Capture */}
      <IdeaCapture onCapture={addIdea} />

      {/* Navigation - Thumb Friendly */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-white/10 flex justify-around p-4 pb-8 z-50">
        <NavButton active={currentView === 'FOCUS'} onClick={() => setCurrentView('FOCUS')} icon={<Target />} label="Focus" />
        <NavButton active={currentView === 'BLOCKS'} onClick={() => setCurrentView('BLOCKS')} icon={<Clock />} label="Blocks" />
        <NavButton active={currentView === 'DUMP'} onClick={() => setCurrentView('DUMP')} icon={<Brain />} label="Dump" />
        <NavButton active={currentView === 'PARKING'} onClick={() => setCurrentView('PARKING')} icon={<Lightbulb />} label="Parking" />
        <NavButton active={currentView === 'STATS'} onClick={() => setCurrentView('STATS')} icon={<BarChart3 />} label="Stats" />
      </nav>

      {/* Modals */}
      <EodCheckModal 
        isOpen={!!state.pendingEodCheck}
        taskText={state.pendingEodCheck?.taskText || ''}
        onComplete={completeEodCheck}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showSwitchConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#151619] border border-white/10 p-10 w-full max-w-xs text-center shadow-2xl"
            >
              <AlertCircle className="w-16 h-16 mx-auto mb-6 text-white" />
              <h2 className="text-2xl font-black mb-4 tracking-tighter uppercase">Switching Focus?</h2>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                You are abandoning your current anchor. Is this intentional or avoidance?
              </p>
              <div className="flex flex-col gap-4">
                <button 
                  className="btn-primary py-4"
                  onClick={() => {
                    setPrimaryTask(showSwitchConfirm);
                    setShowSwitchConfirm(null);
                  }}
                >
                  It's Intentional
                </button>
                <button 
                  className="btn-secondary py-4"
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
