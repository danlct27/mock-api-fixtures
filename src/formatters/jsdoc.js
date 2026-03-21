/**
 * @fileoverview JSDoc output formatter
 * @module formatters/jsdoc
 */

import { generateJSDoc } from '../core/generator.js';
import { toPascalCase } from '../cli/utils.js';

/**
 * Generate JSDoc for a fixture (delegates to core generator)
 * @param {string} fixtureName - Fixture name
 * @param {*} data - Fixture data
 * @returns {string} JSDoc output
 */
export function generateFixtureJSDoc(fixtureName, data) {
  return generateJSDoc(data, toPascalCase(fixtureName));
}

export default {
  generateFixtureJSDoc
};
