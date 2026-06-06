import { useState, useEffect } from 'react';
import { DailyState, Task, Category, TaskStatus, TimeBlockType, Idea, IdeaStatus, EodReason, Reflection, ReflectionTag, TimeLog, ActiveTimer, TimeBlock, BlockTemplate, NotificationSettings, AppNotification, GoogleCalendarSettings, GoogleCalendarEvent, GoogleSyncLog } from '../types';

const STORAGE_KEY = 'anchor_app_state';

const DEFAULT_GOOGLE_CALENDAR_SETTINGS: GoogleCalendarSettings = {
  connected: false,
  clientId: '',
  calendarId: 'primary',
  calendarName: 'Primary Calendar',
  syncEnabled: false,
  syncConflictsWarn: true,
  lastSynced: null,
};

const DEFAULT_TEMPLATES: BlockTemplate[] = [
  {
    id: 'monday_deep',
    name: 'Monday Deep Sessions',
    description: '3x 90m deep work blocks optimizing morning neural clarity.',
    blocks: [
      { dayOfWeek: 1, startTime: '09:00', duration: 90, type: 'DEEP', environment: 'office', tools: ['computer'], focusLevel: 9, label: 'Morning Sprint Spec', linkedTaskId: null },
      { dayOfWeek: 1, startTime: '11:00', duration: 90, type: 'DEEP', environment: 'office', tools: ['computer'], focusLevel: 8, label: 'Core System Refactoring', linkedTaskId: null },
      { dayOfWeek: 1, startTime: '14:00', duration: 90, type: 'DEEP', environment: 'home', tools: ['computer'], focusLevel: 8, label: 'Security Auditing Session', linkedTaskId: null },
    ]
  },
  {
    id: 'admin_friday',
    name: 'Admin Friday',
    description: '4x 30m light work blocks to sweep communication channels and clear chores.',
    blocks: [
      { dayOfWeek: 5, startTime: '09:30', duration: 30, type: 'LIGHT', environment: 'office', tools: ['computer', 'phone'], focusLevel: 4, label: 'Weekly Backlog Grooming', linkedTaskId: null },
      { dayOfWeek: 5, startTime: '10:30', duration: 30, type: 'LIGHT', environment: 'office', tools: ['computer'], focusLevel: 3, label: 'GCP Budget review', linkedTaskId: null },
      { dayOfWeek: 5, startTime: '13:30', duration: 30, type: 'LIGHT', environment: 'coffee shop', tools: ['phone'], focusLevel: 3, label: 'Inbox Chores Cleared', linkedTaskId: null },
      { dayOfWeek: 5, startTime: '15:00', duration: 30, type: 'LIGHT', environment: 'coffee shop', tools: ['phone'], focusLevel: 2, label: 'Weekly OKRs Calibration', linkedTaskId: null },
    ]
  },
  {
    id: 'flexible_wed',
    name: 'Flexible Wednesday',
    description: 'Balanced mixture of deep development, light admin work, and refreshing drift breaks.',
    blocks: [
      { dayOfWeek: 3, startTime: '09:00', duration: 90, type: 'DEEP', environment: 'home', tools: ['computer'], focusLevel: 9, label: 'PostgreSQL Indexes Design', linkedTaskId: null },
      { dayOfWeek: 3, startTime: '11:00', duration: 45, type: 'LIGHT', environment: 'home', tools: ['computer', 'phone'], focusLevel: 5, label: 'Customer Feedback Review', linkedTaskId: null },
      { dayOfWeek: 3, startTime: '13:30', duration: 90, type: 'DEEP', environment: 'coffee shop', tools: ['computer'], focusLevel: 7, label: 'Layout Polish & Animations', linkedTaskId: null },
      { dayOfWeek: 3, startTime: '15:30', duration: 60, type: 'FREE', environment: 'outdoor', tools: ['none'], focusLevel: 1, label: 'Misty Woods Recovery Hike', linkedTaskId: null },
    ]
  }
];

