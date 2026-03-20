/**
 * @fileoverview Sync command - re-capture all fixtures from original URLs
 * @module cli/commands/sync
 */

import { loadConfig } from '../../core/config.js';
import { fetchWithAuth } from '../../core/http-client.js';
import { listFixtures, loadMetadata, saveFixture } from '../../core/fixture-store.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { generateMSW } from '../../formatters/msw.js';
import fs from 'fs';
import path from 'path';

/**
 * Sync all fixtures from their original URLs
 * @param {Object} options - Command options
 * @param {string} options.env - Environment name
 * @param {boolean} options.dryRun - Show what would be synced without making changes
 * @param {boolean} options.force - Force re-capture even if unchanged
 * @param {string} options.config - Config file path
 * @returns {Promise<number>} Exit code
 */
export async function syncCommand(options = {}) {
  const { env, dryRun = false, force = false } = options;

  console.log(`Syncing fixtures from ${env || 'default'} environment...\n`);

  try {
    const config = await loadConfig(options.config);
    const fixtures = await listFixtures();

    if (fixtures.length === 0) {
      console.log('No fixtures found. Run `mock-api-fixtures capture` first.');
      return 0;
    }

    // Filter fixtures with URLs
    const fixturesWithUrls = fixtures.filter(f => f.url);
    
    if (fixturesWithUrls.length === 0) {
      console.log('No fixtures with source URLs found.');
      return 0;
    }

    console.log(`Found ${fixturesWithUrls.length} fixture(s) to sync:\n`);

    const results = [];
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    for (const fixture of fixturesWithUrls) {
      const { name, url, method } = fixture;
      
      // Resolve URL with environment
      let resolvedUrl = url;
      if (env && config.environments?.[env]) {
        const baseUrl = config.environments[env];
        try {
          const urlObj = new URL(url, baseUrl);
          resolvedUrl = urlObj.href;
        } catch {
          resolvedUrl = url;
        }
      }

      console.log(`Syncing ${name}...`);
      console.log(`  URL: ${resolvedUrl}`);

      if (dryRun) {
        console.log(`  [DRY RUN] Would re-capture from ${resolvedUrl}\n`);
        results.push({ name, status: 'dry-run' });
        continue;
      }

      try {
        // Fetch live API
        const response = await fetchWithAuth(resolvedUrl, {
          method: method || 'GET',
          headers: {
            ...(config.defaultHeaders || {}),
            ...(fixture.headers || {})
          }
        });

        // Check if changed (unless force)
        if (!force) {
          const existingData = await loadFixtureData(name);
          const isUnchanged = JSON.stringify(existingData) === JSON.stringify(response.data);
          
          if (isUnchanged) {
            console.log(`  ✓ Unchanged\n`);
            unchanged++;
            results.push({ name, status: 'unchanged' });
            continue;
          }
        }

        // Save updated fixture
        await saveFixture(name, response.data, {
          url,
          method: method || 'GET',
          capturedAt: new Date().toISOString(),
          headers: fixture.headers,
          status: response.status
        });

        // Regenerate types if they exist
        const fixturesDir = config.fixturesDir || './fixtures';
        const jsdocPath = path.join(fixturesDir, `${name}.types.js`);
        const tsPath = path.join(fixturesDir, `${name}.d.ts`);
        const mswPath = path.join(fixturesDir, `${name}.msw.js`);

        if (fs.existsSync(jsdocPath)) {
          const typeContent = generateJSDoc(response.data, toPascalCase(name));
          const jsdocContent = `// Auto-generated JSDoc types for ${name}\n${typeContent}\n\nexport const ${name} = require('./${name}.json');\n`;
          fs.writeFileSync(jsdocPath, jsdocContent);
        }

        if (fs.existsSync(tsPath)) {
          const typeContent = generateTypeScript(response.data, toPascalCase(name));
          fs.writeFileSync(tsPath, typeContent + '\n');
        }

        if (fs.existsSync(mswPath)) {
          const mswContent = generateMSW({ name, url, method: method || 'GET' });
          fs.writeFileSync(mswPath, mswContent);
        }

        console.log(`  ✓ Updated\n`);
        updated++;
        results.push({ name, status: 'updated' });

      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
        failed++;
        results.push({ name, status: 'error', error: error.message });
      }
    }

    // Summary
    console.log('Sync Summary:');
    console.log(`  Updated: ${updated}`);
    console.log(`  Unchanged: ${unchanged}`);
    console.log(`  Failed: ${failed}`);
    
    if (dryRun) {
      console.log(`\n[DRY RUN] No changes were made.`);
    }

    return failed > 0 ? 1 : 0;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

/**
 * Load fixture data
 * @param {string} name - Fixture name
 * @returns {Promise<Object>} Fixture data
 */
async function loadFixtureData(name) {
  const { getFixturesDir } = await import('../../core/fixture-store.js');
  const fixturesDir = await getFixturesDir();
  const dataPath = path.join(fixturesDir, `${name}.json`);
  
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Fixture not found: ${name}`);
  }
  
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
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