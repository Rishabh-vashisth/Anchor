/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Goal, Reflection, TimeBlock, GoogleCalendarEvent } from '../types';

export interface TaskPrediction {
  rating: 'High' | 'Medium' | 'Low';
  reason: string;
  suggestions: string[];
  _cached?: boolean;
  _fallback?: boolean;
}

export interface OptimalTaskRecommendation {
  taskId: string | null;
  taskText: string;
  reason: string;
  confidence: 'High' | 'Medium' | 'Low';
  _cached?: boolean;
  _fallback?: boolean;
}

export interface BlockerAnalysisResult {
  patterns: string[];
  actionPlan: string[];
  _cached?: boolean;
  _fallback?: boolean;
}

export interface ReflectionInsightsResult {
  summary: string;
  patterns: string[];
  actionPlan: string[];
  _cached?: boolean;
  _fallback?: boolean;
}

export interface GoalBreakdownResult {
  breakdownTitle: string;
  keyResults: string[];
  subtasks: string[];
  _cached?: boolean;
  _fallback?: boolean;
}

export interface SmartRetryResult {
  suggestedBreakdown: string[];
  encouragementText: string;
  _cached?: boolean;
  _fallback?: boolean;
}

/**
 * Service to request intelligent insights and task planning predictions from the server-side Gemini API proxy.
 */
export async function getTaskCompletionPrediction(task: Task, history: Task[]): Promise<TaskPrediction> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prediction',
        payload: { task, history }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getTaskCompletionPrediction failed:', err);
    return {
      rating: 'Medium',
      reason: 'Standard analysis fallback. Unify subtask checklists and allocate focus segments.',
      suggestions: ['Subdivide complex goals into microtasks', 'Map to an active focus block'],
      _fallback: true
    };
  }
}

export async function getOptimalTaskRecommendation(
  pendingTasks: Task[],
  availableMinutes: number,
  currentEnergy: number,
  dayBlocks: TimeBlock[],
  googleMeetings: GoogleCalendarEvent[]
): Promise<OptimalTaskRecommendation> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'optimal',
        payload: { pendingTasks, availableMinutes, currentEnergy, dayBlocks, googleMeetings }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getOptimalTaskRecommendation failed:', err);
    return {
      taskId: pendingTasks[0]?.id || null,
      taskText: pendingTasks[0]?.text || 'Review your backlog',
      reason: 'Recommended based on oldest pending backlog tasks in your list.',
      confidence: 'Medium',
      _fallback: true
    };
  }
}

export async function getBlockerAnalysis(abandonedTasks: Task[], reflections: Reflection[]): Promise<BlockerAnalysisResult> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'blocker',
        payload: { abandonedTasks, reflections }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getBlockerAnalysis failed:', err);
    return {
      patterns: ['Accumulation of tasks occurs during high-friction administrative blocks.'],
      actionPlan: ['Formulate clear definition-of-done lists.', 'Separate planning from execution sessions.'],
      _fallback: true
    };
  }
}

export async function getReflectionInsights(reflections: Reflection[]): Promise<ReflectionInsightsResult> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'insights',
        payload: { reflections }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getReflectionInsights failed:', err);
    return {
      summary: 'Your reflections express steady mental focus, minor fatigue periods, and high alignment on early morning work.',
      patterns: ['Sustained high focus hours recorded before lunch.', 'Elevated stress spikes registered with complex dependencies.'],
      actionPlan: ['Block off 9:00 - 10:30 specialized slot.', 'Unlink meetings in critical deep run boundaries.'],
      _fallback: true
    };
  }
}

export async function getGoalBreakdown(goalTitle: string, goalDescription: string): Promise<GoalBreakdownResult> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'goal-breakdown',
        payload: { goalTitle, goalDescription }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getGoalBreakdown failed:', err);
    return {
      breakdownTitle: goalTitle,
      keyResults: ['Establish draft functional setup', 'Deploy initial review test checks'],
      subtasks: ['Core environment configuration', 'Develop structural layout draft', 'Integrate action controls', 'Inspect build diagnostics'],
      _fallback: true
    };
  }
}

export async function getSmartRetryBreakdown(taskText: string, failureCount: number, reasons: string[]): Promise<SmartRetryResult> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'retry',
        payload: { taskText, failureCount, reasons }
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('getSmartRetryBreakdown failed:', err);
    return {
      suggestedBreakdown: ['Initiate 15m easy setup review', 'Assemble basic data schemas', 'Formulate test outline'],
      encouragementText: 'Every setback is a set of clues waiting to be untangled! Try tackling a bite-sized piece first.',
      _fallback: true
    };
  }
}
