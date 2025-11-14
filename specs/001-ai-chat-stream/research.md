# Research: AI Chat (Streaming) - Technology Decisions

**Branch**: `001-ai-chat-stream` | **Date**: 2025-11-14
**Purpose**: Consolidate research findings on unresolved technology decisions for AI chat streaming feature.

---

## 1. AI API Provider Selection

**Problem Statement**: Determine which external AI API to use for chat completions and streaming responses.

### Candidates

#### Option A: Anthropic Claude (API)
**Characteristics**:
- Streaming support: ✅ Yes (Server-Sent Events via HTTP API)
- Latency: ~200-800ms first token (varies by model: Claude 3 Opus, Sonnet, Haiku)
- Cost: $3/$15 per 1M input/output tokens (Haiku/Opus)
- Authentication: API key in header (simple)
- Workers compatibility: ✅ Full support via fetch (no Node.js SDK needed, use REST API)
- Error handling: Structured error responses; supports streaming error messages

**Cloudflare Workers Considerations**:
- Can use direct HTTP fetch to `api.anthropic.com` (no SDK needed → smaller bundle)
- Stream via `fetch(..., { signal })` with AbortController for cancellation
- Latency acceptable for edge deployment
- Cost: Reasonable per-token pricing, scales linearly

#### Option B: OpenAI (API)
**Characteristics**:
- Streaming support: ✅ Yes (Server-Sent Events)
- Latency: ~100-600ms first token (GPT-4, GPT-3.5)
- Cost: $0.50-$30 per 1M input/output tokens (3.5-Turbo/GPT-4)
- Authentication: API key in header (simple)
- Workers compatibility: ⚠️ SDK uses Node-specific modules; recommend REST API instead
- Error handling: Structured errors; streaming includes error recovery

**Cloudflare Workers Considerations**:
- REST API via fetch works well (no SDK needed)
- Streaming: `fetch` with `response.body.getReader()` for events
- Latency acceptable but varies more than Claude
- Cost: Higher than Claude Haiku, but model variety (Turbo cheaper)
- Vendor lock-in: Heavy dependencies on OpenAI ecosystem

#### Option C: Hugging Face Inference API
**Characteristics**:
- Streaming support: ✅ Yes (Server-Sent Events)
- Latency: ~500ms-2s first token (shared inference endpoints)
- Cost: Free tier limited; $9+/month for dedicated endpoints
- Authentication: Bearer token in header
- Workers compatibility: ✅ HTTP API only
- Error handling: Basic error responses

**Cloudflare Workers Considerations**:
- REST API via fetch works well
- Good for open-source models (Llama, Mistral, etc.)
- Latency slower than commercial APIs (shared hardware)
- Cost: Predictable if using dedicated endpoint
- Community-driven model updates (less stability)

#### Option D: Local/Embedded Model on Workers (via WASM/ONNX)
**Characteristics**:
- Streaming support: ✅ Yes (in-process streaming)
- Latency: ~2-10s per response (quantized model on edge)
- Cost: $0 (compute bundled in Worker execution, within CPU limits)
- Authentication: N/A (internal)
- Workers compatibility: ⚠️ Requires WASM or ONNX Runtime (bundle size risk)
- Error handling: Simple (application-level only)

**Cloudflare Workers Considerations**:
- Bundle size: WASM model files typically 500MB-2GB (exceeds Worker limits)
- Execution time: Quantized small models (e.g., TinyLlama) run in <10s, but risky
- Not recommended for MVP: Technical debt, model quality issues, unpredictable cold starts
- Better as Phase 2 optimization (if needed)

#### Option E: OpenRouter (OpenAI-Compatible Aggregator)

**Characteristics**:

- Streaming support: ✅ Yes (Server-Sent Events, OpenAI-compatible format)
- Latency: ~150-400ms first token (depends on selected model; supports Claude, GPT-4, Llama, Mistral, etc.)
- Cost: $0.80-$30 per 1M tokens (varies by model; competitive with direct API pricing)
- Authentication: Bearer token in header (OpenAI-compatible)
- Workers compatibility: ✅ Full support via fetch (uses OpenAI SDK-compatible REST API)
- Error handling: OpenAI-compatible error responses; supports streaming error messages
- Multi-Model Support: Single API endpoint supports 100+ models from different providers (Claude, OpenAI, Open Source)

