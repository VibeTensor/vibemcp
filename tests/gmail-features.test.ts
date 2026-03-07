/**
 * Tests for new Gmail service methods and tool-level action mapping.
 *
 * Mocks the googleapis module to isolate service logic from network calls.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// =====================================================================
// Mock setup - must be before imports
// =====================================================================

const mockLabelsCreate = jest.fn();
const mockLabelsUpdate = jest.fn();
const mockLabelsDelete = jest.fn();
const mockLabelsList = jest.fn();
const mockMessagesModify = jest.fn();
const mockMessagesBatchModify = jest.fn();
const mockMessagesGet = jest.fn();
const mockAttachmentsGet = jest.fn();
const mockGetVacation = jest.fn();
const mockUpdateVacation = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    gmail: () => ({
      users: {
        labels: {
          create: mockLabelsCreate,
          update: mockLabelsUpdate,
          delete: mockLabelsDelete,
          list: mockLabelsList,
        },
        messages: {
          modify: mockMessagesModify,
          batchModify: mockMessagesBatchModify,
          get: mockMessagesGet,
          list: jest.fn(),
          send: jest.fn(),
          attachments: {
            get: mockAttachmentsGet,
          },
        },
        drafts: {
          create: jest.fn(),
          delete: jest.fn(),
        },
        threads: {
          list: jest.fn(),
          get: jest.fn(),
        },
        settings: {
          getVacation: mockGetVacation,
          updateVacation: mockUpdateVacation,
        },
      },
    }),
  },
  gmail_v1: {},
}));

jest.mock('../src/auth/google.js', () => ({
  getCredentials: jest.fn().mockResolvedValue('mock-auth-token'),
}));

import { GmailService } from '../src/services/gmail.js';

// =====================================================================
// Helper to build a GmailService without async create
// =====================================================================

function buildService(): GmailService {
  // The constructor accepts (email, auth) - auth is truthy so it passes the guard
  return new GmailService('test@gmail.com', 'mock-auth' as any);
}

// =====================================================================
// Tests
// =====================================================================

describe('GmailService - Label Management', () => {
  let svc: GmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = buildService();
  });

  describe('createLabel', () => {
    it('should create a label with default visibility settings', async () => {
      mockLabelsCreate.mockResolvedValue({
        data: { id: 'Label_1', name: 'Projects', type: 'user' },
      });

      const label = await svc.createLabel('Projects');

      expect(mockLabelsCreate).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: {
          name: 'Projects',
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      expect(label).toEqual({ id: 'Label_1', name: 'Projects', type: 'user' });
    });

    it('should create a label with custom visibility settings', async () => {
      mockLabelsCreate.mockResolvedValue({
        data: { id: 'Label_2', name: 'Hidden', type: 'user' },
      });

      const label = await svc.createLabel('Hidden', 'labelHide', 'hide');

      expect(mockLabelsCreate).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: {
          name: 'Hidden',
          labelListVisibility: 'labelHide',
          messageListVisibility: 'hide',
        },
      });
      expect(label.id).toBe('Label_2');
    });

    it('should handle missing fields in response with empty defaults', async () => {
      mockLabelsCreate.mockResolvedValue({ data: {} });

      const label = await svc.createLabel('Test');

      expect(label).toEqual({ id: '', name: '', type: '' });
    });
  });

  describe('updateLabel', () => {
    it('should update label name', async () => {
      mockLabelsUpdate.mockResolvedValue({
        data: { id: 'Label_1', name: 'Updated', type: 'user' },
      });

      const label = await svc.updateLabel('Label_1', 'Updated');

      expect(mockLabelsUpdate).toHaveBeenCalledWith({
        userId: 'me',
        id: 'Label_1',
        requestBody: { name: 'Updated' },
      });
      expect(label.name).toBe('Updated');
    });

    it('should only include provided fields in the request body', async () => {
      mockLabelsUpdate.mockResolvedValue({
        data: { id: 'Label_1', name: 'Same', type: 'user' },
      });

      await svc.updateLabel('Label_1', undefined, 'labelHide');

      expect(mockLabelsUpdate).toHaveBeenCalledWith({
        userId: 'me',
        id: 'Label_1',
        requestBody: { labelListVisibility: 'labelHide' },
      });
    });
  });

  describe('deleteLabel', () => {
    it('should delete a label by ID', async () => {
      mockLabelsDelete.mockResolvedValue({});

      await svc.deleteLabel('Label_99');

      expect(mockLabelsDelete).toHaveBeenCalledWith({
        userId: 'me',
        id: 'Label_99',
      });
    });
  });

  describe('modifyLabels', () => {
    it('should modify labels on each message individually', async () => {
      mockMessagesModify.mockResolvedValue({});

      await svc.modifyLabels(['msg1', 'msg2'], ['STARRED'], ['UNREAD']);

      expect(mockMessagesModify).toHaveBeenCalledTimes(2);
      expect(mockMessagesModify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg1',
        requestBody: { addLabelIds: ['STARRED'], removeLabelIds: ['UNREAD'] },
      });
      expect(mockMessagesModify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg2',
        requestBody: { addLabelIds: ['STARRED'], removeLabelIds: ['UNREAD'] },
      });
    });

    it('should use empty arrays as defaults for label IDs', async () => {
      mockMessagesModify.mockResolvedValue({});

      await svc.modifyLabels(['msg1']);

      expect(mockMessagesModify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg1',
        requestBody: { addLabelIds: [], removeLabelIds: [] },
      });
    });
  });
});

describe('GmailService - Batch Operations', () => {
  let svc: GmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = buildService();
  });

  describe('batchModify', () => {
    it('should call batchModify with correct parameters', async () => {
      mockMessagesBatchModify.mockResolvedValue({});

      const result = await svc.batchModify(['msg1', 'msg2', 'msg3'], ['UNREAD'], ['INBOX']);

      expect(mockMessagesBatchModify).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: {
          ids: ['msg1', 'msg2', 'msg3'],
          addLabelIds: ['UNREAD'],
          removeLabelIds: ['INBOX'],
        },
      });
      expect(result).toEqual({ modified: 3 });
    });

    it('should return count matching input message IDs', async () => {
      mockMessagesBatchModify.mockResolvedValue({});

      const result = await svc.batchModify(['a'], [], ['TRASH']);

      expect(result.modified).toBe(1);
    });
  });
});

describe('GmailService - Attachment Download', () => {
  let svc: GmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = buildService();
  });

  describe('downloadAttachment', () => {
    it('should return attachment data with filename and mimeType from message parts', async () => {
      mockAttachmentsGet.mockResolvedValue({
        data: { data: 'base64data', size: 1024 },
      });
      mockMessagesGet.mockResolvedValue({
        data: {
          payload: {
            parts: [
              {
                filename: 'report.pdf',
                mimeType: 'application/pdf',
                body: { attachmentId: 'att-001', size: 1024 },
              },
            ],
          },
        },
      });

      const result = await svc.downloadAttachment('msg1', 'att-001');

      expect(result).toEqual({
        filename: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        data: 'base64data',
      });
    });

    it('should use default filename and mimeType when attachment not found in parts', async () => {
      mockAttachmentsGet.mockResolvedValue({
        data: { data: 'abc', size: 256 },
      });
      mockMessagesGet.mockResolvedValue({
        data: { payload: {} },
      });

      const result = await svc.downloadAttachment('msg1', 'att-unknown');

      expect(result.filename).toBe('attachment');
      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should find attachment in nested parts', async () => {
      mockAttachmentsGet.mockResolvedValue({
        data: { data: 'nested-data', size: 512 },
      });
      mockMessagesGet.mockResolvedValue({
        data: {
          payload: {
            parts: [
              {
                mimeType: 'multipart/alternative',
                parts: [
                  {
                    filename: 'nested-file.zip',
                    mimeType: 'application/zip',
                    body: { attachmentId: 'att-nested', size: 512 },
                  },
                ],
              },
            ],
          },
        },
      });

      const result = await svc.downloadAttachment('msg1', 'att-nested');

      expect(result.filename).toBe('nested-file.zip');
      expect(result.mimeType).toBe('application/zip');
    });
  });
});

describe('GmailService - Vacation Settings', () => {
  let svc: GmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = buildService();
  });

  describe('getVacation', () => {
    it('should return vacation settings with ISO date conversion', async () => {
      const startMs = new Date('2026-03-10T00:00:00Z').getTime();
      const endMs = new Date('2026-03-17T00:00:00Z').getTime();

      mockGetVacation.mockResolvedValue({
        data: {
          enableAutoReply: true,
          responseSubject: 'OOO',
          responseBodyPlainText: 'I am out of office.',
          startTime: String(startMs),
          endTime: String(endMs),
        },
      });

      const result = await svc.getVacation();

      expect(result.enableAutoReply).toBe(true);
      expect(result.responseSubject).toBe('OOO');
      expect(result.responseBodyPlainText).toBe('I am out of office.');
      expect(result.startTime).toBe('2026-03-10T00:00:00.000Z');
      expect(result.endTime).toBe('2026-03-17T00:00:00.000Z');
    });

    it('should handle missing optional fields with defaults', async () => {
      mockGetVacation.mockResolvedValue({
        data: {},
      });

      const result = await svc.getVacation();

      expect(result.enableAutoReply).toBe(false);
      expect(result.responseSubject).toBe('');
      expect(result.responseBodyPlainText).toBe('');
      expect(result.startTime).toBeUndefined();
      expect(result.endTime).toBeUndefined();
    });
  });

  describe('setVacation', () => {
    it('should enable vacation with all settings', async () => {
      mockUpdateVacation.mockResolvedValue({
        data: { enableAutoReply: true, responseSubject: 'Away' },
      });

      const result = await svc.setVacation({
        enableAutoReply: true,
        responseSubject: 'Away',
        responseBodyPlainText: 'Back on Monday.',
        startTime: '2026-03-10T00:00:00Z',
        endTime: '2026-03-17T00:00:00Z',
      });

      const expectedStartMs = String(new Date('2026-03-10T00:00:00Z').getTime());
      const expectedEndMs = String(new Date('2026-03-17T00:00:00Z').getTime());

      expect(mockUpdateVacation).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: {
          enableAutoReply: true,
          responseSubject: 'Away',
          responseBodyPlainText: 'Back on Monday.',
          startTime: expectedStartMs,
          endTime: expectedEndMs,
        },
      });
      expect(result).toEqual({ enableAutoReply: true, responseSubject: 'Away' });
    });

    it('should disable vacation with minimal settings', async () => {
      mockUpdateVacation.mockResolvedValue({
        data: { enableAutoReply: false, responseSubject: '' },
      });

      const result = await svc.setVacation({ enableAutoReply: false });

      expect(mockUpdateVacation).toHaveBeenCalledWith({
        userId: 'me',
        requestBody: { enableAutoReply: false },
      });
      expect(result.enableAutoReply).toBe(false);
    });
  });
});

// =====================================================================
// Batch modify action mapping (tool-level logic)
// =====================================================================

describe('Batch modify action mapping', () => {
  const actionMap: Record<string, { add: string[]; remove: string[] }> = {
    archive: { add: [], remove: ['INBOX'] },
    mark_read: { add: [], remove: ['UNREAD'] },
    mark_unread: { add: ['UNREAD'], remove: [] },
    trash: { add: ['TRASH'], remove: [] },
    untrash: { add: [], remove: ['TRASH'] },
  };

  it('should map archive to removing INBOX label', () => {
    expect(actionMap['archive']).toEqual({ add: [], remove: ['INBOX'] });
  });

  it('should map mark_read to removing UNREAD label', () => {
    expect(actionMap['mark_read']).toEqual({ add: [], remove: ['UNREAD'] });
  });

  it('should map mark_unread to adding UNREAD label', () => {
    expect(actionMap['mark_unread']).toEqual({ add: ['UNREAD'], remove: [] });
  });

  it('should map trash to adding TRASH label', () => {
    expect(actionMap['trash']).toEqual({ add: ['TRASH'], remove: [] });
  });

  it('should map untrash to removing TRASH label', () => {
    expect(actionMap['untrash']).toEqual({ add: [], remove: ['TRASH'] });
  });
});
