/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'completed' | 'abandoned';
export type Category = 'KEEP' | 'DELAY' | 'DELETE' | 'NONE';
export type TimeBlockType = 'DEEP' | 'LIGHT' | 'FREE';
export type EodReason = 'TOO_BIG' | 'DISTRACTED' | 'DIDNT_START' | 'LOST_INTEREST';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  category: Category;
  block?: TimeBlockType;
  createdAt: number;
  completedAt?: number;
  subtasks: Subtask[];
  dependsOn?: string | null;
  startDate?: number | null;
}

export type IdeaStatus = 'parked' | 'executed' | 'deleted' | 'delayed';

export type ReflectionTag = 'Insight' | 'Reminder' | 'Mistake';

export interface Reflection {
  id: string;
  text: string;
  date: string;
  tag: ReflectionTag;
}

export interface Idea {
  id: string;
  text: string;
  status: IdeaStatus;
  createdAt: number;
  processedAt?: number;
}

export interface DailyTodo {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyState {
  primaryTaskId: string | null;
  tasks: Task[];
  ideas: Idea[];
  reflections: Reflection[];
  dailyTodos: { [date: string]: DailyTodo[] };
  lastIdeaConvertedDate: string | null; // YYYY-MM-DD
  lastResetDate: string; // ISO date string
  streak: number;
  lastCheckDate: string | null;
  isContinuingTask: boolean;
  pendingEodCheck: {
    date: string;
    taskId: string;
    taskText: string;
    completed: boolean;
  } | null;
}

export interface WeeklyStats {
  completed: number;
  abandoned: number;
  totalTimeSpent: number; // in minutes
}
