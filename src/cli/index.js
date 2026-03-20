#!/usr/bin/env node

/**
 * @fileoverview CLI entry point for mock-api-fixtures
 * @module cli/index
 */

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { captureCommand } from './commands/capture.js';
import { typesCommand } from './commands/types.js';
import { listCommand } from './commands/list.js';

program
  .name('mock-api-fixtures')
  .description('Capture real API responses as test fixtures with auto-generated types')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new fixtures directory with config')
  .option('-f, --force', 'Overwrite existing config')
  .option('--no-gitignore', 'Do not update .gitignore')
  .action(initCommand);

program
  .command('capture <url>')
  .description('Capture an API response as a fixture')
  .option('-n, --name <name>', 'Fixture name (required)')
  .option('-e, --env <environment>', 'Environment name for URL resolution')
  .option('-m, --method <method>', 'HTTP method (default: GET)')
  .option('-H, --header <headers...>', 'Request headers')
  .option('--auth <type>', 'Auth type: bearer, api-key')
  .option('--auth-token <token>', 'Auth token or API key')
  .option('--jsdoc', 'Generate JSDoc types file (.types.js)')
  .option('--typescript', 'Generate TypeScript types file (.d.ts)')
  .action(captureCommand);

program
  .command('types')
  .description('Generate types from all fixtures')
  .option('-f, --format <format>', 'Output format: jsdoc, typescript (default: jsdoc)')
  .option('-o, --output <dir>', 'Output directory')
  .action(typesCommand);

program
  .command('list')
  .description('List all fixtures with metadata')
  .option('-j, --json', 'Output as JSON')
  .action(listCommand);

program.parse();