const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: 'tb-1', dayOfWeek: 1, startTime: '09:00', duration: 90, type: 'DEEP', environment: 'office', tools: ['computer'], focusLevel: 9, label: 'Morning Sprint Spec', linkedTaskId: null },
  { id: 'tb-2', dayOfWeek: 1, startTime: '11:00', duration: 90, type: 'DEEP', environment: 'office', tools: ['computer'], focusLevel: 8, label: 'Core System Refactoring', linkedTaskId: null },
  { id: 'tb-3', dayOfWeek: 1, startTime: '14:00', duration: 90, type: 'DEEP', environment: 'home', tools: ['computer'], focusLevel: 8, label: 'Security Auditing Session', linkedTaskId: null },
  { id: 'tb-4', dayOfWeek: 3, startTime: '09:00', duration: 90, type: 'DEEP', environment: 'home', tools: ['computer'], focusLevel: 9, label: 'PostgreSQL Indexes Design', linkedTaskId: null },
  { id: 'tb-5', dayOfWeek: 3, startTime: '11:00', duration: 45, type: 'LIGHT', environment: 'home', tools: ['computer', 'phone'], focusLevel: 5, label: 'Customer Feedback Review', linkedTaskId: null },
  { id: 'tb-6', dayOfWeek: 3, startTime: '13:30', duration: 90, type: 'DEEP', environment: 'coffee shop', tools: ['computer'], focusLevel: 7, label: 'Layout Polish & Animations', linkedTaskId: null },
  { id: 'tb-7', dayOfWeek: 3, startTime: '15:30', duration: 60, type: 'FREE', environment: 'outdoor', tools: ['none'], focusLevel: 1, label: 'Misty Woods Recovery Hike', linkedTaskId: null },
  { id: 'tb-8', dayOfWeek: 5, startTime: '09:30', duration: 30, type: 'LIGHT', environment: 'office', tools: ['computer', 'phone'], focusLevel: 4, label: 'Weekly Backlog Grooming', linkedTaskId: null },
  { id: 'tb-9', dayOfWeek: 5, startTime: '10:30', duration: 30, type: 'LIGHT', environment: 'office', tools: ['computer'], focusLevel: 3, label: 'GCP Budget review', linkedTaskId: null },
  { id: 'tb-10', dayOfWeek: 5, startTime: '13:30', duration: 30, type: 'LIGHT', environment: 'coffee shop', tools: ['phone'], focusLevel: 3, label: 'Inbox Chores Cleared', linkedTaskId: null },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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
};

const PREPOPULATED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-insight-1',
    type: 'insight',
    title: '💡 Smart Insight Profile',
    body: "You're becoming a morning person! 80% of tasks completed before noon.",
    timestamp: Date.now() - 3600 * 1000 * 5, // 5 hours ago
    read: false,
  },
  {
    id: 'notif-milestone-1',
    type: 'milestone',
    title: '🔥 Peak Streak Unlocked!',
    body: "12-day focus streak achieved! Your cognitive momentum is exceptional.",
    timestamp: Date.now() - 3600 * 1000 * 2, // 2 hours ago
    read: false,
  },
  {
    id: 'notif-brief-1',
    type: 'morning_brief',
    title: '☀️ Daily Focus Alignment',
    body: "Good morning! Today focus on: complete core layout specifications. Deep sessions prioritized.",
    timestamp: Date.now() - 3600 * 1000 * 10, // 10 hours ago
    read: true,
  }
];