**Cloudflare Workers Considerations**:

- API Compatibility: Uses OpenAI-compatible chat completion format (no provider-specific parsing needed)
- Bundle Size: OpenAI SDK is smaller than Anthropic SDK; REST API fetch also works (keeps bundle <50KB)
- Model Flexibility: Switch between Claude, GPT-4, Llama without code changes (just change `model` parameter)
- Latency: Comparable to direct API calls; routing logic transparent to client
- Cost Optimization: Can route cheaper models for common requests, expensive models for complex queries
- Vendor Lock-In: Minimal; standardized OpenAI API format means easy migration to OpenAI or other OpenAI-compatible providers

### Decision

**SELECTED**: **Option E - OpenRouter (OpenAI-Compatible Aggregator)**

### Rationale

1. **API Standardization**: OpenAI-compatible format (`/v1/chat/completions`) means code is portable across multiple AI providers.
2. **Model Flexibility**: Single API endpoint supports 100+ models (Claude Opus/Sonnet/Haiku, GPT-4, Llama, Mistral, etc.); switch models without code changes.
3. **Cost Optimization**: Route different models based on complexity (cheap Haiku for simple queries, Opus for complex reasoning) without code changes.
4. **Minimal Vendor Lock-In**: Standardized API format; if OpenRouter becomes unsuitable, migrate to OpenAI directly (same code) or other OpenAI-compatible provider.
5. **Streaming Support**: Native SSE streaming with OpenAI-compatible format; existing OpenAI SDK examples apply directly.
6. **Bundle Size**: OpenAI SDK is lightweight; direct HTTP fetch also works (keeps Worker bundle <50KB).
7. **Scalability**: OpenRouter handles load balancing and fallbacks transparently; more reliable than single-provider direct API.

### Alternatives Considered

- **Option A (Anthropic Claude)**: High-quality reasoning, but single-provider lock-in. Would require code changes to switch providers.
- **Option B (OpenAI)**: Good quality and widespread adoption, but higher cost and tight integration with OpenAI ecosystem.
- **Option C (HF Inference)**: Good for open-source models but slower latency (~500ms+), less suitable for 1s target.
- **Option D (Local WASM)**: Bundle size + execution time risk; out of scope for MVP.
- **Option E (OpenRouter)**: **SELECTED** - Provides flexibility, standardization, and cost optimization without sacrificing latency or quality.

### Implementation Approach

**API Integration Pattern** (OpenAI-Compatible):

```typescript
// Streaming chat with OpenRouter using OpenAI-compatible API
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet', // Can change to 'openai/gpt-4', 'meta-llama/llama-2-70b', etc.
    max_tokens: 500,
    stream: true,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});

// Parse OpenAI-compatible SSE streaming format
for await (const line of response.body) {
  if (line.startsWith('data: ')) {
    const delta = JSON.parse(line.slice(6));
    // Process delta (compatible with OpenAI SDK streaming format)
    yield formatStreamChunk(delta);
  }
}
```

**Environment Variable**: `OPENROUTER_API_KEY` (stored via `wrangler secret put`)

**Model Routing Strategy** (Optional, for cost optimization):

- Default: `anthropic/claude-3.5-sonnet` (high quality, balanced cost)
- For simple queries: `anthropic/claude-3-haiku` (fastest, cheapest)
- For complex reasoning: `openai/gpt-4-turbo` (highest quality)
- Route selection can be added in Phase 2 as cost optimization

---

---

## 2. Database Choice: D1 vs. Third-Party

**Problem Statement**: Determine where to persist conversation history and session metadata.

### Candidates

#### Option A: Cloudflare D1 (SQLite on Edge)
**Characteristics**:
- Technology: SQLite (embedded database)
- Deployment: Distributed across Cloudflare edge locations
- Latency: <10ms (co-located with Worker)
- Scalability: Beta; ~100 concurrent connections per shard
- Cost: Included in Cloudflare Workers plan (no additional charge for initial usage)
- Backups: Automatic; point-in-time restore available
- Querying: SQL via Wrangler `d1 execute` or via Worker binding

**Cloudflare Workers Considerations**:
- Binding: Simple `c.env.DB` access in Hono handlers
- Type Safety: D1 binding auto-generated by `cf-typegen` (satisfies Constitution Principle II)
- SQL Schema: Define in `.sql` files, apply via `wrangler d1 execute`
- Vendor Lock-In: Medium (easy to export SQLite to other systems)
- Maturity: Beta phase; data integrity proven, but edge distribution still evolving

