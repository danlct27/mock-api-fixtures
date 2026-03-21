/**
 * @fileoverviewInit command - creates fixtures directory and config
 * @module cli/commands/init
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} InitOptions
 * @property {boolean} force - Overwrite existing config
 * @property {boolean} gitignore - Update .gitignore
 */

/**
 * Initialize a new fixtures directory with config
 * @param {InitOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function initCommand(options = {}) {
  const cwd = process.cwd();
  const fixturesDir = path.join(cwd, 'fixtures');
  const configFile = path.join(cwd, 'apitape.config.json');
  const gitignoreFile = path.join(cwd, '.gitignore');

  // Get template path (from src/cli/commands/ -> root templates/)
  const templatePath = path.join(__dirname, '..', '..', '..', 'templates', 'config.default.json');

  // Create fixtures directory
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
    console.log('✓ Created fixtures/ directory');
  } else {
    console.log('  fixtures/ directory already exists');
  }

  // Create config file
  if (fs.existsSync(configFile) && !options.force) {
    console.log('  apitape.config.json already exists (use --force to overwrite)');
  } else {
    const configTemplate = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(configFile, configTemplate);
    console.log('✓ Created apitape.config.json');
  }

  // Update .gitignore
  if (options.gitignore !== false) {
    const gitignoreEntry = '\n# Mock API Fixtures\n/fixtures/\n';
    
    if (fs.existsSync(gitignoreFile)) {
      const gitignore = fs.readFileSync(gitignoreFile, 'utf-8');
      if (!gitignore.includes('/fixtures/')) {
        fs.appendFileSync(gitignoreFile, gitignoreEntry);
        console.log('✓ Updated .gitignore');
      } else {
        console.log('  .gitignore already includes /fixtures/');
      }
    } else {
      fs.writeFileSync(gitignoreFile, gitignoreEntry.trim() + '\n');
      console.log('✓ Created .gitignore');
    }
  }

  console.log('\n🎉 Initialization complete!');
  console.log('\nNext steps:');
  console.log('  1. Edit apitape.config.json to configure your API');
  console.log('  2. Run `apitape capture <url> --name <name>` to capture fixtures');
}