/**
 * Calendar Tool Handlers (Google Calendar + Outlook Calendar)
 *
 * Unified calendar tools that detect provider from account email.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GoogleCalendarService } from '../services/google-calendar.js';
import { MicrosoftCalendarService } from '../services/ms-calendar.js';
import { getServiceAsync } from '../services/cache.js';
import { loadAccounts } from '../config.js';
import { formatOutput } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

// Detect if account is Google or Microsoft
function detectProvider(account: string): 'google' | 'microsoft' {
  const data = loadAccounts();
  if (data.google_accounts.some((a) => a.email === account)) return 'google';
  if (data.microsoft_accounts.some((a) => a.email === account)) return 'microsoft';
  // Fallback: guess from domain
  if (account.endsWith('@gmail.com') || account.endsWith('@googlemail.com')) return 'google';
  return 'microsoft';
}

async function getGoogleCalendar(account: string): Promise<GoogleCalendarService> {
  return getServiceAsync(`GoogleCalendarService:${account}`, () =>
    GoogleCalendarService.create(account),
  );
}

async function getMSCalendar(account: string): Promise<MicrosoftCalendarService> {
  return getServiceAsync(`MicrosoftCalendarService:${account}`, () =>
    MicrosoftCalendarService.create(account),
  );
}

// =====================================================================
// RRULE to Microsoft Graph recurrence converter
// =====================================================================

const RRULE_FREQ_MAP: Record<string, string> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'absoluteMonthly',
  YEARLY: 'absoluteYearly',
};

const RRULE_DAY_MAP: Record<string, string> = {
  MO: 'monday',
  TU: 'tuesday',
  WE: 'wednesday',
  TH: 'thursday',
  FR: 'friday',
  SA: 'saturday',
  SU: 'sunday',
};

/**
 * Parse an RRULE string into a Microsoft Graph recurrence object.
 *
 * Supports FREQ, INTERVAL, BYDAY, COUNT, and UNTIL.
 * Example input: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
 */
export function parseRRuleForMicrosoft(
  rrule: string,
  eventStart: string,
): {
  pattern: { type: string; interval: number; daysOfWeek?: string[] };
  range: { type: string; startDate: string; endDate?: string; numberOfOccurrences?: number };
} {
  const parts: Record<string, string> = {};
  for (const segment of rrule.split(';')) {
    const [key, value] = segment.split('=');
    if (key && value) parts[key.toUpperCase()] = value;
  }

  const freq = parts['FREQ'] ?? 'WEEKLY';
  const interval = parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1;
  const daysOfWeek = parts['BYDAY']
    ? parts['BYDAY'].split(',').map((d) => RRULE_DAY_MAP[d.trim()] ?? d.toLowerCase())
    : undefined;

  const pattern: { type: string; interval: number; daysOfWeek?: string[] } = {
    type: RRULE_FREQ_MAP[freq] ?? 'weekly',
    interval,
  };
  if (daysOfWeek?.length) {
    pattern.daysOfWeek = daysOfWeek;
  }

  // Extract the start date (date portion only) from the event start
  const startDate = eventStart.includes('T') ? eventStart.split('T')[0]! : eventStart;

  const range: { type: string; startDate: string; endDate?: string; numberOfOccurrences?: number } =
    {
      type: 'noEnd',
      startDate,
    };

  if (parts['COUNT']) {
    range.type = 'numbered';
    range.numberOfOccurrences = parseInt(parts['COUNT'], 10);
  } else if (parts['UNTIL']) {
    range.type = 'endDate';
    // UNTIL may be a date like 20261231 or 20261231T235959Z
    const until = parts['UNTIL'];
    const datePart = until.includes('T') ? until.split('T')[0]! : until;
    range.endDate =
      datePart.length === 8
        ? `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`
        : datePart;
  }

  return { pattern, range };
}

