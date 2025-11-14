# Implementation Plan: AI Chat (Streaming)

**Branch**: `001-ai-chat-stream` | **Date**: 2025-11-14 | **Spec**: `specs/001-ai-chat-stream/spec.md`
**Input**: Feature specification from `/specs/001-ai-chat-stream/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a simple AI chat feature on Cloudflare Workers with streaming output support. Users submit text prompts to a `/api/chat/stream` endpoint, which returns server-sent events (SSE) with chunked AI responses in real-time. The backend uses Hono framework on Workers, persists conversation history to an external database (D1 or third-party), and tracks users via session-based identifiers. The frontend (React or Vue) provides a clean, modern web UI with multi-turn conversation support, stream cancellation, and error handling. Target: MVP with fail-fast error strategy, text-only input, and 100 concurrent session capacity.

## Technical Context

**Language/Version**: TypeScript (ESNext via Hono 4.10.5+, Node.js 18+)

**Primary Dependencies**:

- Backend: Hono (web framework), wrangler (CLI/types), @hono/streaming (SSE/streaming support)
- Frontend: React 18+ or Vue 3+ (component framework), axios/fetch (HTTP client)
- Infrastructure: Cloudflare Workers (serverless edge), Wrangler 4.48+

**Storage**: External database (D1 or third-party):

- **Conversations table**: id, sessionId, createdAt, updatedAt, title (auto-inferred)
- **Messages table**: id, conversationId, role (user|assistant), content, createdAt
- **ClientSessions table**: id (UUID), createdAt, lastActivity, metadata (browser/IP)

**Testing**: Vitest (unit tests for handlers), MSW (mock streaming API), Playwright (E2E for UI/SSE)

**Target Platform**: Cloudflare Workers edge (global distribution via `wrangler deploy`)

**Project Type**: Web application (backend API on Workers + React/Vue frontend in `public/`)

**Performance Goals**:

- First chunk latency: **1 second (95th percentile)**
- Stream completion success rate: **≥99%** for valid requests
- Cancellation acknowledgment: **≤500ms (95th percentile)**
- Max concurrent sessions: **100** simultaneous active streams

**Constraints**:

- Worker bundle size: **<50 KB** (minified)
- Stream completion time: **≤1000ms** for typical ~200-token AI responses
- Message latency from submission to first chunk: **≤1000ms**
- Session storage overhead: **negligible** (stateless Workers, session ID in request header only)
- No long-running processes (Workers CPU limit: 30s wall-clock)

**Scale/Scope**: MVP single-feature (AI chat only):

- **User Stories**: 3 (one-off Q&A, multi-turn conversation, stream cancellation/resume)
- **API Endpoints**: 1 primary (`POST /api/chat/stream` for SSE), 1 helper (`GET /api/conversations` to list history)
- **UI Screens**: 1 main (chat interface with message list, input form, streaming display)
- **Entities**: 4 (Conversation, Message, StreamChunk, ClientSession)
- **Estimated implementation**: ~200 lines backend (Hono handlers), ~300 lines frontend (React/Vue components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ Constitution v1.0.0 Alignment**: All core principles satisfied.

| Principle | Assessment | Notes |
|-----------|------------|-------|
| **I. Serverless-First (NON-NEGOTIABLE)** | ✅ PASS | Hono on Cloudflare Workers (stateless edge execution). Session state purely ephemeral in request headers; persistent data in external D1 database. No long-running processes or background workers needed for MVP. |
| **II. Type & Binding Safety** | ✅ PASS | Hono instantiated with `Hono<{ Bindings: CloudflareBindings }>()`. D1 binding declared in `wrangler.jsonc`, types regenerated via `pnpm run cf-typegen` after any binding changes. |
| **III. Minimal Bundle & Compatibility** | ✅ PASS | Hono + @hono/streaming + minimal polyfills only. Compatibility date frozen at `2025-11-14`. No Node-specific APIs; JSX via `hono/jsx` if needed for dynamic templates. Target: <50KB minified bundle. |
| **IV. Observability & Local Parity** | ✅ PASS | Observability enabled in `wrangler.jsonc` for request/performance logging. Local dev via `pnpm run dev` (wrangler) matches production edge behavior. Structured logging for API requests, stream chunks, and errors. |
| **V. Deployment-as-Code & Type-First** | ✅ PASS | All config via `wrangler.jsonc` (no UI-based settings). Secrets managed via `wrangler secret` (production only). CI validates type sync before deploy. Type generation part of developer workflow. |

**Governance Assessment**: No violations detected. The design aligns with all five core principles. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-stream/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (COMPLETED)
├── research.md          # Phase 0 output (/speckit.plan command) - PENDING
├── data-model.md        # Phase 1 output (/speckit.plan command) - PENDING
├── quickstart.md        # Phase 1 output (/speckit.plan command) - PENDING
├── contracts/           # Phase 1 output (/speckit.plan command) - PENDING
│   ├── api.openapi.yaml # OpenAPI 3.1 spec for streaming chat endpoint
│   └── database.sql      # D1 schema for conversations/messages/sessions
├── checklists/
│   └── requirements.md   # Quality checklist (COMPLETED)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Structure Selected**: Option 2 (Web application - Cloudflare Workers backend + static frontend)

```text
src/
├── index.ts              # Hono app entry point, route handlers for /api/chat/stream, /api/conversations
├── handlers/
│   ├── chat-stream.ts    # POST /api/chat/stream (SSE streaming logic)
│   └── conversations.ts  # GET /api/conversations (history listing)
├── models/
│   ├── conversation.ts   # Conversation entity type definitions
│   ├── message.ts        # Message entity type definitions
│   └── client-session.ts # ClientSession entity type definitions
├── services/
│   ├── db.ts             # D1 database client wrapper
│   └── stream.ts         # Stream chunking and error handling utilities
└── utils/
    └── session.ts        # Session ID parsing and validation

