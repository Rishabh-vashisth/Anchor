/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Anchor, 
  Target, 
  BarChart3, 
  AlertCircle,
  Menu,
  X,
  LayoutDashboard,
  Sliders,
  BookOpen,
  Settings,
  Plus,
  Brain,
  Lightbulb,
  Bookmark,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useAnchorState } from './hooks/useAnchorState';
import { DashboardPage } from './pages/DashboardPage';
import { ManagePage } from './pages/ManagePage';
import { InsightsPage } from './pages/InsightsPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReflectionsPage } from './pages/ReflectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { EodCheckModal } from './components/EodCheckModal';
import { ReflectionTag } from './types';

type View = 'DASHBOARD' | 'MANAGE' | 'INSIGHTS' | 'GOALS' | 'REFLECTIONS' | 'SETTINGS';

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
    addReflection,
    deleteReflection,
    addDailyTodo,
    toggleDailyTodo,
    deleteDailyTodo,
    deleteTask, 
    abandonTask,
    addGoal,
    editGoal,
    updateGoalStatus,
    toggleGoalKeyResult,
    deleteGoal,
    linkTaskToGoal,
    startTimer,
    stopTimer,
    addManualTimeLog,
    updateTaskEstimate,
    toggleTimeTracking,
    updateDailyTimeBudget,
    resetAllState
  } = useAnchorState();
  
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States for Unified Quick Capture Drawer
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [captureTab, setCaptureTab] = useState<'TASK' | 'IDEA' | 'REFLECTION'>('TASK');
  const [taskText, setTaskText] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionTag, setReflectionTag] = useState<ReflectionTag>('Insight');

  const primaryTask = state.tasks?.find(t => t.id === state.primaryTaskId);
  const today = new Date().toISOString().split('T')[0];
  const currentDailyTodos = state.dailyTodos[today] || [];

  const handleSetPrimary = (id: string) => {
    if (state.primaryTaskId && state.primaryTaskId !== id) {
      setShowSwitchConfirm(id);
    } else {
      setPrimaryTask(id);
    }
  };

  const navItems = [
    { view: 'DASHBOARD' as View, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'MANAGE' as View, label: 'Manage Blocks', icon: <Sliders className="w-4 h-4" /> },
    { view: 'INSIGHTS' as View, label: 'Insights Engine', icon: <BarChart3 className="w-4 h-4" /> },
    { view: 'GOALS' as View, label: 'OKRs Goals', icon: <Target className="w-4 h-4" /> },
    { view: 'REFLECTIONS' as View, label: 'Reflections Log', icon: <BookOpen className="w-4 h-4" /> },
    { view: 'SETTINGS' as View, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Quick Capture submissions handlers
  const handleQuickCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (captureTab === 'TASK') {
      if (taskText.trim()) {
        addTask(taskText.trim());
        setTaskText('');
        setIsQuickCaptureOpen(false);
      }
    } else if (captureTab === 'IDEA') {
      if (ideaText.trim()) {
        addIdea(ideaText.trim());
        setIdeaText('');
        setIsQuickCaptureOpen(false);
      }
    } else if (captureTab === 'REFLECTION') {
      if (reflectionText.trim()) {
        addReflection(reflectionText.trim(), reflectionTag);
        setReflectionText('');
        setIsQuickCaptureOpen(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black shadow-2xl relative overflow-x-hidden md:border-x border-white/5 pb-24">
      {/* Header */}
      <header className="p-4 md:px-8 md:py-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          {/* Burger button - visible on mobile/tablet, hidden on desktop */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1 px-2 border border-white/10 hover:border-white/50 hover:bg-white/5 transition-all outline-none"
            title="Open navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setCurrentView('DASHBOARD')}>
            <Anchor className="w-4 h-4 text-orange-500" />
            <h1 className="text-xl font-black tracking-tighter uppercase text-white">Anchor</h1>
          </div>
        </div>

        {/* Desktop horizontal navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-950/40 p-1 border border-white/5">
          {navItems.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-all hover:bg-white/[0.02] ${
                  isActive ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="text-[9px] font-mono text-zinc-500 bg-white/[0.02] border border-white/5 py-0.5 px-2.5 uppercase tracking-wider">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Sliding Collapsible Sidebar Navigation Panel Drawer - visible only on Mobile/Tablet */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[101] md:hidden"
            />

            {/* Sidebar content */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#090a0c] border-r border-white/10 z-[102] p-6 flex flex-col justify-between shadow-[20px_0_50px_rgba(0,0,0,0.8)] md:hidden font-mono"
            >
              <div className="space-y-8">
                {/* Close & Brand Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-black uppercase tracking-widest text-white">Navigation</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Items list */}
                <div className="space-y-1">
                  {navItems.map(item => {
                    const isActive = currentView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          setCurrentView(item.view);
                          setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full p-3 transition-all hover:bg-white/[0.02] border-l-2 text-left ${
                          isActive 
                            ? 'border-orange-500 text-white bg-white/[0.01]' 
                            : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span className="text-xs uppercase font-bold tracking-widest">{item.label}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar footer telemetry context */}
              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                  <span>SYSTEM VERSION</span>
                  <span>v3.5.0-OKRs</span>
                </div>
                <p className="text-[10px] text-zinc-500 italic font-sans">
                  Keep anchors locked, eliminate noise.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {currentView === 'DASHBOARD' && (
            <DashboardPage
              key="dashboard"
              primaryTask={primaryTask}
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              allTasks={state.tasks || []}
              dailyTodos={currentDailyTodos}
              streak={state.streak}
              isContinuingTask={state.isContinuingTask}
              reflections={state.reflections || []}
              goals={state.goals || []}
              onSetPrimary={handleSetPrimary}
              onToggleTask={toggleTaskStatus}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onAddDailyTodo={addDailyTodo}
              onToggleDailyTodo={(id) => toggleDailyTodo(today, id)}
              onDeleteDailyTodo={(id) => deleteDailyTodo(today, id)}
              onSetStartDate={setTaskStartDate}
              onSetDependency={setTaskDependency}
              onLinkTaskToGoal={linkTaskToGoal}
              timeTrackingEnabled={state.timeTrackingEnabled !== undefined ? state.timeTrackingEnabled : true}
              timeLogs={state.timeLogs || []}
              dailyTimeBudget={state.dailyTimeBudget !== undefined ? state.dailyTimeBudget : 480}
              activeTimer={state.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onAddManualTimeLog={addManualTimeLog}
              onUpdateTaskEstimate={updateTaskEstimate}
            />
          )}

          {currentView === 'MANAGE' && (
            <ManagePage
              key="manage"
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              unfilteredTasks={state.tasks?.filter(t => t.category === 'NONE') || []}
              allTasks={state.tasks || []}
              goals={state.goals || []}
              onAdd={addTask}
              onCategorize={categorizeTask}
              onDelete={deleteTask}
              onAssignBlock={assignToBlock}
              onToggleTaskStatus={toggleTaskStatus}
              onAbandonTask={abandonTask}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onSetDependency={setTaskDependency}
              onSetStartDate={setTaskStartDate}
              onLinkTaskToGoal={linkTaskToGoal}
            />
          )}

          {currentView === 'INSIGHTS' && (
            <InsightsPage
              key="insights"
              tasks={state.tasks || []}
              reflections={state.reflections || []}
              dailyTodos={state.dailyTodos || {}}
              timeTrackingEnabled={state.timeTrackingEnabled !== undefined ? state.timeTrackingEnabled : true}
              timeLogs={state.timeLogs || []}
              dailyTimeBudget={state.dailyTimeBudget !== undefined ? state.dailyTimeBudget : 480}
            />
          )}

          {currentView === 'GOALS' && (
            <GoalsPage
              key="goals"
              goals={state.goals || []}
              allTasks={state.tasks || []}
              onAddGoal={addGoal}
              onEditGoal={editGoal}
              onUpdateGoalStatus={updateGoalStatus}
              onToggleKeyResult={toggleGoalKeyResult}
              onDeleteGoal={deleteGoal}
            />
          )}

          {currentView === 'REFLECTIONS' && (
            <ReflectionsPage
              key="reflections"
              reflections={state.reflections || []}
              allTasks={state.tasks || []}
              onAddReflection={addReflection}
              onDeleteReflection={deleteReflection}
            />
          )}

          {currentView === 'SETTINGS' && (
            <SettingsPage
              key="settings"
              stats={{
                tasksCount: state.tasks?.length || 0,
                ideasCount: state.ideas?.length || 0,
                reflectionsCount: state.reflections?.length || 0,
                goalsCount: (state.goals || []).length,
                streak: state.streak || 0
              }}
              timeTrackingEnabled={state.timeTrackingEnabled !== undefined ? state.timeTrackingEnabled : true}
              toggleTimeTracking={toggleTimeTracking}
              dailyTimeBudget={state.dailyTimeBudget !== undefined ? state.dailyTimeBudget : 480}
              updateDailyTimeBudget={updateDailyTimeBudget}
              onReset={resetAllState}
            />
          )}

        </AnimatePresence>
      </main>

      {/* QUICK ACTIONS HUB - Persistent Multi-Purpose capture floating trigger */}
      <div className="fixed bottom-16 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsQuickCaptureOpen(true)}
          className="w-14 h-14 bg-white text-black rounded-full shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center z-50 border-2 border-white cursor-pointer"
          title="Open Quick Capture Center"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </div>

      {/* Quick Unified Capture Drawer Modal */}
      <AnimatePresence>
        {isQuickCaptureOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Backdrop Close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsQuickCaptureOpen(false)} />
            
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-[#121316] border border-white/10 p-6 shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.25em]">Quick Node Capture</span>
                <button 
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="text-zinc-500 hover:text-white transition-all p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subtabs chooser */}
              <div className="grid grid-cols-3 border border-white/5 bg-[#090a0c] p-1 mb-5">
                {(['TASK', 'IDEA', 'REFLECTION'] as const).map(tab => {
                  const isActive = captureTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setCaptureTab(tab)}
                      className={`py-2 text-[9px] font-mono uppercase font-bold tracking-widest text-center transition-all ${
                        isActive ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Capture input Forms */}
              <form onSubmit={handleQuickCaptureSubmit} className="space-y-4">
                {captureTab === 'TASK' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={taskText}
                      onChange={(e) => setTaskText(e.target.value)}
                      placeholder="e.g. Code database schema validators..."
                      className="w-full bg-transparent border-b-2 border-white/10 p-2 text-base font-mono focus:outline-none focus:border-white transition-all text-white placeholder:text-zinc-700"
                    />
                    <div className="p-3 bg-white/[0.01] border border-white/5 text-[9px] font-mono text-zinc-500 uppercase">
                      Pushed directly to raw unfiltered thought buffer queue.
                    </div>
                  </div>
                )}

                {captureTab === 'IDEA' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={ideaText}
                      onChange={(e) => setIdeaText(e.target.value)}
                      placeholder="Record inspiration to age for 24 hours..."
                      className="w-full bg-transparent border-b-2 border-white/10 p-2 text-base font-mono focus:outline-none focus:border-white transition-all text-white placeholder:text-zinc-700"
                    />
                    <div className="p-3 bg-orange-950/20 border border-orange-500/10 text-[9px] font-mono text-orange-400/80 uppercase tracking-wider">
                      Parked buffer locking active. Aged entries build strategic leverage.
                    </div>
                  </div>
                )}

                {captureTab === 'REFLECTION' && (
                  <div className="space-y-4">
                    <textarea
                      autoFocus
                      required
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="Capture raw telemetry, lesson, or focus blocker..."
                      className="w-full bg-transparent border border-white/5 p-3 text-sm font-mono h-20 resize-none focus:outline-none focus:border-white transition-all text-white placeholder:text-zinc-700"
                      maxLength={150}
                    />
                    
                    <div className="flex gap-2 justify-start items-center">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Tag:</span>
                      {(['Insight', 'Reminder', 'Mistake'] as ReflectionTag[]).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setReflectionTag(tag)}
                          className={`text-[9px] font-mono uppercase tracking-widest py-1 px-3 border transition-all ${
                            reflectionTag === tag 
                              ? 'border-white bg-white text-black font-black' 
                              : 'border-white/10 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-black font-mono text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all mt-2"
                >
                  Stream Capture Signal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nav indicator - Bottom Footer status details */}
      <div className="fixed bottom-0 left-0 right-0 max-w-full md:max-w-4xl lg:max-w-5xl mx-auto border-t border-white/5 bg-[#050505]/95 backdrop-blur-md p-3 px-6 z-40 flex justify-between items-center text-[10px] font-mono uppercase text-zinc-500">
        <span className="tracking-[0.1em] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-none animate-pulse" />
          Anchor Session Live
        </span>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden tracking-wider text-orange-400 hover:text-white transition-colors"
        >
          Menu Menu
        </button>
        <span className="text-zinc-700 hidden md:inline">PEAK DISCIPLINE OPERATIVE</span>
      </div>

      {/* Modals check */}
      <EodCheckModal 
        isOpen={!!state.pendingEodCheck}
        taskText={state.pendingEodCheck?.taskText || ''}
        onComplete={completeEodCheck}
      />

      {/* Confirmation Anchor Switch */}
      <AnimatePresence>
        {showSwitchConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121316] border border-white/10 p-8 w-full max-w-xs text-center shadow-2xl space-y-4"
            >
              <AlertCircle className="w-12 h-12 mx-auto text-white animate-bounce" />
              <h2 className="text-xl font-black tracking-tighter uppercase text-white leading-none">Switching Focus?</h2>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                You are abandoning your current active anchor. Is this intentional or cognitive avoidance?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  className="w-full py-2.5 bg-white text-black font-mono text-[10px] font-black uppercase tracking-widest hover:opacity-90"
                  onClick={() => {
                    setPrimaryTask(showSwitchConfirm);
                    setShowSwitchConfirm(null);
                  }}
                >
                  It's Intentional
                </button>
                <button 
                  className="w-full py-2.5 border border-white/10 text-zinc-400 font-mono text-[10px] uppercase tracking-widest hover:text-white hover:border-white/30"
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
