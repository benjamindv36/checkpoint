# Migration: Vitest -> Jest

Summary
- Project tests migrated from Vitest to Jest using `ts-jest` for TypeScript support.
- Jest configuration file: `jest.config.js` (preset `ts-jest`, `testEnvironment: 'node'`).
- Tests now rely on Jest globals; Vitest-specific imports were removed.

What I changed
- Updated `package.json` test scripts to use Jest:
  - `test`: `jest --runInBand`
  - `test:watch`: `jest --watch`
  - `test:coverage`: `jest --coverage`
- Installed `jest`, `ts-jest`, and `@types/jest` as dev dependencies.
- Added `jest.config.js` with `moduleNameMapper` mapping `@/` -> `<rootDir>/` (matches `tsconfig.json`).
- Removed Vitest imports from test files so Jest globals are used.
- Marked `vitest.config.ts` as removed (left a small placeholder comment).
- Uninstalled `vitest` and `@vitest/ui` from node_modules.

Commands to run locally
```powershell
npm install
npm test
npm run test:coverage
npm run test:watch
```

CI / Next Steps
- I did not find any CI workflow files in `.github/workflows/` in this repository — no automated CI detected. If you have CI elsewhere (external pipeline), update it to run `npm test`.
- Optionally remove any leftover Vitest references from `package-lock.json` (running `npm install`/`npm prune` after uninstall will keep the lockfile clean).
- Consider adding a coverage badge to the README after running `npm run test:coverage` and pushing the coverage report to a service (Codecov, Coveralls) if desired.

Notes about compatibility
- Vitest-specific utilities like `vi.mock` map to `jest.mock` and `vi.spyOn` to `jest.spyOn`. I scanned the tests and did not find runtime `vi.*` usage beyond imports.
- If other parts of the codebase were using Vitest runner features, we should convert them to Jest equivalents.

If you want, I can:
- Update/add CI workflow(s) to run Jest (GitHub Actions template),
- Run coverage and add a short badge snippet for `README.md`,
- Remove the `vitest.config.ts` file entirely (currently marked as removed in-place),
- Create a small PR with these changes.

If you'd like me to proceed with any of the CI/coverage steps, tell me which and I'll continue.