
# Test Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:nuclear": "node src/test/clear-cache.js && npm install && npx vitest run --no-cache --config vitest.config.ts",
    "test:clear": "node src/test/clear-cache.js",
    "test:debug": "vitest run --reporter=verbose --no-cache",
    "test:verify-msw": "node src/test/verify-msw-v2.js"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@vitest/coverage-v8": "^3.2.2",
    "jsdom": "^26.1.0",
    "msw": "^2.10.1",
    "vitest": "^3.2.2"
  }
}
```

## Nuclear Cache Resolution for MSW v1/v2 Issues

If you're getting `rest.post` errors or other MSW v1/v2 conflicts:

### 🚀 Instant Fix (Recommended)
```bash
npm run test:nuclear
```

This will:
1. 🧹 Clear ALL caches (node_modules, .vitest, dist, coverage, etc.)
2. 🗑️ Remove lock files that might contain stale MSW v1 references
3. 🧽 Clear npm cache completely
4. 📦 Fresh install all dependencies
5. ✅ Run tests with zero cache to force complete recompilation

### 🔍 Verify MSW v2 Compliance
```bash
npm run test:verify-msw
```

### 🛠️ Manual Nuclear Reset
If the script doesn't work, run manually:

```bash
# 1. Nuclear cache clear
rm -rf node_modules .vitest dist coverage .cache .tsbuildinfo
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# 2. Clear npm cache
npm cache clean --force

# 3. Fresh install
npm install

# 4. Verify MSW v2
npm ls msw  # Should show version ^2.x.x

# 5. Run tests with no cache
npx vitest run --no-cache --config vitest.config.ts
```

## Running Tests

- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run all unit tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:nuclear` - **🚀 Nuclear option: Complete reset + fresh test run**
- `npm run test:clear` - Clear all caches without running tests
- `npm run test:debug` - Run tests with verbose logging and no cache
- `npm run test:verify-msw` - Check for MSW v1/v2 compliance issues

## Understanding MSW v1 vs v2

| MSW v1 (❌ Old) | MSW v2 (✅ Current) |
|---|---|
| `import { rest } from 'msw'` | `import { http, HttpResponse } from 'msw'` |
| `rest.get(url, resolver)` | `http.get(url, resolver)` |
| `rest.post(url, resolver)` | `http.post(url, resolver)` |
| `res.json(data)` | `HttpResponse.json(data)` |

## CI/CD Integration

For GitHub Actions, the workflow now includes nuclear cache clearing:

```yaml
- name: Clear any existing caches
  run: |
    rm -rf node_modules .vitest dist coverage
    rm -f package-lock.json
    npm cache clean --force

- name: Install dependencies
  run: npm ci

- name: Verify MSW v2 compliance
  run: node src/test/verify-msw-v2.js

- name: Run tests (no cache)
  run: npx vitest run --no-cache --config vitest.config.ts
```

## Troubleshooting Persistent Issues

1. **🚀 First, try the nuclear option**: `npm run test:nuclear`
2. **🔍 Verify MSW compliance**: `npm run test:verify-msw`
3. **🧹 Check for phantom cache files**: Look for hidden `.vitest` folders
4. **📦 Verify MSW version**: `npm ls msw` should show `^2.x.x`
5. **🔄 Restart your IDE/terminal** after clearing caches

The nuclear option should resolve 99% of MSW v1/v2 transition issues by ensuring a completely clean environment.
