/**
 * Google People API service for contact name resolution.
 *
 * Uses the Google People API to search, list, and resolve contacts
 * from authenticated Google accounts.
 */

import { google, people_v1 } from 'googleapis';
import { getCredentials } from '../auth/google.js';

// =====================================================================
// Types
// =====================================================================

export interface GoogleContact {
  email: string;
  name: string;
  photoUrl: string;
}

// =====================================================================
// Google Contacts Service Class
// =====================================================================

export class GoogleContactsService {
  private people: people_v1.People;
  private email: string;

  private constructor(email: string, auth: Awaited<ReturnType<typeof getCredentials>>) {
    if (!auth) throw new Error(`No valid credentials for ${email}. Authenticate first.`);
    this.email = email;
    this.people = google.people({ version: 'v1', auth });
  }

  static async create(email: string): Promise<GoogleContactsService> {
    const auth = await getCredentials(email);
    return new GoogleContactsService(email, auth);
  }

  // =================================================================
  // Contact formatting
  // =================================================================

  formatContact(person: Record<string, unknown>): GoogleContact {
    const names = (person['names'] as Array<Record<string, unknown>>) ?? [];
    const emails = (person['emailAddresses'] as Array<Record<string, unknown>>) ?? [];
    const photos = (person['photos'] as Array<Record<string, unknown>>) ?? [];
    return {
      email: (emails[0]?.['value'] as string) ?? '',
      name: (names[0]?.['displayName'] as string) ?? '',
      photoUrl: (photos[0]?.['url'] as string) ?? '',
    };
  }

  // =================================================================
  // Core operations
  // =================================================================

  async listContacts(pageSize: number = 100, query?: string): Promise<GoogleContact[]> {
    if (query) {
      const res = await this.people.people.searchContacts({
        query,
        readMask: 'names,emailAddresses,photos',
        pageSize,
      });
      return (res.data.results ?? []).map((r) =>
        this.formatContact((r.person ?? {}) as Record<string, unknown>),
      );
    }

    const res = await this.people.people.connections.list({
      resourceName: 'people/me',
      pageSize,
      personFields: 'names,emailAddresses,photos',
    });
    return (res.data.connections ?? []).map((p: people_v1.Schema$Person) =>
      this.formatContact(p as unknown as Record<string, unknown>),
    );
  }

  async resolveEmails(emails: string[]): Promise<GoogleContact[]> {
    const results: GoogleContact[] = [];
    for (const email of emails) {
      try {
        const contacts = await this.listContacts(1, email);
        if (contacts.length > 0) {
          results.push(contacts[0]!);
        } else {
          results.push({ email, name: '', photoUrl: '' });
        }
      } catch {
        results.push({ email, name: '', photoUrl: '' });
      }
    }
    return results;
  }
}
