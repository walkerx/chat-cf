# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI chat application built on Cloudflare Workers with Hono framework. Features streaming AI responses via Server-Sent Events (SSE) and Character Card V3 (CCv3) support for rich character personalities with dynamic prompt rendering.

**Tech Stack:**
- Backend: Cloudflare Workers, Hono, Drizzle ORM, D1 (SQLite)
- Frontend: React 19, Vite, TypeScript
- AI: OpenRouter API (default model: deepseek/deepseek-v3.2-exp)
- Character Cards: CCv3 format with CBS macros, lorebook entries, Jinja templates

## Essential Commands

### Development
```bash
pnpm run dev              # Build frontend + start Wrangler dev server (localhost:8787)
pnpm run dev:frontend     # Frontend dev server only (Vite, localhost:5173)
pnpm run dev:debug        # Dev server with Node inspector on port 9229
```

### Testing & Type Checking
```bash
pnpm run test             # Run all tests once (Vitest)
pnpm run test:watch       # Run tests in watch mode
pnpm run type-check       # Type check both backend and frontend
pnpm run pre-commit       # Generate types + type check (run before committing)
```

### Database Operations
```bash
# After modifying src/db/schema.ts:
pnpm run db:generate      # Generate migration files in src/db/migrations/
pnpm run db:migrate       # Apply migrations locally
pnpm run db:migrate:prod  # Apply migrations to production

# Character card seeding:
pnpm run seed:characters  # Generate seed SQL from examples/character-cards/
wrangler d1 execute DB --local --file=seed.sql  # Apply seed data
```

### Build & Deploy
```bash
pnpm run build            # Full build (frontend + dry-run deploy check)
pnpm run deploy           # Build + deploy to Cloudflare
pnpm run cf-typegen       # Generate CloudflareBindings types from wrangler.jsonc
```

## Architecture

### Backend Structure (`src/`)

**Entry Point:**
- `index.ts` - Hono app initialization, CORS, middleware pipeline, route definitions

**Handlers (Request Controllers):**
- `handlers/chat-stream.ts` - POST /api/chat/stream (SSE streaming)
- `handlers/conversations.ts` - GET /api/conversations, /api/conversations/:id
- `handlers/character-cards.ts` - CRUD endpoints for character cards

**Services (Core Business Logic):**
- `services/prompt-builder.ts` - **Orchestrator** for entire prompt construction pipeline
  - Coordinates CBS processing, lorebook matching, template rendering
  - Compiles static character context once per conversation (cached in DB)
  - Processes dynamic context (lorebook, macros) per message
- `services/cbs-processor.ts` - Curly Braced Syntax (CBS) macro processor
  - Handles {{char}}, {{user}}, {{random:}}, {{pick:}}, {{roll:}}, etc.
- `services/lorebook-engine.ts` - Lorebook entry matching and decorator parsing
  - Matches keywords in conversation context
  - Processes decorators (@@depth, @@role, @@scan_depth, etc.)
- `services/template-renderer.ts` - Jinja template rendering (ChatML, Alpaca, Llama)
- `services/openrouter.ts` - OpenRouter API client for streaming chat completions
- `services/db.ts` - Database client wrapping Drizzle ORM operations

**Models (Type Definitions):**
- `models/character-card.ts` - CCv3 data structures, validation, creation utilities
- `models/conversation.ts` - Conversation entity with ID generation
- `models/message.ts` - Message entity (user/assistant roles)
- `models/stream-chunk.ts` - SSE chunk format definitions

**Database:**
- `db/schema.ts` - Drizzle schema definitions (sessions, conversations, messages, character_cards)
- `db/mappers.ts` - Convert DB rows to domain models
- `db/migrations/` - Auto-generated SQL migration files

