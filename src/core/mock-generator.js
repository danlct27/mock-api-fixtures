/**
 * @fileoverview Mock data generator from JSON schema
 * @module core/mock-generator
 */

/**
 * @typedef {Object} SchemaInfo
 * @property {string} [type] - JSON schema type
 * @property {Array} [enum] - Enum values
 * @property {Object} [properties] - Object properties
 * @property {Object} [items] - Array item schema
 * @property {string} [format] - Format string (date-time, email, etc.)
 * @property {number} [minimum] - Minimum value
 * @property {number} [maximum] - Maximum value
 * @property {number} [minLength] - Minimum string length
 * @property {number} [maxLength] - Maximum string length
 * @property {Array} [examples] - Example values
 * @property {Object} [example] - Single example
 */

/**
 * Generate mock data from JSON schema
 * @param {SchemaInfo} schema - JSON schema
 * @param {Object} [rootSpec] - Root OpenAPI spec for resolving refs
 * @param {Map} [visited] - Visited refs for cycle detection
 * @returns {*} Generated mock data
 */
export function generateMockData(schema, rootSpec = null, visited = new Map()) {
  if (!schema) return null;

  // Resolve $ref
  if (schema.$ref && rootSpec) {
    const resolved = resolveSchemaRef(schema.$ref, rootSpec);
    if (visited.has(schema.$ref)) {
      return visited.get(schema.$ref);
    }
    visited.set(schema.$ref, null); // Prevent infinite loop
    const result = generateMockData(resolved, rootSpec, visited);
    visited.set(schema.$ref, result);
    return result;
  }

  // Use example if provided
  if (schema.example !== undefined) {
    return schema.example;
  }
  if (schema.examples && schema.examples.length > 0) {
    return schema.examples[0];
  }

  // Use enum if provided
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[Math.floor(Math.random() * schema.enum.length)];
  }

  const type = schema.type || inferType(schema);

  switch (type) {
    case 'string':
      return generateString(schema);
    case 'number':
    case 'integer':
      return generateNumber(schema);
    case 'boolean':
      return Math.random() > 0.5;
    case 'array':
      return generateArray(schema, rootSpec, visited);
    case 'object':
      return generateObject(schema, rootSpec, visited);
    case 'null':
      return null;
    default:
      return null;
  }
}

/**
 * Infer type from schema shape
 * @param {Object} schema - Schema object
 * @returns {string} Inferred type
 */
function inferType(schema) {
  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  if (schema.enum) return 'string';
  return 'object';
}

/**
 * Generate string mock data
 * @param {SchemaInfo} schema - String schema
 * @returns {string} Generated string
 */
function generateString(schema) {
  const format = schema.format;
  const minLength = schema.minLength || 0;
  const maxLength = schema.maxLength || 50;

  // Format-based generation
  switch (format) {
    case 'date-time':
      return new Date().toISOString();
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'time':
      return new Date().toISOString().split('T')[1].split('.')[0];
    case 'email':
      return `user${Math.floor(Math.random() * 1000)}@example.com`;
    case 'uri':
    case 'url':
      return 'https://example.com';
    case 'uuid':
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    case 'hostname':
      return 'api.example.com';
    case 'ipv4':
      return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    case 'ipv6':
      return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'phone':
      return '+1-555-123-4567';
    default:
      // Generic string
      const length = Math.max(minLength, Math.min(maxLength, 10));
      return generateRandomString(length);
  }
}

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate number mock data
 * @param {SchemaInfo} schema - Number schema
 * @returns {number} Generated number
 */
function generateNumber(schema) {
  const min = schema.minimum ?? schema.exclusiveMinimum ?? 0;
  const max = schema.maximum ?? schema.exclusiveMaximum ?? 100;
  const isInteger = schema.type === 'integer';
  
  // Check for multiple of
  let value = min + Math.random() * (max - min);
  
  if (isInteger) {
    value = Math.floor(value);
  }
  
  return value;
}

/**
 * Generate array mock data
 * @param {SchemaInfo} schema - Array schema
 * @param {Object} rootSpec - Root spec
 * @param {Map} visited - Visited refs
 * @returns {Array} Generated array
 */