#### Option B: Postgres (Third-Party: Neon, Supabase, etc.)
**Characteristics**:
- Technology: PostgreSQL (industry standard OLTP)
- Deployment: Centralized (single region or multi-region failover)
- Latency: 50-200ms (depends on Worker location vs. DB region)
- Scalability: Mature; handles millions of connections
- Cost: ~$0.30-$2/day for hobby tier; scales to $50+/month for production
- Backups: Automated daily; point-in-time restore standard
- Querying: SQL via driver libraries (pg, prisma, etc.)

**Cloudflare Workers Considerations**:
- Network hop: Workers → Postgres adds 50-100ms latency (noticeable for 1s target)
- SDK: Use `@neondatabase/serverless` (Workers-compatible driver)
- Connection pooling: Cloudflare D1 + Postgres can use Neon's serverless driver for connection reuse
- Type Safety: ORM (Prisma, Drizzle) provides types; no Workers auto-generation
- Vendor Lock-In: Low (standard SQL, easy to migrate)
- Maturity: Production-ready; proven at scale

#### Option C: MongoDB Atlas (Third-Party)
**Characteristics**:
- Technology: MongoDB (document-oriented NoSQL)
- Deployment: Managed multi-region clusters
- Latency: 100-300ms (depends on region proximity)
- Scalability: Excellent for unstructured data; sharding built-in
- Cost: ~$5-$100+/month for shared/dedicated clusters
- Backups: Automatic; Ops Manager for restore
- Querying: Document queries, aggregation pipeline