**Middleware:**
- `middleware/logger.ts` - Request/response logging
- `middleware/rate-limiter.ts` - Rate limiting for /api/* routes

**Utils:**
- `utils/session.ts` - Session ID generation and validation (UUID v4)
- `utils/errors.ts` - Standard error response formatting
- `utils/prompt.ts` - Helper for converting character context to OpenRouter format

### Frontend Structure (`public/src/`)

**Root:**
- `main.tsx` - React entry point
- `App.tsx` - Main application component
- `AppRoot.tsx` - Router and context provider setup

**Pages:**
- `pages/` - Top-level page components (chat, gallery, etc.)

**Components:**
- `components/CharacterCard.tsx` - Character card display and management
- `components/CharacterCardSelector.tsx` - Character selection dropdown
- `components/ChatDisplay.tsx` - Message list rendering
- `components/ChatInputForm.tsx` - User input form with streaming state
- `components/ChatHeader.tsx` - Chat header with conversation info
- `components/UserMenu.tsx` - User settings and nickname management
- `components/UsernameSetup.tsx` - First-time user nickname setup
- `components/UploadModal.tsx` - Character card JSON upload
- `components/ErrorBoundary.tsx`, `components/ChatErrorBoundary.tsx` - Error handling

**Services:**
- `services/` - Frontend API clients (fetch wrappers for backend endpoints)

**Contexts:**
- `contexts/` - React context providers (auth, session, etc.)

**Hooks:**
- `hooks/` - Custom React hooks

### Configuration Files

- `wrangler.jsonc` - Cloudflare Workers configuration
  - D1 database binding (DB)
  - Asset serving (./dist)
  - Environment variables (AI_MODEL)
  - Secrets: OPENROUTER_API_KEY (set via `wrangler secret put`)
- `vite.config.ts` - Vite build configuration
  - Root: ./public
  - Output: ./dist
  - Proxy /api → http://localhost:8787 (for dev)
  - Parses .dev.vars for VITE_* environment variables
- `tsconfig.json` - Backend TypeScript config (ESNext, module: Bundler)
- `public/tsconfig.json` - Frontend TypeScript config (React JSX)

## Character Card System

### Key Concepts

1. **Static Compilation (Once per Conversation):**
   - Character description, personality, scenario, system_prompt
   - Constant lorebook entries (constant=true)
   - Cached in `conversations.compiled_context` JSON column
   - ~50-100ms first message overhead

2. **Dynamic Processing (Per Message):**
   - Lorebook entry matching based on recent messages
   - CBS macro processing in current message
   - Template rendering with matched entries
   - ~10-20ms per message

3. **Prompt Flow:**
   ```
   User Message
   ↓
   PromptBuilder.buildPrompt()
   ↓
   ├─ Load/Compile Static Context (if not cached)
   │  ├─ CBSProcessor.process(description, personality, etc.)
   │  └─ LorebookEngine.findConstantEntries()
   ↓
   ├─ Dynamic Processing
   │  ├─ LorebookEngine.findMatches(messages + current prompt)
   │  ├─ CBSProcessor.process(matched lorebook content)
   │  └─ CBSProcessor.process(user prompt)
   ↓
   ├─ TemplateRenderer.render(template, context)
   ↓
   └─ OpenRouter API (streaming)
   ```

### CBS Macros
- `{{char}}` → Character nickname (or name)
- `{{user}}` → User's display name
- `{{random:A,B,C}}` → Random selection
- `{{pick:A,B,C}}` → Deterministic selection (same seed = same result)
- `{{roll:6}}` or `{{roll:d6}}` → Random number 1-6
- `{{reverse:text}}` → Reverses text
- `{{// comment}}` → Removed from output
- `{{hidden_key:text}}` → Used for lorebook scanning but removed from output

### Lorebook Decorators
- `@@depth N` - Insert at Nth message from most recent
- `@@role assistant|system|user` - Format as specific message role
- `@@activate_only_after N` - Only activate after N assistant messages
- `@@activate_only_every N` - Activate every N messages
- `@@position after_desc|before_desc` - Position relative to description
- `@@scan_depth N` - Only scan last N messages for keys

### Important Implementation Details

**Session Management:**
- Sessions are anonymous (UUID v4 in X-Session-ID header)
- Frontend stores session ID in localStorage
- Backend validates and auto-generates if missing
- Foreign key constraint: conversations.session_id → client_sessions.id

**Conversation Lifecycle:**
1. First message: Create conversation with character_card_id
2. Compile static context → store in conversations.compiled_context
3. Subsequent messages: Load compiled context from DB (no recompilation)
4. Character card updates do NOT affect existing conversations (by design)

**Streaming Response Format:**
- Server-Sent Events (SSE) with `text/event-stream`
- Chunks: `data: {...}\n\n`
- Chunk types: `conversationId`, `messageId`, `token`, `done`, `error`
- See `models/stream-chunk.ts` for full spec

**Database Cascading:**
- Deleting session → deletes all conversations + messages
- Deleting conversation → deletes all messages
- Deleting character card → sets conversation.character_card_id to NULL

## Development Workflow

1. **Making Schema Changes:**
   ```bash
   # 1. Edit src/db/schema.ts
   # 2. Generate migration
   pnpm run db:generate
   # 3. Review generated SQL in src/db/migrations/
   # 4. Apply locally
   pnpm run db:migrate
   # 5. Test changes
   pnpm run dev
   # 6. Commit migration files
   git add src/db/migrations/
   ```

2. **Testing Changes:**
   - Backend: Add tests in `tests/` using Vitest
   - Run `pnpm run test` or `pnpm run test:watch`
   - Type check: `pnpm run type-check`

3. **Adding API Endpoints:**
   - Create handler in `handlers/` directory
   - Import and register route in `src/index.ts`
   - Update frontend service in `public/src/services/`

4. **Adding Character Card Features:**
   - CBS macros: Update `services/cbs-processor.ts`
   - Lorebook decorators: Update `services/lorebook-engine.ts`
   - Template formats: Update `services/template-renderer.ts`

## Environment Variables & Secrets

**Local Development (.dev.vars):**
```
OPENROUTER_API_KEY=your_key_here
AI_MODEL=deepseek/deepseek-v3.2-exp
VITE_API_BASE_URL=http://localhost:8787
```

**Production (Cloudflare Secrets):**
```bash
wrangler secret put OPENROUTER_API_KEY
```

**Frontend Environment Variables:**
- Must be prefixed with `VITE_` to be exposed to client
- Parsed by vite.config.ts parseDevVars() function

## Common Patterns

**Error Handling:**
- Use `createStandardErrorResponse()` from `utils/errors.ts`
- Standard error codes: UNAUTHORIZED, INVALID_REQUEST, NOT_FOUND, INTERNAL_ERROR
- Streaming errors: Use `formatErrorAsStreamChunk()` for SSE error responses

**Database Operations:**
- Always use `DatabaseClient` from `services/db.ts`
- Never use Drizzle directly in handlers
- Transactions: Use `db.db.transaction()` when needed

**Type Safety:**
- Run `pnpm run cf-typegen` after wrangler.jsonc changes
- CloudflareBindings type auto-generated in `worker-configuration.d.ts`
- Pass to Hono: `new Hono<{ Bindings: CloudflareBindings }>()`
