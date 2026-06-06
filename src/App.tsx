/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Bell,
  Cloud,
  Flame,
  Compass, 
  Archive,
  Lock,
  HelpCircle
} from 'lucide-react';
import { useAnchorState } from './hooks/useAnchorState';
import { OnboardingTour } from './components/OnboardingTour';
import { DashboardPage } from './pages/DashboardPage';
import { ManagePage } from './pages/ManagePage';
import { InsightsPage } from './pages/InsightsPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReflectionsPage } from './pages/ReflectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncPage } from './pages/SyncPage';
import { TodayPage } from './pages/TodayPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CapturePage } from './pages/CapturePage';
import { ReviewPage } from './pages/ReviewPage';
import { LibraryPage } from './pages/LibraryPage';
import { HelpPage } from './pages/HelpPage';
import { StreakDashboard } from './components/StreakDashboard';
import { Confetti } from './components/Confetti';
import { EodCheckModal } from './components/EodCheckModal';
import { EodReflectionModal } from './components/EodReflectionModal';
import { NotificationCenter } from './components/NotificationCenter';
import { ReflectionTag } from './types';

type View = 'TODAY' | 'PROJECTS' | 'CAPTURE' | 'REVIEW' | 'LIBRARY' | 'DASHBOARD' | 'MANAGE' | 'INSIGHTS' | 'GOALS' | 'REFLECTIONS' | 'SETTINGS' | 'SYNC' | 'STREAKS' | 'HELP';

