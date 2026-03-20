/**
 * @fileoverview Capture command - captures API responses as fixtures
 * @module cli/commands/capture
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../core/config.js';
import { fetchWithAuth } from '../../core/http-client.js';
import { saveFixture, getFixturesDir } from '../../core/fixture-store.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { generateMSW } from '../../formatters/msw.js';

/**
 * @typedef {Object} CaptureOptions
 * @property {string} name- Fixture name
 * @property {string} env - Environment name
 * @property {string} method - HTTP method
 * @property {string[]} header - Request headers
 * @property {string} auth - Auth type
 * @property {string} authToken - Auth token
 * @property {boolean} jsdoc - Generate JSDoc types file
 * @property {boolean} typescript - Generate TypeScript types file
 */

/**
 * Capture an API response as a fixture
 * @param {string} url - URL to capture
 * @param {CaptureOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function captureCommand(url, options = {}) {
  console.log(`Capturing: ${url}`);

  try {
    // Load config
    const config = await loadConfig();

    // Parse headers
    const headers = {};
    if (options.header) {
      for (const h of options.header) {
        const [key, value] = h.split(':').map(s => s.trim());
        if (key && value) {
          headers[key] = value;
        }
      }
    }

    // Merge with default headers
    const mergedHeaders = { ...config.defaultHeaders, ...headers };

    // Build auth options
    const authOptions = {};
    if (options.auth && options.authToken) {
      authOptions.type = options.auth;
      authOptions.token = options.authToken;
    }

    // Fetch the API
    const response = await fetchWithAuth(url, {
      method: options.method || 'GET',
      headers: mergedHeaders,
      auth: authOptions
    });

    // Save fixture
    const fixtureName = options.name || generateFixtureName(url);
    const metadata = {
      url,
      method: options.method || 'GET',
      capturedAt: new Date().toISOString(),
      headers: mergedHeaders,
      status: response.status
    };

    await saveFixture(fixtureName, response.data, metadata);

    console.log(`✓ Saved fixture: ${fixtureName}`);

    // Generate types if requested
    if (options.jsdoc || options.typescript) {
      const fixturesDir = await getFixturesDir();
      const typeName = toPascalCase(fixtureName);

      if (options.typescript) {
        const typeContent = generateTypeScript(response.data, typeName);
        const typePath = path.join(fixturesDir, `${fixtureName}.d.ts`);
        fs.writeFileSync(typePath, typeContent + '\n');
        console.log(`✓ Generated TypeScript types: ${typePath}`);
      }

      if (options.jsdoc) {
        const typeContent = generateJSDoc(response.data, typeName);
        const jsdocContent = `// Auto-generated JSDoc types for ${fixtureName}\n${typeContent}\n\nexport const ${fixtureName} = require('./${fixtureName}.json');\n`;
        const typePath = path.join(fixturesDir, `${fixtureName}.types.js`);
        fs.writeFileSync(typePath, jsdocContent);
        console.log(`✓ Generated JSDoc types: ${typePath}`);
      }
    }

    // Generate MSW handler if requested
    if (options.msw) {
      const fixturesDir = await getFixturesDir();
      const mswContent = generateMSW({
        name: fixtureName,
        url: url,
        method: options.method || 'GET'
      });
      const mswPath = path.join(fixturesDir, `${fixtureName}.msw.js`);
      fs.writeFileSync(mswPath, mswContent);
      console.log(`✓ Generated MSW handler: ${mswPath}`);
    }

  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
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

/**
 * Generate a fixture name from URL
 * @param {string} url - URL
 * @returns {string} Fixture name
 */
function generateFixtureName(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const name = pathParts.length > 0? pathParts.join('-'): 'root';
    return `${name}-${Date.now()}`;
  } catch {
    return `fixture-${Date.now()}`;
  }
}