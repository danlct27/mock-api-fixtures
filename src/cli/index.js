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
import { diffCommand } from './commands/diff.js';
import { syncCommand } from './commands/sync.js';
import { importCommand } from './commands/import.js';
import { mockCommand, mockAllCommand } from './commands/mock.js';

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
  .option('--msw', 'Generate MSW handler file (.msw.js)')
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

program
  .command('diff')
  .description('Compare fixtures against live API to detect drift')
  .option('-e, --env <environment>', 'Environment name for URL resolution')
  .option('--config <path>', 'Config file path')
  .option('--fail-on-drift', 'Exit with error code if drift detected')
  .action(diffCommand);

program
  .command('sync')
  .description('Re-capture all fixtures from their original URLs')
  .option('-e, --env <environment>', 'Environment name for URL resolution')
  .option('--config <path>', 'Config file path')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--force', 'Force re-capture even if unchanged')
  .action(syncCommand);

program
  .command('import <spec>')
  .description('Import fixtures from OpenAPI specification')
  .option('-e, --env <environment>', 'Environment name for URL resolution')
  .option('--config <path>', 'Config file path')
  .option('--jsdoc', 'Generate JSDoc types for imported fixtures')
  .option('--typescript', 'Generate TypeScript types for imported fixtures')
  .option('--msw', 'Generate MSW handlers for imported fixtures')
  .option('--mock', 'Generate mock data from schema')
  .action(importCommand);

program
  .command('mock <name>')
  .description('Generate mock data variants from existing fixture')
  .option('-c, --count <number>', 'Number of variants to generate', '3')
  .option('-o, --output <prefix>', 'Output name prefix')
  .option('--all', 'Generate mocks for all fixtures')
  .option('--jsdoc', 'Generate JSDoc types for mock variants')
  .option('--typescript', 'Generate TypeScript types for mock variants')
  .option('--msw', 'Generate MSW handlers for mock variants')
  .option('--vary <fields...>', 'Fields to vary (comma-separated)')
  .action(mockCommand);

// Alias for mock --all
program
  .command('mock:all')
  .description('Generate mock variants for all fixtures')
  .option('-c, --count <number>', 'Number of variants per fixture', '3')
  .option('--jsdoc', 'Generate JSDoc types')
  .option('--typescript', 'Generate TypeScript types')
  .option('--msw', 'Generate MSW handlers')
  .action(mockAllCommand);

program.parse();