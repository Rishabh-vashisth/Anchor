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
  estimatedTime?: number; // Estimated duration in minutes
  goalId?: string | null; // Link to weekly objective (or goal)
}

export type IdeaStatus = 'parked' | 'executed' | 'deleted' | 'delayed';

export type ReflectionTag = 'Insight' | 'Reminder' | 'Mistake' | 'Victory' | 'Blocker';

export interface Reflection {
  id: string;
  text: string; // Summary or text excerpt
  date: string;
  tag: ReflectionTag;
  
  // Structured Journal fields
  whatWorked: string;
  whatBlocked: string;
  whatSurprised: string;
  whatToDoDifferently: string;
  moodEnergy: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
  
  photo?: string | null; // mood board / visual reflection attachment link or base64
  relatedTaskId?: string | null; // Linked task
  templateId?: string | null; // Preset template name used
  createdAt: number;
}

export interface TimeLog {
  id: string;
  taskId: string;
  startTime: number; // UTC timestamp of start
  endTime: number; // UTC timestamp of end
  duration: number; // duration in seconds
  manual: boolean; // manually logged vs active timer
  timezone: string; // timezone label
}

export interface ActiveTimer {
  taskId: string;
  startTime: number;
  isPomodoro: boolean;
  pomodoroDuration: number; // in seconds (e.g. 25 * 60)
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

export type GoalType = 'quarterly' | 'weekly';
export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface GoalKeyResult {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  parentId?: string | null; // weekly objective pointing to quarterly goal
  keyResults: GoalKeyResult[];
  targetDate: string;
  startDate?: string;
  status: GoalStatus;
  completed: boolean; // Keep for backward-compatibility, matches status === 'completed'
  createdAt: number;
  lastUpdated: number;
}

export interface TimeBlock {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:MM" e.g., "09:00"
  duration: number; // in minutes
  type: TimeBlockType;
  environment: 'office' | 'home' | 'coffee shop' | 'outdoor' | 'any';
  tools: ('computer' | 'notebook' | 'phone' | 'none')[];
  focusLevel: number; // 1-10 focus rating
  label?: string;
  linkedTaskId?: string | null;
}

export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<TimeBlock, 'id'>[];
}

export interface NotificationSettings {
  morningBriefing: boolean;
  morningBriefTime: string; // "08:00"
  taskReminders: boolean;
  eodPrompt: boolean;
  eodPromptTime: string; // "17:00"
  milestones: boolean;
  insights: boolean;
  weeklyDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'off';
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "21:00"
  quietHoursEnd: string; // "08:00"
}

export interface AppNotification {
  id: string;
  type: 'morning_brief' | 'task_reminder' | 'eod_prompt' | 'milestone' | 'insight' | 'weekly_digest';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

export interface DailyState {
  primaryTaskId: string | null;
  tasks: Task[];
  ideas: Idea[];
  reflections: Reflection[];
  dailyTodos: { [date: string]: DailyTodo[] };
  goals?: Goal[]; // Optional or with custom default fallbacks
  goalsEnabled?: boolean;
  timeBlocks?: TimeBlock[];
  blockTemplates?: BlockTemplate[];
  notificationSettings?: NotificationSettings;
  notifications?: AppNotification[];
  lastIdeaConvertedDate: string | null; // YYYY-MM-DD
  lastResetDate: string; // ISO date string
  streak: number;
  personalBestStreak?: number;
  streakRule?: 'traditional' | 'forgiving' | 'flexible';
  forgivesUsedThisWeek?: number;
  lastForgiveResetWeek?: number;
  streakMilestonesUnlocked?: number[];
  lastCheckDate: string | null;
  isContinuingTask: boolean;
  pendingEodCheck: {
    date: string;
    taskId: string;
    taskText: string;
    completed: boolean;
  } | null;
  // Dynamic Time Tracking States
  timeTrackingEnabled?: boolean;
  timeLogs?: TimeLog[];
  dailyTimeBudget?: number; // In minutes, e.g. 480
  activeTimer?: ActiveTimer | null;
  googleCalendarSettings?: GoogleCalendarSettings;
  googleCachedToken?: string | null;
  googleTokenExpiry?: number | null;
  googleCalendarEvents?: GoogleCalendarEvent[];
  googleSyncLogs?: GoogleSyncLog[];
}

export interface GoogleCalendarSettings {
  connected: boolean;
  clientId: string;
  calendarId: string;
  calendarName: string;
  syncEnabled: boolean;
  syncConflictsWarn: boolean;
  lastSynced: number | null;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
  htmlLink?: string;
}

export interface GoogleSyncLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface WeeklyStats {
  completed: number;
  abandoned: number;
  totalTimeSpent: number; // in minutes
}
