/**
 * @fileoverview Tests for config module
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadConfig, resolveEnv } from '../../src/core/config.js';

describe('Config', () => {
  describe('loadConfig', () => {
    it('should return default config when no file exists', async () => {
      const config = await loadConfig('/nonexistent/path.json');
      assert.ok(config);
      assert.strictEqual(config.typesFormat, 'jsdoc');
    });
  });

  describe('resolveEnv', () => {
    it('should return URL unchanged when no env matches', () => {
      const config = { environments: {} };
      const result = resolveEnv('https://api.example.com/users', 'staging', config);
      assert.strictEqual(result, 'https://api.example.com/users');
    });
  });
});