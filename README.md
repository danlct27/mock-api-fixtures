# Mock API Fixtures

Capture real API responses as test fixtures with auto-generated types (JSDoc or TypeScript).

## Features

- 🎯 Capture real API responses as JSON fixtures
- 📝 Auto-generate type definitions (JSDoc or TypeScript)
- 🔐 Support for Bearer and API Key authentication
- 📁 Simple fixture storage with metadata
- ⚡ Native fetch API (Node.js 24+)

## Installation

```bash
npm install mock-api-fixtures
```

## Quick Start

### 1. Initialize

```bash
npx mock-api-fixtures init
```

This creates:
- `fixtures/` directory
- `mock-api-fixtures.config.json` configuration file
- Updates `.gitignore` (optional)

### 2. Capture API Responses

```bash
npx mock-api-fixtures capture https://api.example.com/users --name users
```

### 3. Generate Types

```bash
npx mock-api-fixtures types --format jsdoc
# or
npx mock-api-fixtures types --format typescript
```

### 4. List Fixtures

```bash
npx mock-api-fixtures list
```

## Configuration

Edit `mock-api-fixtures.config.json`:

```json
{
  "fixturesDir": "./fixtures",
  "typesOutput": "./fixtures",
  "typesFormat": "jsdoc",
  "environments": {
    "staging": {
      "baseUrl": "https://staging.api.example.com"
    },
    "production": {
      "baseUrl": "https://api.example.com"
    }
  },
  "auth": null,
  "defaultHeaders": {
    "Content-Type": "application/json"
  },
  "maxSizeBytes": 5242880,
  "arraySampleSize": 100
}
```

## CLI Commands

### `init`

Initialize fixtures directory and config.

```bash
mock-api-fixtures init
mock-api-fixtures init --force        # Overwrite existing config
mock-api-fixtures init --no-gitignore # Skip .gitignore update
```

### `capture <url>`

Capture an API response as a fixture.

```bash
mock-api-fixtures capture https://api.example.com/users --name users
mock-api-fixtures capture /users --env staging --name users
mock-api-fixtures capture https://api.example.com/users \
  --name users \
  --auth bearer \
  --auth-token "your-token" \
  --generate-types
```

Options:
- `-n, --name <name>` - Fixture name (required)
- `-e, --env <environment>` - Environment name for URL resolution
- `-m, --method <method>` - HTTP method (default: GET)
- `-H, --header <headers...>` - Request headers
- `--auth <type>` - Auth type: bearer, api-key
- `--auth-token <token>` - Auth token or API key
- `--generate-types` - Generate types after capture
- `--typescript` - Generate TypeScript types (default: JSDoc)

### `types`

Generate types from all fixtures.

```bash
mock-api-fixtures types
mock-api-fixtures types --format typescript
mock-api-fixtures types --output ./src/types
```

Options:
- `-f, --format <format>` - Output format: jsdoc, typescript (default: jsdoc)
- `-o, --output <dir>` - Output directory

### `list`

List all fixtures with metadata.

```bash
mock-api-fixtures list
mock-api-fixtures list --json
```

## Programmatic Usage

```javascript
import {
  loadConfig,
  fetchWithAuth,
  saveFixture,
  loadFixture,
  listFixtures,
  generateJSDoc,
  generateTypeScript
} from 'mock-api-fixtures';

// Load config
const config = await loadConfig();

// Fetch with auth
const response = await fetchWithAuth('https://api.example.com/users', {
  auth: { type: 'bearer', token: 'your-token' }
});

// Save fixture
await saveFixture('users', response.data, { url: 'https://api.example.com/users' });

// Load fixture
const fixture = await loadFixture('users');
console.log(fixture.data);

// List fixtures
const fixtures = await listFixtures();

// Generate types
const jsdoc = generateJSDoc(fixture.data, 'Users');
const ts = generateTypeScript(fixture.data, 'Users');
```

## Requirements

- Node.js 24.0.0 or higher
- Native fetch API support

## License

MIT