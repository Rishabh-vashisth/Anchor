import { TimeBlock, GoogleCalendarEvent, GoogleSyncLog } from '../types';

// Scopes we need
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Generates client-side Implicit Flow OAuth URL using accounts.google.com
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('scope', GOOGLE_CALENDAR_SCOPES.join(' '));
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

/**
 * Helper to fetch with Bearer token authorization
 */
async function fetchGoogleAPI(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google API Error [${response.status}]: ${errorBody || response.statusText}`);
  }

  return response.status === 204 ? null : await response.json();
}

/**
 * Lists user's calendars
 */
export async function fetchCalendarList(token: string) {
  const data = await fetchGoogleAPI('/users/me/calendarList', token);
  return data.items || [];
}

/**
 * Creates 'Anchor Blocks' secondary calendar
 */
export async function createAnchorCalendar(token: string): Promise<{ id: string; summary: string }> {
  const data = await fetchGoogleAPI('/calendars', token, {
    method: 'POST',
    body: JSON.stringify({
      summary: 'Anchor Blocks',
      description: 'Synchronized focus sessions, deep work templates, and context scheduled via the Anchor Focus Applet.'
    })
  });
  return { id: data.id, summary: data.summary };
}

/**
 * Converts a weekly recurring TimeBlock (dayOfWeek, startTime, duration) to concrete target Dates during the current week.
 * Note: dayOfWeek: (0 = Sunday, 1 = Monday ... 6 = Saturday)
 */
export function getConcreteDatesForBlock(block: TimeBlock): { start: Date; end: Date } {
  const [hours, minutes] = block.startTime.split(':').map(Number);
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday ...

  // Calculate day difference for this current week
  let diff = block.dayOfWeek - currentDay;
  
  const start = new Date(now);
  start.setTime(now.getTime() + diff * 24 * 3600 * 1000);
  start.setHours(hours, minutes, 0, 0);

  const end = new Date(start.getTime() + block.duration * 60000);

  return { start, end };
}

/**
 * Fetches events for the current week for overlap and context display
 */
export async function fetchCalendarEvents(token: string, calendarId: string, daysRange: number = 7): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(); // 2 days ago
  const timeMax = new Date(now.getTime() + daysRange * 24 * 3600 * 1000).toISOString(); // forward range
  
  try {
    const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
    const data = await fetchGoogleAPI(endpoint, token);
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || 'Untitled Event',
      description: item.description,
      start: { dateTime: item.start?.dateTime || item.start?.date, date: item.start?.date },
      end: { dateTime: item.end?.dateTime || item.end?.date, date: item.end?.date },
      status: item.status,
      htmlLink: item.htmlLink
    }));
  } catch (err) {
    console.error(`Error fetching calendar ${calendarId}:`, err);
    return [];
  }
}

/**
 * Deletes all events in a calendar that matches an '[Anchor]' prefix or are identified in our week.
 */
export async function clearAnchorCalendarWeekEvents(token: string, calendarId: string): Promise<void> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

  const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
  const data = await fetchGoogleAPI(endpoint, token);
  const events = data.items || [];
  
  // Filter events created by Anchor (e.g. they contain [Anchor] summary or descriptive flag)
  const anchorEvents = events.filter((e: any) => e.summary?.startsWith('[Anchor]') || e.description?.includes('scheduled focus block'));
  
  for (const event of anchorEvents) {
    await fetchGoogleAPI(`/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`, token, {
      method: 'DELETE'
    });
  }
}

/**
 * Writes a batch of scheduled blocks as Google Calendar events to the selected calendar
 */
export async function writeBlocksToCalendar(token: string, calendarId: string, blocks: TimeBlock[]): Promise<number> {
  // First clean the week events to avoid stacking repeats on reschedule
  await clearAnchorCalendarWeekEvents(token, calendarId);

  let writtenCount = 0;
  for (const block of blocks) {
    // Generate dates for current week
    const { start, end } = getConcreteDatesForBlock(block);

    const eventPayload = {
      summary: `[Anchor] ${block.label || (block.type === 'DEEP' ? 'Deep Focus Session' : block.type === 'LIGHT' ? 'Admin Light Work' : 'Free Recovery Time')}`,
      description: `Anchor Scheduled Time Block\n• Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][block.dayOfWeek]}\n• Type: ${block.type}\n• Focus Load: ${block.focusLevel}/10\n• Workspace: ${block.environment}\n• Gear: ${block.tools.join(', ')}\n\n[Synced from Anchor Focus Applet]`,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    await fetchGoogleAPI(`/calendars/${encodeURIComponent(calendarId)}/events`, token, {
      method: 'POST',
      body: JSON.stringify(eventPayload)
    });
    writtenCount++;
  }

  return writtenCount;
}

/**
 * Analyzes event arrays and finds the next daylight free slot of `durationMinutes`
 * Daylight hours are configured between 09:00 and 18:00
 */
export function findNextFreeSlot(
  primaryEvents: GoogleCalendarEvent[],
  blocks: TimeBlock[],
  durationMinutes: number = 120
): { dateStart: Date; dateEnd: Date } | null {
  const now = new Date();
  
  // Combine GCal events and local TimeBlocks as busy spans
  interface BusySpan {
    start: Date;
    end: Date;
  }

  const busySpans: BusySpan[] = [];

  // 1. Add primary GCal events
  primaryEvents.forEach(e => {
    const sStr = e.start?.dateTime;
    const eStr = e.end?.dateTime;
    if (sStr && eStr) {
      busySpans.push({ start: new Date(sStr), end: new Date(eStr) });
    }
  });

  // 2. Add current week's local scheduler blocks
  blocks.forEach(b => {
    const { start, end } = getConcreteDatesForBlock(b);
    busySpans.push({ start, end });
  });

  // Sort busy spans chronologically
  busySpans.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Search through next 7 days
  for (let d = 0; d < 7; d++) {
    const searchDate = new Date(now);
    searchDate.setDate(now.getDate() + d);

    // Business focus hours limit: 09:00 to 18:00
    const workStart = new Date(searchDate);
    workStart.setHours(9, 0, 0, 0);

    const workEnd = new Date(searchDate);
    workEnd.setHours(18, 0, 0, 0);

    // If search is today, start search from now if it is past 9:00 AM
    let currentPointer = new Date(workStart);
    if (d === 0 && now > workStart) {
      currentPointer = new Date(now);
      // Align to nearest 15-minute slot for professional clean start
      const rem = currentPointer.getMinutes() % 15;
      currentPointer.setMinutes(currentPointer.getMinutes() + (15 - rem), 0, 0);
    }

    // Slide window inside daylight focus hours
    while (currentPointer.getTime() + durationMinutes * 60000 <= workEnd.getTime()) {
      const candidateStart = new Date(currentPointer);
      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000);

      // Check if candidate slot overlaps with ANY busy span
      const hasOverlap = busySpans.some(span => {
        // overlap occurs if (StartA < EndB) and (EndA > StartB)
        return (candidateStart < span.end && candidateEnd > span.start);
      });

      if (!hasOverlap) {
        return { dateStart: candidateStart, dateEnd: candidateEnd };
      }

      // Increment pointer by 15-min intervals to inspect next candidate
      currentPointer.setTime(currentPointer.getTime() + 15 * 60000);
    }
  }

  // Fallback: Return tomorrow morning if search exceeds bounds or overlap dense
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(now.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  return {
    dateStart: tomorrowMorning,
    dateEnd: new Date(tomorrowMorning.getTime() + durationMinutes * 60000)
  };
}

/**
 * Checks for conflicts between week blocks and external calendar events.
 * Returns overlapping block IDs paired with the meeting summaries that duplicate times.
 */
export interface ConflictMapping {
  blockId: string;
  blockLabel: string;
  eventSummary: string;
  eventStart: string;
}

export function detectTimeConflicts(
  blocks: TimeBlock[],
  events: GoogleCalendarEvent[]
): ConflictMapping[] {
  const conflicts: ConflictMapping[] = [];

  for (const block of blocks) {
    const { start, end } = getConcreteDatesForBlock(block);

    for (const event of events) {
      if (event.summary?.startsWith('[Anchor]')) continue; // skip own blocks

      const evStartStr = event.start?.dateTime;
      const evEndStr = event.end?.dateTime;
      if (!evStartStr || !evEndStr) continue;

      const evStart = new Date(evStartStr);
      const evEnd = new Date(evEndStr);

      // Overlap calculation
      if (start < evEnd && end > evStart) {
        const timeFmt = evStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        conflicts.push({
          blockId: block.id,
          blockLabel: block.label || `${block.type} Block`,
          eventSummary: event.summary,
          eventStart: timeFmt
        });
      }
    }
  }

  return conflicts;
}
