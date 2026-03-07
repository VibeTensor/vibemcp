/**
 * Tests for new Outlook / Microsoft Mail service methods.
 *
 * Mocks the global fetch to simulate Graph API responses
 * without requiring real credentials.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { MicrosoftMailService } from '../src/services/ms-mail.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a MicrosoftMailService with a fake token by reaching into the
 * private constructor via Object.create + manual assignment.
 */
function buildService(): MicrosoftMailService {
  const svc = Object.create(MicrosoftMailService.prototype) as MicrosoftMailService;
  (svc as any).token = 'fake-token';
  return svc;
}

/**
 * Install a mock for globalThis.fetch that resolves with the given body.
 * Returns the mock so callers can inspect call args.
 */
function mockFetch(body: unknown, status = 200): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body ? JSON.stringify(body) : ''),
  });
  globalThis.fetch = mock as any;
  return mock;
}

/**
 * Install a mock that returns different responses for successive calls.
 */
function mockFetchSequence(responses: Array<{ body: unknown; status?: number }>): jest.Mock {
  const mock = jest.fn();
  for (const resp of responses) {
    const st = resp.status ?? 200;
    mock.mockResolvedValueOnce({
      ok: st >= 200 && st < 300,
      status: st,
      json: async () => resp.body,
      text: async () => (resp.body ? JSON.stringify(resp.body) : ''),
    });
  }
  globalThis.fetch = mock as any;
  return mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MicrosoftMailService - new features', () => {
  let svc: MicrosoftMailService;

  beforeEach(() => {
    svc = buildService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // === Categories ===

  describe('listCategories', () => {
    it('should return parsed categories from Graph API', async () => {
      mockFetch({
        value: [
          { id: 'cat-1', displayName: 'Important', color: 'preset0' },
          { id: 'cat-2', displayName: 'Work', color: 'preset1' },
        ],
      });

      const result = await svc.listCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'cat-1', displayName: 'Important', color: 'preset0' });
      expect(result[1]).toEqual({ id: 'cat-2', displayName: 'Work', color: 'preset1' });
    });

    it('should return empty array when no categories exist', async () => {
      mockFetch({ value: [] });

      const result = await svc.listCategories();

      expect(result).toEqual([]);
    });

    it('should call the correct endpoint', async () => {
      const mock = mockFetch({ value: [] });

      await svc.listCategories();

      expect(mock).toHaveBeenCalledTimes(1);
      const url = mock.mock.calls[0][0] as string;
      expect(url).toContain('/me/outlook/masterCategories');
    });
  });

  describe('setMessageCategories', () => {
    it('should PATCH the message with the given categories', async () => {
      const mock = mockFetch({});

      await svc.setMessageCategories('msg-123', ['Important', 'Work']);

      expect(mock).toHaveBeenCalledTimes(1);
      const [url, opts] = mock.mock.calls[0];
      expect(url).toContain('/me/messages/msg-123');
      expect(opts.method).toBe('PATCH');
      expect(JSON.parse(opts.body)).toEqual({ categories: ['Important', 'Work'] });
    });
  });

  // === Follow-up Flags ===

  describe('setMessageFlag', () => {
    it('should set a flagged status without due date', async () => {
      const mock = mockFetch({});

      await svc.setMessageFlag('msg-456', 'flagged');

      const body = JSON.parse(mock.mock.calls[0][1].body);
      expect(body).toEqual({ flag: { flagStatus: 'flagged' } });
    });

    it('should set a flagged status with due date', async () => {
      const mock = mockFetch({});

      await svc.setMessageFlag('msg-456', 'flagged', '2026-04-01T00:00:00Z');

      const body = JSON.parse(mock.mock.calls[0][1].body);
      expect(body).toEqual({
        flag: {
          flagStatus: 'flagged',
          dueDateTime: { dateTime: '2026-04-01T00:00:00Z', timeZone: 'UTC' },
        },
      });
    });

    it('should set notFlagged status and ignore due date', async () => {
      const mock = mockFetch({});

      await svc.setMessageFlag('msg-456', 'notFlagged', '2026-04-01T00:00:00Z');

      const body = JSON.parse(mock.mock.calls[0][1].body);
      expect(body).toEqual({ flag: { flagStatus: 'notFlagged' } });
    });

    it('should set complete status', async () => {
      const mock = mockFetch({});

      await svc.setMessageFlag('msg-456', 'complete');

      const body = JSON.parse(mock.mock.calls[0][1].body);
      expect(body).toEqual({ flag: { flagStatus: 'complete' } });
    });
  });

  // === Batch Update ===

  describe('batchUpdate', () => {
    it('should mark messages as read', async () => {
      const mock = mockFetch({});

      const result = await svc.batchUpdate(['m1', 'm2', 'm3'], { isRead: true });

      expect(result).toEqual({ updated: 3 });
      expect(mock).toHaveBeenCalledTimes(3);

      for (let i = 0; i < 3; i++) {
        const [url, opts] = mock.mock.calls[i];
        expect(url).toContain(`/me/messages/m${i + 1}`);
        expect(opts.method).toBe('PATCH');
        expect(JSON.parse(opts.body)).toEqual({ isRead: true });
      }
    });

    it('should move messages when destinationId is provided', async () => {
      const mock = mockFetch({});

      const result = await svc.batchUpdate(['m1', 'm2'], { destinationId: 'folder-archive' });

      expect(result).toEqual({ updated: 2 });
      expect(mock).toHaveBeenCalledTimes(2);

      for (let i = 0; i < 2; i++) {
        const [url, opts] = mock.mock.calls[i];
        expect(url).toContain(`/me/messages/m${i + 1}/move`);
        expect(opts.method).toBe('POST');
        expect(JSON.parse(opts.body)).toEqual({ destinationId: 'folder-archive' });
      }
    });

    it('should set categories on messages', async () => {
      const mock = mockFetch({});

      const result = await svc.batchUpdate(['m1'], { categories: ['Urgent'] });

      expect(result).toEqual({ updated: 1 });
      const body = JSON.parse(mock.mock.calls[0][1].body);
      expect(body).toEqual({ categories: ['Urgent'] });
    });
  });

  // === Attachments ===

  describe('listAttachments', () => {
    it('should return parsed attachment metadata', async () => {
      mockFetch({
        value: [
          { id: 'att-1', name: 'report.pdf', contentType: 'application/pdf', size: 12345 },
          { id: 'att-2', name: 'image.png', contentType: 'image/png', size: 67890 },
        ],
      });

      const result = await svc.listAttachments('msg-789');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'att-1',
        name: 'report.pdf',
        contentType: 'application/pdf',
        size: 12345,
      });
      expect(result[1]).toEqual({
        id: 'att-2',
        name: 'image.png',
        contentType: 'image/png',
        size: 67890,
      });
    });

    it('should call the correct endpoint', async () => {
      const mock = mockFetch({ value: [] });

      await svc.listAttachments('msg-789');

      const url = mock.mock.calls[0][0] as string;
      expect(url).toContain('/me/messages/msg-789/attachments');
    });

    it('should return empty array when no attachments exist', async () => {
      mockFetch({ value: [] });

      const result = await svc.listAttachments('msg-789');

      expect(result).toEqual([]);
    });
  });

  describe('downloadAttachment', () => {
    it('should return attachment with content bytes', async () => {
      mockFetch({
        id: 'att-1',
        name: 'report.pdf',
        contentType: 'application/pdf',
        size: 12345,
        contentBytes: 'base64encodedcontent',
      });

      const result = await svc.downloadAttachment('msg-789', 'att-1');

      expect(result).toEqual({
        id: 'att-1',
        name: 'report.pdf',
        contentType: 'application/pdf',
        size: 12345,
        contentBytes: 'base64encodedcontent',
      });
    });

    it('should call the correct endpoint', async () => {
      const mock = mockFetch({
        id: 'att-1',
        name: 'file.txt',
        contentType: 'text/plain',
        size: 100,
        contentBytes: '',
      });

      await svc.downloadAttachment('msg-789', 'att-1');

      const url = mock.mock.calls[0][0] as string;
      expect(url).toContain('/me/messages/msg-789/attachments/att-1');
    });
  });

  // === Auto-Reply / Out-of-Office ===

  describe('getAutoReply', () => {
    it('should return parsed auto-reply settings', async () => {
      mockFetch({
        status: 'alwaysEnabled',
        externalAudience: 'all',
        internalReplyMessage: 'I am out of office.',
        externalReplyMessage: 'I am currently away.',
        scheduledStartDateTime: { dateTime: '2026-03-10T08:00:00Z' },
        scheduledEndDateTime: { dateTime: '2026-03-15T17:00:00Z' },
      });

      const result = await svc.getAutoReply();

      expect(result).toEqual({
        status: 'alwaysEnabled',
        externalAudience: 'all',
        internalReplyMessage: 'I am out of office.',
        externalReplyMessage: 'I am currently away.',
        scheduledStartDateTime: '2026-03-10T08:00:00Z',
        scheduledEndDateTime: '2026-03-15T17:00:00Z',
      });
    });

    it('should handle disabled auto-reply with no scheduled dates', async () => {
      mockFetch({
        status: 'disabled',
        externalAudience: 'none',
        internalReplyMessage: '',
        externalReplyMessage: '',
      });

      const result = await svc.getAutoReply();

      expect(result.status).toBe('disabled');
      expect(result.scheduledStartDateTime).toBeUndefined();
      expect(result.scheduledEndDateTime).toBeUndefined();
    });

    it('should call the correct endpoint', async () => {
      const mock = mockFetch({
        status: 'disabled',
        externalAudience: 'none',
        internalReplyMessage: '',
        externalReplyMessage: '',
      });

      await svc.getAutoReply();

      const url = mock.mock.calls[0][0] as string;
      expect(url).toContain('/me/mailboxSettings/automaticRepliesSetting');
    });
  });

  describe('setAutoReply', () => {
    it('should configure auto-reply and return updated settings', async () => {
      // First call: PATCH to set the auto-reply
      // Second call: GET to retrieve updated settings
      const mock = mockFetchSequence([
        { body: {} },
        {
          body: {
            status: 'alwaysEnabled',
            externalAudience: 'all',
            internalReplyMessage: 'Out of office.',
            externalReplyMessage: 'Away from desk.',
          },
        },
      ]);

      const result = await svc.setAutoReply({
        status: 'alwaysEnabled',
        internalReplyMessage: 'Out of office.',
        externalReplyMessage: 'Away from desk.',
        externalAudience: 'all',
      });

      expect(result.status).toBe('alwaysEnabled');
      expect(result.internalReplyMessage).toBe('Out of office.');

      // Verify PATCH was called with correct body
      const [patchUrl, patchOpts] = mock.mock.calls[0];
      expect(patchUrl).toContain('/me/mailboxSettings');
      expect(patchOpts.method).toBe('PATCH');
      const patchBody = JSON.parse(patchOpts.body);
      expect(patchBody.automaticRepliesSetting.status).toBe('alwaysEnabled');
      expect(patchBody.automaticRepliesSetting.internalReplyMessage).toBe('Out of office.');
    });

    it('should include scheduled dates when status is scheduled', async () => {
      const mock = mockFetchSequence([
        { body: {} },
        {
          body: {
            status: 'scheduled',
            externalAudience: 'none',
            internalReplyMessage: 'On vacation.',
            externalReplyMessage: '',
            scheduledStartDateTime: { dateTime: '2026-03-20T00:00:00Z' },
            scheduledEndDateTime: { dateTime: '2026-03-25T00:00:00Z' },
          },
        },
      ]);

      await svc.setAutoReply({
        status: 'scheduled',
        internalReplyMessage: 'On vacation.',
        startDateTime: '2026-03-20T00:00:00Z',
        endDateTime: '2026-03-25T00:00:00Z',
      });

      const patchBody = JSON.parse(mock.mock.calls[0][1].body);
      const autoReply = patchBody.automaticRepliesSetting;
      expect(autoReply.status).toBe('scheduled');
      expect(autoReply.scheduledStartDateTime).toEqual({
        dateTime: '2026-03-20T00:00:00Z',
        timeZone: 'UTC',
      });
      expect(autoReply.scheduledEndDateTime).toEqual({
        dateTime: '2026-03-25T00:00:00Z',
        timeZone: 'UTC',
      });
    });

    it('should disable auto-reply', async () => {
      const mock = mockFetchSequence([
        { body: {} },
        {
          body: {
            status: 'disabled',
            externalAudience: 'none',
            internalReplyMessage: '',
            externalReplyMessage: '',
          },
        },
      ]);

      const result = await svc.setAutoReply({ status: 'disabled' });

      expect(result.status).toBe('disabled');
      const patchBody = JSON.parse(mock.mock.calls[0][1].body);
      expect(patchBody.automaticRepliesSetting.status).toBe('disabled');
    });
  });
});