public/
├── index.html            # Main HTML entry point
├── src/                  # Frontend source (React/Vue app)
│   ├── main.tsx          # Application entry point (React) or main.ts (Vue)
│   ├── app.tsx           # Root App component
│   ├── components/
│   │   ├── chat-interface.tsx    # Chat message list + input form
│   │   ├── message-item.tsx      # Single message display
│   │   ├── streaming-display.tsx # Real-time chunk display
│   │   └── error-banner.tsx      # Error notification UI
│   ├── services/
│   │   ├── api.ts        # Fetch wrapper for /api/chat/stream
│   │   └── session.ts    # Session ID management (localStorage)
│   └── styles/
│       └── app.css       # Tailwind or vanilla CSS for clean modern design
└── vite.config.ts        # (if using Vite for frontend build)

tests/
├── integration/
│   ├── chat-stream.test.ts       # E2E streaming behavior
│   └── conversations.test.ts     # History listing
├── unit/
│   ├── handlers/
│   │   └── chat-stream.test.ts
│   ├── services/
│   │   ├── db.test.ts
│   │   └── stream.test.ts
│   └── utils/
│       └── session.test.ts
└── fixtures/
    └── mock-responses.ts         # Mock AI API responses for testing

# Configuration files (root)
wrangler.jsonc               # Cloudflare Workers config (D1 binding, ASSETS, observability)
package.json                 # npm/pnpm scripts (dev, build, test, deploy)
tsconfig.json                # TypeScript strict mode, JSX, ESNext
worker-configuration.d.ts    # AUTO-GENERATED by cf-typegen (do NOT edit manually)
```

**Structure Decision**: Web application with Cloudflare Workers backend (`src/`) and static frontend (`public/`). Workers handles `/api/*` endpoints (streaming chat, conversation history), while `public/index.html` serves the React/Vue UI and static assets via the `ASSETS` binding. This aligns with the project's existing architecture and Constitution Principle III (minimal bundle).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** The design fully adheres to Constitution v1.0.0 (Serverless-First, Type & Binding Safety, Minimal Bundle, Observability, Deployment-as-Code). No architectural exceptions needed for the MVP scope.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | N/A | N/A |

---

## Phase 0: Research (Completed ✅)

**Status**: COMPLETED (2025-11-14)

**Deliverables**:

- ✅ `research.md`: Technology decisions consolidated
  - AI API: Selected OpenRouter (OpenAI-compatible aggregator for flexibility, multiple model support, cost optimization)
  - Database: Selected Cloudflare D1 (co-located, included cost, type safety)
  - Frontend: Selected React 18+ (ecosystem, streaming integration, velocity)
  - Streaming: Selected SSE (native, simple, no stateful connection needed)

## Phase 1: Design & Contracts (Completed ✅)

**Status**: COMPLETED (2025-11-14)

**Deliverables**:

- ✅ `data-model.md`: Entity definitions with relationships
  - ClientSession, Conversation, Message, StreamChunk (ephemeral)
  - Field types, constraints, indexes, lifecycle
  - Query patterns and storage estimates
- ✅ `contracts/database.sql`: D1 schema (CREATE TABLE, indexes, FK constraints)
- ✅ `contracts/api.openapi.yaml`: OpenAPI 3.1 spec with all endpoints
  - POST /api/chat/stream (streaming via SSE)
  - GET /api/conversations (list user's conversations)
  - GET /api/conversations/{id} (load conversation + message history)
- ✅ `quickstart.md`: Developer onboarding guide
  - Setup, environment variables, local dev server
  - API testing via curl, frontend testing, troubleshooting

## Phase 2: Implementation (Next Step ➡️)

**Status**: PENDING (queued for execution)

**Scope**: Build handlers, React components, tests

**Deliverables** (to be generated via `/speckit.tasks`):

- `tasks.md`: Implementation task list with story points, acceptance criteria
- Hono handlers: `/api/chat/stream`, `/api/conversations`, message persistence
- React components: ChatInterface, MessageList, StreamingDisplay, ErrorBanner
- Tests: Unit tests (handlers, utilities), E2E tests (streaming, multi-turn)
- Agent context: Updated via `update-agent-context.sh copilot`
