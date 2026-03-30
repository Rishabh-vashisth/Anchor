/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'completed' | 'abandoned';
export type Category = 'KEEP' | 'DELAY' | 'DELETE' | 'NONE';
export type TimeBlockType = 'DEEP' | 'LIGHT' | 'FREE';

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

export interface Idea {
  id: string;
  text: string;
  status: IdeaStatus;
  createdAt: number;
  processedAt?: number;
}

export interface DailyState {
  primaryTaskId: string | null;
  tasks: Task[];
  ideas: Idea[];
  lastIdeaConvertedDate: string | null; // YYYY-MM-DD
  lastResetDate: string; // ISO date string
}

export interface WeeklyStats {
  completed: number;
  abandoned: number;
  totalTimeSpent: number; // in minutes
}
