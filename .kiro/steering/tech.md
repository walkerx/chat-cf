# Tech Stack & Build System

## Core Technologies

- **Runtime**: Cloudflare Workers (serverless edge platform)
- **Framework**: Hono 4.10+ (lightweight web framework)
- **Language**: TypeScript (ESNext target, strict mode)
- **Package Manager**: pnpm
- **Frontend**: React 19+ with Vite for bundling
- **Database**: Cloudflare D1 (SQLite-based)
- **Testing**: Vitest

## Key Dependencies

- `hono` - Web framework for Workers
- `react` + `react-dom` - Frontend UI
- `wrangler` - Cloudflare Workers CLI and type generation
- `vite` - Frontend build tool
- `vitest` - Test runner

## Common Commands

### Development
```bash
pnpm run dev              # Start local dev server (builds frontend + runs wrangler)
pnpm run dev:frontend     # Frontend dev server only (Vite)
```

### Building
```bash
pnpm run build:frontend   # Build React app to dist/
pnpm run build            # Full build (frontend + dry-run deploy check)
```

### Type Safety
```bash
pnpm run cf-typegen       # Generate CloudflareBindings types from wrangler.jsonc
pnpm run type-check       # TypeScript type checking (no emit)
pnpm run pre-commit       # Run typegen + type-check before committing
```

### Testing
```bash
pnpm run test             # Run all tests once
pnpm run test:watch       # Run tests in watch mode
```

### Deployment
```bash
pnpm run deploy           # Build + deploy to Cloudflare Workers (production)
```

## Configuration Files

- `wrangler.jsonc` - Workers config (bindings, D1 database, assets, observability)
- `tsconfig.json` - TypeScript config (strict mode, ESNext, JSX)
- `worker-configuration.d.ts` - AUTO-GENERATED types (never edit manually)
- `vite.config.ts` - Frontend build config
- `vitest.config.ts` - Test runner config
- `.dev.vars` - Local environment variables (gitignored, use `.dev.vars.example` as template)

## Type Safety Rules

1. Always instantiate Hono with bindings: `new Hono<{ Bindings: CloudflareBindings }>()`
2. Run `pnpm run cf-typegen` after modifying `wrangler.jsonc` bindings
3. Never manually edit `worker-configuration.d.ts`
4. Use `c.env.BINDING_NAME` to access Cloudflare bindings (D1, secrets, etc.)

## Code Style

- Use `.js` extensions in imports (ESM requirement): `import { foo } from "./utils.js"`
- Prefer async/await over promises
- Use structured logging with JSON for observability
- Export types and interfaces for reusability
- Keep handlers thin - business logic in services/utils

## Environment Variables

- **Local dev**: Set in `.dev.vars` file (not committed)
- **Production**: Use `wrangler secret put <NAME>` for sensitive values
- **Access in code**: `c.env.VARIABLE_NAME` in Hono handlers

## Bundle Constraints

- Target: <50KB minified bundle size
- No Node.js-specific APIs (Workers runtime only)
- Compatibility date frozen at `2025-11-14` in wrangler.jsonc
