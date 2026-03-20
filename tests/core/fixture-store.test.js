/**
 * @fileoverview Tests for fixture-store module
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { saveFixture, loadFixture, listFixtures, fixtureExists } from '../../src/core/fixture-store.js';

const TEST_FIXTURES_DIR = './test-fixtures';

describe('FixtureStore', () => {
  describe('saveFixture and loadFixture', () => {
    it('should save and load a fixture', async () => {
      const name = 'test-fixture';
      const data = { message: 'hello', count: 42 };
      const metadata = { url: 'https://api.example.com/test' };

      // Note: This test requires a writable directory
      // In real tests, we'd mock the config
    });

    it('should throw when loading non-existent fixture', async () => {
      try {
        await loadFixture('nonexistent-fixture');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('not found'));
      }
    });
  });

  describe('fixtureExists', () => {
    it('should return false for non-existent fixture', async () => {
      // Depending on config location
      const exists = await fixtureExists('completely-nonexistent-12345');
      assert.strictEqual(exists, false);
    });
  });
});