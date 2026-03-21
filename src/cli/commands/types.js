/**
 * @fileoverview Types command - generates types from fixtures
 * @module cli/commands/types
 */

import { loadConfig } from '../../core/config.js';
import { listFixtures, loadFixture } from '../../core/fixture-store.js';
import { generateJSDoc, generateTypeScript } from '../../core/generator.js';
import { toPascalCase } from '../utils.js';
import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} TypesOptions
 * @property {string} format - Output format (jsdoc, typescript)
 * @property {string} output - Output directory
 */

/**
 * Generate types from all fixtures
 * @param {TypesOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function typesCommand(options = {}) {
  console.log('Generating types from fixtures...');

  try {
    const config = await loadConfig();
    const format = options.format || config.typesFormat || 'jsdoc';
    const outputDir = options.output || config.typesOutput || './fixtures';

    // List all fixtures
    const fixtures = await listFixtures();

    if (fixtures.length === 0) {
      console.log('No fixtures found.');
      return;
    }

    // Generate types for each fixture
    const typeContents = [];

    for (const fixture of fixtures) {
      const data = await loadFixture(fixture.name);
      const typeName = toPascalCase(fixture.name);

      if (format === 'typescript') {
        typeContents.push(generateTypeScript(data, typeName));
      } else {
        typeContents.push(generateJSDoc(data, typeName));
      }
    }

    // Write types file
    const typeFileName = format === 'typescript' ? 'fixtures.d.ts' : 'fixtures.jsdoc.js';
    const outputPath = path.join(outputDir, typeFileName);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, typeContents.join('\n\n'));
    console.log(`✓ Generated types: ${outputPath}`);
    console.log(`  (${fixtures.length} fixtures processed)`);

  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
}