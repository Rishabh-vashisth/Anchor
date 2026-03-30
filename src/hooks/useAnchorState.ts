import { useState, useEffect } from 'react';
import { DailyState, Task, Category, TaskStatus, TimeBlockType, Idea, IdeaStatus } from '../types';

const STORAGE_KEY = 'anchor_app_state';

export function useAnchorState() {
  const [state, setState] = useState<DailyState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastResetDate !== today) {
        // Simple reset logic for demo: keep tasks but clear primary focus
        // In a real app, you might archive yesterday's tasks
        return {
          ...parsed,
          primaryTaskId: null,
          lastResetDate: today,
          tasks: parsed.tasks || [],
          ideas: parsed.ideas || [],
          lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
        };
      }
      return {
        ...parsed,
        tasks: parsed.tasks || [],
        ideas: parsed.ideas || [],
        lastIdeaConvertedDate: parsed.lastIdeaConvertedDate || null,
      };
    }
    return {
      primaryTaskId: null,
      tasks: [],
      ideas: [],
      lastIdeaConvertedDate: null,
      lastResetDate: new Date().toISOString().split('T')[0],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).filter(t => t.id !== id),
      primaryTaskId: prev.primaryTaskId === id ? null : prev.primaryTaskId
    }));
  };

  const abandonTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, status: 'abandoned' } : t)
    }));
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
    deleteTask,
    abandonTask
  };
}
