# Project Structure

## Overview

Monorepo structure with backend (Cloudflare Workers) and frontend (React SPA) in a single workspace.

## Directory Layout

```
src/                      # Backend source (Cloudflare Workers)
├── index.ts              # Hono app entry point, middleware, route registration
├── handlers/             # HTTP request handlers (thin layer)
│   ├── chat-stream.ts    # POST /api/chat/stream - SSE streaming
│   └── conversations.ts  # GET /api/conversations - history listing
├── models/               # Entity type definitions and factories
│   ├── conversation.ts   # Conversation entity + ID generation
│   ├── message.ts        # Message entity + ID generation
│   ├── client-session.ts # ClientSession entity
│   └── stream-chunk.ts   # StreamChunk type for SSE
├── services/             # Business logic and external integrations
│   ├── db.ts             # D1 database client wrapper
│   └── openrouter.ts     # OpenRouter API client
├── middleware/           # Hono middleware
│   ├── logger.ts         # Request logging
│   └── rate-limiter.ts   # Rate limiting
└── utils/                # Shared utilities
    ├── errors.ts         # Error codes and formatting
    ├── prompt.ts         # Context preparation for AI
    ├── session.ts        # Session ID validation/generation
    └── stream.ts         # SSE parsing utilities

public/                   # Frontend source (React SPA)
├── index.html            # HTML entry point
└── src/
    ├── main.tsx          # React app entry point
    ├── App.tsx           # Root component
    ├── components/       # React components
    │   ├── ChatDisplay.tsx
    │   ├── ChatInputForm.tsx
    │   └── ErrorDisplay.tsx
    ├── hooks/            # Custom React hooks
    │   └── useChat.ts
    ├── services/         # Frontend API clients
    │   ├── api.ts        # Fetch wrapper for backend API
    │   └── session.ts    # Session ID management (localStorage)
    └── styles/
        └── app.css       # Global styles

tests/                    # Test files
├── contract/             # API contract tests
├── integration/          # Integration tests (E2E flows)
├── unit/                 # Unit tests (mirrors src/ structure)
└── fixtures/             # Test data and mocks

specs/                    # Feature specifications
└── 001-ai-chat-stream/   # Current feature spec
    ├── spec.md           # Requirements and user stories
    ├── plan.md           # Implementation plan
    ├── tasks.md          # Task breakdown
    ├── contracts/        # API and database contracts
    │   ├── api.openapi.yaml
    │   └── database.sql
    └── checklists/       # Quality checklists

dist/                     # Build output (gitignored)
.wrangler/                # Wrangler local state (gitignored)
node_modules/             # Dependencies (gitignored)
```

## Architecture Patterns

### Backend (src/)

- **Handlers**: Thin layer that validates input, calls services, formats responses
- **Services**: Business logic, external API calls, database operations
- **Models**: Type definitions, entity factories, ID generation
- **Utils**: Pure functions, no side effects, highly reusable
- **Middleware**: Cross-cutting concerns (logging, rate limiting, CORS)

### Frontend (public/src/)

- **Components**: Presentational React components
- **Hooks**: Custom hooks for state management and side effects
- **Services**: API clients and browser storage management

## File Naming Conventions

- Use kebab-case for files: `chat-stream.ts`, `error-display.tsx`
- Use PascalCase for React components: `ChatDisplay.tsx`
- Use `.ts` for TypeScript, `.tsx` for React components
- Test files: `*.test.ts` (co-located with source or in tests/)

## Import Conventions

- Always use `.js` extension in imports (ESM requirement)
- Use relative imports within same module: `./utils.js`
- Import types with `import type` when possible
- Group imports: external deps → internal modules → types

## Key Files

- `src/index.ts` - Main entry point, defines all routes and middleware
- `wrangler.jsonc` - Cloudflare Workers configuration (bindings, database)
- `worker-configuration.d.ts` - Auto-generated types (DO NOT EDIT)
- `package.json` - Dependencies and scripts
- `.dev.vars` - Local environment variables (gitignored)

## Adding New Features

1. Create spec in `specs/[feature-name]/`
2. Add handlers in `src/handlers/`
3. Add services/models/utils as needed
4. Register routes in `src/index.ts`
5. Add tests in `tests/`
6. Update frontend components in `public/src/`

## Database

- Schema defined in `specs/001-ai-chat-stream/contracts/database.sql`
- Access via `c.env.DB` binding in handlers
- Wrapped by `DatabaseClient` service in `src/services/db.ts`
