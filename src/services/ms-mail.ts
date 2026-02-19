/**
 * Microsoft Graph Mail API Service
 *
 * Port of productivity-mcp/services/microsoft_mail.py
 * Uses native fetch with Graph API v1.0.
 */

import { getTokenForAccount } from '../auth/microsoft.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// =====================================================================
// Types
// =====================================================================

export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  preview: string;
}

export interface OutlookMessageFull extends OutlookMessage {
  to: string[];
  cc: string[];
  importance: string;
  body: string;
  bodyContentType: string;
}

export interface MailFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
}

// =====================================================================
// Service Class
// =====================================================================

export class MicrosoftMailService {
  private token: string;

  private constructor(token: string) {
    this.token = token;
  }

  static async create(accountId: string): Promise<MicrosoftMailService> {
    const token = await getTokenForAccount(accountId);
    if (!token) throw new Error(`No valid token for ${accountId}. Authenticate first.`);
    return new MicrosoftMailService(token);
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

  private async post(endpoint: string, body?: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  }

  private async delete(endpoint: string): Promise<void> {
    const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  }

  // =================================================================
  // Message formatting
  // =================================================================

  private formatMessage(
    msg: Record<string, unknown>,
    includeBody = false,
  ): OutlookMessage | OutlookMessageFull {
    const from = msg['from'] as Record<string, unknown> | undefined;
    const fromEmail =
      ((from?.['emailAddress'] as Record<string, unknown>)?.['address'] as string) ?? '';

    const base: OutlookMessage = {
      id: (msg['id'] as string) ?? '',
      subject: (msg['subject'] as string) ?? '(no subject)',
      from: fromEmail,
      receivedDateTime: (msg['receivedDateTime'] as string) ?? '',
      isRead: (msg['isRead'] as boolean) ?? false,
      hasAttachments: (msg['hasAttachments'] as boolean) ?? false,
      preview: (msg['bodyPreview'] as string) ?? '',
    };

    if (!includeBody) return base;

    const toRecipients = (msg['toRecipients'] as Array<Record<string, unknown>>) ?? [];
    const ccRecipients = (msg['ccRecipients'] as Array<Record<string, unknown>>) ?? [];
    const body = (msg['body'] as Record<string, unknown>) ?? {};

    return {
      ...base,
      to: toRecipients.map(
        (r) => ((r['emailAddress'] as Record<string, unknown>)?.['address'] as string) ?? '',
      ),
      cc: ccRecipients.map(
        (r) => ((r['emailAddress'] as Record<string, unknown>)?.['address'] as string) ?? '',
      ),
      importance: (msg['importance'] as string) ?? 'normal',
      body: (body['content'] as string) ?? '',
      bodyContentType: (body['contentType'] as string) ?? '',
    };
  }

  // =================================================================
  // Operations
  // =================================================================

  async listFolders(): Promise<MailFolder[]> {
    const data = await this.get('/me/mailFolders', { $top: '50' });
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((f) => ({
      id: (f['id'] as string) ?? '',
      displayName: (f['displayName'] as string) ?? '',
      totalItemCount: (f['totalItemCount'] as number) ?? 0,
      unreadItemCount: (f['unreadItemCount'] as number) ?? 0,
    }));
  }

  async listMessages(folderId = 'inbox', top = 20, filter?: string): Promise<OutlookMessage[]> {
    const params: Record<string, string> = {
      $top: String(top),
      $orderby: 'receivedDateTime desc',
    };
    if (filter) params['$filter'] = filter;

    const endpoint = folderId === 'all' ? '/me/messages' : `/me/mailFolders/${folderId}/messages`;
    const data = await this.get(endpoint, params);
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((m) => this.formatMessage(m));
  }

  async getMessage(messageId: string): Promise<OutlookMessageFull> {
    const data = await this.get(`/me/messages/${messageId}`);
    return this.formatMessage(data, true) as OutlookMessageFull;
  }

  async searchMessages(query: string, top = 20): Promise<OutlookMessage[]> {
    const data = await this.get('/me/messages', { $search: `"${query}"`, $top: String(top) });
    const value = (data['value'] as Array<Record<string, unknown>>) ?? [];
    return value.map((m) => this.formatMessage(m));
  }

  async sendMessage(
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
  ): Promise<{ status: string }> {
    const message: Record<string, unknown> = {
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: to.map((addr) => ({ emailAddress: { address: addr } })),
      },
    };
    if (cc?.length) {
      (message['message'] as Record<string, unknown>)['ccRecipients'] = cc.map((addr) => ({
        emailAddress: { address: addr },
      }));
    }
    await this.post('/me/sendMail', message);
    return { status: 'sent' };
  }

  async replyMessage(messageId: string, comment: string): Promise<{ status: string }> {
    await this.post(`/me/messages/${messageId}/reply`, { comment });
    return { status: 'replied' };
  }

  async forwardMessage(messageId: string, to: string[], comment = ''): Promise<{ status: string }> {
    await this.post(`/me/messages/${messageId}/forward`, {
      comment,
      toRecipients: to.map((addr) => ({ emailAddress: { address: addr } })),
    });
    return { status: 'forwarded' };
  }

  async createDraft(
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
  ): Promise<{ id: string; status: string }> {
    const message: Record<string, unknown> = {
      subject,
      body: { contentType: 'Text', content: body },
      toRecipients: to.map((addr) => ({ emailAddress: { address: addr } })),
    };
    if (cc?.length) {
      message['ccRecipients'] = cc.map((addr) => ({ emailAddress: { address: addr } }));
    }
    const data = await this.post('/me/messages', message);
    return { id: (data['id'] as string) ?? '', status: 'draft' };
  }

  async moveMessage(
    messageId: string,
    destinationFolderId: string,
  ): Promise<{ id: string; status: string }> {
    const data = await this.post(`/me/messages/${messageId}/move`, {
      destinationId: destinationFolderId,
    });
    return { id: (data['id'] as string) ?? '', status: 'moved' };
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    await this.delete(`/me/messages/${messageId}`);
    return true;
  }
}
