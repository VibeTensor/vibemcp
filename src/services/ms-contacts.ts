/**
 * Microsoft Graph Contacts service for contact name resolution.
 *
 * Uses the Microsoft Graph People and Contacts APIs to search,
 * list, and resolve contacts from authenticated Microsoft accounts.
 */

import { getTokenForAccount } from '../auth/microsoft.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// =====================================================================
// Types
// =====================================================================

export interface MSContact {
  email: string;
  name: string;
  jobTitle: string;
  department: string;
}

// =====================================================================
// Microsoft Contacts Service Class
// =====================================================================

export class MicrosoftContactsService {
  private token: string;
  private email: string;

  private constructor(email: string, token: string) {
    this.email = email;
    this.token = token;
  }

  static async create(email: string): Promise<MicrosoftContactsService> {
    const token = await getTokenForAccount(email);
    if (!token) throw new Error(`No valid token for ${email}. Authenticate first.`);
    return new MicrosoftContactsService(email, token);
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

  // =================================================================
  // Contact formatting
  // =================================================================

  formatContact(c: Record<string, unknown>): MSContact {
    const emailAddresses = (c['emailAddresses'] as Array<Record<string, unknown>>) ?? [];
    const scoredEmails = (c['scoredEmailAddresses'] as Array<Record<string, unknown>>) ?? [];
    const primaryEmail =
      (emailAddresses[0]?.['address'] as string) ?? (scoredEmails[0]?.['address'] as string) ?? '';
    return {
      email: primaryEmail,
      name: (c['displayName'] as string) ?? '',
      jobTitle: (c['jobTitle'] as string) ?? '',
      department: (c['department'] as string) ?? '',
    };
  }

  // =================================================================
  // Core operations
  // =================================================================

  async listContacts(top: number = 100, filter?: string): Promise<MSContact[]> {
    const params: Record<string, string> = {
      $top: String(top),
      $select: 'displayName,emailAddresses,jobTitle,department',
    };
    if (filter) params['$filter'] = filter;

    const data = await this.get('/me/contacts', params);
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((c) => this.formatContact(c));
  }

  async searchPeople(query: string, top: number = 10): Promise<MSContact[]> {
    const params: Record<string, string> = {
      $search: `"${query}"`,
      $top: String(top),
      $select: 'displayName,emailAddresses,jobTitle,department',
    };
    const data = await this.get('/me/people', params);
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((c) => this.formatContact(c));
  }

  async resolveEmails(emails: string[]): Promise<MSContact[]> {
    const results: MSContact[] = [];
    for (const email of emails) {
      try {
        const people = await this.searchPeople(email, 1);
        if (people.length > 0) {
          results.push(people[0]!);
        } else {
          results.push({ email, name: '', jobTitle: '', department: '' });
        }
      } catch {
        results.push({ email, name: '', jobTitle: '', department: '' });
      }
    }
    return results;
  }
}
