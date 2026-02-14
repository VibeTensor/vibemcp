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
      attendees: (event.attendees ?? []).map(a => a.email ?? ''),
      htmlLink: event.htmlLink ?? '',
      hangoutLink: event.hangoutLink ?? '',
    };
  }

  async listCalendars(): Promise<CalendarInfo[]> {
    const result = await this.calendar.calendarList.list();
    return (result.data.items ?? []).map(c => ({
      id: c.id ?? '',
      summary: c.summary ?? '',
      primary: c.primary ?? false,
      timeZone: c.timeZone ?? '',
    }));
  }

  async getEvents(timeMin: string, timeMax: string, calendarId = 'primary', maxResults = 50): Promise<CalendarEvent[]> {
    const result = await this.calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return (result.data.items ?? []).map(e => this.formatEvent(e));
  }

  async createEvent(params: {
    summary: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
    calendarId?: string;
  }): Promise<CalendarEvent> {
    const event: calendar_v3.Schema$Event = {
      summary: params.summary,
      start: { dateTime: params.start },
      end: { dateTime: params.end },
      description: params.description,
      location: params.location,
      attendees: params.attendees?.map(email => ({ email })),
    };

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
}
