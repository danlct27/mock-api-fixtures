/**
 * @fileoverview Type generator for JSDoc and TypeScript
 * @module core/generator
 */

/**
 * @typedef {Object} TypeDefinition
 * @property {string} type - Type name
 * @property {Object<string, TypeDefinition>} [properties] - Object properties
 * @property {TypeDefinition} [items] - Array items type
 * @property {boolean} [optional] - Whether property is optional
 */

/**
 * Infer JSDoc type from JavaScript value
 * @param {*} value - JavaScript value
 * @returns {string} JSDoc type string
 */
export function inferType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'function':
      return 'Function';
    case 'symbol':
      return 'symbol';
    case 'bigint':
      return 'bigint';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'Array<any>';
        // Infer array type from first few items
        const itemTypes = new Set(
          value.slice(0, 10).map(item => inferType(item))
        );
        if (itemTypes.size === 1) {
          return `Array<${[...itemTypes][0]}>`;
        }
        return `Array<${[...itemTypes].join(' | ')}>`;
      }
      if (value instanceof Date) return 'Date';
      if (value instanceof RegExp) return 'RegExp';
      if (value instanceof Map) return 'Map<any, any>';
      if (value instanceof Set) return 'Set<any>';
      return 'Object';
    default:
      return 'any';
  }
}

/**
 * Analyze object structure for type generation
 * @param {Object} obj - Object to analyze
 * @returns {Object} Type structure
 */
function analyzeObject(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { type: inferType(obj) };
  }

  const properties = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      properties[key] = {
        type: 'Object',
        properties: analyzeObject(value).properties,
        optional: false
      };
    } else if (Array.isArray(value)) {
      properties[key] = {
        type: inferType(value),
        items: value.length > 0 ? { type: inferType(value[0]) } : null,
        optional: false
      };
    } else {
      properties[key] = {
        type: inferType(value),
        optional: value === undefined
      };
    }
  }

  return { type: 'Object', properties };
}

/**
 * Generate JSDoc typedef from JSON
 * @param {Object} json - JSON object
 * @param {string} name - Type name
 * @returns {string} JSDoc typedef string
 */
export function generateJSDoc(json, name) {
  const lines = [];
  lines.push('/**');
  lines.push(` * @typedef {Object} ${name}`);

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    lines.push(` * @type {${inferType(json)}}`);
    lines.push(' */');
    return lines.join('\n');
  }

  for (const [key, value] of Object.entries(json)) {
    const typeStr = inferType(value);
    const optional = value === undefined ? '?' : '';
    lines.push(` * @property {${typeStr}${optional}} ${key}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Generate TypeScript interface from JSON
 * @param {Object} json - JSON object
 * @param {string} name - Interface name
 * @returns {string} TypeScript interface string
 */
export function generateTypeScript(json, name) {
  const lines = [];
  lines.push(`export interface ${name} {`);

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return `export type ${name} = ${inferType(json)};`;
  }

  for (const [key, value] of Object.entries(json)) {
    const typeStr = typeScriptType(value);
    const optional = value === undefined ? '?' : '';
    lines.push(`  ${key}${optional}: ${typeStr};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Convert JavaScript value to TypeScript type string
 * @param {*} value - JavaScript value
 * @returns {string} TypeScript type string
 */
function typeScriptType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'function':
      return 'Function';
    case 'symbol':
      return 'symbol';
    case 'bigint':
      return 'bigint';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const itemType = typeScriptType(value[0]);
        return `${itemType}[]`;
      }
      if (value instanceof Date) return 'Date';
      if (value instanceof RegExp) return 'RegExp';
      if (value instanceof Map) return 'Map<any, any>';
      if (value instanceof Set) return 'Set<any>';

      // Nested object - infer full structure
      const properties = Object.entries(value)
        .map(([k, v]) => {
          const valueType = typeScriptType(v);
          const optional = v === undefined ? '?' : '';
          return `    ${k}${optional}: ${valueType};`;
        })
        .join('\n');

      if (properties) {
        return `{\n${properties}\n  }`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * Generate type definition from JSON
 * @param {Object} json - JSON object
 * @param {string} name - Type name
 * @param {string} format - Output format (jsdoc, typescript)
 * @returns {string} Type definition string
 */
export function generateType(json, name, format = 'jsdoc') {
  switch (format) {
    case 'typescript':
      return generateTypeScript(json, name);
    case 'jsdoc':
    default:
      return generateJSDoc(json, name);
  }
}