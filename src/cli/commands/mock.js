/**
 * @fileoverview Mock command - generate mock data from existing fixtures
 * @module cli/commands/mock
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../core/config.js';
import { listFixtures, loadFixture, loadMetadata, saveFixture, getFixturesDir } from '../../core/fixture-store.js';
import { generateVariants } from '../../core/mock-generator.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { generateMSW } from '../../formatters/msw.js';
import { toPascalCase } from '../utils.js';

/**
 * Generate mock data from existing fixture
 * @param {string} name - Fixture name
 * @param {Object} options - Command options
 * @param {number} options.count - Number of variants to generate
 * @param {string} options.output - Output name prefix
 * @param {boolean} options.jsdoc - Generate JSDoc types
 * @param {boolean} options.typescript - Generate TypeScript types
 * @param {boolean} options.msw - Generate MSW handlers
 * @param {Array<string>} options.vary - Fields to vary
 * @returns {Promise<number>} Exit code
 */
export async function mockCommand(name, options = {}) {
  const { count = 3, output, vary = [] } = options;

  console.log(`Generating mock variants from fixture: ${name}\n`);

  try {
    // Load existing fixture
    const data = await loadFixture(name);
    const metadata = await loadMetadata(name);

    if (!data) {
      console.error(`Fixture not found: ${name}`);
      return 1;
    }

    const fixturesDir = await getFixturesDir();
    const baseName = output || name;
    
    console.log(`Generating ${count} variant(s)...`);
    console.log(`Base data keys: ${Object.keys(data).join(', ')}\n`);

    // Generate variants
    const variants = generateVariants(data, { count, variations: vary });

    // Save each variant
    for (let i = 0; i < variants.length; i++) {
      const variantName = count === 1 ? baseName : `${baseName}-${i + 1}`;
      const variantData = variants[i];

      await saveFixture(variantName, variantData, {
        ...(metadata || {}),
        capturedAt: new Date().toISOString(),
        source: 'mock-generator',
        baseFixture: name,
        variantIndex: i + 1
      });

      console.log(`✓ Generated: ${variantName}`);

      // Generate types if requested
      if (options.typescript) {
        const typeName = toPascalCase(variantName);
        const typeContent = generateTypeScript(variantData, typeName);
        const typePath = path.join(fixturesDir, `${variantName}.d.ts`);
        fs.writeFileSync(typePath, typeContent + '\n');
      }

      if (options.jsdoc) {
        const typeName = toPascalCase(variantName);
        const typeContent = generateJSDoc(variantData, typeName);
        const jsdocContent = `// Auto-generated JSDoc types for ${variantName}\n${typeContent}\n\nexport const ${variantName} = require('./${variantName}.json');\n`;
        const typePath = path.join(fixturesDir, `${variantName}.types.js`);
        fs.writeFileSync(typePath, jsdocContent);
      }

      // Generate MSW handler if requested
      if (options.msw) {
        const mswContent = generateMSW({
          name: variantName,
          url: metadata?.url || `/${variantName}`,
          method: metadata?.method || 'GET'
        });
        const mswPath = path.join(fixturesDir, `${variantName}.msw.js`);
        fs.writeFileSync(mswPath, mswContent);
      }
    }

    console.log(`\n✅ Generated ${variants.length} mock variant(s)`);
    return 0;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

/**
 * Generate mock data for all fixtures
 * @param {Object} options - Command options
 * @returns {Promise<number>} Exit code
 */
export async function mockAllCommand(options = {}) {
  const { count = 3 } = options;

  console.log('Generating mock variants for all fixtures...\n');

  try {
    const fixtures = await listFixtures();
    
    if (fixtures.length === 0) {
      console.log('No fixtures found. Run `apitape capture` first.');
      return 0;
    }

    const fixturesWithUrls = fixtures.filter(f => f.url);
    let generated = 0;

    for (const fixture of fixturesWithUrls) {
      console.log(`Processing ${fixture.name}...`);
      
      try {
        await mockCommand(fixture.name, { ...options, count });
        generated++;
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Generated mocks for ${generated} fixture(s)`);
    return 0;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}