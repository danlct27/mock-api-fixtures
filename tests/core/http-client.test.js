/**
 * @fileoverview Tests for http-client module
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { inferType, generateJSDoc, generateTypeScript } from '../../src/core/generator.js';

describe('Generator', () => {
  describe('inferType', () => {
    it('should infer string type', () => {
      assert.strictEqual(inferType('hello'), 'string');
    });

    it('should infer number type', () => {
      assert.strictEqual(inferType(42), 'number');
    });

    it('should infer boolean type', () => {
      assert.strictEqual(inferType(true), 'boolean');
    });

    it('should infer null type', () => {
      assert.strictEqual(inferType(null), 'null');
    });

    it('should infer array type', () => {
      assert.strictEqual(inferType([1, 2, 3]), 'Array<number>');
    });

    it('should infer object type', () => {
      assert.strictEqual(inferType({}), 'Object');
    });
  });

  describe('generateJSDoc', () => {
    it('should generate JSDoc for simple object', () => {
      const result = generateJSDoc({ name: 'test', count: 5 }, 'TestType');
      assert.ok(result.includes('@typedef'));
      assert.ok(result.includes('TestType'));
    });
  });

  describe('generateTypeScript', () => {
    it('should generate TypeScript interface', () => {
      const result = generateTypeScript({ name: 'test', count: 5 }, 'TestType');
      assert.ok(result.includes('interface TestType'));
      assert.ok(result.includes('name: string'));
      assert.ok(result.includes('count: number'));
    });
  });
});