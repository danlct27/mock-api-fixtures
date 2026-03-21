/**
 * @fileoverview Delete command - removes fixtures
 * @module cli/commands/delete
 */

import { deleteFixture, fixtureExists } from '../../core/fixture-store.js';

/**
 * Delete a fixture by name
 * @param {string} name - Fixture name
 * @param {Object} options - Command options
 * @param {boolean} options.force - Skip confirmation
 * @returns {Promise<void>}
 */
export async function deleteCommand(name, options = {}) {
  try {
    const exists = await fixtureExists(name);

    if (!exists) {
      console.error(`Fixture not found: ${name}`);
      process.exit(1);
    }

    const deleted = await deleteFixture(name);

    if (deleted) {
      console.log(`✓ Deleted fixture: ${name}`);
    } else {
      console.error(`✗ Failed to delete fixture: ${name}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
}