export function useAnchorState() {
  const [state, setState] = useState<DailyState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Check if it's a new day
      if (parsed.lastResetDate !== today) {
        const previousPrimaryId = parsed.primaryTaskId;
        const previousPrimaryTask = parsed.tasks?.find((t: Task) => t.id === previousPrimaryId);
        const wasCompleted = previousPrimaryTask?.status === 'completed';

        // If a primary task existed yesterday but no EOD check was done, 
        // we need to trigger it now before resetting.
        // However, the streak resets if the check is skipped (which happens if they just open the app next day)
        // Actually, the prompt says "Reset streak if: task incomplete OR check skipped"
        // If they open the app and it's a new day, we trigger the check for YESTERDAY.
        
        return {
          ...parsed,
          lastResetDate: today,
          primaryTaskId: wasCompleted ? null : previousPrimaryId, // Auto carry forward if incomplete
          isContinuingTask: !wasCompleted && !!previousPrimaryId,
          pendingEodCheck: previousPrimaryId ? {
            date: parsed.lastResetDate,
            taskId: previousPrimaryId,
            taskText: previousPrimaryTask?.text || 'Unknown Task',
            completed: wasCompleted
          } : null,
          tasks: parsed.tasks || [],
          ideas: parsed.ideas || [],
          reflections: (parsed.reflections || []).map((r: any) => ({
            whatWorked: r.whatWorked || '',
            whatBlocked: r.whatBlocked || '',
            whatSurprised: r.whatSurprised || '',
            whatToDoDifferently: r.whatToDoDifferently || '',
            moodEnergy: r.moodEnergy !== undefined ? r.moodEnergy : r.energyRating !== undefined ? r.energyRating : 5,
            stressLevel: r.stressLevel !== undefined ? r.stressLevel : 5,
            photo: r.photo || r.photos?.[0] || null,
            relatedTaskId: r.relatedTaskId || null,
            templateId: r.templateId || null,
            createdAt: r.createdAt || (r.date ? new Date(r.date).getTime() : Date.now()),
            ...r
          })),
          dailyTodos: parsed.dailyTodos || {},
          goals: (parsed.goals || []).map((g: any) => ({
            type: g.type || 'weekly',
            status: g.status || (g.completed ? 'completed' : 'active'),
            createdAt: g.createdAt || Date.now(),
            lastUpdated: g.lastUpdated || Date.now(),
            ...g
          })),
          goalsEnabled: parsed.goalsEnabled !== undefined ? parsed.goalsEnabled : false,
          timeBlocks: parsed.timeBlocks || DEFAULT_TIME_BLOCKS,
          blockTemplates: parsed.blockTemplates || DEFAULT_TEMPLATES,
          notificationSettings: parsed.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS,
          notifications: parsed.notifications || PREPOPULATED_NOTIFICATIONS,
          lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
          streak: parsed.streak || 0,
          personalBestStreak: parsed.personalBestStreak !== undefined ? parsed.personalBestStreak : (parsed.streak || 0),
          streakRule: parsed.streakRule || 'traditional',
          forgivesUsedThisWeek: parsed.forgivesUsedThisWeek || 0,
          lastForgiveResetWeek: parsed.lastForgiveResetWeek || 0,
          streakMilestonesUnlocked: parsed.streakMilestonesUnlocked || [],
          lastCheckDate: parsed.lastCheckDate || null,
          timeTrackingEnabled: parsed.timeTrackingEnabled !== undefined ? parsed.timeTrackingEnabled : true,
          timeLogs: parsed.timeLogs || [],
          dailyTimeBudget: parsed.dailyTimeBudget || 480,
          activeTimer: parsed.activeTimer || null,
          googleCalendarSettings: parsed.googleCalendarSettings || DEFAULT_GOOGLE_CALENDAR_SETTINGS,
          googleCachedToken: parsed.googleCachedToken || null,
          googleTokenExpiry: parsed.googleTokenExpiry || null,
          googleCalendarEvents: parsed.googleCalendarEvents || [],
          googleSyncLogs: parsed.googleSyncLogs || [],
        };
      }
      return {
        ...parsed,
        tasks: parsed.tasks || [],
        ideas: parsed.ideas || [],
        reflections: (parsed.reflections || []).map((r: any) => ({
          whatWorked: r.whatWorked || '',
          whatBlocked: r.whatBlocked || '',
          whatSurprised: r.whatSurprised || '',
          whatToDoDifferently: r.whatToDoDifferently || '',
          moodEnergy: r.moodEnergy !== undefined ? r.moodEnergy : r.energyRating !== undefined ? r.energyRating : 5,
          stressLevel: r.stressLevel !== undefined ? r.stressLevel : 5,
          photo: r.photo || r.photos?.[0] || null,
          relatedTaskId: r.relatedTaskId || null,
          templateId: r.templateId || null,
          createdAt: r.createdAt || (r.date ? new Date(r.date).getTime() : Date.now()),
          ...r
        })),
        dailyTodos: parsed.dailyTodos || {},
        goals: (parsed.goals || []).map((g: any) => ({
          type: g.type || 'weekly',
          status: g.status || (g.completed ? 'completed' : 'active'),
          createdAt: g.createdAt || Date.now(),
          lastUpdated: g.lastUpdated || Date.now(),
          ...g
        })),
        goalsEnabled: parsed.goalsEnabled !== undefined ? parsed.goalsEnabled : false,
        timeBlocks: parsed.timeBlocks || DEFAULT_TIME_BLOCKS,
        blockTemplates: parsed.blockTemplates || DEFAULT_TEMPLATES,
        notificationSettings: parsed.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS,
        notifications: parsed.notifications || PREPOPULATED_NOTIFICATIONS,
        lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
        streak: parsed.streak || 0,
        personalBestStreak: parsed.personalBestStreak !== undefined ? parsed.personalBestStreak : (parsed.streak || 0),
        streakRule: parsed.streakRule || 'traditional',
        forgivesUsedThisWeek: parsed.forgivesUsedThisWeek || 0,
        lastForgiveResetWeek: parsed.lastForgiveResetWeek || 0,
        streakMilestonesUnlocked: parsed.streakMilestonesUnlocked || [],
        lastCheckDate: parsed.lastCheckDate || null,
        isContinuingTask: parsed.isContinuingTask || false,
        pendingEodCheck: parsed.pendingEodCheck || null,
        timeTrackingEnabled: parsed.timeTrackingEnabled !== undefined ? parsed.timeTrackingEnabled : true,
        timeLogs: parsed.timeLogs || [],
        dailyTimeBudget: parsed.dailyTimeBudget || 480,
        activeTimer: parsed.activeTimer || null,
        googleCalendarSettings: parsed.googleCalendarSettings || DEFAULT_GOOGLE_CALENDAR_SETTINGS,
        googleCachedToken: parsed.googleCachedToken || null,
        googleTokenExpiry: parsed.googleTokenExpiry || null,
        googleCalendarEvents: parsed.googleCalendarEvents || [],
        googleSyncLogs: parsed.googleSyncLogs || [],
      };
    }
    return {
      primaryTaskId: null,
      tasks: [],
      ideas: [],
      reflections: [],
      dailyTodos: {},
      goals: [],
      goalsEnabled: false,
      timeBlocks: DEFAULT_TIME_BLOCKS,
      blockTemplates: DEFAULT_TEMPLATES,
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      notifications: PREPOPULATED_NOTIFICATIONS,
      lastIdeaConvertedDate: null,
      lastResetDate: today,
      streak: 0,
      personalBestStreak: 0,
      streakRule: 'traditional',
      forgivesUsedThisWeek: 0,
      lastForgiveResetWeek: 0,
      streakMilestonesUnlocked: [],
      lastCheckDate: null,
      isContinuingTask: false,
      pendingEodCheck: null,
      timeTrackingEnabled: true,
      timeLogs: [],
      dailyTimeBudget: 480,
      activeTimer: null,
      googleCalendarSettings: DEFAULT_GOOGLE_CALENDAR_SETTINGS,
      googleCachedToken: null,
      googleTokenExpiry: null,
      googleCalendarEvents: [],
      googleSyncLogs: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addDailyTodo = (text: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newTodo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };
    setState(prev => ({
      ...prev,
      dailyTodos: {
        ...prev.dailyTodos,
        [today]: [...(prev.dailyTodos[today] || []), newTodo]
      }
    }));
  };

  const toggleDailyTodo = (date: string, id: string) => {
    setState(prev => ({
      ...prev,
      dailyTodos: {
        ...prev.dailyTodos,
        [date]: (prev.dailyTodos[date] || []).map(t => 
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      }
    }));
  };

  const deleteDailyTodo = (date: string, id: string) => {
    setState(prev => ({
      ...prev,
      dailyTodos: {
        ...prev.dailyTodos,
        [date]: (prev.dailyTodos[date] || []).filter(t => t.id !== id)
      }
    }));
  };

  const addReflection = (
    text: string,
    tag: ReflectionTag,
    whatWorked?: string,
    whatBlocked?: string,
    whatSurprised?: string,
    whatToDoDifferently?: string,
    moodEnergy?: number,
    stressLevel?: number,
    photo?: string | null,
    relatedTaskId?: string | null,
    templateId?: string | null
  ) => {
    const newReflection: Reflection = {
      id: crypto.randomUUID(),
      text,
      tag,
      date: new Date().toISOString(),
      whatWorked: whatWorked || '',
      whatBlocked: whatBlocked || '',
      whatSurprised: whatSurprised || '',
      whatToDoDifferently: whatToDoDifferently || '',
      moodEnergy: moodEnergy !== undefined ? moodEnergy : 5,
      stressLevel: stressLevel !== undefined ? stressLevel : 5,
      photo: photo || null,
      relatedTaskId: relatedTaskId || null,
      templateId: templateId || null,
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      reflections: [newReflection, ...(prev.reflections || [])]
    }));
  };

  const deleteReflection = (id: string) => {
    setState(prev => ({
      ...prev,
      reflections: (prev.reflections || []).filter(r => r.id !== id)
    }));
  };

  const completeEodCheck = (reason?: EodReason, customStatus?: 'completed' | 'missed') => {
    setState(prev => {
      if (!prev.pendingEodCheck) return prev;
      
      const checkDateStr = prev.pendingEodCheck.date;
      const originalCompleted = prev.pendingEodCheck.completed;
      const wasCompleted = customStatus ? (customStatus === 'completed') : originalCompleted;
      const rule = prev.streakRule || 'traditional';
      
      let maintainStreak = false;
      let usedForgive = false;
      let newStreak = 0;

      if (wasCompleted) {
        maintainStreak = true;
        newStreak = prev.streak + 1;
      } else {
        if (rule === 'forgiving') {
          const today = new Date();
          const getWeekYear = (d: Date) => {
            const temp = new Date(d);
            temp.setHours(0, 0, 0, 0);
            temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
            const yearStart = new Date(temp.getFullYear(), 0, 1);
            const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${temp.getFullYear()}-W${weekNo}`;
          };
          const currentWeekStr = getWeekYear(today);
          const lastResetWeekStr = prev.lastForgiveResetWeek ? String(prev.lastForgiveResetWeek) : '';
          
          let currentForgivesUsed = prev.forgivesUsedThisWeek || 0;
          if (lastResetWeekStr !== currentWeekStr) {
            currentForgivesUsed = 0;
          }

          if (currentForgivesUsed < 2) {
            maintainStreak = true;
            usedForgive = true;
            newStreak = prev.streak; 
            currentForgivesUsed += 1;
          } else {
            newStreak = 0;
          }
        } else if (rule === 'flexible') {
          const todos = prev.dailyTodos[checkDateStr] || [];
          const anyTodoDone = todos.some(t => t.completed);
          const anyTaskDone = (prev.tasks || []).some(t => {
            if (t.status !== 'completed' || !t.completedAt) return false;
            const compDateStr = new Date(t.completedAt).toISOString().split('T')[0];
            return compDateStr === checkDateStr;
          });

          if (anyTodoDone || anyTaskDone) {
            maintainStreak = true;
            newStreak = prev.streak + 1;
          } else {
            newStreak = 0;
          }
        } else {
          newStreak = 0;
        }
      }

      const currentBest = prev.personalBestStreak || 0;
      const finalBest = Math.max(currentBest, newStreak);

      const milestones = [3, 7, 14, 30, 100];
      const currentUnlocked = prev.streakMilestonesUnlocked || [];
      const justUnlocked = milestones.filter(m => newStreak >= m && !currentUnlocked.includes(m));
      const finalUnlocked = [...currentUnlocked, ...justUnlocked];

      let updatedNotifications = prev.notifications || [];
      if (justUnlocked.length > 0) {
        justUnlocked.forEach(m => {
          const milestoneNotification = {
            id: crypto.randomUUID(),
            type: 'milestone' as const,
            title: `🔥 Milestone Achieved: ${m} Days Solid!`,
            body: `Outstanding job, Commander! You've unlocked the ${m}-Day Streak Badge. Your continuity is legendary.`,
            timestamp: Date.now(),
            read: false,
          };
          updatedNotifications = [milestoneNotification, ...updatedNotifications];
        });
      } else if (newStreak > currentBest && currentBest > 0) {
        const pbNotification = {
          id: crypto.randomUUID(),
          type: 'milestone' as const,
          title: `🏆 New Personal Best Streak!`,
          body: `You have surpassed your former best! New high streak set: ${newStreak} days. Crushing it!`,
          timestamp: Date.now(),
          read: false,
        };
        updatedNotifications = [pbNotification, ...updatedNotifications];
      }

      const getWeekYearStr = () => {
        const temp = new Date();
        temp.setHours(0, 0, 0, 0);
        temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
        const yearStart = new Date(temp.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${temp.getFullYear()}-W${weekNo}`;
      };

      return {
        ...prev,
        streak: newStreak,
        personalBestStreak: finalBest,
        streakMilestonesUnlocked: finalUnlocked,
        forgivesUsedThisWeek: rule === 'forgiving' && usedForgive ? (prev.forgivesUsedThisWeek || 0) + 1 : (prev.forgivesUsedThisWeek || 0),
        lastForgiveResetWeek: getWeekYearStr() as any,
        lastCheckDate: checkDateStr,
        pendingEodCheck: null,
        notifications: updatedNotifications,
      };
    });
  };

  const updateStreakRule = (rule: 'traditional' | 'forgiving' | 'flexible') => {
    setState(prev => ({
      ...prev,
      streakRule: rule
    }));
  };

  const updateStreak = (value: number) => {
    setState(prev => {
      const best = Math.max(prev.personalBestStreak || 0, value);
      const milestones = [3, 7, 14, 30, 100];
      const newlyUnlocked = milestones.filter(m => value >= m);
      return {
        ...prev,
        streak: value,
        personalBestStreak: best,
        streakMilestonesUnlocked: Array.from(new Set([...(prev.streakMilestonesUnlocked || []), ...newlyUnlocked]))
      };
    });
  };

  const addTask = (text: string, category: Category = 'NONE', isPrimaryOrGoalId: boolean | string | null = null) => {
    const newTaskId = crypto.randomUUID();
    const isPrimary = typeof isPrimaryOrGoalId === 'boolean' ? isPrimaryOrGoalId : false;
    const goalId = typeof isPrimaryOrGoalId === 'string' ? isPrimaryOrGoalId : null;
    
    const newTask: Task = {
      id: newTaskId,
      text,
      status: 'pending',
      category: category,
      createdAt: Date.now(),
      subtasks: [],
      dependsOn: null,
      startDate: null,
      goalId: goalId,
    };
    setState(prev => ({ 
      ...prev, 
      tasks: [newTask, ...(prev.tasks || [])],
      primaryTaskId: isPrimary ? newTaskId : prev.primaryTaskId
    }));
  };

  const addIdea = (text: string) => {
    const newIdea: Idea = {
      id: crypto.randomUUID(),
      text,
      status: 'parked',
      createdAt: Date.now(),
    };
    setState(prev => ({ ...prev, ideas: [newIdea, ...(prev.ideas || [])] }));
  };

  const processIdea = (id: string, action: 'EXECUTE' | 'DELAY' | 'DELETE') => {
    const today = new Date().toISOString().split('T')[0];
    
    setState(prev => {
      const idea = prev.ideas.find(i => i.id === id);
      if (!idea) return prev;

      if (action === 'EXECUTE') {
        // Check if already converted an idea today
        if (prev.lastIdeaConvertedDate === today) {
          // This should be handled by UI, but as a guard:
          return prev;
        }

        const newTask: Task = {
          id: crypto.randomUUID(),
          text: idea.text,
          status: 'pending',
          category: 'KEEP',
          createdAt: Date.now(),
          subtasks: [],
          dependsOn: null,
          startDate: null,
        };

        return {
          ...prev,
          tasks: [newTask, ...prev.tasks],
          ideas: prev.ideas.map(i => i.id === id ? { ...i, status: 'executed', processedAt: Date.now() } : i),
          lastIdeaConvertedDate: today
        };
      } else if (action === 'DELAY') {
        return {
          ...prev,
          ideas: prev.ideas.map(i => i.id === id ? { ...i, status: 'delayed', processedAt: Date.now() } : i)
        };
      } else {
        return {
          ...prev,
          ideas: prev.ideas.map(i => i.id === id ? { ...i, status: 'deleted', processedAt: Date.now() } : i)
        };
      }
    });
  };

  const categorizeTask = (id: string, category: Category) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, category } : t)
    }));
  };

  const setPrimaryTask = (id: string) => {
    setState(prev => ({ ...prev, primaryTaskId: id }));
  };

  const assignToBlock = (id: string, block: TimeBlockType) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, block } : t)
    }));
  };

  const toggleTaskStatus = (id: string) => {
    setState(prev => {
      const tasks = prev.tasks || [];
      const task = tasks.find(t => t.id === id);
      if (!task) return prev;

      // Check dependency
      if (task.dependsOn) {
        const dependency = tasks.find(t => t.id === task.dependsOn);
        if (dependency && dependency.status !== 'completed' && task.status !== 'completed') {
          return prev; // Cannot complete if dependency is not completed
        }
      }

      return {
        ...prev,
        tasks: tasks.map(t => {
          if (t.id === id) {
            const newStatus: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
            return { ...t, status: newStatus, completedAt: newStatus === 'completed' ? Date.now() : undefined };
          }
          return t;
        })
      };
    });
  };

  const addSubtask = (taskId: string, title: string) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => {
        if (t.id === taskId && (t.subtasks || []).length < 5) {
          return {
            ...t,
            subtasks: [...(t.subtasks || []), { id: crypto.randomUUID(), title, completed: false }]
          };
        }
        return t;
      })
    }));
  };

  const addMultipleSubtasks = (taskId: string, titles: string[]) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => {
        if (t.id === taskId) {
          const newSubs = titles.map(title => ({
            id: crypto.randomUUID(),
            title,
            completed: false
          })).slice(0, 5 - (t.subtasks || []).length); // respect the maximum size
          return {
            ...t,
            subtasks: [...(t.subtasks || []), ...newSubs]
          };
        }
        return t;
      })
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
          };
        }
        return t;
      })
    }));
  };

  const setTaskDependency = (taskId: string, dependsOnId: string | null) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === taskId ? { ...t, dependsOn: dependsOnId } : t)
    }));
  };

  const setTaskStartDate = (taskId: string, startDate: number | null) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === taskId ? { ...t, startDate } : t)
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => {
      const activeTimer = prev.activeTimer?.taskId === id ? null : prev.activeTimer;
      return {
        ...prev,
        tasks: (prev.tasks || []).filter(t => t.id !== id),
        primaryTaskId: prev.primaryTaskId === id ? null : prev.primaryTaskId,
        activeTimer
      };
    });
  };

  const abandonTask = (id: string) => {
    setState(prev => {
      const activeTimer = prev.activeTimer?.taskId === id ? null : prev.activeTimer;
      return {
        ...prev,
        tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, status: 'abandoned' } : t),
        activeTimer
      };
    });
  };

  const addGoal = (
    title: string,
    targetDate: string,
    keyResultTexts: string[],
    type: 'quarterly' | 'weekly' = 'weekly',
    parentId?: string | null,
    description?: string,
    startDate?: string
  ) => {
    const newGoal = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      type,
      parentId: parentId || null,
      keyResults: keyResultTexts.filter(t => t.trim() !== '').map(text => ({
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false
      })),
      targetDate,
      startDate: startDate || new Date().toISOString().split('T')[0],
      status: 'active' as const,
      completed: false,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    setState(prev => ({
      ...prev,
      goals: [newGoal, ...(prev.goals || [])]
    }));
  };

  const editGoal = (
    goalId: string,
    updates: {
      title?: string;
      description?: string;
      targetDate?: string;
      startDate?: string;
      parentId?: string | null;
      type?: 'quarterly' | 'weekly';
    }
  ) => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => g.id === goalId ? { ...g, ...updates, lastUpdated: Date.now() } : g)
    }));
  };

  const updateGoalStatus = (goalId: string, status: 'active' | 'completed' | 'abandoned') => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            status,
            completed: status === 'completed',
            lastUpdated: Date.now()
          };
        }
        return g;
      })
    }));
  };

  const toggleGoalKeyResult = (goalId: string, krId: string) => {
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => {
        if (g.id === goalId) {
          const updatedKRs = g.keyResults.map(kr => kr.id === krId ? { ...kr, completed: !kr.completed } : kr);
          const isKRsCompleted = updatedKRs.length > 0 && updatedKRs.every(kr => kr.completed);
          const currentStatus = isKRsCompleted ? 'completed' : g.status === 'completed' ? 'active' : g.status;
          return {
            ...g,
            keyResults: updatedKRs,
            status: currentStatus as 'active' | 'completed' | 'abandoned',
            completed: currentStatus === 'completed',
            lastUpdated: Date.now()
          };
        }
        return g;
      })
    }));
  };

  const deleteGoal = (goalId: string) => {
    setState(prev => {
      // Find weekly objectives that have this goal as parent
      const remainingGoals = (prev.goals || []).filter(g => g.id !== goalId).map(g => {
        if (g.parentId === goalId) {
          return { ...g, parentId: null };
        }
        return g;
      });
      // Clear link on tasks
      const remainingTasks = (prev.tasks || []).map(t => {
        if (t.goalId === goalId) {
          return { ...t, goalId: null };
        }
        return t;
      });
      return {
        ...prev,
        goals: remainingGoals,
        tasks: remainingTasks
      };
    });
  };

  const linkTaskToGoal = (taskId: string, goalId: string | null) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === taskId ? { ...t, goalId } : t)
    }));
  };

  const startTimer = (taskId: string, isPomodoro = false, pomodoroDurationMinutes = 25) => {
    setState(prev => {
      let updatedLogs = prev.timeLogs || [];
      if (prev.activeTimer) {
        const elapsed = Math.floor((Date.now() - prev.activeTimer.startTime) / 1000);
        if (elapsed > 0) {
          const finishedLog: TimeLog = {
            id: crypto.randomUUID(),
            taskId: prev.activeTimer.taskId,
            startTime: prev.activeTimer.startTime,
            endTime: Date.now(),
            duration: elapsed,
            manual: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          };
          updatedLogs = [...updatedLogs, finishedLog];
        }
      }

      return {
        ...prev,
        timeLogs: updatedLogs,
        activeTimer: {
          taskId,
          startTime: Date.now(),
          isPomodoro,
          pomodoroDuration: pomodoroDurationMinutes * 60
        }
      };
    });
  };

  const stopTimer = () => {
    setState(prev => {
      if (!prev.activeTimer) return prev;
      const elapsed = Math.floor((Date.now() - prev.activeTimer.startTime) / 1000);
      let updatedLogs = prev.timeLogs || [];

      if (elapsed > 0) {
        const finishedLog: TimeLog = {
          id: crypto.randomUUID(),
          taskId: prev.activeTimer.taskId,
          startTime: prev.activeTimer.startTime,
          endTime: Date.now(),
          duration: elapsed,
          manual: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        };
        updatedLogs = [...updatedLogs, finishedLog];
      }

      return {
        ...prev,
        timeLogs: updatedLogs,
        activeTimer: null
      };
    });
  };

  const addManualTimeLog = (taskId: string, durationMinutes: number) => {
    const durationSeconds = durationMinutes * 60;
    const now = Date.now();
    const newLog: TimeLog = {
      id: crypto.randomUUID(),
      taskId,
      startTime: now - durationSeconds * 1000,
      endTime: now,
      duration: durationSeconds,
      manual: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    };
    setState(prev => ({
      ...prev,
      timeLogs: [...(prev.timeLogs || []), newLog]
    }));
  };

  const updateTaskEstimate = (taskId: string, estimatedMinutes: number) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => 
        t.id === taskId ? { ...t, estimatedTime: estimatedMinutes } : t
      )
    }));
  };

  const updateTaskText = (taskId: string, text: string) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => 
        t.id === taskId ? { ...t, text } : t
      )
    }));
  };

  const toggleTimeTracking = () => {
    setState(prev => ({
      ...prev,
      timeTrackingEnabled: prev.timeTrackingEnabled !== undefined ? !prev.timeTrackingEnabled : false
    }));
  };

  const updateDailyTimeBudget = (minutes: number) => {
    setState(prev => ({
      ...prev,
      dailyTimeBudget: minutes
    }));
  };

  const addTimeBlock = (block: Omit<TimeBlock, 'id'>) => {
    setState(prev => ({
      ...prev,
      timeBlocks: [...(prev.timeBlocks || []), { ...block, id: `tb-${crypto.randomUUID()}` }]
    }));
  };

  const updateTimeBlock = (id: string, updates: Partial<TimeBlock>) => {
    setState(prev => ({
      ...prev,
      timeBlocks: (prev.timeBlocks || []).map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const deleteTimeBlock = (id: string) => {
    setState(prev => ({
      ...prev,
      timeBlocks: (prev.timeBlocks || []).filter(b => b.id !== id)
    }));
  };

  const applyBlockTemplate = (templateId: string, dayOfWeek: number) => {
    setState(prev => {
      const template = (prev.blockTemplates || []).find(t => t.id === templateId);
      if (!template) return prev;
      const otherDaysBlocks = (prev.timeBlocks || []).filter(b => b.dayOfWeek !== dayOfWeek);
      const newBlocks = template.blocks.map(b => ({
        ...b,
        id: `tb-${crypto.randomUUID()}`,
        dayOfWeek
      }));
      return {
        ...prev,
        timeBlocks: [...otherDaysBlocks, ...newBlocks]
      };
    });
  };

  const saveBlockAsTemplate = (name: string, description: string, dayOfWeek: number) => {
    setState(prev => {
      const dayBlocks = (prev.timeBlocks || []).filter(b => b.dayOfWeek === dayOfWeek).map(b => {
        const { id, ...rest } = b;
        return rest;
      });
      const newTemplate: BlockTemplate = {
        id: `tpl-${crypto.randomUUID()}`,
        name,
        description,
        blocks: dayBlocks
      };
      return {
        ...prev,
        blockTemplates: [...(prev.blockTemplates || []), newTemplate]
      };
    });
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setState(prev => ({
      ...prev,
      notificationSettings: {
        ...(prev.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS),
        ...settings
      }
    }));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    setState(prev => {
      const isQuietHour = () => {
        const config = prev.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
        if (!config.quietHoursEnabled) return false;
        
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const parseTimeToMins = (tStr: string) => {
          const [h, m] = tStr.split(':').map(Number);
          return h * 60 + m;
        };
        
        const startMins = parseTimeToMins(config.quietHoursStart);
        const endMins = parseTimeToMins(config.quietHoursEnd);
        
        if (startMins > endMins) {
          return currentMins >= startMins || currentMins < endMins;
        } else {
          return currentMins >= startMins && currentMins < endMins;
        }
      };

      const isQuiet = isQuietHour();
      const labelPrefix = isQuiet ? '🌙 ' : '';
      
      const newNotif: AppNotification = {
        ...notif,
        title: labelPrefix + notif.title,
        id: `notif-${crypto.randomUUID()}`,
        timestamp: Date.now(),
        read: false
      };
      
      return {
        ...prev,
        notifications: [newNotif, ...(prev.notifications || [])]
      };
    });
  };

  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const markAllNotificationsAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => ({ ...n, read: true }))
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({
      ...prev,
      notifications: []
    }));
  };

  const updateGoogleCalendarSettings = (settings: Partial<GoogleCalendarSettings>) => {
    setState(prev => ({
      ...prev,
      googleCalendarSettings: {
        ...(prev.googleCalendarSettings || DEFAULT_GOOGLE_CALENDAR_SETTINGS),
        ...settings
      }
    }));
  };

  const disconnectCalendar = () => {
    setState(prev => {
      const log: GoogleSyncLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'warn',
        message: 'Google Calendar API connection revoked and access tokens flushed.'
      };
      return {
        ...prev,
        googleCachedToken: null,
        googleTokenExpiry: null,
        googleCalendarEvents: [],
        googleCalendarSettings: {
          ...(prev.googleCalendarSettings || DEFAULT_GOOGLE_CALENDAR_SETTINGS),
          connected: false,
          lastSynced: null
        },
        googleSyncLogs: [log, ...(prev.googleSyncLogs || [])]
      };
    });
  };

  const addGoogleSyncLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
    setState(prev => {
      const newLog: GoogleSyncLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type,
        message
      };
      return {
        ...prev,
        googleSyncLogs: [newLog, ...(prev.googleSyncLogs || [])].slice(0, 50)
      };
    });
  };

  const clearGoogleSyncLogs = () => {
    setState(prev => ({
      ...prev,
      googleSyncLogs: []
    }));
  };

  const saveGoogleCalendarEvents = (events: GoogleCalendarEvent[]) => {
    setState(prev => ({
      ...prev,
      googleCalendarEvents: events
    }));
  };

  // URL hash listener for Google OAuth return
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      
      if (accessToken) {
        const expiryTime = Date.now() + (expiresIn ? Number(expiresIn) * 1000 : 3600000);
        
        setState(prev => {
          const updatedSettings = {
            ...(prev.googleCalendarSettings || DEFAULT_GOOGLE_CALENDAR_SETTINGS),
            connected: true,
          };
          
          const log: GoogleSyncLog = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'success',
            message: 'Successfully authenticated Google Account via Client-Side Web flow.',
          };
          
          return {
            ...prev,
            googleCachedToken: accessToken,
            googleTokenExpiry: expiryTime,
            googleCalendarSettings: updatedSettings,
            googleSyncLogs: [log, ...(prev.googleSyncLogs || [])],
          };
        });
        
        // Clear hash from URL immediately
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const resetAllState = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const toggleGoalsFeature = () => {
    setState(prev => ({
      ...prev,
      goalsEnabled: !prev.goalsEnabled
    }));
  };

    return {
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
  };
}
