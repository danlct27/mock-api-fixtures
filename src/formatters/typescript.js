/**
 * @fileoverview TypeScript output formatter
 * @module formatters/typescript
 */

/**
 * Format a type definition as TypeScript interface
 * @param {string} name - Interface name
 * @param {Object} properties - Interface properties
 * @returns {string} TypeScript interface
 */
export function formatTypeScript(name, properties) {
  const lines = [];
  lines.push(`export interface ${name} {`);

  for (const [key, type] of Object.entries(properties)) {
    const optional = type.optional ? '?' : '';
    const tsType = toTypeScript(type.type);
    lines.push(`  ${key}${optional}: ${tsType};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Format multiple types as TypeScript
 * @param {Array<{name: string, properties: Object}>} types - Type definitions
 * @returns {string} TypeScript output
 */
export function formatTypeScriptTypes(types) {
  return types
    .map(({ name, properties }) => formatTypeScript(name, properties))
    .join('\n\n');
}

/**
 * Convert type to TypeScript type string
 * @param {string} type - Simple type
 * @returns {string} TypeScript type
 */
function toTypeScript(type) {
  // Handle array types
  if (type.startsWith('Array<')) {
    const inner = type.slice(6, -1);
    return `${toTypeScript(inner)}[]`;
  }

  // Handle nullable types
  if (type.includes('|')) {
    return type;
  }

  // Map common types
  const typeMap = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'null': 'null',
    'undefined': 'undefined',
    'Object': 'Record<string, any>',
    'Function': 'Function'
  };

  return typeMap[type] || type;
}

/**
 * Generate TypeScript interface for a fixture
 * @param {string} fixtureName - Fixture name
 * @param {*} data - Fixture data
 * @returns {string} TypeScript interface
 */
export function generateFixtureTypeScript(fixtureName, data) {
  const typeName = toPascalCase(fixtureName);

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return `export type ${typeName} = ${inferTsType(data)};`;
  }

  const properties = {};
  for (const [key, value] of Object.entries(data)) {
    properties[key] = {
      type: inferTsType(value),
      optional: value === undefined
    };
  }

  return formatTypeScript(typeName, properties);
}

/**
 * Infer TypeScript type from value
 * @param {*} value - Value
 * @returns {string} TypeScript type
 */
function inferTsType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    const itemType = inferTsType(value[0]);
    return `${itemType}[]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => {
        const vt = inferTsType(v);
        const opt = v === undefined ? '?' : '';
        return `    ${k}${opt}: ${vt};`;
      })
      .join('\n');
    return `{\n${entries}\n  }`;
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
  formatTypeScript,
  formatTypeScriptTypes,
  generateFixtureTypeScript
};