**Cloudflare Workers Considerations**:
- SDK: Use `mongodb` driver (not Workers-optimized; large bundle)
- Connection pooling: Requires persistent connections (risky on Workers' ephemeral processes)
- Document queries: Flexible schema; good for evolving data model
- Type Safety: TypeScript support but manual (no schema-to-type automation)
- Vendor Lock-In: Medium (NoSQL syntax specific to MongoDB)
- Maturity: Production-ready but heavier for Workers

#### Option D: Sqlite (Local File / R2 Backup)
**Characteristics**:
- Technology: SQLite (same as D1)
- Deployment: On-disk in Worker's `/tmp/` (ephemeral) or R2 (persistent)
- Latency: <1ms (in-process) but R2 fetch ~100ms for backup/restore
- Scalability: Single-file database; not suitable for high concurrency
- Cost: Free (compute-only)
- Backups: Manual via R2 snapshots
- Querying: SQL via better-sqlite3 (Node.js; not supported on Workers)

**Cloudflare Workers Considerations**:
- Persistence: Ephemeral `/tmp/` storage lost on Worker reload
- R2 workaround: Slow and complex (fetch DB from R2, modify, upload back)
- Concurrency: Lock contention on single file makes multi-user chat unreliable
- Type Safety: Manual SQL (no schema-to-type mapping)
- Not recommended: Too many trade-offs for MVP

### Decision

**SELECTED**: **Option A - Cloudflare D1 (SQLite on Edge)**

### Rationale

1. **Latency**: Co-located on edge eliminates network hop; <10ms database queries meet 1s streaming target.
2. **Cost**: Included in Workers plan; no additional recurring charges during MVP.
3. **Type Safety**: Auto-generated `CloudflareBindings` types align with Constitution Principle II.
4. **Simplicity**: Single `.sql` schema file; `wrangler d1 execute` for migrations.
5. **Vendor Alignment**: Designed for Cloudflare Workers; no compatibility layers needed.
6. **Scalability**: 100 concurrent connections sufficient for MVP (spec requires 100 concurrent sessions max).

### Alternatives Rejected

- **Option B (Postgres)**: Network latency (50-200ms) adds 5-20% to 1s budget. Cost justified only post-MVP scale.
- **Option C (MongoDB)**: Heavier SDK, worse for Workers; document model unneeded for structured conversations.
- **Option D (Local SQLite)**: Ephemeral storage unsuitable for persistence; R2 backup too complex.

### Implementation Approach

**Schema** (DDL in `specs/001-ai-chat-stream/contracts/database.sql`):
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES client_sessions(id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE client_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_activity TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX idx_sessions_updated ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conv ON messages(conversation_id);
```

**Access Pattern** (in Hono handler):
```typescript
const db = c.env.DB;
const result = await db.prepare(
  'SELECT * FROM conversations WHERE session_id = ? ORDER BY updated_at DESC LIMIT 10'
).bind(sessionId).all();
```

---

## 3. Frontend Framework: React vs. Vue

**Problem Statement**: Select JavaScript UI framework for clean, modern web chat interface.

### Candidates

#### Option A: React 18+
**Characteristics**:
- Bundle size: ~42KB (react + react-dom, minified + gzipped)
- Ecosystem: Largest ecosystem (state management, UI libraries, tooling)
- Learning curve: Moderate (JSX, hooks, unidirectional data flow)
- Performance: Excellent (virtual DOM, fine-grained re-renders via useMemo)
- Component library: Material-UI, shadcn/ui, Ant Design widely available
- Streaming UI: React 18 Suspense + Server Components (but less relevant for static frontend)
- Developer velocity: Fast (abundant examples, StackOverflow support)

**Cloudflare Workers Considerations**:
- Build: Vite or Create React App; compile to static JS
- SSR: Not needed for Workers (frontend static); Client-side hydration only
- SSE integration: `fetch()` + `EventSource` or custom SSE client library
- State management: Redux (heavy), Zustand (light), Jotai (atomic)
- Bundle optimization: Tree-shaking works well; remove unused Material-UI components

#### Option B: Vue 3+
**Characteristics**:
- Bundle size: ~34KB (vue + vue-router, minified + gzipped)
- Ecosystem: Smaller but focused (official plugins: pinia, vue-router, vite)
- Learning curve: Gentle (template syntax closer to HTML, straightforward reactivity)
- Performance: Excellent (fine-grained reactivity with automatic dependency tracking)
- Component library: Vuetify, Naive UI, PrimeVue available but less mature than React
- Streaming UI: Simpler stream/reactive data binding (no Suspense needed)
- Developer velocity: Good (well-documented, cleaner syntax for many developers)

**Cloudflare Workers Considerations**:
- Build: Vite (official, excellent for edge): `npm create vite . -- --template vue`
- SSR: Not needed; server-side rendering not applicable for static frontend
- SSE integration: Pinia store + template reactivity make SSE binding natural
- State management: Pinia (recommended, simpler than Redux)
- Bundle optimization: Native tree-shaking; smaller baseline than React

#### Option C: Svelte
**Characteristics**:
- Bundle size: ~13KB (smallest)
- Ecosystem: Growing (SvelteKit, stores built-in)
- Learning curve: Steep (reactive declarations, component-scoped styles novel)
- Performance: Excellent (compiler-based, no virtual DOM)
- Component library: Limited (not mainstream)
- Streaming UI: Reactive stores + transitions very clean
- Developer velocity: Moderate (smaller community)

**Cloudflare Workers Considerations**:
- Build: SvelteKit; excellent for edge with adapters
- Bundle size: Smallest of all options (~13KB)
- Niche risk: Less community support, fewer tutorials for streaming chat patterns
- Not mainstream for enterprise: Lower adoption risk

#### Option D: Vanilla JavaScript (No Framework)
**Characteristics**:
- Bundle size: ~2KB (minimal)
- Ecosystem: None (pure DOM APIs)
- Learning curve: Requires DOM API knowledge
- Performance: Manual (no virtual DOM; developer responsibility)
- Component library: Hand-rolled or web components
- Streaming UI: Manual DOM updates; callback hell risk
- Developer velocity: Slow (repetitive boilerplate)

**Cloudflare Workers Considerations**:
- Build: Simple (no build step if inline in HTML)
- Control: Maximum control but maximum complexity
- Not recommended: Too much manual DOM manipulation for real-time streaming

### Decision

**SELECTED**: **Option A - React 18+**

### Rationale

1. **Ecosystem Breadth**: Largest component library ecosystem (shadcn/ui, Headless UI) suitable for modern, clean design.
2. **Developer Velocity**: Abundant tutorials, StackOverflow, hiring pool (pragmatic for iteration).
3. **SSE Integration**: React 18 + Hooks pattern works well with streaming; many examples available.
4. **Bundle Size**: 42KB acceptable within budget (<50KB Hono + React combined).
5. **Streaming UI**: `useEffect` + `useState` makes real-time message updates straightforward.
6. **Maturity**: Proven at scale; thousands of chat applications built with React.

### Alternatives Rejected

- **Option B (Vue 3)**: Only 8KB smaller; React's ecosystem more valuable for iteration speed. Vue viable if bundle size becomes critical post-MVP.
- **Option C (Svelte)**: Smallest bundle but niche; community support thinner for streaming patterns. Viable for Phase 2 optimization.
- **Option D (Vanilla JS)**: Too much manual work; risks callback hell and hard-to-maintain code.

### Implementation Approach

**React Component Structure** (in `public/src/`):
```typescript
// App.tsx
export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  async function handleChatSubmit(userInput: string) {
    setIsStreaming(true);
    const abortController = new AbortController();
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ prompt: userInput, conversationId }),
        signal: abortController.signal,
      });
      const reader = response.body?.getReader();
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        // Parse SSE chunk and append to messages
      }
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div>
      <ChatMessageList messages={messages} />
      <ChatInputForm onSubmit={handleChatSubmit} disabled={isStreaming} />
    </div>
  );
}
```

**Build**: Vite with `@vitejs/plugin-react` (React Fast Refresh support)

---

## 4. Streaming Protocol: SSE vs. WebSocket

**Problem Statement**: Select protocol for real-time AI response streaming to client.

### Candidates

#### Option A: Server-Sent Events (SSE)
**Characteristics**:
- Protocol: HTTP/1.1, unidirectional server→client streaming
- API: `EventSource` (browser native) or `fetch` + `response.body.getReader()`
- Message format: `data: <JSON>` plaintext (simple, no binary)
- Latency: ~10-50ms per message (TCP no-delay available)
- Browser support: All modern browsers (IE11 not supported)
- Error recovery: Built-in automatic reconnection (EventSource) or manual (fetch)
- Cancellation: AbortController on fetch; EventSource.close()
- Security: Same-origin policy applies; CORS supported

**Cloudflare Workers Considerations**:
- Implementation: Simple HTTP response with `text/event-stream` MIME type
- Backpressure: No built-in; relies on TCP flow control
- Connection pooling: HTTP/1.1 keep-alive supported; no multiplexing
- Cost: Standard HTTP bandwidth (no premium for streaming)
- Firewall friendly: HTTP port 80/443; no protocol upgrades

#### Option B: WebSocket
**Characteristics**:
- Protocol: WebSocket (RFC 6455), full-duplex bidirectional
- API: `WebSocket` (browser native) or `ws` library
- Message format: Binary or text frames (flexible)
- Latency: ~5-20ms per message (lower TCP overhead than HTTP)
- Browser support: All modern browsers (IE10+ with fallbacks)
- Error recovery: Manual reconnection logic required
- Cancellation: `WebSocket.close()` with error code
- Security: Same-origin policy; separate wss:// for TLS

**Cloudflare Workers Considerations**:
- Implementation: Requires Cloudflare Durable Objects or third-party WebSocket gateway
- Persistence: Durable Objects provide stateful connections (higher cost)
- Connection pooling: True multiplexing; one socket for multiple streams
- Cost: Durable Objects additional charge (~$0.15/million requests + storage)
- Scalability: WebSocket state management adds complexity

#### Option C: HTTP Long-Polling
**Characteristics**:
- Protocol: HTTP/1.1, repeated polling with long timeout
- API: Standard `fetch` with timeout
- Message format: JSON (simple)
- Latency: 100-5000ms per message (depends on polling interval)
- Browser support: All browsers (most compatible)
- Error recovery: Automatic retry on fetch failure
- Cancellation: Standard HTTP abort
- Security: Standard HTTP CORS

**Cloudflare Workers Considerations**:
- Implementation: Simplest (no special streaming needed)
- Bandwidth: Inefficient (many HTTP headers per message)
- Latency: Too high for real-time chat (conflicts with 1s target)
- Not recommended: Outdated pattern, worse UX than SSE

#### Option D: gRPC / Protobuf Streaming
**Characteristics**:
- Protocol: HTTP/2, bidirectional with protobuf encoding
- API: `@grpc-web/grpc-web` (browser plugin)
- Message format: Binary (efficient)
- Latency: ~5-15ms per message (HTTP/2 multiplexing)
- Browser support: Chrome, Firefox, Safari (via gRPC-Web proxy)
- Error recovery: gRPC status codes; client handles reconnection
- Cancellation: gRPC call cancellation
- Security: TLS required; protobuf schema versioning

**Cloudflare Workers Considerations**:
- Implementation: Requires gRPC-Web proxy or Cloudflare Workers gRPC support (experimental)
- Bundle size: `@grpc-web/grpc-web` adds ~50KB
- Complexity: Over-engineered for simple chat streaming
- Not recommended: Excessive complexity for MVP

### Decision

**SELECTED**: **Option A - Server-Sent Events (SSE)**

### Rationale

1. **Simplicity**: HTTP/1.1 unidirectional; no stateful connection management needed (aligns with Serverless-First).
2. **Native Browser Support**: `EventSource` or `fetch` + streaming reader built into browsers.
3. **Implementation**: Hono `c.streamText()` or `c.stream()` provides native SSE support.
4. **Latency**: 10-50ms per chunk acceptable for 1s streaming target.
5. **Cost**: Standard HTTP bandwidth; no Durable Objects or third-party gateway.
6. **Error Recovery**: Built-in automatic reconnection (EventSource) or manual (AbortController).
7. **Testing**: Easier to mock and test than WebSocket (curl-compatible).

### Alternatives Rejected

- **Option B (WebSocket)**: Requires Durable Objects (cost + complexity); bidirectionality not needed for this MVP.
- **Option C (Long-Polling)**: Latency too high (100-5000ms) relative to 1s budget.
- **Option D (gRPC)**: Over-engineered; bundle size and complexity unnecessary for MVP.

### Implementation Approach

**Hono SSE Handler** (in `src/handlers/chat-stream.ts`, OpenRouter-compatible):
```typescript
export async function streamChat(c: Context) {
  const { prompt, conversationId } = await c.req.json();
  
  return c.streamText(async (write) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // OpenAI-compatible format
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    for await (const line of response.body) {
      if (line.startsWith('data: ')) {
        const delta = JSON.parse(line.slice(6));
        if (delta.choices?.[0]?.delta?.content) {
          await write(`data: ${JSON.stringify(delta)}\n\n`);
        }
      }
    }
  });
}
```

**Frontend EventSource Usage** (React):
```typescript
useEffect(() => {
  const source = new EventSource('/api/chat/stream?...params...');
  source.onmessage = (event) => {
    const chunk = JSON.parse(event.data);
    setMessages((prev) => [...prev, { role: 'assistant', content: chunk.text }]);
  };
  source.onerror = () => source.close();
  return () => source.close();
}, []);
```

---

## Summary: Technology Stack

| Dimension | Decision | Rationale |
|-----------|----------|-----------|
| **AI API** | OpenRouter (OpenAI-compatible) | Unified API supporting 100+ models (Claude, GPT-4, Llama, Mistral, etc.), flexible routing, cost optimization, minimal vendor lock-in, OpenAI-compatible format |
| **Database** | Cloudflare D1 (SQLite) | <10ms latency, co-located edge, included in Workers plan, auto-generated types |
| **Frontend** | React 18+ | Largest ecosystem, excellent SSE integration, developer velocity, 42KB bundle acceptable |
| **Streaming Protocol** | SSE (Server-Sent Events) | Simplicity, native browser support, no state management, curl-testable |

---

## Next Steps (Phase 1)

1. **data-model.md**: Define Conversation, Message, ClientSession entities with field types and constraints.
2. **contracts/api.openapi.yaml**: OpenAPI 3.1 spec for `/api/chat/stream` and `/api/conversations`.
3. **contracts/database.sql**: D1 CREATE TABLE statements (schema already drafted above).
4. **quickstart.md**: Developer onboarding (setup, env vars, example curl for `/api/chat/stream`).
5. **Agent context update**: Run `update-agent-context.sh copilot` to register React + Claude + D1 technologies.

---

## Appendix: Alternative Decisions to Revisit (Phase 2+)

If performance constraints tighten post-MVP:

- **Latency**: Switch Claude Opus → Haiku (done) or explore gRPC for <10ms overhead
- **Database**: Migrate D1 → Neon Postgres if concurrency exceeds 100 sessions (read replicas needed)
- **Frontend**: Swap React → Svelte if bundle size becomes bottleneck (<13KB vs. 42KB)
- **Streaming**: Add WebSocket layer via Durable Objects for bidirectional chat features (future user stories)
