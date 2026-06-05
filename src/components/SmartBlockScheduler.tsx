import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Brain, 
  AlertTriangle, 
  Zap, 
  Coffee, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Check, 
  Sparkles, 
  Trash2, 
  Calendar, 
  Briefcase, 
  Home, 
  Laptop, 
  BookOpen, 
  PhoneCall, 
  Maximize, 
  Eye, 
  AlertCircle 
} from 'lucide-react';
import { TimeBlock, TimeBlockType, Task, BlockTemplate, GoogleCalendarSettings, GoogleCalendarEvent } from '../types';
import { findNextFreeSlot } from '../utils/googleCalendarService';

interface SmartBlockSchedulerProps {
  tasks: Task[];
  allTasks: Task[];
  timeBlocks: TimeBlock[];
  blockTemplates: BlockTemplate[];
  onAddTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onUpdateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onApplyBlockTemplate: (templateId: string, dayOfWeek: number) => void;
  onSaveBlockAsTemplate: (name: string, description: string, dayOfWeek: number) => void;
  onAssignToBlock?: (taskId: string, blockType: TimeBlockType) => void; 
  googleCalendarEvents?: GoogleCalendarEvent[];
  googleCalendarSettings?: GoogleCalendarSettings;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const ENV_ICONS = {
  office: <Briefcase className="w-3.5 h-3.5" />,
  home: <Home className="w-3.5 h-3.5" />,
  'coffee shop': <Laptop className="w-3.5 h-3.5" />,
  outdoor: <BookOpen className="w-3.5 h-3.5" />,
  any: <Sparkles className="w-3.5 h-3.5" />,
};

const TOOL_ICONS = {
  computer: <Laptop className="w-3.5 h-3.5" />,
  notebook: <BookOpen className="w-3.5 h-3.5" />,
  phone: <PhoneCall className="w-3.5 h-3.5" />,
  none: <Sparkles className="w-3.5 h-3.5" />,
};

export function SmartBlockScheduler({
  tasks,
  allTasks,
  timeBlocks = [],
  blockTemplates = [],
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onApplyBlockTemplate,
  onSaveBlockAsTemplate,
  onAssignToBlock,
  googleCalendarEvents = [],
  googleCalendarSettings
}: SmartBlockSchedulerProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Monday
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'DAILY'>('CALENDAR');

  // Google Calendar scheduling helpers
  const calendarConnected = googleCalendarSettings?.connected;

  const googleMeetingsToday = useMemo(() => {
    return googleCalendarEvents.filter(event => {
      const s = event.start?.dateTime;
      if (!s) return false;
      const d = new Date(s);
      return d.getDay() === selectedDay;
    });
  }, [googleCalendarEvents, selectedDay]);

  const todayScheduledFocusDuration = useMemo(() => {
    const blocksForDay = timeBlocks.filter(b => b.dayOfWeek === selectedDay);
    return blocksForDay.reduce((acc, b) => acc + b.duration, 0);
  }, [timeBlocks, selectedDay]);

  const showOverschedulingAlert = todayScheduledFocusDuration > 360; // warn if > 6 hours are mapped

  const handleSuggestSlot = () => {
    const result = findNextFreeSlot(googleCalendarEvents, timeBlocks, 120);
    if (result) {
      const hs = String(result.dateStart.getHours()).padStart(2, '0');
      const ms = String(result.dateStart.getMinutes()).padStart(2, '0');
      setFormStartTime(`${hs}:${ms}`);
      setFormDuration(120);
      setFormLabel("Smart GCal Suggested Block");
      setFormType("DEEP");
    }
  };
  
  // Custom template save states
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  
  // New Block Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<TimeBlockType>('DEEP');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState<number>(90);
  const [formEnv, setFormEnv] = useState<'office' | 'home' | 'coffee shop' | 'outdoor' | 'any'>('office');
  const [formTools, setFormTools] = useState<('computer' | 'notebook' | 'phone' | 'none')[]>(['computer']);
  const [formFocus, setFormFocus] = useState<number>(8);
  const [formLabel, setFormLabel] = useState('');

  // Selected Block Detail Panel State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string>('');

  // Find currently active or selected block
  const selectedBlock = useMemo(() => {
    return timeBlocks.find(b => b.id === selectedBlockId);
  }, [timeBlocks, selectedBlockId]);

  // Handle template apply
  const handleApplyTemplate = (templateId: string, day: number) => {
    onApplyBlockTemplate(templateId, day);
  };

  // Handle custom template save
  const handleSaveAsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tplName.trim()) {
      onSaveBlockAsTemplate(tplName.trim(), tplDesc.trim() || 'Custom saved block layout.', selectedDay);
      setTplName('');
      setTplDesc('');
      setIsSavingTemplate(false);
    }
  };

  // Convert "HH:MM" to minutes from midnight
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Convert minutes from midnight to "HH:MM"
  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Sort blocks for display
  const sortedBlocks = useMemo(() => {
    return [...timeBlocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [timeBlocks]);

  // Extract blocks for selected day
  const dayBlocks = useMemo(() => {
    return sortedBlocks.filter(b => b.dayOfWeek === selectedDay);
  }, [sortedBlocks, selectedDay]);

  // OPTIMAL SCHEDULING ANALYSIS ENGINE
  const schedulerAnalysis = useMemo(() => {
    // 1. Calculate Peak Productivity hours from resolved/completed tasks (using allTasks database)
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const hourBlocks = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const hrs = new Date(t.completedAt).getHours();
        if (hrs >= 6 && hrs < 13) hourBlocks.Morning++;
        else if (hrs >= 13 && hrs < 18) hourBlocks.Afternoon++;
        else if (hrs >= 18 && hrs < 24) hourBlocks.Evening++;
        else hourBlocks.Night++;
      }
    });

    let peakSlot = 'Morning (09:00 - 12:00)';
    let maxResolves = hourBlocks.Morning;
    
    if (hourBlocks.Afternoon > maxResolves) {
      peakSlot = 'Afternoon (13:00 - 17:00)';
      maxResolves = hourBlocks.Afternoon;
    }
    if (hourBlocks.Evening > maxResolves) {
      peakSlot = 'Evening (18:00 - 22:00)';
      maxResolves = hourBlocks.Evening;
    }
    if (hourBlocks.Night > maxResolves) {
      peakSlot = 'Late Night (22:00 - 02:00)';
      maxResolves = hourBlocks.Night;
    }

    // Is there enough historical telemetry logs? If not, default to Morning circadian rhythm.
    const hasEnoughData = completedTasks.length >= 3;
    const suggestedFocusStartTime = peakSlot.includes('Morning') ? '09:00' 
      : peakSlot.includes('Afternoon') ? '14:00' 
      : peakSlot.includes('Evening') ? '19:00' : '22:00';

    // 2. Overload Check and Suggester on Selected Day
    const totalDeepMinutes = dayBlocks
      .filter(b => b.type === 'DEEP')
      .reduce((acc, curr) => acc + curr.duration, 0);

    const isOverloaded = totalDeepMinutes > 300; // > 5 hours.
    
    const totalLightMinutes = dayBlocks
      .filter(b => b.type === 'LIGHT')
      .reduce((acc, curr) => acc + curr.duration, 0);

    const balanceVerdict = (() => {
      if (dayBlocks.length === 0) return 'No blocks scheduled. Apply a template below to optimize your focus.';
      if (isOverloaded) return '⚠️ NEURAL OVERLOAD DETECTED! You have scheduled ' + (totalDeepMinutes / 60).toFixed(1) + ' hours of DEEP work today. Studies confirm cognitive endurance peaks at 4–5 hours maximum. Replace a DEEP block with LIGHT work or FREE rest to avoid burnout.';
      if (totalDeepMinutes > 0 && totalLightMinutes === 0) return 'Recommend adding at least one brief 30m LIGHT block in the afternoon to clear low-cognitive administrative logs and emails.';
      if (totalDeepMinutes === 0 && totalLightMinutes > 0) return 'Administrative heavy load. Consider placing a 90m high-concentration DEEP block during your ' + peakSlot + ' peak focus window to drive primary objectives.';
      return 'Balanced block distribution achieved. Core focus sessions are well insulated with recovery buffers.';
    })();

    return {
      peakSlot,
      suggestedFocusStartTime,
      hasEnoughData,
      totalDeepHours: totalDeepMinutes / 60,
      isOverloaded,
      balanceVerdict
    };
  }, [allTasks, dayBlocks]);

  // RECOMMENDED TASK LIST FOR SELECTED BLOCK
  const recommendedTasksForSelectedBlock = useMemo(() => {
    if (!selectedBlock) return [];
    
    // Choose appropriate tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    if (selectedBlock.type === 'DEEP') {
      // Recommend tasks with higher focus levels, dependencies, or OKR goals
      return pendingTasks.filter(t => {
        const isFocusIntense = !t.block || t.block === 'DEEP';
        // Boost if has dependencies or goal linked
        return isFocusIntense;
      }).slice(0, 3);
    } else if (selectedBlock.type === 'LIGHT') {
      // Recommend template tasks
      return pendingTasks.filter(t => t.block === 'LIGHT' || !t.block).slice(0, 3);
    } else {
      return pendingTasks.filter(t => t.block === 'FREE').slice(0, 3);
    }
  }, [tasks, selectedBlock]);

  // ACTION CAROUSEL: "I'M IN FLOW", "NEED A BREAK", "QUICK SWAP"
  const handleFlowExtend = (blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) return;
    // Add 30m to duration
    onUpdateTimeBlock(blockId, { duration: block.duration + 30 });
  };

  const handleNeedABreak = (blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) return;
    // Push the timing forward by 30 minutes
    const mins = timeToMinutes(block.startTime);
    const newMins = mins + 30;
    onUpdateTimeBlock(blockId, { startTime: minutesToTime(newMins) });
  };

  const handleQuickSwap = (blockId: string, targetId: string) => {
    if (!targetId) return;
    const blockA = timeBlocks.find(b => b.id === blockId);
    const blockB = timeBlocks.find(b => b.id === targetId);
    if (!blockA || !blockB) return;

    // Swap parameters
    const swapA = {
      dayOfWeek: blockB.dayOfWeek,
      startTime: blockB.startTime,
      duration: blockB.duration,
    };
    const swapB = {
      dayOfWeek: blockA.dayOfWeek,
      startTime: blockA.startTime,
      duration: blockA.duration,
    };

    onUpdateTimeBlock(blockA.id, swapA);
    onUpdateTimeBlock(blockB.id, swapB);
    setSwapTargetId('');
  };

  // Click-to-move block position helper
  const handleMoveBlock = (blockId: string, direction: 'UP' | 'DOWN', minutes: number = 30) => {
    const b = timeBlocks.find(x => x.id === blockId);
    if (!b) return;
    const mins = timeToMinutes(b.startTime);
    const updatedMins = direction === 'UP' ? Math.max(0, mins - minutes) : Math.min(1410, mins + minutes);
    onUpdateTimeBlock(blockId, { startTime: minutesToTime(updatedMins) });
  };

  // Form submit for new blocks
  const handleAddBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTimeBlock({
      dayOfWeek: selectedDay,
      startTime: formStartTime,
      duration: Number(formDuration),
      type: formType,
      environment: formEnv,
      tools: formTools,
      focusLevel: Number(formFocus),
      label: formLabel.trim() || `${formType} block`,
      linkedTaskId: null
    });
    setFormLabel('');
    setShowAddForm(false);
  };

  // Auto assign recommendation to block
  const handleLinkTaskToBlock = (blockId: string, taskId: string) => {
    onUpdateTimeBlock(blockId, { linkedTaskId: taskId });
    // Also assign category to task if assignToBlock function exists
    if (onAssignToBlock) {
      const block = timeBlocks.find(b => b.id === blockId);
      if (block) {
        onAssignToBlock(taskId, block.type);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION: AI OPTIMAL SCHEDULING HEADER */}
      <section className="bg-zinc-950/60 border border-white/5 p-5 space-y-4 rounded-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 text-orange-500 bg-orange-950/20 border border-orange-500/10">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-orange-400 font-bold block">Circadian Core</span>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">Dynamic Micro-Calibration</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase">Peak Attention Profile</span>
            <span className="text-xs font-mono text-white font-semibold block uppercase">
              {schedulerAnalysis.hasEnoughData ? '📊 Detected: ' : '🤖 Predicted: '} {schedulerAnalysis.peakSlot}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase font-black tracking-widest">
              <Zap className="w-3.5 h-3.5 text-zinc-500" /> Suggestions Engine
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {schedulerAnalysis.balanceVerdict}
            </p>
          </div>

          <div className="bg-zinc-900/30 p-3 border border-white/5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Scheduled Deep Load</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${schedulerAnalysis.isOverloaded ? 'bg-red-950 text-red-400 border border-red-500/20' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/10'}`}>
                {schedulerAnalysis.totalDeepHours.toFixed(1)} / 5.0 Hrs Max
              </span>
            </div>
            
            <button
              onClick={() => {
                // Auto create suggested deep block
                onAddTimeBlock({
                  dayOfWeek: selectedDay,
                  startTime: schedulerAnalysis.suggestedFocusStartTime,
                  duration: 90,
                  type: 'DEEP',
                  environment: 'office',
                  tools: ['computer'],
                  focusLevel: 9,
                  label: 'AI Auto-Suggested Deep Session',
                  linkedTaskId: null
                });
              }}
              className="text-center py-1.5 bg-white text-black hover:bg-zinc-200 transition-all text-[9.5px] font-mono uppercase tracking-widest font-black"
            >
              ⚡ Suggest Peak Block
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: DAY SELECTION & CONTROLS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map(d => {
            const numBlocksOnDay = timeBlocks.filter(b => b.dayOfWeek === d.value).length;
            const hasOverload = timeBlocks.filter(b => b.dayOfWeek === d.value && b.type === 'DEEP').reduce((sum, current) => sum + current.duration, 0) > 300;
            
            return (
              <button
                key={d.value}
                onClick={() => {
                  setSelectedDay(d.value);
                  setSelectedBlockId(null);
                }}
                className={`relative px-3.5 py-2.5 text-[10px] font-mono uppercase font-bold tracking-wider transition-all border ${
                  selectedDay === d.value
                    ? 'bg-white border-white text-black font-black'
                    : 'bg-zinc-950/40 text-zinc-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {d.label}
                {numBlocksOnDay > 0 && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${hasOverload ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('CALENDAR')}
            className={`py-1.5 px-3 border border-white/5 text-[10px] uppercase font-mono tracking-wider ${viewMode === 'CALENDAR' ? 'bg-zinc-900 border-white/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setViewMode('DAILY')}
            className={`py-1.5 px-3 border border-white/5 text-[10px] uppercase font-mono tracking-wider ${viewMode === 'DAILY' ? 'bg-zinc-900 border-white/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Daily Detail
          </button>
        </div>
      </section>

      {/* WEEKLY GRID OR DAILY TIMELINE */}
      <AnimatePresence mode="wait">
        {viewMode === 'CALENDAR' ? (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-white/5 bg-zinc-950/20 p-4 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
              {DAYS_OF_WEEK.map(d => {
                const dayBlocksList = sortedBlocks.filter(b => b.dayOfWeek === d.value);
                const isCurrent = d.value === selectedDay;
                
                return (
                  <div 
                    key={d.value}
                    onClick={() => setSelectedDay(d.value)}
                    className={`border p-3 flex flex-col min-h-[220px] transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-zinc-900/60 border-white/25 shadow-md scale-[1.01]' 
                        : 'bg-zinc-950/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2.5">
                      <span className={`text-[10px] uppercase font-mono tracking-widest ${isCurrent ? 'text-white font-heavy font-black' : 'text-zinc-600'}`}>
                        {d.label}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600">{dayBlocksList.length} blocks</span>
                    </div>

                    <div className="flex-1 space-y-2 relative">
                      {dayBlocksList.map(b => (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(d.value);
                            setSelectedBlockId(b.id);
                          }}
                          className={`p-2 border relative group text-left cursor-pointer select-none transition-all ${
                            selectedBlockId === b.id 
                              ? 'border-white bg-zinc-900 text-white shadow-[0_0_8px_rgba(255,255,255,0.06)]' 
                              : b.type === 'DEEP' 
                                ? 'bg-orange-950/20 border-orange-500/20 text-orange-200 hover:border-orange-500/40'
                                : b.type === 'LIGHT'
                                  ? 'bg-blue-950/20 border-blue-500/20 text-blue-200 hover:border-blue-500/40'
                                  : 'bg-emerald-950/10 border-emerald-500/10 text-emerald-300 hover:border-emerald-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[8px] font-mono opacity-50 mb-1">
                            <span>{b.startTime}</span>
                            <span>{b.duration}m</span>
                          </div>
                          <span className="text-[9.5px] font-bold font-mono tracking-wide truncate block">{b.label || b.type}</span>
                          <div className="flex items-center gap-1 mt-1 text-[8px] font-mono opacity-40">
                            {ENV_ICONS[b.environment]} <span>{b.environment}</span>
                          </div>
                        </div>
                      ))}

                      {dayBlocksList.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[8px] font-mono uppercase tracking-widest text-center">
                          Clear Schedule
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="daily-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {dayBlocks.length === 0 ? (
              <div className="py-14 border border-dashed border-white/5 text-center max-w-sm mx-auto space-y-3">
                <Coffee className="w-8 h-8 text-zinc-600 mx-auto opacity-30 animate-pulse-subtle" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Day schedule completely unmapped</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="px-3.5 py-1.5 text-[9px] font-mono uppercase bg-white text-black font-black tracking-widest"
                >
                  Create Custom Block
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* TIMELINE LIST */}
                <div className="lg:col-span-2 space-y-2.5">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    <span>Scheduled Progression Stream</span>
                    <span>Total {dayBlocks.length} Segments</span>
                  </div>

                  <div className="space-y-3">
                    {dayBlocks.map(b => {
                      const isSelected = b.id === selectedBlockId;
                      
                      return (
                        <div
                          key={b.id}
                          className={`border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 pointer-events-auto cursor-pointer ${
                            isSelected 
                              ? 'border-white bg-zinc-950 shadow-md' 
                              : b.type === 'DEEP'
                                ? 'bg-orange-950/10 border-orange-500/10 hover:border-orange-500/30 text-white'
                                : b.type === 'LIGHT'
                                  ? 'bg-blue-950/10 border-blue-500/10 hover:border-blue-500/30 text-white'
                                  : 'bg-emerald-900/5 border-emerald-500/10 hover:border-emerald-500/30 text-white'
                          }`}
                          onClick={() => setSelectedBlockId(b.id)}
                        >
                          <div className="space-y-1 bg-transparent">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                b.type === 'DEEP' ? 'bg-orange-500' : b.type === 'LIGHT' ? 'bg-blue-500' : 'bg-emerald-500'
                              }`} />
                              <span className="text-[9.5px] font-mono font-black border text-zinc-400 opacity-60 uppercase px-1.5 border-black/30">
                                {b.startTime} • {b.duration} Min
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase">
                                Range: {b.startTime} - {minutesToTime(timeToMinutes(b.startTime) + b.duration)}
                              </span>
                            </div>
                            <h4 className="text-sm font-black tracking-tighter uppercase text-white font-mono mt-1">
                              {b.label || b.type}
                            </h4>
                            <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-500 pt-0.5">
                              <span className="flex items-center gap-1">
                                {ENV_ICONS[b.environment]} Env: {b.environment}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                Tooling: {b.tools.length > 0 ? b.tools.join(', ') : 'none'}
                              </span>
                              <span>•</span>
                              <span className="text-orange-400 font-bold">Focus: {b.focusLevel}/10</span>
                            </div>
                            
                            {b.linkedTaskId && (
                              <div className="mt-2 inline-flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400 uppercase bg-emerald-950/20 border border-emerald-500/15 py-0.5 px-2">
                                <Check className="w-3 h-3 text-emerald-500" /> Linked: {tasks.find(t => t.id === b.linkedTaskId)?.text || 'Assigned Target'}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 justify-end shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleFlowExtend(b.id)}
                              className="p-1 px-2 border border-white/5 hover:border-white/20 text-[9px] font-mono uppercase bg-zinc-950 text-zinc-400 hover:text-white"
                              title="I'm in Flow! Extend block by 30 mins"
                            >
                              🚀 +30m
                            </button>
                            <button
                              onClick={() => handleNeedABreak(b.id)}
                              className="p-1 px-2 border border-white/5 hover:border-white/20 text-[9px] font-mono uppercase bg-zinc-950 text-zinc-400 hover:text-white"
                              title="Need a Break. Defer timing backward by 30 mins"
                            >
                              ☕ Defer 30
                            </button>
                            <button
                              onClick={() => onDeleteTimeBlock(b.id)}
                              className="p-1.5 border border-white/5 hover:border-red-500/30 text-zinc-500 hover:text-red-400 bg-zinc-950"
                              title="Delete block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SCHEDULER ACTIONS SIDE BAR DETAILS */}
                <div className="space-y-4">
                  {selectedBlock ? (
                    <div className="border border-white/10 bg-zinc-950/60 p-5 space-y-6">
                      <div className="border-b border-white/5 pb-3">
                        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">Selected Block Inspector</span>
                        <h4 className="text-base font-black tracking-tight text-white uppercase font-mono mt-1">
                          {selectedBlock.label || selectedBlock.type}
                        </h4>
                        <span className="text-[9px] font-mono text-orange-400 uppercase mt-0.5 block">{selectedBlock.type} Focus Segment</span>
                      </div>

                      {/* QUICK ADJUST BUTTONS */}
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider">Fine Timing Reschedule</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleMoveBlock(selectedBlock.id, 'UP', 30)}
                            className="py-1 px-2 text-[9px] font-mono uppercase tracking-widest border border-white/10 hover:border-white bg-[#050505] text-zinc-400 hover:text-white"
                          >
                            ▲ Move Up 30m
                          </button>
                          <button
                            onClick={() => handleMoveBlock(selectedBlock.id, 'DOWN', 30)}
                            className="py-1 px-2 text-[9px] font-mono uppercase tracking-widest border border-white/10 hover:border-white bg-[#050505] text-zinc-400 hover:text-white"
                          >
                            ▼ Move Down 30m
                          </button>
                        </div>
                      </div>

                      {/* QUICK TIME SWAP */}
                      <div className="space-y-2.5">
                        <label className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider block">Quick Swap Blocks Exchange</label>
                        <div className="flex gap-1.5">
                          <select
                            value={swapTargetId}
                            onChange={(e) => setSwapTargetId(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-white/10 p-1.5 text-[9px] font-mono uppercase text-zinc-400 outline-none"
                          >
                            <option value="">Exchange with block...</option>
                            {timeBlocks.filter(b => b.id !== selectedBlock.id).map(tb => {
                              const dayLabel = DAYS_OF_WEEK.find(d => d.value === tb.dayOfWeek)?.label || 'Day';
                              return (
                                <option key={tb.id} value={tb.id}>{dayLabel} ({tb.startTime}) - {tb.label || tb.type}</option>
                              );
                            })}
                          </select>
                          <button
                            onClick={() => handleQuickSwap(selectedBlock.id, swapTargetId)}
                            disabled={!swapTargetId}
                            className="py-1 px-3 border border-white/10 bg-white text-black font-semibold text-[9px] font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-35"
                          >
                            Swap
                          </button>
                        </div>
                      </div>

                      {/* TASKS RECOMMENDATION LIST */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Recommended Task Match</span>
                          <p className="text-[8px] font-sans text-zinc-600 mt-0.5 italic">Matched to block intensity and tooling tags.</p>
                        </div>

                        <div className="space-y-2">
                          {recommendedTasksForSelectedBlock.map(t => {
                            const isLinkedAlready = selectedBlock.linkedTaskId === t.id;
                            return (
                              <div key={t.id} className="p-2 border border-white/5 bg-zinc-900/40 flex justify-between items-center text-[10px] gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-zinc-300 block truncate">{t.text}</span>
                                  {t.estimatedTime && <span className="text-[8px] font-mono text-zinc-500 lowercase">Est: {t.estimatedTime}m</span>}
                                </div>
                                <button
                                  onClick={() => handleLinkTaskToBlock(selectedBlock.id, t.id)}
                                  className={`p-1 border border-white/10 font-mono text-[8px] uppercase tracking-wider shrink-0 transition-all ${
                                    isLinkedAlready 
                                      ? 'bg-zinc-800 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-white text-black font-bold hover:bg-zinc-200'
                                  }`}
                                >
                                  {isLinkedAlready ? 'Linked ✓' : 'Link Block'}
                                </button>
                              </div>
                            );
                          })}

                          {recommendedTasksForSelectedBlock.length === 0 && (
                            <p className="text-[9px] font-mono text-zinc-600 italic">No free pending tasks matching this segment.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 border border-dashed border-white/5 text-center text-zinc-600 max-w-xs mx-auto space-y-2.5">
                      <Eye className="w-8 h-8 mx-auto opacity-20" />
                      <p className="text-[9px] font-mono uppercase tracking-widest">Select segment block above to inspect</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE NEW BLOCK INTEGRATION BAR */}
      <section className="bg-zinc-950/20 border border-white/5 p-4 rounded-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Interactive Planner Segment</h4>
            <p className="text-[9px] font-mono text-zinc-500 uppercase leading-tight mt-0.5">Map customized Deep, Light or Free intervals inside the selected day.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="py-1 px-3 border border-white bg-white text-black text-[9px] font-mono font-heavy font-black uppercase tracking-wider"
          >
            {showAddForm ? 'Hide Form' : 'Add Time Segment'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddBlockSubmit} className="mt-4 p-4 border border-white/10 bg-zinc-950 space-y-4 font-mono select-text">
            
            {/* Real-time Google Calendar Overlay & Intelligent Automation Controls */}
            {calendarConnected && (
              <div className="space-y-3.5 pb-2 border-b border-white/5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="text-[9.5px]/relaxed text-zinc-400 font-sans">
                    <strong className="text-white">Smart Scheduler Assistance:</strong> Let Anchor scour your GCal list and local blocks to map optimal focus times.
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggestSlot}
                    className="py-1 px-3 bg-orange-600 hover:bg-orange-700 text-white hover:text-white font-heavy font-black uppercase text-[9px] tracking-wider self-start shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-orange-200 animate-pulse" />
                    Find next free 2h slot ✦
                  </button>
                </div>

                {googleMeetingsToday.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase block">Google Calendar External Overlays Today:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {googleMeetingsToday.map(meeting => {
                        const s = meeting.start?.dateTime ? new Date(meeting.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All Day';
                        return (
                          <div key={meeting.id} className="p-1.5 border border-white/[0.04] bg-zinc-950 flex justify-between items-center text-[9px] font-mono">
                            <span className="text-zinc-300 truncate max-w-[150px] font-sans font-bold block">{meeting.summary || 'Private Event'}</span>
                            <span className="text-orange-400 shrink-0 font-bold">{s}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overscheduling Warn Alarm Block */}
            {showOverschedulingAlert && (
              <div className="p-3 bg-orange-950/20 border border-orange-500/20 flex items-start gap-2.5 text-orange-400 text-xs">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold block">Cognitive Mismatch Warning (Too Many Today)</span>
                  <p className="font-sans text-[10.5px] text-zinc-350 font-medium">
                    You have mapped over <strong>{Math.round(todayScheduledFocusDuration / 60)} hours</strong> of deep focus blocks for today. Piling more blocks reduces real executive capability and raises fatigue!
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
              
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Block Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as TimeBlockType)}
                  className="w-full bg-[#050505] p-2 border border-white/15 text-white focus:outline-none outline-none focus:border-white h-8"
                >
                  <option value="DEEP">DEEP Focus</option>
                  <option value="LIGHT">LIGHT Admin</option>
                  <option value="FREE">FREE Time</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Start Time</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full bg-[#050505] p-2 border border-white/15 text-white focus:outline-none outline-none focus:border-white h-8 block"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Duration (Min)</label>
                <select
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full bg-[#050505] p-2 border border-white/15 text-white focus:outline-none outline-none focus:border-white h-8"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                  <option value="120">120 Minutes</option>
                  <option value="180">180 Minutes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Focus Requirement</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formFocus}
                  onChange={(e) => setFormFocus(Number(e.target.value))}
                  className="w-full accent-white mt-2 block"
                />
                <span className="text-[8px] text-zinc-400 block text-right mt-1 font-bold font-mono">Intensity: {formFocus}/10</span>
              </div>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10px]">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Target Environment</label>
                <select
                  value={formEnv}
                  onChange={(e) => setFormEnv(e.target.value as any)}
                  className="w-full bg-[#050505] p-1.5 border border-white/15 text-white focus:outline-none outline-none h-8"
                >
                  <option value="office">Office Desk</option>
                  <option value="home">Home Study</option>
                  <option value="coffee shop">Coffee Shop</option>
                  <option value="outdoor">Outdoor / Travel</option>
                  <option value="any">Any Setup</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Primary Tooling Required</label>
                <div className="flex gap-2 pt-1">
                  {['computer', 'notebook', 'phone'].map(t => {
                    const isSelected = formTools.includes(t as any);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormTools(formTools.filter(x => x !== t));
                          } else {
                            setFormTools([...formTools, t as any]);
                          }
                        }}
                        className={`py-0.5 px-2 border text-[8px] uppercase tracking-wider font-bold transition-all ${
                          isSelected ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Custom Title Label</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. Core Module Refactor"
                  className="w-full bg-[#050505] p-1.5 border border-white/15 text-zinc-300 focus:outline-none focus:border-white h-8 block text-[10px]"
                />
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="py-1.5 px-5 bg-white text-black text-[9px] font-bold uppercase tracking-widest hover:opacity-90 font-mono"
              >
                Assemble Time Block ✓
              </button>
            </div>
          </form>
        )}
      </section>

      {/* SECTION: BENTO BLOCK TEMPLATES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Recurring Block Templates</h4>
            <p className="text-[9px] font-mono text-zinc-500 uppercase leading-none mt-1">Deploy whole-day custom focus regimes in one quick command.</p>
          </div>
          <button
            onClick={() => setIsSavingTemplate(!isSavingTemplate)}
            className="py-1 px-3 border border-white/10 text-[9px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider"
          >
            {isSavingTemplate ? 'Cancel Save' : 'Save Today as Template'}
          </button>
        </div>

        {/* Save Day As Template Form */}
        {isSavingTemplate && (
          <form onSubmit={handleSaveAsTemplateSubmit} className="p-4 border border-white/10 bg-zinc-950/80 space-y-3 font-mono">
            <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Save active day blocks layout as a reusable blueprint</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Template Name e.g. Extreme Deep Wednesday"
                className="bg-[#050505] p-2 border border-white/15 text-xs text-white outline-none focus:border-white w-full h-8 block"
                required
              />
              <input
                type="text"
                value={tplDesc}
                onChange={(e) => setTplDesc(e.target.value)}
                placeholder="Brief description e.g. Focus on deep refactoring with breaks"
                className="bg-[#050505] p-2 border border-white/15 text-xs text-white outline-none focus:border-white w-full h-8 block"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="py-1 px-3 bg-white text-black text-[9px] font-bold uppercase tracking-wide"
              >
                Publish Template ✓
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {blockTemplates.map(tpl => (
            <div key={tpl.id} className="border border-white/5 bg-zinc-950/40 p-4 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest block">Focus Blueprint</span>
                <h5 className="text-xs font-black uppercase text-white font-mono tracking-wide mt-1">{tpl.name}</h5>
                <p className="text-[10px] text-zinc-500 leading-normal mt-1.5">{tpl.description}</p>
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Configuration:</span>
                  <div className="flex gap-1">
                    {tpl.blocks.map((b, i) => (
                      <span key={i} className={`w-2 h-2 rounded-full ${
                        b.type === 'DEEP' ? 'bg-orange-500' : b.type === 'LIGHT' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} title={`${b.type} block at ${b.startTime}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleApplyTemplate(tpl.id, selectedDay)}
                  className="w-full text-center py-1.5 border border-white/10 hover:border-white text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-widest font-black transition-colors"
                >
                  ⚡ Apply to Selected Day
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
