import { useState, useEffect } from 'react';
import { DailyState, Task, Category, TaskStatus, TimeBlockType } from '../types';

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
        };
      }
      return parsed;
    }
    return {
      primaryTaskId: null,
      tasks: [],
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
    };
    setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
  };

  const categorizeTask = (id: string, category: Category) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, category } : t)
    }));
  };

  const setPrimaryTask = (id: string) => {
    setState(prev => ({ ...prev, primaryTaskId: id }));
  };

  const assignToBlock = (id: string, block: TimeBlockType) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, block } : t)
    }));
  };

  const toggleTaskStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === id) {
          const newStatus: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
          return { ...t, status: newStatus, completedAt: newStatus === 'completed' ? Date.now() : undefined };
        }
        return t;
      })
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      primaryTaskId: prev.primaryTaskId === id ? null : prev.primaryTaskId
    }));
  };

  const abandonTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: 'abandoned' } : t)
    }));
  };

  return {
    state,
    addTask,
    categorizeTask,
    setPrimaryTask,
    assignToBlock,
    toggleTaskStatus,
    deleteTask,
    abandonTask
  };
}
