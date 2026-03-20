/**
 * @fileoverview JSDoc output formatter
 * @module formatters/jsdoc
 */

/**
 * Format a type definition as JSDoc
 * @param {string} name - Type name
 * @param {Object} properties - Type properties
 * @returns {string} JSDoc output
 */
export function formatJSDoc(name, properties) {
  const lines = [];
  lines.push('/**');
  lines.push(` * @typedef {Object} ${name}`);

  for (const [key, type] of Object.entries(properties)) {
    const optional = type.optional ? '?' : '';
    lines.push(` * @property {${type.type}${optional}} ${key}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Format multiple types as JSDoc
 * @param {Array<{name: string, properties: Object}>} types - Type definitions
 * @returns {string} JSDoc output
 */
export function formatJSDocTypes(types) {
  return types
    .map(({ name, properties }) => formatJSDoc(name, properties))
    .join('\n\n');
}

/**
 * Generate JSDoc for a fixture
 * @param {string} fixtureName - Fixture name
 * @param {*} data - Fixture data
 * @returns {string} JSDoc output
 */
export function generateFixtureJSDoc(fixtureName, data) {
  const typeName = toPascalCase(fixtureName);
  const properties = inferProperties(data);
  return formatJSDoc(typeName, properties);
}

/**
 * Infer properties from data
 * @param {*} data - Data to analyze
 * @returns {Object} Property types
 */
function inferProperties(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { value: { type: inferSimpleType(data) } };
  }

  const properties = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      properties[key] = {
        type: 'Object',
        optional: false
      };
    } else {
      properties[key] = {
        type: inferSimpleType(value),
        optional: value === undefined
      };
    }
  }
  return properties;
}

/**
 * Infer simple type from value
 * @param {*} value - Value
 * @returns {string} Type name
 */
function inferSimpleType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Array';
    return `Array<${inferSimpleType(value[0])}>`;
  }
  return typeof value;
}

/**
 * Convert string to PascalCase
 * @param {string} str - Input string
 * @returns {string} PascalCase string
 */
function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export default {
  formatJSDoc,
  formatJSDocTypes,
  generateFixtureJSDoc
};