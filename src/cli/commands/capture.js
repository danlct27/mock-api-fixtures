/**
 * @fileoverview Capture command - captures API responses as fixtures
 * @module cli/commands/capture
 */

import fs from 'fs';
import path from 'path';
import { loadConfig, resolveEnv } from '../../core/config.js';
import { fetchWithAuth } from '../../core/http-client.js';
import { saveFixture, getFixturesDir } from '../../core/fixture-store.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { generateMSW } from '../../formatters/msw.js';
import { toPascalCase } from '../utils.js';

/**
 * Capture an API response as a fixture
 * @param {string} url - URL to capture
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function captureCommand(url, options = {}) {
  try {
    const config = await loadConfig();

    // Resolve URL with environment
    const resolvedUrl = resolveEnv(url, options.env, config);
    console.log(`Capturing: ${resolvedUrl}`);

    // Parse headers
    const headers = {};
    if (options.header) {
      for (const h of options.header) {
        const [key, value] = h.split(':').map(s => s.trim());
        if (key && value) headers[key] = value;
      }
    }
    const mergedHeaders = { ...config.defaultHeaders, ...headers };

    // Build auth: CLI flags override config
    const authOptions = buildAuth(options, config);

    // Fetch the API
    const response = await fetchWithAuth(resolvedUrl, {
      method: options.method || 'GET',
      headers: mergedHeaders,
      auth: authOptions
    });

    // Reject non-2xx unless --allow-error is set
    if (response.status >= 400 && !options.allowError) {
      console.error(`✗ HTTP ${response.status} — use --allow-error to capture error responses`);
      process.exit(1);
    }

    // Validate fixture name
    if (!options.name) {
      console.error('✗ Missing required option: --name <name>');
      process.exit(1);
    }

    // Save fixture
    const fixtureName = options.name;
    const metadata = {
      url: resolvedUrl,
      method: options.method || 'GET',
      capturedAt: new Date().toISOString(),
      headers: mergedHeaders,
      status: response.status
    };

    await saveFixture(fixtureName, response.data, metadata);
    console.log(`✓ Saved fixture: ${fixtureName} (HTTP ${response.status})`);

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
        url: resolvedUrl,
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
 * Build auth options — CLI flags take priority, then config
 * @param {Object} options - CLI options
 * @param {Object} config - Loaded config
 * @returns {Object} Auth options for fetchWithAuth
 */
function buildAuth(options, config) {
  // CLI flags first
  if (options.auth && options.authToken) {
    return { type: options.auth, token: options.authToken };
  }
  // Fall back to config
  if (config.auth && config.auth.type && config.auth.token) {
    return { type: config.auth.type, token: config.auth.token };
  }
  return {};
}


