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
              text: logError('calendar_list_calendars', e as Error, ErrorCategory.GCAL),
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
              text: logError('calendar_list_events', e as Error, ErrorCategory.GCAL),
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
    'Create a new calendar event (Google Calendar or Outlook).',
    {
      account: z.string().email().describe('Account email'),
      summary: z.string().describe('Event title/subject'),
      start: z.string().describe('Start time (ISO 8601)'),
      end: z.string().describe('End time (ISO 8601)'),
      description: z.string().optional().describe('Event description/body'),
      location: z.string().optional(),
      attendees: z.array(z.string().email()).optional(),
      calendarId: z.string().optional(),
      timezone: z.string().default('UTC'),
      createOnlineMeeting: z.boolean().default(false).describe('Create Teams/Meet link'),
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
    }) => {
      try {
        const provider = detectProvider(account);

        if (provider === 'google') {
          const svc = await getGoogleCalendar(account);
          const event = await svc.createEvent({
            summary,
            start,
            end,
            description,
            location,
            attendees,
            calendarId,
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('calendar_create_event', e as Error, ErrorCategory.GCAL),
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
              text: logError('calendar_delete_event', e as Error, ErrorCategory.GCAL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Update Event (Microsoft only — Google Calendar v3 requires full event)
  // ===================================================================

  server.tool(
    'calendar_update_event',
    'Update an existing Outlook calendar event.',
    {
      account: z.string().email().describe('Microsoft account email'),
      eventId: z.string().describe('Event ID'),
      subject: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      timezone: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
    },
    async ({ account, eventId, subject, start, end, timezone, description, location }) => {
      try {
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
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('calendar_update_event', e as Error, ErrorCategory.MS_CAL),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
