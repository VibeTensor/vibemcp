/**
 * Microsoft Graph Calendar API Service
 *
 * Port of productivity-mcp/services/microsoft_calendar.py
 * Uses native fetch with Graph API v1.0.
 */

import { getTokenForAccount } from '../auth/microsoft.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// =====================================================================
// Types
// =====================================================================

export interface MSCalendarInfo {
  id: string;
  name: string;
  color: string;
  isDefaultCalendar: boolean;
  canEdit: boolean;
}

export interface MSCalendarEvent {
  id: string;
  subject: string;
  body: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: string;
  organizer: string;
  attendees: Array<{ email: string; status: string }>;
  isOnlineMeeting: boolean;
  onlineMeetingUrl: string;
  importance: string;
}

// =====================================================================
// Service Class
// =====================================================================

export class MicrosoftCalendarService {
  private token: string;

  private constructor(token: string) {
    this.token = token;
  }

  static async create(accountId: string): Promise<MicrosoftCalendarService> {
    const token = await getTokenForAccount(accountId);
    if (!token) throw new Error(`No valid token for ${accountId}. Authenticate first.`);
    return new MicrosoftCalendarService(token);
  }

  // =================================================================
  // HTTP helpers
  // =================================================================

  private async get(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const url = new URL(`${GRAPH_BASE}${endpoint}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
    return (await res.json()) as Record<string, unknown>;
  }

  private async post(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  }

  private async patch(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
    return (await res.json()) as Record<string, unknown>;
  }

  private async del(endpoint: string): Promise<void> {
    const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  }

  // =================================================================
  // Event formatting
  // =================================================================

  private formatEvent(event: Record<string, unknown>): MSCalendarEvent {
    const start = event['start'] as Record<string, unknown> | undefined;
    const end = event['end'] as Record<string, unknown> | undefined;
    const location = event['location'] as Record<string, unknown> | undefined;
    const organizer = event['organizer'] as Record<string, unknown> | undefined;
    const orgEmail = organizer?.['emailAddress'] as Record<string, unknown> | undefined;
    const attendees = (event['attendees'] as Array<Record<string, unknown>>) ?? [];
    const body = event['body'] as Record<string, unknown> | undefined;

    return {
      id: (event['id'] as string) ?? '',
      subject: (event['subject'] as string) ?? '(no title)',
      body: (body?.['content'] as string) ?? '',
      start: {
        dateTime: (start?.['dateTime'] as string) ?? '',
        timeZone: (start?.['timeZone'] as string) ?? 'UTC',
      },
      end: {
        dateTime: (end?.['dateTime'] as string) ?? '',
        timeZone: (end?.['timeZone'] as string) ?? 'UTC',
      },
      location: (location?.['displayName'] as string) ?? '',
      organizer: (orgEmail?.['address'] as string) ?? '',
      attendees: attendees.map((a) => {
        const ea = a['emailAddress'] as Record<string, unknown> | undefined;
        const st = a['status'] as Record<string, unknown> | undefined;
        return {
          email: (ea?.['address'] as string) ?? '',
          status: (st?.['response'] as string) ?? '',
        };
      }),
      isOnlineMeeting: (event['isOnlineMeeting'] as boolean) ?? false,
      onlineMeetingUrl: (event['onlineMeetingUrl'] as string) ?? '',
      importance: (event['importance'] as string) ?? 'normal',
    };
  }

  // =================================================================
  // Operations
  // =================================================================

  async listCalendars(): Promise<MSCalendarInfo[]> {
    const data = await this.get('/me/calendars');
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((c) => ({
      id: (c['id'] as string) ?? '',
      name: (c['name'] as string) ?? '',
      color: (c['color'] as string) ?? '',
      isDefaultCalendar: (c['isDefaultCalendar'] as boolean) ?? false,
      canEdit: (c['canEdit'] as boolean) ?? false,
    }));
  }

  async getEvents(
    startDateTime: string,
    endDateTime: string,
    calendarId?: string,
    top = 50,
  ): Promise<MSCalendarEvent[]> {
    const endpoint = calendarId ? `/me/calendars/${calendarId}/calendarView` : '/me/calendarView';
    const params: Record<string, string> = {
      startDateTime,
      endDateTime,
      $top: String(top),
      $orderby: 'start/dateTime',
      $select:
        'id,subject,body,start,end,location,organizer,attendees,isOnlineMeeting,onlineMeetingUrl,importance',
    };
    const data = await this.get(endpoint, params);
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((e) => this.formatEvent(e));
  }

  async createEvent(params: {
    subject: string;
    start: string;
    end: string;
    timezone?: string;
    body?: string;
    location?: string;
    attendees?: string[];
    isOnline?: boolean;
    calendarId?: string;
  }): Promise<MSCalendarEvent> {
    const tz = params.timezone ?? 'UTC';
    const eventBody: Record<string, unknown> = {
      subject: params.subject,
      start: { dateTime: params.start, timeZone: tz },
      end: { dateTime: params.end, timeZone: tz },
    };
    if (params.body) {
      eventBody['body'] = { contentType: 'Text', content: params.body };
    }
    if (params.location) {
      eventBody['location'] = { displayName: params.location };
    }
    if (params.attendees?.length) {
      eventBody['attendees'] = params.attendees.map((a) => ({
        emailAddress: { address: a },
        type: 'required',
      }));
    }
    if (params.isOnline) {
      eventBody['isOnlineMeeting'] = true;
      eventBody['onlineMeetingProvider'] = 'teamsForBusiness';
    }

    const endpoint = params.calendarId ? `/me/calendars/${params.calendarId}/events` : '/me/events';
    const data = await this.post(endpoint, eventBody);
    return this.formatEvent(data);
  }

  async updateEvent(
    eventId: string,
    updates: {
      subject?: string;
      start?: string;
      end?: string;
      timezone?: string;
      body?: string;
      location?: string;
    },
  ): Promise<MSCalendarEvent> {
    const patch: Record<string, unknown> = {};
    if (updates.subject !== undefined) patch['subject'] = updates.subject;
    if (updates.body !== undefined) patch['body'] = { contentType: 'Text', content: updates.body };
    if (updates.location !== undefined) patch['location'] = { displayName: updates.location };
    const tz = updates.timezone ?? 'UTC';
    if (updates.start !== undefined) patch['start'] = { dateTime: updates.start, timeZone: tz };
    if (updates.end !== undefined) patch['end'] = { dateTime: updates.end, timeZone: tz };

    const data = await this.patch(`/me/events/${eventId}`, patch);
    return this.formatEvent(data);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    await this.del(`/me/events/${eventId}`);
    return true;
  }

  async getAvailability(
    startDateTime: string,
    endDateTime: string,
    schedules?: string[],
  ): Promise<Record<string, unknown>> {
    const body = {
      schedules: schedules ?? [],
      startTime: { dateTime: startDateTime, timeZone: 'UTC' },
      endTime: { dateTime: endDateTime, timeZone: 'UTC' },
      availabilityViewInterval: 30,
    };
    return this.post('/me/calendar/getSchedule', body);
  }
}
