/**
 * Google Calendar API Service
 *
 * Port of productivity-mcp/services/google_calendar.py
 */

import { google, calendar_v3 } from 'googleapis';
import { getCredentials } from '../auth/google.js';

// =====================================================================
// Types
// =====================================================================

export interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  timeZone: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  status: string;
  organizer: string;
  attendees: string[];
  htmlLink: string;
  hangoutLink: string;
}

export interface FreeBusySlot {
  start: string;
  end: string;
}

export interface FreeBusyResult {
  calendar: string;
  busy: FreeBusySlot[];
}

// =====================================================================
// Service Class
// =====================================================================

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  constructor(email: string, auth: Awaited<ReturnType<typeof getCredentials>>) {
    if (!auth) throw new Error(`No valid credentials for ${email}. Authenticate first.`);
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  static async create(email: string): Promise<GoogleCalendarService> {
    const auth = await getCredentials(email);
    return new GoogleCalendarService(email, auth);
  }

  private formatEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    return {
      id: event.id ?? '',
      summary: event.summary ?? '',
      description: event.description ?? '',
      location: event.location ?? '',
      start: event.start?.dateTime ?? event.start?.date ?? '',
      end: event.end?.dateTime ?? event.end?.date ?? '',
      status: event.status ?? '',
      organizer: event.organizer?.email ?? '',
      attendees: (event.attendees ?? []).map((a) => a.email ?? ''),
      htmlLink: event.htmlLink ?? '',
      hangoutLink: event.hangoutLink ?? '',
    };
  }

  async listCalendars(): Promise<CalendarInfo[]> {
    const result = await this.calendar.calendarList.list();
    return (result.data.items ?? []).map((c) => ({
      id: c.id ?? '',
      summary: c.summary ?? '',
      primary: c.primary ?? false,
      timeZone: c.timeZone ?? '',
    }));
  }

  async getEvents(
    timeMin: string,
    timeMax: string,
    calendarId = 'primary',
    maxResults = 50,
  ): Promise<CalendarEvent[]> {
    const result = await this.calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return (result.data.items ?? []).map((e) => this.formatEvent(e));
  }

  async createEvent(params: {
    summary: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
    calendarId?: string;
    recurrence?: string[];
  }): Promise<CalendarEvent> {
    const event: calendar_v3.Schema$Event = {
      summary: params.summary,
      start: params.start.includes('T')
        ? { dateTime: params.start }
        : { date: params.start },
      end: params.end.includes('T')
        ? { dateTime: params.end }
        : { date: params.end },
      description: params.description,
      location: params.location,
      attendees: params.attendees?.map((email) => ({ email })),
    };
    if (params.recurrence?.length) {
      event.recurrence = params.recurrence;
    }

    const result = await this.calendar.events.insert({
      calendarId: params.calendarId ?? 'primary',
      requestBody: event,
      sendUpdates: 'all',
    });
    return this.formatEvent(result.data);
  }

  async deleteEvent(eventId: string, calendarId = 'primary'): Promise<boolean> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });
    return true;
  }

  // ===================================================================
  // Update Event
  // ===================================================================

  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      location?: string;
      start?: string;
      end?: string;
      attendees?: string[];
    },
  ): Promise<CalendarEvent> {
    const requestBody: Record<string, unknown> = {};
    if (updates.summary) requestBody.summary = updates.summary;
    if (updates.description) requestBody.description = updates.description;
    if (updates.location) requestBody.location = updates.location;
    if (updates.start) {
      requestBody.start = updates.start.includes('T')
        ? { dateTime: updates.start }
        : { date: updates.start };
    }
    if (updates.end) {
      requestBody.end = updates.end.includes('T')
        ? { dateTime: updates.end }
        : { date: updates.end };
    }
    if (updates.attendees) {
      requestBody.attendees = updates.attendees.map((email) => ({ email }));
    }

    const res = await this.calendar.events.patch({
      calendarId,
      eventId,
      requestBody,
      sendUpdates: 'all',
    });
    return this.formatEvent(res.data);
  }

  // ===================================================================
  // Free/Busy Query
  // ===================================================================

  async getFreeBusy(
    calendarIds: string[],
    timeMin: string,
    timeMax: string,
  ): Promise<FreeBusyResult[]> {
    const res = await this.calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const calendars = res.data.calendars ?? {};
    return Object.entries(calendars).map(([id, cal]) => ({
      calendar: id,
      busy: (
        (cal as Record<string, unknown>).busy as Array<{ start: string; end: string }> ?? []
      ).map((slot) => ({
        start: slot.start ?? '',
        end: slot.end ?? '',
      })),
    }));
  }
}
