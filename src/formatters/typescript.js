/**
 * @fileoverview TypeScript output formatter
 * @module formatters/typescript
 */

import { generateTypeScript } from '../core/generator.js';
import { toPascalCase } from '../cli/utils.js';

/**
 * Generate TypeScript interface for a fixture (delegates to core generator)
 * @param {string} fixtureName - Fixture name
 * @param {*} data - Fixture data
 * @returns {string} TypeScript interface
 */
export function generateFixtureTypeScript(fixtureName, data) {
  return generateTypeScript(data, toPascalCase(fixtureName));
}

export default {
  generateFixtureTypeScript
};
