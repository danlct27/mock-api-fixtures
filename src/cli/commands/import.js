/**
 * @fileoverview Import command - generate fixtures from OpenAPI spec
 * @module cli/commands/import
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../core/config.js';
import { saveFixture, getFixturesDir } from '../../core/fixture-store.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { generateMSW } from '../../formatters/msw.js';
import { generateMockData } from '../../core/mock-generator.js';
import { toPascalCase, sanitizeName } from '../utils.js';

/**
 * Import fixtures from OpenAPI specification
 * @param {string} specPath - Path to OpenAPI spec file (JSON only)
 * @param {Object} options - Command options
 * @param {string} options.env - Environment name for URL resolution
 * @param {boolean} options.jsdoc - Generate JSDoc types
 * @param {boolean} options.typescript - Generate TypeScript types
 * @param {boolean} options.msw - Generate MSW handlers
 * @param {boolean} options.mock - Generate mock data from schema
 * @returns {Promise<number>} Exit code
 */
export async function importCommand(specPath, options = {}) {
  console.log(`Importing fixtures from OpenAPI spec: ${specPath}\n`);

  try {
    const spec = loadOpenAPISpec(specPath);

    if (!spec) {
      console.error('Failed to parse OpenAPI specification. Only JSON format is supported.');
      return 1;
    }

    console.log(`API: ${spec.info?.title || 'Unknown'} v${spec.info?.version || '0.0.0'}`);
    console.log(`Endpoints found: ${countEndpoints(spec.paths || {})}\n`);

    const config = await loadConfig(options.config);
    const fixturesDir = await getFixturesDir();

    const results = [];
    let imported = 0;
    let skipped = 0;

    for (const [pathStr, pathItem] of Object.entries(spec.paths || {})) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = pathItem[method];
        if (!operation) continue;

        const operationId = operation.operationId || generateOperationId(method, pathStr);
        const fixtureName = sanitizeName(operationId);

        console.log(`Processing ${method.toUpperCase()} ${pathStr} -> ${fixtureName}`);

        const fixturePath = path.join(fixturesDir, `${fixtureName}.json`);
        if (fs.existsSync(fixturePath)) {
          console.log(`  Skipping (already exists)\n`);
          skipped++;
          continue;
        }

        try {
          const schema = getResponseSchema(operation, spec);

          let data;
          if (options.mock && schema) {
            data = generateMockData(schema, spec);
          } else if (schema) {
            data = schema.example || generateMockData(schema, spec);
          } else {
            data = {};
          }

          await saveFixture(fixtureName, data, {
            url: pathStr,
            method: method.toUpperCase(),
            capturedAt: new Date().toISOString(),
            source: 'openapi-import',
            operationId
          });

          if (options.typescript) {
            const typeContent = generateTypeScript(data, toPascalCase(fixtureName));
            fs.writeFileSync(path.join(fixturesDir, `${fixtureName}.d.ts`), typeContent + '\n');
          }

          if (options.jsdoc) {
            const typeContent = generateJSDoc(data, toPascalCase(fixtureName));
            const jsdocContent = `// Auto-generated JSDoc types for ${fixtureName}\n${typeContent}\n\nexport const ${fixtureName} = require('./${fixtureName}.json');\n`;
            fs.writeFileSync(path.join(fixturesDir, `${fixtureName}.types.js`), jsdocContent);
          }

          if (options.msw) {
            const mswContent = generateMSW({
              name: fixtureName,
              url: pathStr,
              method: method.toUpperCase()
            });
            fs.writeFileSync(path.join(fixturesDir, `${fixtureName}.msw.js`), mswContent);
          }

          console.log(`  ✓ Imported\n`);
          imported++;
          results.push({ path: pathStr, method, name: fixtureName, status: 'imported' });
        } catch (error) {
          console.log(`  ✗ Error: ${error.message}\n`);
          results.push({ path: pathStr, method, error: error.message });
        }
      }
    }

    console.log('Import Summary:');
    console.log(`  Imported: ${imported}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total endpoints: ${countEndpoints(spec.paths || {})}`);

    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

/**
 * Load and parse OpenAPI specification (JSON only)
 * @param {string} specPath - Path to spec file
 * @returns {Object|null} Parsed spec or null
 */
function loadOpenAPISpec(specPath) {
  const content = fs.readFileSync(specPath, 'utf-8');
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get response schema from operation
 * @param {Object} operation - OpenAPI operation
 * @param {Object} spec - Full OpenAPI spec
 * @returns {Object|null} Response schema
 */
function getResponseSchema(operation, spec) {
  const responses = operation.responses;
  if (!responses) return null;

  const successResponse = responses['200'] || responses['201'] || responses.default;
  if (!successResponse) return null;

  const content = successResponse.content;
  if (!content) return null;

  const jsonContent = content['application/json'];
  if (!jsonContent) return null;

  let schema = jsonContent.schema;
  if (!schema) return null;

  if (schema.$ref) {
    schema = resolveRef(schema.$ref, spec);
  }

  return schema;
}

/**
 * Resolve $ref reference
 * @param {string} ref - Reference string
 * @param {Object} spec - OpenAPI spec
 * @returns {Object} Resolved schema
 */
function resolveRef(ref, spec) {
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
 * Count endpoints in paths object
 * @param {Object} paths - OpenAPI paths
 * @returns {number} Number of endpoints
 */
function countEndpoints(paths) {
  let count = 0;
  for (const pathItem of Object.values(paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (pathItem[method]) count++;
    }
  }
  return count;
}

/**
 * Generate operation ID from method and path
 * @param {string} method - HTTP method
 * @param {string} pathStr - API path
 * @returns {string} Operation ID
 */
function generateOperationId(method, pathStr) {
  const parts = pathStr.split('/').filter(Boolean);
  return `${method}-${parts.join('-')}`;
}
