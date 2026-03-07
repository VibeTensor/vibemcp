/**
 * Tests for the Contacts module - services and provider detection.
 *
 * Mocks auth modules to avoid ESM compatibility issues with the 'open' package
 * and to prevent real credential lookups during testing.
 */

// Mock auth modules before any imports that depend on them
jest.mock('../src/auth/google.js', () => ({
  getCredentials: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/auth/microsoft.js', () => ({
  getTokenForAccount: jest.fn().mockResolvedValue(null),
}));

// Mock config to return empty accounts (avoids reading real accounts.json)
jest.mock('../src/config.js', () => ({
  loadAccounts: jest.fn(() => ({
    google_accounts: [],
    microsoft_accounts: [],
  })),
  CONFIG_DIR: '/tmp/test-vibemcp',
  ACCOUNTS_FILE: '/tmp/test-vibemcp/accounts.json',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_SCOPES: [],
  GOOGLE_OAUTH_PORT: 4100,
  AZURE_CLIENT_ID: '',
  AZURE_TENANT_ID: 'common',
  MS_TOKEN_CACHE_PATH: '/tmp/test-vibemcp/ms-token-cache.json',
  MS_SCOPES: [],
  MS_SCOPES_BASE: [],
  MS_SCOPES_PERSONAL: [],
  MS_SCOPES_TEAMS: [],
  DEFAULT_OUTPUT_FORMAT: 'toon',
  PROJECT_DIR: '/tmp/test-vibemcp',
}));

import { GoogleContactsService } from '../src/services/google-contacts.js';
import { MicrosoftContactsService } from '../src/services/ms-contacts.js';
import { detectProvider } from '../src/tools/contacts.js';
import { formatOutput } from '../src/toon/encoder.js';
import { loadAccounts } from '../src/config.js';

// =====================================================================
// GoogleContactsService.formatContact tests
// =====================================================================

describe('GoogleContactsService.formatContact', () => {
  const formatContact = GoogleContactsService.prototype.formatContact;

  it('should extract email, name, and photoUrl from a person object', () => {
    const person = {
      names: [{ displayName: 'Alice Smith' }],
      emailAddresses: [{ value: 'alice@example.com' }],
      photos: [{ url: 'https://photos.example.com/alice.jpg' }],
    };
    const result = formatContact(person);
    expect(result).toEqual({
      email: 'alice@example.com',
      name: 'Alice Smith',
      photoUrl: 'https://photos.example.com/alice.jpg',
    });
  });

  it('should handle missing names gracefully', () => {
    const person = {
      emailAddresses: [{ value: 'noname@example.com' }],
    };
    const result = formatContact(person);
    expect(result.email).toBe('noname@example.com');
    expect(result.name).toBe('');
    expect(result.photoUrl).toBe('');
  });

  it('should handle missing emails gracefully', () => {
    const person = {
      names: [{ displayName: 'No Email Person' }],
    };
    const result = formatContact(person);
    expect(result.email).toBe('');
    expect(result.name).toBe('No Email Person');
  });

  it('should handle completely empty person object', () => {
    const result = formatContact({});
    expect(result).toEqual({ email: '', name: '', photoUrl: '' });
  });

  it('should use the first email when multiple are present', () => {
    const person = {
      emailAddresses: [
        { value: 'primary@example.com' },
        { value: 'secondary@example.com' },
      ],
    };
    const result = formatContact(person);
    expect(result.email).toBe('primary@example.com');
  });
});

// =====================================================================
// MicrosoftContactsService.formatContact tests
// =====================================================================

describe('MicrosoftContactsService.formatContact', () => {
  const formatContact = MicrosoftContactsService.prototype.formatContact;

  it('should extract email, name, jobTitle, and department', () => {
    const contact = {
      displayName: 'Bob Jones',
      emailAddresses: [{ address: 'bob@company.com' }],
      jobTitle: 'Engineer',
      department: 'Engineering',
    };
    const result = formatContact(contact);
    expect(result).toEqual({
      email: 'bob@company.com',
      name: 'Bob Jones',
      jobTitle: 'Engineer',
      department: 'Engineering',
    });
  });

  it('should fall back to scoredEmailAddresses when emailAddresses is empty', () => {
    const contact = {
      displayName: 'Carol White',
      scoredEmailAddresses: [{ address: 'carol@org.com' }],
    };
    const result = formatContact(contact);
    expect(result.email).toBe('carol@org.com');
    expect(result.name).toBe('Carol White');
  });

  it('should prefer emailAddresses over scoredEmailAddresses', () => {
    const contact = {
      displayName: 'Dave Brown',
      emailAddresses: [{ address: 'dave-primary@org.com' }],
      scoredEmailAddresses: [{ address: 'dave-scored@org.com' }],
    };
    const result = formatContact(contact);
    expect(result.email).toBe('dave-primary@org.com');
  });

  it('should handle missing fields gracefully', () => {
    const contact = {};
    const result = formatContact(contact);
    expect(result).toEqual({
      email: '',
      name: '',
      jobTitle: '',
      department: '',
    });
  });

  it('should handle null-ish jobTitle and department', () => {
    const contact = {
      displayName: 'Eve Gray',
      emailAddresses: [{ address: 'eve@test.com' }],
      jobTitle: null,
      department: undefined,
    };
    const result = formatContact(contact);
    expect(result.name).toBe('Eve Gray');
    expect(result.email).toBe('eve@test.com');
    expect(result.jobTitle).toBe('');
    expect(result.department).toBe('');
  });
});

