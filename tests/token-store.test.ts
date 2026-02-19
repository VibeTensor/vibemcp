/**
 * Token store (auth/store.ts) tests
 *
 * Uses real fs with temp files to test read/write/delete operations.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readTokenFile, writeTokenFile, deleteTokenFile } from '../src/auth/store.js';

describe('token store', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibemcp-test-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readTokenFile', () => {
    it('should return null if file does not exist', () => {
      expect(readTokenFile(path.join(tmpDir, 'nonexistent.json'))).toBeNull();
    });

    it('should return parsed JSON when file exists', () => {
      const filePath = path.join(tmpDir, 'valid.json');
      const tokenData = { access_token: 'abc123', refresh_token: 'xyz789' };
      fs.writeFileSync(filePath, JSON.stringify(tokenData));

      const result = readTokenFile(filePath);
      expect(result).toEqual(tokenData);
    });

    it('should return null if file contains invalid JSON', () => {
      const filePath = path.join(tmpDir, 'invalid.json');
      fs.writeFileSync(filePath, 'not valid json');

      expect(readTokenFile(filePath)).toBeNull();
    });
  });

  describe('writeTokenFile', () => {
    it('should write JSON with pretty formatting', () => {
      const filePath = path.join(tmpDir, 'write-test.json');
      const tokenData = { access_token: 'abc', refresh_token: 'xyz' };

      writeTokenFile(filePath, tokenData);

      const raw = fs.readFileSync(filePath, 'utf-8');
      expect(JSON.parse(raw)).toEqual(tokenData);
      // Should be pretty-printed (contains newlines)
      expect(raw).toContain('\n');
    });

    it('should overwrite existing file', () => {
      const filePath = path.join(tmpDir, 'overwrite.json');
      writeTokenFile(filePath, { old: 'data' });
      writeTokenFile(filePath, { new: 'data' });

      const result = readTokenFile(filePath);
      expect(result).toEqual({ new: 'data' });
    });
  });

  describe('deleteTokenFile', () => {
    it('should delete file and return true if exists', () => {
      const filePath = path.join(tmpDir, 'to-delete.json');
      fs.writeFileSync(filePath, '{}');

      expect(deleteTokenFile(filePath)).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should return false if file does not exist', () => {
      expect(deleteTokenFile(path.join(tmpDir, 'already-gone.json'))).toBe(false);
    });
  });
});
