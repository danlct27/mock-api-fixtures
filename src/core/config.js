/**
 * @fileoverview Configuration management
 * @module core/config
 */

import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} Config
 * @property {string} fixturesDir - Directory for fixtures
 * @property {string} typesOutput - Output directory for types
 * @property {string} typesFormat - Format for types (jsdoc, typescript)
 * @property {Object} environments - Environment configurations
 * @property {Object|null} auth - Authentication configuration
 * @property {Object} defaultHeaders - Default request headers
 * @property {number} maxSizeBytes - Maximum fixture size
 * @property {number} arraySampleSize - Array sample size for type inference
 */

const CONFIG_FILE = 'apitape.config.json';

/**
 * Load configuration from file
 * @param {string} [filePath] - Path to config file
 * @returns {Promise<Config>} Configuration object
 */
export async function loadConfig(filePath) {
  const configPath = filePath || path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return getDefaultConfig();
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    console.warn(`Warning: Failed to parse config file: ${error.message}`);
    return getDefaultConfig();
  }
}

/**
 * Get default configuration
 * @returns {Config} Default configuration
 */
function getDefaultConfig() {
  return {
    fixturesDir: './fixtures',
    typesOutput: './fixtures',
    typesFormat: 'jsdoc',
    environments: {},
    auth: null,
    defaultHeaders: {
      'Content-Type': 'application/json'
    },
    maxSizeBytes: 5242880,
    arraySampleSize: 100
  };
}

/**
 * Resolve environment variable in URL
 * @param {string} url - URL with potential env variables
 * @param {string} envName - Environment name
 * @param {Config} config - Configuration object
 * @returns {string} Resolved URL
 */
export function resolveEnv(url, envName, config) {
  if (!envName || !config.environments || !config.environments[envName]) {
    return url;
  }

  const env = config.environments[envName];
  const baseUrl = env.baseUrl || '';

  // If URL is relative, prepend base URL
  if (url.startsWith('/') && baseUrl) {
    return baseUrl + url;
  }

  // Replace env placeholders
  let resolved = url;
  for (const [key, value] of Object.entries(env)) {
    resolved = resolved.replace(`{${key}}`, value);
  }

  return resolved;
}

/**
 * Save configuration to file
 * @param {Config} config - Configuration object
 * @param {string} [filePath] - Path to config file
 * @returns {Promise<void>}
 */
export async function saveConfig(config, filePath) {
  const configPath = filePath || path.join(process.cwd(), CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}