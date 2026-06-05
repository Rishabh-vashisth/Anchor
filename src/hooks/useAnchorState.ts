import { useState, useEffect } from 'react';
import { DailyState, Task, Category, TaskStatus, TimeBlockType, Idea, IdeaStatus, EodReason, Reflection, ReflectionTag, TimeLog, ActiveTimer } from '../types';

const STORAGE_KEY = 'anchor_app_state';

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
          lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
          streak: parsed.streak || 0,
          lastCheckDate: parsed.lastCheckDate || null,
          timeTrackingEnabled: parsed.timeTrackingEnabled !== undefined ? parsed.timeTrackingEnabled : true,
          timeLogs: parsed.timeLogs || [],
          dailyTimeBudget: parsed.dailyTimeBudget || 480,
          activeTimer: parsed.activeTimer || null,
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
        lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
        streak: parsed.streak || 0,
        lastCheckDate: parsed.lastCheckDate || null,
        isContinuingTask: parsed.isContinuingTask || false,
        pendingEodCheck: parsed.pendingEodCheck || null,
        timeTrackingEnabled: parsed.timeTrackingEnabled !== undefined ? parsed.timeTrackingEnabled : true,
        timeLogs: parsed.timeLogs || [],
        dailyTimeBudget: parsed.dailyTimeBudget || 480,
        activeTimer: parsed.activeTimer || null,
      };
    }
    return {
      primaryTaskId: null,
      tasks: [],
      ideas: [],
      reflections: [],
      dailyTodos: {},
      goals: [],
      lastIdeaConvertedDate: null,
      lastResetDate: today,
      streak: 0,
      lastCheckDate: null,
      isContinuingTask: false,
      pendingEodCheck: null,
      timeTrackingEnabled: true,
      timeLogs: [],
      dailyTimeBudget: 480,
      activeTimer: null,
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

  const completeEodCheck = (reason?: EodReason) => {
    setState(prev => {
      if (!prev.pendingEodCheck) return prev;
      
      const wasCompleted = prev.pendingEodCheck.completed;
      const newStreak = wasCompleted ? prev.streak + 1 : 0;

      return {
        ...prev,
        streak: newStreak,
        lastCheckDate: prev.pendingEodCheck.date,
        pendingEodCheck: null,
        // Store reason if needed (e.g. in a history log, but prompt just says "Store this data")
        // For now we just process the streak and clear the pending check
      };
    });
  };

  const addTask = (text: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      status: 'pending',
      category: 'NONE',
      createdAt: Date.now(),
      subtasks: [],
      dependsOn: null,
      startDate: null,
    };
    setState(prev => ({ ...prev, tasks: [newTask, ...(prev.tasks || [])] }));
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

  const resetAllState = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

    return {
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
  };
}
