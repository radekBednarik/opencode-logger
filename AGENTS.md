# Agent Guidelines for opencode-logger

This document provides comprehensive instructions, conventions, and workflows for AI agents and developers working on the `opencode-logger` repository.

## 1. Project Overview & Environment

- **Purpose:** This project implements a logger plugin for the OpenCode AI ecosystem.
- **Runtime:** [Bun](https://bun.sh/) (latest) is the sole runtime and package manager. Do not use Node.js or npm/yarn/pnpm commands.
- **Language:** TypeScript (Strict ESNext/NodeNext).
- **Tooling:**
  - **Linter/Formatter:** [Biome](https://biomejs.dev/).
  - **Testing:** Native Bun Test runner.
  - **Git Hooks:** Husky + lint-staged.

## 2. Directory Structure

```text
.
├── __tests__/           # Unit tests (centralized per bunfig.toml)
├── dist/                # Compiled output (generated)
├── src/
│   ├── index.ts         # Main entry point (Plugin definition)
│   └── ...              # Other source files
├── manual-test-npm/     # Manual testing harness (consumer simulation)
├── bun.lock             # Lockfile (do not edit manually)
├── bunfig.toml          # Bun configuration (test roots, etc.)
├── package.json         # Manifest, scripts, dependencies
└── tsconfig.json        # TypeScript configuration (Strict, NodeNext)
```

## 3. Development Commands

Always use the defined scripts in `package.json`.

### Build & Compilation
- **Build Distribution:**
  ```bash
  bun run build-dist
  ```
  *Details:* Runs `bunx tsc` to compile source code to the `dist/` directory.

- **Type Checking:**
  ```bash
  bun run typecheck
  ```
  *Details:* Runs `tsc --noEmit --pretty` to verify types without generating files.

### Code Quality (Linting & Formatting)
- **Lint:**
  ```bash
  bun run lint
  ```
  *Details:* Runs `bunx biome lint --write ./src`. Fixes auto-fixable issues.

- **Format:**
  ```bash
  bun run format
  ```
  *Details:* Runs `bunx biome format --write`. Enforces consistent styling.

- **Run All Checks:**
  ```bash
  bun run forlint
  ```
  *Details:* Runs both linting and formatting in sequence.

### Testing
- **Run Unit Tests:**
  ```bash
  bun test
  ```
- **Run Specific Test File:**
  ```bash
  bun test __tests__/index.spec.ts
  ```
- **Filter Tests by Name:**
  ```bash
  bun test -t "logger initialization"
  ```
- **Watch Mode:**
  ```bash
  bun test --watch
  ```

## 4. Code Style & Conventions

### TypeScript Configuration
- **Strict Mode:** Enabled. No `any` types unless absolutely necessary (and commented).
- **Module System:** `NodeNext`. This requires file extensions in imports (e.g., `import { foo } from "./foo.js"` even for `.ts` source files) or relying on bundler resolution. However, check `tsconfig.json` settings: `moduleResolution: nodenext`.
- **Imports:**
  - Use `import type` for interfaces/types.
  - Use Path Aliases (`@/*`) where configured in `tsconfig.json` to avoid long relative paths (`../../`).

### Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `logger-service.ts`, `event-handler.ts`).
- **Classes/Interfaces:** `PascalCase` (e.g., `LoggerPlugin`, `LogEvent`).
- **Variables/Functions:** `camelCase` (e.g., `initLogger`, `handleEvent`).
- **Constants:** `UPPER_SNAKE_CASE` for global constants.

### Biome Formatting Rules
- **Indentation:** Uses Tabs (or Spaces as configured in `biome.json` default).
- **Semicolons:** Always required.
- **Quotes:** Double quotes preferred.
- *Note:* Do not fight the formatter. Run `bun run format` to fix style issues automatically.

### Error Handling
- **Async/Await:** Prefer `async/await` over raw Promises.
- **Try/Catch:** Wrap plugin logic in try/catch blocks to prevent crashing the host application.
- **Logging:** Use the internal logger or `console.log` with structured prefixes (e.g., `[OpenCode Logger] Error:`).

## 5. Testing Guidelines

### Unit Tests (`__tests__/`)
- **Framework:** Bun Test (compatible with Jest/Vitest API).
- **Structure:**
  ```typescript
  import { describe, it, expect } from "bun:test";
  import { loggerPlugin } from "../src/index.js";

  describe("loggerPlugin", () => {
    it("should initialize correctly", async () => {
      const plugin = await loggerPlugin();
      expect(plugin).toBeDefined();
    });
  });
  ```
- **Mocking:** Use `mock()` from `bun:test` if external dependencies need mocking.

### Manual Tests (`manual-test-npm/`)
- This directory is used for manual testing.
- It simulates a consumer installing the package.
- It uses `link:` protocol to symlink the local package.

## 6. Git Workflow & Hooks

- **Pre-commit:**
  - Husky triggers `lint-staged`.
  - Staged `*.{js,ts}` files are automatically linted and formatted (`bun run forlint`).
  - If this step fails, the commit is blocked. Fix the errors and re-add the files.
- **Commit Messages:**
  - Use clear, descriptive summaries.
  - Format: `type(scope): description` (e.g., `feat(logger): add timestamp to logs`, `fix(deps): update bun types`).

## 7. Troubleshooting

- **"Module not found":**
  - Check if you are using the correct import extension (try `.js` in imports if using `NodeNext`).
  - Verify path aliases in `tsconfig.json`.
- **"Type error during build":**
  - Run `bun run typecheck` to see the full error list.
  - Ensure `peerDependencies` are installed if working in a consumer context.
- **Biome Errors:**
  - Run `bun run forlint` to attempt auto-fixing.
  - If a rule is too strict for a specific line, use `// biome-ignore lint/ruleName: reason`.

## 8. Agent Behavior Rules

1. **Read First:** Always read `package.json` and `tsconfig.json` before making assumptions about the environment.
2. **Minimal Changes:** Modify only what is requested.
3. **Verify:** Always run `bun run typecheck` and `bun test` after making changes.
4. **No Phantom Files:** Do not create config files (like `.eslintrc`, `.prettierrc`) if the project uses Biome.
5. **Lockfile:** Respect `bun.lock`. Use `bun install` to update it, never edit it manually.

---
*Generated for OpenCode AI Agents.*
