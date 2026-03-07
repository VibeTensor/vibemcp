/**
 * Gmail API Service
 *
 * Port of productivity-mcp/services/google_gmail.py
 */

import { google, gmail_v1 } from 'googleapis';
import { getCredentials } from '../auth/google.js';

// =====================================================================
// Types
// =====================================================================

export interface ParsedEmail {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
}

export interface ParsedEmailFull extends ParsedEmail {
  threadId: string;
  cc: string;
  labelIds: string[];
  body: string;
  attachments: AttachmentMeta[];
}

export interface AttachmentMeta {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface Label {
  id: string;
  name: string;
  type: string;
}

export interface ThreadSummary {
  id: string;
  snippet: string;
  historyId: string;
  messagesCount: number;
}

// =====================================================================
// Gmail Service Class
// =====================================================================

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private email: string;

  constructor(email: string, auth: Awaited<ReturnType<typeof getCredentials>>) {
    if (!auth) throw new Error(`No valid credentials for ${email}. Authenticate first.`);
    this.email = email;
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  static async create(email: string): Promise<GmailService> {
    const auth = await getCredentials(email);
    return new GmailService(email, auth);
  }

  // =================================================================
  // Message parsing helpers
  // =================================================================

  private parseMessage(
    msg: gmail_v1.Schema$Message,
    includeBody = false,
  ): ParsedEmail | ParsedEmailFull {
    const headers: Record<string, string> = {};
    for (const h of msg.payload?.headers ?? []) {
      if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
    }

    const base: ParsedEmail = {
      id: msg.id ?? '',
      subject: headers['subject'] ?? '(no subject)',
      from: headers['from'] ?? '',
      to: headers['to'] ?? '',
      date: headers['date'] ?? '',
      snippet: msg.snippet ?? '',
    };

    if (!includeBody) return base;

    return {
      ...base,
      threadId: msg.threadId ?? '',
      cc: headers['cc'] ?? '',
      labelIds: msg.labelIds ?? [],
      body: this.extractBody(msg.payload ?? {}),
      attachments: this.extractAttachments(msg.payload ?? {}),
    };
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart): string {
    const mime = payload.mimeType ?? '';

    if (mime.startsWith('text/plain') || mime.startsWith('text/html')) {
      const data = payload.body?.data;
      if (data) {
        return Buffer.from(data, 'base64url').toString('utf-8');
      }
    }

    for (const part of payload.parts ?? []) {
      const body = this.extractBody(part);
      if (body) return body;
    }

    return '';
  }

  private extractAttachments(payload: gmail_v1.Schema$MessagePart): AttachmentMeta[] {
    const attachments: AttachmentMeta[] = [];

    for (const part of payload.parts ?? []) {
      if (part.filename) {
        attachments.push({
          attachmentId: part.body?.attachmentId ?? '',
          filename: part.filename,
          mimeType: part.mimeType ?? '',
          size: part.body?.size ?? 0,
        });
      }
      if (part.parts) {
        attachments.push(...this.extractAttachments(part));
      }
    }

    return attachments;
  }

  // =================================================================
  // Core operations
  // =================================================================

  async searchEmails(query = '', maxResults = 20): Promise<ParsedEmail[]> {
    const result = await this.gmail.users.messages.list({
      userId: 'me',
      q: query || undefined,
      maxResults: Math.min(maxResults, 500),
    });

    const messages = result.data.messages ?? [];
    if (messages.length === 0) return [];

    const emails: ParsedEmail[] = [];
    for (const msgRef of messages) {
      const msg = await this.gmail.users.messages.get({
        userId: 'me',
        id: msgRef.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Cc', 'Date'],
      });
      emails.push(this.parseMessage(msg.data) as ParsedEmail);
    }

    return emails;
  }

  async getEmail(emailId: string): Promise<ParsedEmailFull> {
    const msg = await this.gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full',
    });
    return this.parseMessage(msg.data, true) as ParsedEmailFull;
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    cc?: string,
  ): Promise<{ id: string; status: string }> {
    const raw = buildRawEmail(to, subject, body, cc);
    const sent = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return { id: sent.data.id ?? '', status: 'sent' };
  }

  async reply(
    messageId: string,
    replyBody: string,
    send = false,
    cc?: string,
  ): Promise<{ id: string; status: string }> {
    const original = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'To', 'Message-ID', 'References', 'In-Reply-To'],
    });

    const headers: Record<string, string> = {};
    for (const h of original.data.payload?.headers ?? []) {
      if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
    }

    let subject = headers['subject'] ?? '';
    if (!subject.toLowerCase().startsWith('re:')) subject = `Re: ${subject}`;

    const raw = buildRawEmail(
      headers['from'] ?? '',
      subject,
      replyBody,
      cc,
      headers['message-id'],
      headers['references'] ?? headers['message-id'],
    );

    if (send) {
      const sent = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw, threadId: original.data.threadId ?? undefined },
      });
      return { id: sent.data.id ?? '', status: 'sent' };
    } else {
      const draft = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: { message: { raw, threadId: original.data.threadId ?? undefined } },
      });
      return { id: draft.data.id ?? '', status: 'draft' };
    }
  }

  async createDraft(
    to: string,
    subject: string,
    body: string,
    cc?: string,
  ): Promise<{ id: string; messageId: string }> {
    const raw = buildRawEmail(to, subject, body, cc);
    const draft = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: { message: { raw } },
    });
    return {
      id: draft.data.id ?? '',
      messageId: draft.data.message?.id ?? '',
    };
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    await this.gmail.users.drafts.delete({ userId: 'me', id: draftId });
    return true;
  }

  async listLabels(): Promise<Label[]> {
    const result = await this.gmail.users.labels.list({ userId: 'me' });
    return (result.data.labels ?? []).map((l) => ({
      id: l.id ?? '',
      name: l.name ?? '',
      type: l.type ?? '',
    }));
  }

  async listThreads(query = '', maxResults = 10): Promise<ThreadSummary[]> {
    const result = await this.gmail.users.threads.list({
      userId: 'me',
      q: query || undefined,
      maxResults: Math.min(maxResults, 500),
    });

    return (result.data.threads ?? []).map((t) => ({
      id: t.id ?? '',
      snippet: t.snippet ?? '',
      historyId: t.historyId ?? '',
      messagesCount: 0, // Not available in list response
    }));
  }

  async getThread(threadId: string): Promise<{ id: string; messages: ParsedEmailFull[] }> {
    const result = await this.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    return {
      id: result.data.id ?? '',
      messages: (result.data.messages ?? []).map(
        (m) => this.parseMessage(m, true) as ParsedEmailFull,
      ),
    };
  }

  async getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<{ data: string; size: number }> {
    const att = await this.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });
    return {
      data: att.data.data ?? '',
      size: att.data.size ?? 0,
    };
  }

  // =================================================================
  // Label Management
  // =================================================================

  async createLabel(
    name: string,
    labelListVisibility: string = 'labelShow',
    messageListVisibility: string = 'show',
  ): Promise<Label> {
    const res = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: { name, labelListVisibility, messageListVisibility },
    });
    return {
      id: res.data.id ?? '',
      name: res.data.name ?? '',
      type: res.data.type ?? '',
    };
  }

  async updateLabel(
    labelId: string,
    name?: string,
    labelListVisibility?: string,
    messageListVisibility?: string,
  ): Promise<Label> {
    const requestBody: Record<string, string> = {};
    if (name) requestBody.name = name;
    if (labelListVisibility) requestBody.labelListVisibility = labelListVisibility;
    if (messageListVisibility) requestBody.messageListVisibility = messageListVisibility;

    const res = await this.gmail.users.labels.update({
      userId: 'me',
      id: labelId,
      requestBody,
    });
    return {
      id: res.data.id ?? '',
      name: res.data.name ?? '',
      type: res.data.type ?? '',
    };
  }

  async deleteLabel(labelId: string): Promise<void> {
    await this.gmail.users.labels.delete({ userId: 'me', id: labelId });
  }

  async modifyLabels(
    messageIds: string[],
    addLabelIds: string[] = [],
    removeLabelIds: string[] = [],
  ): Promise<void> {
    for (const messageId of messageIds) {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { addLabelIds, removeLabelIds },
      });
    }
  }

  // =================================================================
  // Batch Operations
  // =================================================================

  async batchModify(
    messageIds: string[],
    addLabelIds: string[] = [],
    removeLabelIds: string[] = [],
  ): Promise<{ modified: number }> {
    await this.gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: { ids: messageIds, addLabelIds, removeLabelIds },
    });
    return { modified: messageIds.length };
  }

  // =================================================================
  // Attachment Download
  // =================================================================

  async downloadAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<{ filename: string; mimeType: string; size: number; data: string }> {
    const att = await this.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    // Get the message to find filename and mimeType from parts
    const msg = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    let filename = 'attachment';
    let mimeType = 'application/octet-stream';

    const findAttachment = (parts: gmail_v1.Schema$MessagePart[]): void => {
      for (const part of parts) {
        if (part.body?.attachmentId === attachmentId) {
          filename = part.filename ?? 'attachment';
          mimeType = part.mimeType ?? 'application/octet-stream';
          return;
        }
        if (part.parts) {
          findAttachment(part.parts);
        }
      }
    };

    if (msg.data.payload?.parts) {
      findAttachment(msg.data.payload.parts);
    }

    return {
      filename,
      mimeType,
      size: att.data.size ?? 0,
      data: att.data.data ?? '',
    };
  }

  // =================================================================
  // Vacation / Out-of-Office Settings
  // =================================================================

  async getVacation(): Promise<{
    enableAutoReply: boolean;
    responseSubject: string;
    responseBodyPlainText: string;
    startTime?: string;
    endTime?: string;
  }> {
    const res = await this.gmail.users.settings.getVacation({ userId: 'me' });
    return {
      enableAutoReply: res.data.enableAutoReply ?? false,
      responseSubject: res.data.responseSubject ?? '',
      responseBodyPlainText: res.data.responseBodyPlainText ?? '',
      startTime: res.data.startTime
        ? new Date(Number(res.data.startTime)).toISOString()
        : undefined,
      endTime: res.data.endTime ? new Date(Number(res.data.endTime)).toISOString() : undefined,
    };
  }

  async setVacation(settings: {
    enableAutoReply: boolean;
    responseSubject?: string;
    responseBodyPlainText?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<{ enableAutoReply: boolean; responseSubject: string }> {
    const requestBody: Record<string, unknown> = {
      enableAutoReply: settings.enableAutoReply,
    };
    if (settings.responseSubject) requestBody.responseSubject = settings.responseSubject;
    if (settings.responseBodyPlainText)
      requestBody.responseBodyPlainText = settings.responseBodyPlainText;
    if (settings.startTime) requestBody.startTime = String(new Date(settings.startTime).getTime());
    if (settings.endTime) requestBody.endTime = String(new Date(settings.endTime).getTime());

    const res = await this.gmail.users.settings.updateVacation({
      userId: 'me',
      requestBody,
    });
    return {
      enableAutoReply: res.data.enableAutoReply ?? false,
      responseSubject: res.data.responseSubject ?? '',
    };
  }
}

// =====================================================================
// Helpers
// =====================================================================

function buildRawEmail(
  to: string,
  subject: string,
  body: string,
  cc?: string,
  inReplyTo?: string,
  references?: string,
): string {
  const lines: string[] = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
  ];

  if (cc) lines.push(`Cc: ${cc}`);
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);

  lines.push('', body);

  const raw = lines.join('\r\n');
  return Buffer.from(raw).toString('base64url');
}