export function registerCalendarTools(server: McpServer): void {
  // ===================================================================
  // List Calendars
  // ===================================================================

  server.tool(
    'calendar_list_calendars',
    'List available calendars for an account (Google Calendar or Outlook).',
    {
      account: z.string().email().describe('Account email'),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, format }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          const calendars = await svc.listCalendars();
          return {
            content: [
              {
                type: 'text' as const,
                text: formatOutput(calendars, format, 'calendars', [
                  'id',
                  'summary',
                  'primary',
                  'timeZone',
                ]),
              },
            ],
          };
        } else {
          const svc = await getMSCalendar(account);
          const calendars = await svc.listCalendars();
          return {
            content: [
              {
                type: 'text' as const,
                text: formatOutput(calendars, format, 'calendars', [
                  'id',
                  'name',
                  'isDefaultCalendar',
                  'canEdit',
                ]),
              },
            ],
          };
        }
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError(
                'calendar_list_calendars',
                e as Error,
                detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // List Events
  // ===================================================================

  server.tool(
    'calendar_list_events',
    'List calendar events in a time range. Works with Google Calendar and Outlook Calendar.',
    {
      account: z.string().email().describe('Account email'),
      timeMin: z.string().describe('Start time (ISO 8601, e.g., 2026-02-14T00:00:00Z)'),
      timeMax: z.string().describe('End time (ISO 8601)'),
      calendarId: z.string().optional().describe('Calendar ID (default: primary/default)'),
      maxResults: z.coerce.number().min(1).max(250).default(50),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, timeMin, timeMax, calendarId, maxResults, format }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          const events = await svc.getEvents(timeMin, timeMax, calendarId ?? 'primary', maxResults);

          if (events.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No events found in the given time range.' },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: formatOutput(events, format, 'events', [
                  'id',
                  'summary',
                  'start',
                  'end',
                  'location',
                  'organizer',
                ]),
              },
            ],
          };
        } else {
          const svc = await getMSCalendar(account);
          const events = await svc.getEvents(timeMin, timeMax, calendarId, maxResults);

          if (events.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No events found in the given time range.' },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: formatOutput(events, format, 'events', [
                  'id',
                  'subject',
                  'start',
                  'end',
                  'location',
                  'organizer',
                ]),
              },
            ],
          };
        }
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError(
                'calendar_list_events',
                e as Error,
                detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Create Event
  // ===================================================================

  server.tool(
    'calendar_create_event',
    'Create a new calendar event (Google Calendar or Outlook). Supports recurring events via recurrence_rule.',
    {
      account: z.string().email().describe('Account email'),
      summary: z.string().describe('Event title/subject'),
      start: z.string().describe('Start time (ISO 8601)'),
      end: z.string().describe('End time (ISO 8601)'),
      description: z.string().optional().describe('Event description/body'),
      location: z.string().optional().describe('Event location'),
      attendees: z.array(z.string().email()).optional().describe('Attendee email addresses'),
      calendarId: z.string().optional().describe('Calendar ID (default: primary/default)'),
      timezone: z.string().default('UTC').describe('Timezone for the event'),
      createOnlineMeeting: z.boolean().default(false).describe('Create Teams/Meet link'),
      recurrence_rule: z
        .string()
        .optional()
        .describe(
          'RRULE string for recurring events, e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10". ' +
            'Automatically converted for each provider.',
        ),
    },
    async ({
      account,
      summary,
      start,
      end,
      description,
      location,
      attendees,
      calendarId,
      timezone,
      createOnlineMeeting,
      recurrence_rule,
    }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          const recurrence = recurrence_rule ? [`RRULE:${recurrence_rule}`] : undefined;
          const event = await svc.createEvent({
            summary,
            start,
            end,
            description,
            location,
            attendees,
            calendarId,
            recurrence,
          });
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(event, null, 2),
              },
            ],
          };
        } else {
          const svc = await getMSCalendar(account);
          const msRecurrence = recurrence_rule
            ? parseRRuleForMicrosoft(recurrence_rule, start)
            : undefined;
          const event = await svc.createEvent({
            subject: summary,
            start,
            end,
            timezone,
            body: description,
            location,
            attendees,
            isOnline: createOnlineMeeting,
            calendarId,
            recurrence: msRecurrence,
          });
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(event, null, 2),
              },
            ],
          };
        }
      } catch (e) {
        const cat =
          detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL;
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('calendar_create_event', e as Error, cat),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Delete Event
  // ===================================================================

  server.tool(
    'calendar_delete_event',
    'Delete a calendar event (Google Calendar or Outlook).',
    {
      account: z.string().email().describe('Account email'),
      eventId: z.string().describe('Event ID'),
      calendarId: z.string().optional().describe('Calendar ID (default: primary/default)'),
    },
    async ({ account, eventId, calendarId }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          await svc.deleteEvent(eventId, calendarId ?? 'primary');
        } else {
          const svc = await getMSCalendar(account);
          await svc.deleteEvent(eventId);
        }

        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ status: 'deleted', eventId }) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError(
                'calendar_delete_event',
                e as Error,
                detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Update Event (Google Calendar + Outlook)
  // ===================================================================

  server.tool(
    'calendar_update_event',
    'Update an existing calendar event (Google Calendar or Outlook).',
    {
      account: z.string().email().describe('Account email'),
      eventId: z.string().describe('Event ID'),
      subject: z.string().optional().describe('New event title/subject'),
      start: z.string().optional().describe('New start time (ISO 8601)'),
      end: z.string().optional().describe('New end time (ISO 8601)'),
      timezone: z.string().optional().describe('Timezone (e.g., UTC, America/New_York)'),
      description: z.string().optional().describe('New event description/body'),
      location: z.string().optional().describe('New event location'),
      attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated attendee emails (Google only)'),
      calendarId: z.string().optional().describe('Calendar ID (default: primary, Google only)'),
    },
    async ({
      account,
      eventId,
      subject,
      start,
      end,
      timezone,
      description,
      location,
      attendees,
      calendarId,
    }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          const event = await svc.updateEvent(calendarId ?? 'primary', eventId, {
            summary: subject,
            description,
            location,
            start,
            end,
            attendees,
          });
          return { content: [{ type: 'text' as const, text: JSON.stringify(event, null, 2) }] };
        } else {
          const svc = await getMSCalendar(account);
          const event = await svc.updateEvent(eventId, {
            subject,
            start,
            end,
            timezone,
            body: description,
            location,
          });
          return { content: [{ type: 'text' as const, text: JSON.stringify(event, null, 2) }] };
        }
      } catch (e) {
        const cat =
          detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL;
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('calendar_update_event', e as Error, cat),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Free/Busy Query
  // ===================================================================

  server.tool(
    'calendar_free_busy',
    'Check free/busy availability for calendars or people in a time range.',
    {
      account: z.string().email().describe('Email of the authenticated account'),
      emails: z
        .array(z.string())
        .describe('Email addresses or calendar IDs to check availability for'),
      start_time: z.string().describe('Start of time range (ISO 8601)'),
      end_time: z.string().describe('End of time range (ISO 8601)'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, emails, start_time, end_time, format }) => {
      try {
        const provider = detectProvider(account);
        let results;

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          results = await svc.getFreeBusy(emails, start_time, end_time);
        } else {
          const svc = await getMSCalendar(account);
          results = await svc.getFreeBusy(emails, start_time, end_time);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(results, format, 'availability'),
            },
          ],
        };
      } catch (e) {
        const cat =
          detectProvider(account) === 'google' ? ErrorCategory.GCAL : ErrorCategory.MS_CAL;
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('calendar_free_busy', e as Error, cat),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