export default function App() {
  const { 
    state, 
    toggleGoalsFeature,
    addTask, 
    addIdea,
    processIdea,
    categorizeTask, 
    setPrimaryTask, 
    assignToBlock, 
    toggleTaskStatus, 
    addSubtask,
    addMultipleSubtasks,
    toggleSubtask,
    setTaskDependency,
    setTaskStartDate,
    completeEodCheck,
    updateStreakRule,
    updateStreak,
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
    updateTaskText,
    toggleTimeTracking,
    updateDailyTimeBudget,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    applyBlockTemplate,
    saveBlockAsTemplate,
    updateNotificationSettings,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    resetAllState,
    updateGoogleCalendarSettings,
    disconnectCalendar,
    addGoogleSyncLog,
    clearGoogleSyncLogs,
    saveGoogleCalendarEvents
  } = useAnchorState();
  
  const [currentView, setCurrentView] = useState<View>('TODAY');
  const [isOnboardingActive, setIsOnboardingActive] = useState(() => {
    return localStorage.getItem('anchor_onboarding_completed') !== 'true';
  });
  const [isNavUnlocked, setIsNavUnlocked] = useState(false);
  const isLanderMode = currentView === 'TODAY' && !isNavUnlocked;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showCelebrationConfetti, setShowCelebrationConfetti] = useState(false);
  const prevStreakRef = useRef(state.streak || 0);

  useEffect(() => {
    if (state.streak > prevStreakRef.current && prevStreakRef.current !== undefined) {
      setShowCelebrationConfetti(true);
    }
    prevStreakRef.current = state.streak || 0;
  }, [state.streak]);

  // States for Unified Quick Capture Drawer
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [captureTab, setCaptureTab] = useState<'TASK' | 'IDEA'>('TASK');
  const [taskText, setTaskText] = useState('');
  const [ideaText, setIdeaText] = useState('');

  const [skippedEodDate, setSkippedEodDate] = useState<string | null>(() => {
    return localStorage.getItem('anchor_reflection_skipped_date');
  });

  const hasReflectedToday = (state.reflections || []).some(ref => {
    return new Date(ref.createdAt || ref.date).toDateString() === new Date().toDateString();
  });

  const shouldShowEodModal = React.useMemo(() => {
    if (hasReflectedToday) return false;
    const todayStr = new Date().toDateString();
    if (skippedEodDate === todayStr) return false;
    if (isLanderMode || isOnboardingActive) return false;

    const eodPromptTime = state.notificationSettings?.eodPromptTime || '17:00';
    const [eodHour, eodMin] = eodPromptTime.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    return currentHour > eodHour || (currentHour === eodHour && currentMin >= eodMin);
  }, [hasReflectedToday, skippedEodDate, isLanderMode, isOnboardingActive, state.notificationSettings?.eodPromptTime]);

  const handleSaveEodReflection = (
    whatWorked: string,
    whatBlocked: string,
    whatSurprised: string,
    whatToDoDifferently: string,
    moodEnergy: number
  ) => {
    addReflection(
      'EOD Reflection',
      'Insight' as ReflectionTag,
      whatWorked,
      whatBlocked,
      whatSurprised,
      whatToDoDifferently,
      moodEnergy,
      5 // Default stressLevel
    );
  };

  const handleSkipEodReflection = () => {
    const todayStr = new Date().toDateString();
    localStorage.setItem('anchor_reflection_skipped_date', todayStr);
    setSkippedEodDate(todayStr);
  };

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
    { view: 'TODAY' as View, label: 'Today', icon: <Compass className="w-4 h-4 text-orange-500" /> },
    { view: 'INSIGHTS' as View, label: 'Insights', icon: <BarChart3 className="w-4 h-4 text-emerald-500" /> },
    { view: 'REFLECTIONS' as View, label: 'Reflections', icon: <BookOpen className="w-4 h-4 text-amber-500" /> },
    { view: 'GOALS' as View, label: 'Goals', icon: <Target className="w-4 h-4 text-red-500" /> },
    { view: 'SETTINGS' as View, label: 'Settings', icon: <Settings className="w-4 h-4 text-zinc-400" /> },
    { view: 'HELP' as View, label: 'Help', icon: <HelpCircle className="w-4 h-4 text-teal-400" /> },
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
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black shadow-2xl relative overflow-x-hidden md:border-x border-white/5 pb-24">
      {/* Header */}
      {!isLanderMode && (
        <header className="p-4 md:px-8 md:py-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          {/* Burger button - visible on all screens (unifies navigation) */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 border border-white/10 hover:border-white/50 hover:bg-white/5 transition-all outline-none min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            title="Open system navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setCurrentView('TODAY')}>
            <Anchor className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-sm font-black tracking-widest uppercase text-white font-mono">Anchor</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bell Icon Trigger */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 border border-white/10 hover:border-white/40 hover:bg-white/5 transition-all outline-none relative group min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            title="Open Notification Center"
          >
            <Bell className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            {(state.notifications || []).filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-600 rounded-none animate-pulse" />
            )}
          </button>
          
          <div className="text-[9px] font-mono text-zinc-500 bg-white/[0.02] border border-white/5 py-1 px-2.5 uppercase tracking-wider h-10 flex items-center">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          {/* Lock UI Button to transition back to focus lander */}
          {currentView === 'TODAY' && (
            <button
              onClick={() => setIsNavUnlocked(false)}
              className="p-1 px-2 border border-white/10 hover:border-white/35 hover:bg-white/5 text-zinc-400 hover:text-white h-10 flex items-center justify-center cursor-pointer text-[9px] font-mono font-bold tracking-widest uppercase gap-1"
              title="Return to clean landing focus view"
            >
              <Lock className="w-3 h-3 text-orange-500/80" />
              <span className="hidden sm:inline">Focus Mode</span>
            </button>
          )}
        </div>
      </header>
      )}

      {/* Sliding Collapsible Sidebar Navigation Panel Drawer - visible on all screen sizes */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[101]"
            />

            {/* Sidebar content */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-[#090a0c] border-r border-white/10 z-[102] p-6 flex flex-col justify-between shadow-[20px_0_50px_rgba(0,0,0,0.8)] font-mono"
            >
              <div className="space-y-8">
                {/* Close & Brand Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-sm font-black uppercase tracking-widest text-white">Navigation</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Items list */}
                <div className="space-y-1">
                  {navItems.filter(item => item.view !== 'GOALS' || state.goalsEnabled).map(item => {
                    const isActive = currentView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          setCurrentView(item.view);
                          setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3.5 w-full min-h-[48px] p-3.5 px-4 transition-all hover:bg-white/[0.03] active:bg-white/[0.05] border-l-2 text-left cursor-pointer ${
                          isActive 
                            ? 'border-orange-500 text-white bg-white/[0.02] font-black' 
                            : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span className="text-xs uppercase font-extrabold tracking-widest">{item.label}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                {/* Quick actions moved to drawer */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <span className="text-[8px] font-mono text-zinc-650 uppercase tracking-[0.2em] font-black block mb-1">
                    Quick Capture Vault
                  </span>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsQuickCaptureOpen(true);
                    }}
                    className="flex items-center gap-3 w-full p-2.5 px-3 bg-[#111215] hover:bg-zinc-900 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-orange-500 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-300 group-hover:text-white">
                      Capture Idea / Task
                    </span>
                  </button>
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
          {currentView === 'TODAY' && (
            <TodayPage
              key="today"
              primaryTask={primaryTask}
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              allTasks={state.tasks || []}
              dailyTodos={currentDailyTodos}
              streak={state.streak}
              isContinuingTask={state.isContinuingTask}
              reflections={state.reflections || []}
              goals={state.goals || []}
              notificationSettings={state.notificationSettings}
              onAddReflection={addReflection}
              onSetPrimary={handleSetPrimary}
              onToggleTask={toggleTaskStatus}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onAddDailyTodo={addDailyTodo}
              onToggleDailyTodo={(id) => toggleDailyTodo(today, id)}
              onDeleteDailyTodo={(id) => deleteDailyTodo(today, id)}
              timeTrackingEnabled={state.timeTrackingEnabled !== undefined ? state.timeTrackingEnabled : true}
              timeLogs={state.timeLogs || []}
              dailyTimeBudget={state.dailyTimeBudget !== undefined ? state.dailyTimeBudget : 480}
              activeTimer={state.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onAddManualTimeLog={addManualTimeLog}
              onUpdateTaskEstimate={updateTaskEstimate}
              onUpdateTaskText={updateTaskText}
              onDeleteTask={deleteTask}
              onAbandonTask={abandonTask}
              onLinkTaskToGoal={linkTaskToGoal}
              onSetTaskDependency={setTaskDependency}
              onAssignBlock={assignToBlock}
              onQuickCapture={(type, text) => {
                if (type === 'TASK') addTask(text);
                else if (type === 'IDEA') addIdea(text);
              }}
              onSwitchView={(v) => setCurrentView(v)}
              onAddTask={(text, category, isPrimary) => {
                addTask(text, category, isPrimary);
              }}
              onExploreMore={() => {
                setIsNavUnlocked(true);
              }}
            />
          )}

          {currentView === 'PROJECTS' && (
            <ProjectsPage
              key="projects"
              goals={state.goals || []}
              allTasks={state.tasks || []}
              onAddGoal={addGoal}
              onEditGoal={editGoal}
              onUpdateGoalStatus={updateGoalStatus}
              onToggleKeyResult={toggleGoalKeyResult}
              onDeleteGoal={deleteGoal}
              onAddTask={addTask}
              onSetPrimary={handleSetPrimary}
            />
          )}

          {currentView === 'CAPTURE' && (
            <CapturePage
              key="capture"
              tasks={state.tasks || []}
              ideas={state.ideas || []}
              reflections={state.reflections || []}
              onAddTask={addTask}
              onAddIdea={addIdea}
            />
          )}

          {currentView === 'REVIEW' && (
            <ReviewPage
              key="review"
              tasks={state.tasks || []}
              reflections={state.reflections || []}
              dailyTodos={state.dailyTodos || {}}
              timeLogs={state.timeLogs || []}
              onDeleteReflection={deleteReflection}
            />
          )}

          {currentView === 'LIBRARY' && (
            <LibraryPage
              key="library"
              goals={state.goals || []}
              tasks={state.tasks || []}
              ideas={state.ideas || []}
              reflections={state.reflections || []}
              onDeleteGoal={deleteGoal}
              onDeleteTask={deleteTask}
            />
          )}

          {currentView === 'DASHBOARD' && (
            <TodayPage
              key="today-legacy"
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
              timeTrackingEnabled={state.timeTrackingEnabled !== undefined ? state.timeTrackingEnabled : true}
              timeLogs={state.timeLogs || []}
              dailyTimeBudget={state.dailyTimeBudget !== undefined ? state.dailyTimeBudget : 480}
              activeTimer={state.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onAddManualTimeLog={addManualTimeLog}
              onUpdateTaskEstimate={updateTaskEstimate}
              onUpdateTaskText={updateTaskText}
              onDeleteTask={deleteTask}
              onAbandonTask={abandonTask}
              onLinkTaskToGoal={linkTaskToGoal}
              onSetTaskDependency={setTaskDependency}
              onAssignBlock={assignToBlock}
              onQuickCapture={(type, text) => {
                if (type === 'TASK') addTask(text);
                else if (type === 'IDEA') addIdea(text);
              }}
              onSwitchView={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'MANAGE' && (
            <ManagePage
              key="manage"
              tasks={state.tasks?.filter(t => t.category === 'KEEP') || []}
              unfilteredTasks={state.tasks?.filter(t => t.category === 'NONE') || []}
              allTasks={state.tasks || []}
              goals={state.goals || []}
              timeBlocks={state.timeBlocks || []}
              blockTemplates={state.blockTemplates || []}
              onAdd={addTask}
              onCategorize={categorizeTask}
              onDelete={deleteTask}
              onAssignBlock={assignToBlock}
              onToggleTaskStatus={toggleTaskStatus}
              onAbandonTask={abandonTask}
              onAddSubtask={addSubtask}
              onAddMultipleSubtasks={addMultipleSubtasks}
              onToggleSubtask={toggleSubtask}
              onSetDependency={setTaskDependency}
              onSetStartDate={setTaskStartDate}
              onLinkTaskToGoal={linkTaskToGoal}
              onAddTimeBlock={addTimeBlock}
              onUpdateTimeBlock={updateTimeBlock}
              onDeleteTimeBlock={deleteTimeBlock}
              onApplyBlockTemplate={applyBlockTemplate}
              onSaveBlockAsTemplate={saveBlockAsTemplate}
              googleCalendarEvents={state.googleCalendarEvents || []}
              googleCalendarSettings={state.googleCalendarSettings}
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
              onDeleteReflection={deleteReflection}
            />
          )}

          {currentView === 'HELP' && (
            <HelpPage
              key="help"
              onSwitchView={(v) => setCurrentView(v)}
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
              notificationSettings={state.notificationSettings || {
                morningBriefing: true,
                morningBriefTime: '08:00',
                taskReminders: true,
                eodPrompt: true,
                eodPromptTime: '17:00',
                milestones: true,
                insights: true,
                weeklyDigest: true,
                digestFrequency: 'weekly',
                quietHoursEnabled: true,
                quietHoursStart: '21:00',
                quietHoursEnd: '08:00',
              }}
              updateNotificationSettings={updateNotificationSettings}
              onReset={resetAllState}
              onLaunchOnboarding={() => {
                setIsOnboardingActive(true);
                setCurrentView('TODAY');
              }}
              goalsEnabled={state.goalsEnabled || false}
              toggleGoalsEnabled={toggleGoalsFeature}
            />
          )}

          {currentView === 'SYNC' && (
            <SyncPage
              key="sync"
              tasks={state.tasks || []}
              goals={state.goals || []}
              streak={state.streak || 0}
              timeBlocks={state.timeBlocks || []}
              googleCalendarSettings={state.googleCalendarSettings}
              googleCachedToken={state.googleCachedToken}
              googleTokenExpiry={state.googleTokenExpiry}
              googleCalendarEvents={state.googleCalendarEvents || []}
              googleSyncLogs={state.googleSyncLogs || []}
              updateGoogleCalendarSettings={updateGoogleCalendarSettings}
              disconnectCalendar={disconnectCalendar}
              addGoogleSyncLog={addGoogleSyncLog}
              clearGoogleSyncLogs={clearGoogleSyncLogs}
              saveGoogleCalendarEvents={saveGoogleCalendarEvents}
            />
          )}

          {currentView === 'STREAKS' && (
            <StreakDashboard
              state={state}
              updateStreakRule={updateStreakRule}
              updateStreak={updateStreak}
              tasks={state.tasks || []}
            />
          )}

        </AnimatePresence>
      </main>

      {/* QUICK ACTIONS HUB - Persistent Multi-Purpose capture floating trigger */}
      {!isLanderMode && currentView !== 'TODAY' && (
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
      )}

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
              <div className="grid grid-cols-2 border border-white/5 bg-[#090a0c] p-1 mb-5">
                {(['TASK', 'IDEA'] as const).map(tab => {
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
        <span className="text-zinc-700">PEAK DISCIPLINE OPERATIVE</span>
      </div>

      {/* Modals check */}
      <EodCheckModal 
        isOpen={!!state.pendingEodCheck}
        taskText={state.pendingEodCheck?.taskText || ''}
        onComplete={completeEodCheck}
      />

      <EodReflectionModal
        isOpen={shouldShowEodModal}
        onSave={handleSaveEodReflection}
        onSkip={handleSkipEodReflection}
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

      <NotificationCenter
        notifications={state.notifications || []}
        tasks={state.tasks || []}
        goals={state.goals || []}
        streak={state.streak || 0}
        notificationSettings={state.notificationSettings || {
          morningBriefing: true,
          morningBriefTime: '08:00',
          taskReminders: true,
          eodPrompt: true,
          eodPromptTime: '17:00',
          milestones: true,
          insights: true,
          weeklyDigest: true,
          digestFrequency: 'weekly',
          quietHoursEnabled: true,
          quietHoursStart: '21:00',
          quietHoursEnd: '08:00',
        }}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
        onClear={clearNotifications}
        onAddNotification={addNotification}
      />

      {showCelebrationConfetti && (
        <Confetti onComplete={() => setShowCelebrationConfetti(false)} />
      )}

      {isOnboardingActive && (
        <OnboardingTour
          onAddTask={addTask}
          onSetPrimary={setPrimaryTask}
          onAddSubtask={addSubtask}
          onAddReflection={addReflection}
          onStartTimer={(taskId, isPom, dur) => {
            // start timer in hook
            startTimer(taskId, isPom, dur);
          }}
          onStopTimer={stopTimer}
          onComplete={() => setIsOnboardingActive(false)}
          tasks={state.tasks || []}
        />
      )}
    </div>
  );
}
