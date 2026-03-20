/**
 * @fileoverview Fixture storage and retrieval
 * @module core/fixture-store
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.js';

/**
 * @typedef {Object} FixtureMetadata
 * @property {string} url - Source URL
 * @property {string} method - HTTP method
 * @property {string} capturedAt - ISO timestamp
 * @property {Object} headers - Request headers
 * @property {number} status - Response status
 */

/**
 * @typedef {Object} Fixture
 * @property {string} name - Fixture name
 * @property {Object} data - Fixture data
 * @property {FixtureMetadata} metadata - Fixture metadata
 */

/**
 * Get fixtures directory path
 * @returns {Promise<string>} Fixtures directory path
 */
export async function getFixturesDir() {
  const config = await loadConfig();
  return path.resolve(process.cwd(), config.fixturesDir || './fixtures');
}

/**
 * Get fixture file path
 * @param {string} name - Fixture name
 * @param {string} fixturesDir - Fixtures directory
 * @returns {Object} Object with dataPath and metaPath
 */
function getFixturePaths(name, fixturesDir) {
  const baseName = sanitizeName(name);
  return {
    dataPath: path.join(fixturesDir, `${baseName}.json`),
    metaPath: path.join(fixturesDir, `${baseName}.meta.json`)
  };
}

/**
 * Sanitize fixture name for file system
 * @param {string} name - Original name
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Save a fixture
 * @param {string} name - Fixture name
 * @param {*} data - Fixture data
 * @param {FixtureMetadata} metadata - Fixture metadata
 * @returns {Promise<void>}
 */
export async function saveFixture(name, data, metadata = {}) {
  const fixturesDir = await getFixturesDir();

  // Ensure directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const { dataPath, metaPath } = getFixturePaths(name, fixturesDir);

  // Save data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  // Save metadata
  const fullMetadata = {
    name,
    ...metadata,
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(metaPath, JSON.stringify(fullMetadata, null, 2));
}

/**
 * Load a fixture
 * @param {string} name - Fixture name
 * @returns {Promise<Fixture>} Fixture object
 */
export async function loadFixture(name) {
  const fixturesDir = await getFixturesDir();
  const { dataPath, metaPath } = getFixturePaths(name, fixturesDir);

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Fixture not found: ${name}`);
  }

  // Load data
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Load metadata (optional)
  let metadata = {};
  if (fs.existsSync(metaPath)) {
    metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  return { name, data, metadata };
}

/**
 * Delete a fixture
 * @param {string} name - Fixture name
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteFixture(name) {
  const fixturesDir = await getFixturesDir();
  const { dataPath, metaPath } = getFixturePaths(name, fixturesDir);

  let deleted = false;

  if (fs.existsSync(dataPath)) {
    fs.unlinkSync(dataPath);
    deleted = true;
  }

  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
  }

  return deleted;
}

/**
 * List all fixtures with metadata
 * @returns {Promise<Array<FixtureMetadata>>} Array of fixture metadata
 */
export async function listFixtures() {
  const fixturesDir = await getFixturesDir();

  if (!fs.existsSync(fixturesDir)) {
    return [];
  }

  const files = fs.readdirSync(fixturesDir);
  const fixtureNames = new Set();

  // Find all fixture names
  for (const file of files) {
    if (file.endsWith('.json') && !file.endsWith('.meta.json')) {
      fixtureNames.add(file.replace('.json', ''));
    }
  }

  // Load metadata for each fixture
  const fixtures = [];

  for (const name of fixtureNames) {
    const { metaPath } = getFixturePaths(name, fixturesDir);

    if (fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        fixtures.push(metadata);
      } catch {
        // If metadata is invalid, add basic info
        fixtures.push({ name, capturedAt: null, url: null });
      }
    } else {
      fixtures.push({ name, capturedAt: null, url: null });
    }
  }

  // Sort by capturedAt descending
  fixtures.sort((a, b) => {
    if (!a.capturedAt) return 1;
    if (!b.capturedAt) return -1;
    return new Date(b.capturedAt) - new Date(a.capturedAt);
  });

  return fixtures;
}

/**
 * Check if fixture exists
 * @param {string} name - Fixture name
 * @returns {Promise<boolean>} True if exists
 */
export async function fixtureExists(name) {
  const fixturesDir = await getFixturesDir();
  const { dataPath } = getFixturePaths(name, fixturesDir);
  return fs.existsSync(dataPath);
}