function generateArray(schema, rootSpec, visited) {
  const items = schema.items || {};
  const minItems = schema.minItems || 0;
  const maxItems = schema.maxItems || 5;
  
  const length = Math.max(minItems, Math.min(maxItems, 2));
  const result = [];
  
  for (let i = 0; i < length; i++) {
    result.push(generateMockData(items, rootSpec, visited));
  }
  
  return result;
}

/**
 * Generate object mock data
 * @param {SchemaInfo} schema - Object schema
 * @param {Object} rootSpec - Root spec
 * @param {Map} visited - Visited refs
 * @returns {Object} Generated object
 */
function generateObject(schema, rootSpec, visited) {
  const properties = schema.properties || {};
  const required = schema.required || [];
  const result = {};
  
  for (const [key, propSchema] of Object.entries(properties)) {
    // Always include required fields, randomly include optional
    if (required.includes(key) || Math.random() > 0.3) {
      result[key] = generateMockData(propSchema, rootSpec, visited);
    }
  }
  
  return result;
}

/**
 * Resolve $ref in schema
 * @param {string} ref - Reference string
 * @param {Object} spec - OpenAPI spec
 * @returns {Object} Resolved schema
 */
function resolveSchemaRef(ref, spec) {
  if (!ref.startsWith('#/')) return {};
  
  const parts = ref.slice(2).split('/');
  let current = spec;
  
  for (const part of parts) {
    current = current[part];
    if (!current) return {};
  }
  
  return current;
}

/**
 * Generate multiple mock variants from existing data
 * @param {Object} sampleData - Sample real data
 * @param {Object} options - Generation options
 * @param {number} options.count - Number of variants
 * @param {Array<string>} options.variations - Fields to vary
 * @returns {Array<Object>} Array of mock variants
 */
export function generateVariants(sampleData, options = {}) {
  const { count = 3, variations = [] } = options;
  const variants = [];
  
  for (let i = 0; i < count; i++) {
    const variant = JSON.parse(JSON.stringify(sampleData));
    varyObject(variant, variations);
    variants.push(variant);
  }
  
  return variants;
}

/**
 * Vary object fields
 * @param {Object} obj - Object to vary
 * @param {Array<string>} varyFields - Fields to vary
 */
function varyObject(obj, varyFields) {
  for (const key of Object.keys(obj)) {
    if (varyFields.length === 0 || varyFields.includes(key)) {
      const value = obj[key];
      const type = typeof value;
      
      if (type === 'string') {
        obj[key] = varyString(value);
      } else if (type === 'number') {
        obj[key] = varyNumber(value);
      } else if (type === 'boolean') {
        obj[key] = Math.random() > 0.5;
      } else if (Array.isArray(value) && value.length > 0) {
        obj[key] = varyArray(value);
      } else if (type === 'object' && value !== null) {
        varyObject(value, varyFields);
      }
    }
  }
}

/**
 * Vary string value
 * @param {string} value - Original value
 * @returns {string} Varied string
 */
function varyString(value) {
  if (value.includes('@')) {
    // Email
    const [local, domain] = value.split('@');
    return `${local}${Math.floor(Math.random() * 100)}@${domain}`;
  }
  if (value.match(/^\d+$/)) {
    // Numeric string
    return String(Math.floor(Math.random() * 1000));
  }
  if (value.match(/\d{4}-\d{2}-\d{2}/)) {
    // Date
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString().split('T')[0];
  }
  // Generic string - append random number
  return `${value}${Math.floor(Math.random() * 100)}`;
}

/**
 * Vary number value
 * @param {number} value - Original value
 * @returns {number} Varied number
 */
function varyNumber(value) {
  const variance = value * 0.2; // 20% variance
  const delta = (Math.random() - 0.5) * 2 * variance;
  return Math.round(value + delta);
}

/**
 * Vary array
 * @param {Array} arr - Original array
 * @returns {Array} Varied array
 */
function varyArray(arr) {
  if (arr.length <= 1) return arr;
  
  // Randomly shuffle and take subset
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const newLength = Math.max(1, arr.length + Math.floor((Math.random() - 0.5) * 2));
  return shuffled.slice(0, newLength);
}