// =====================================================================
// Provider detection tests
// =====================================================================

describe('detectProvider', () => {
  beforeEach(() => {
    // Reset to empty accounts for domain-based heuristic tests
    (loadAccounts as jest.Mock).mockReturnValue({
      google_accounts: [],
      microsoft_accounts: [],
    });
  });

  it('should detect gmail.com as google', () => {
    expect(detectProvider('user@gmail.com')).toBe('google');
  });

  it('should detect googlemail.com as google', () => {
    expect(detectProvider('user@googlemail.com')).toBe('google');
  });

  it('should default to microsoft for unknown domains', () => {
    expect(detectProvider('user@company.com')).toBe('microsoft');
  });

  it('should default to microsoft for hotmail.com', () => {
    expect(detectProvider('user@hotmail.com')).toBe('microsoft');
  });

  it('should default to microsoft for outlook.com', () => {
    expect(detectProvider('user@outlook.com')).toBe('microsoft');
  });

  it('should detect google from accounts registry', () => {
    (loadAccounts as jest.Mock).mockReturnValue({
      google_accounts: [{ email: 'user@custom-domain.com', accountType: 'workspace', extraInfo: '' }],
      microsoft_accounts: [],
    });
    expect(detectProvider('user@custom-domain.com')).toBe('google');
  });

  it('should detect microsoft from accounts registry', () => {
    (loadAccounts as jest.Mock).mockReturnValue({
      google_accounts: [],
      microsoft_accounts: [{ email: 'user@custom-domain.com', accountType: 'business', extraInfo: '' }],
    });
    expect(detectProvider('user@custom-domain.com')).toBe('microsoft');
  });
});

// =====================================================================
// TOON output format for contacts
// =====================================================================

describe('TOON output for contacts', () => {
  it('should produce valid TOON header and rows for Google contacts', () => {
    const contacts = [
      { email: 'alice@example.com', name: 'Alice', photoUrl: 'https://photo.url/a' },
      { email: 'bob@example.com', name: 'Bob', photoUrl: '' },
    ];
    const result = formatOutput(contacts, 'toon', 'contacts', ['email', 'name']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('contacts[2]{email,name}');
    expect(lines[1]).toBe('alice@example.com\tAlice');
    expect(lines[2]).toBe('bob@example.com\tBob');
  });

  it('should produce valid TOON header and rows for MS contacts', () => {
    const contacts = [
      { email: 'carol@corp.com', name: 'Carol', jobTitle: 'CEO', department: 'Executive' },
    ];
    const result = formatOutput(contacts, 'toon', 'contacts', ['email', 'name']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('contacts[1]{email,name}');
    expect(lines[1]).toBe('carol@corp.com\tCarol');
  });

  it('should handle empty contact list', () => {
    const result = formatOutput([], 'toon', 'contacts', ['email', 'name']);
    expect(result).toBe('contacts[0]{}');
  });

  it('should produce valid JSON when json format is requested', () => {
    const contacts = [
      { email: 'test@example.com', name: 'Test User', photoUrl: '' },
    ];
    const result = formatOutput(contacts, 'json', 'contacts');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(contacts);
  });
});

// =====================================================================
// Email resolution with empty results
// =====================================================================

describe('email resolution with empty results', () => {
  it('should format unresolved contacts with empty name in TOON', () => {
    // Simulates what resolveEmails returns when no contact is found
    const unresolvedResults = [
      { email: 'unknown@example.com', name: '', photoUrl: '' },
      { email: 'also-unknown@example.com', name: '', photoUrl: '' },
    ];
    const result = formatOutput(unresolvedResults, 'toon', 'contacts', ['email', 'name']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('contacts[2]{email,name}');
    // Empty name should be rendered as empty quoted string
    expect(lines[1]).toBe('unknown@example.com\t""');
    expect(lines[2]).toBe('also-unknown@example.com\t""');
  });

  it('should format mixed resolved and unresolved contacts', () => {
    const mixedResults = [
      { email: 'known@example.com', name: 'Known User', photoUrl: '' },
      { email: 'unknown@example.com', name: '', photoUrl: '' },
    ];
    const result = formatOutput(mixedResults, 'toon', 'contacts', ['email', 'name']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('contacts[2]{email,name}');
    expect(lines[1]).toBe('known@example.com\tKnown User');
    expect(lines[2]).toBe('unknown@example.com\t""');
  });
});
