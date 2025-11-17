# Quickstart: AI Chat (Streaming)

**Feature**: AI Chat with streaming output | **Date**: 2025-11-14
**For developers**: Set up local environment and test the API.

---

## Prerequisites

- **Node.js**: v18+ (ESNext support)
- **pnpm**: v8+ (package manager)
- **Wrangler CLI**: v4.48+ (Cloudflare Workers tooling)
- **Git**: For version control and branch management

**Check versions**:
```bash
node --version        # v18.x.x
pnpm --version        # 8.x.x
wrangler --version    # 4.48.x
```

---

## 1. Local Development Setup

### 1.1 Clone and Install Dependencies

```bash
# Clone the repository (adjust path as needed)
git clone https://github.com/your-org/chat-cf.git
cd chat-cf

# Switch to feature branch
git checkout 001-ai-chat-stream

# Install dependencies
pnpm install
```

### 1.2 Environment Variables

**For Local Development**:

Create a `.dev.vars` file in the project root (not committed to git):

```bash
# Copy the example file
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` and add your API key:

```env
# OpenRouter API (OpenAI-compatible)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get `OPENROUTER_API_KEY`**:
1. Go to [OpenRouter Console](https://openrouter.ai/keys)
2. Create an account or log in (supports GitHub, Google, email)
3. Click **Create Key** or **Generate** for a new API key
4. Copy the key and paste into `.dev.vars`

**Note**: OpenRouter provides unified access to 100+ models (Claude, GPT-4, Llama, Mistral, etc.) via OpenAI-compatible API.

**For Production**:

Use Cloudflare Secrets Store (recommended for sensitive data):

```bash
# Set secret in Cloudflare (production)
wrangler secret put OPENROUTER_API_KEY
# Paste the key and press Ctrl+D (or Cmd+D on macOS)
```

**Local dev**: Wrangler automatically loads `.dev.vars` during `pnpm run dev`.

### 1.4 Configure D1 Database

Check that `wrangler.jsonc` has the D1 binding configured:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "chat-cf-db",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

**For first-time setup** (create local D1):
```bash
wrangler d1 create chat-cf-db
# Follow the prompts; copy the database_id to wrangler.jsonc
```

**Apply schema to local D1**:
```bash
wrangler d1 execute chat-cf-db --file ./specs/001-ai-chat-stream/contracts/database.sql --local
```

---

## 2. Start Local Development Server

```bash
pnpm run dev
```

**Output**:
```
 ⛅️  wrangler 4.48.0
Your worker has access to the following bindings:
- D1 Database: DB
- Assets: ASSETS
 ➜  local:   http://localhost:8787
 ➜  network: use `--remote` to access remotely
```

**Access the app**:
- Open http://localhost:8787 in your browser
- Frontend UI loads from `public/index.html`

---

## 3. Test the API

### 3.1 Generate a Session ID

The client needs a unique session ID. Generate one locally:

```bash
# macOS / Linux
SESSION_ID=$(node -e "console.log(crypto.randomUUID())")
echo "Session ID: $SESSION_ID"

# Or manually:
SESSION_ID="550e8400-e29b-41d4-a716-446655440000"
```

### 3.2 Test Streaming Chat Endpoint

```bash
# Single-turn streaming response
curl -X POST http://localhost:8787/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  --data-raw '{"prompt": "Hello! How are you?"}' \
  --no-buffer
```

**Expected output** (Server-Sent Events):
```
data: {"index": 0, "text": "Hello! I'm an AI assistant here to help you.", "type": "content", "timestamp": "2025-11-14T10:30:35.100Z"}
data: {"index": 1, "text": " I'm doing well, thank you for asking. How can I help you today?", "type": "content", "timestamp": "2025-11-14T10:30:35.200Z"}
```

### 3.3 Test with Multi-Turn Conversation

```bash
# Create first message
curl -X POST http://localhost:8787/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  --data-raw '{"prompt": "What is Python?"}' \
  --no-buffer

# Note the conversation_id from the response (or save from browser)
CONV_ID="conv-660e9400-e29b-41d4-a716-446655440111"

# Second message in same conversation
curl -X POST http://localhost:8787/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  --data-raw "{\"prompt\": \"Tell me more about its uses\", \"conversationId\": \"$CONV_ID\"}" \
  --no-buffer
```

### 3.4 List Conversations

```bash
curl -X GET "http://localhost:8787/api/conversations?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json"
```

**Expected output**:
```json
{
  "conversations": [
    {
      "id": "conv-660e9400-e29b-41d4-a716-446655440111",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "What is Python?",
      "created_at": "2025-11-14T10:30:00Z",
      "updated_at": "2025-11-14T10:45:30Z"
    }
  ]
}
```

### 3.5 Load Conversation History

```bash
curl -X GET "http://localhost:8787/api/conversations/$CONV_ID" \
  -H "Content-Type: application/json"
```

**Expected output**:
```json
{
  "conversation": { ... },
  "messages": [
    {
      "id": "msg-770e9400-e29b-41d4-a716-446655440222",
      "conversation_id": "conv-660e9400-e29b-41d4-a716-446655440111",
      "role": "user",
      "content": "What is Python?",
      "created_at": "2025-11-14T10:30:05Z"
    },
    {
      "id": "msg-770e9400-e29b-41d4-a716-446655440333",
      "conversation_id": "conv-660e9400-e29b-41d4-a716-446655440111",
      "role": "assistant",
      "content": "Python is a high-level, interpreted programming language...",
      "created_at": "2025-11-14T10:30:35Z"
    }
  ]
}
```

---

## 4. Frontend Testing

### 4.1 Open the Web UI

1. Browser: http://localhost:8787/
2. You should see the chat interface (React component)
3. Input your session ID (or auto-generated)
4. Type a message and submit

### 4.2 Verify Streaming Display

1. Submit a prompt: "Tell me a short joke"
2. Watch the response appear **word by word** (streaming)
3. Check that multi-turn conversations work:
   - Ask: "What was my previous joke?"
   - Claude should reference the earlier message

### 4.3 Test Error Handling

1. **Submit empty prompt**: Should show error "Prompt cannot be empty"
2. **Missing Session ID**: Should show "Session ID is required"
3. **API Error** (simulate by stopping the server): Should display "Connection lost. Please retry."

---

## 5. Type Safety & Code Generation

After modifying bindings in `wrangler.jsonc`, regenerate types:

```bash
pnpm run cf-typegen
```

**Verify**:
- `worker-configuration.d.ts` is updated
- Your IDE shows correct types for `c.env.DB`, `c.env.OPENROUTER_API_KEY`, etc.

---

## 6. Database Management

### 6.1 View Data

```bash
# Local database (development)
wrangler d1 execute chat-cf-db --command "SELECT * FROM conversations;" --local

# Production database (after deploy)
wrangler d1 execute chat-cf-db --command "SELECT * FROM conversations;"
```

### 6.2 Reset Local Database

```bash
# Drop and recreate tables
wrangler d1 execute chat-cf-db --file ./specs/001-ai-chat-stream/contracts/database.sql --local
```

### 6.3 Inspect Schema

```bash
wrangler d1 execute chat-cf-db --command ".schema" --local
```

---

## 7. Build & Deploy

### 7.1 Production Build

```bash
pnpm run build
```

**Output**: Minified Worker + frontend bundle in `dist/`

### 7.2 Deploy to Cloudflare

```bash
pnpm run deploy
```

**Output**:
```
✨ Built successfully, 42.2 KB.
▶ Uploading your Worker to Cloudflare... ✓
✨ Success! Your worker is live at:
   https://chat-cf.your-account.workers.dev
```

### 7.3 Set Production Secrets

```bash
wrangler secret put OPENROUTER_API_KEY
# Paste your API key and press Ctrl+D
```

### 7.4 Verify Production Deployment

```bash
curl -X POST https://chat-cf.your-account.workers.dev/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  --data-raw '{"prompt": "Hello from production!"}' \
  --no-buffer
```

---

## 8. Troubleshooting

### Issue: "OPENROUTER_API_KEY is undefined"

**Solution**:
```bash
# Check .env.local exists
cat .env.local | grep OPENROUTER_API_KEY

# If missing, add it
echo "OPENROUTER_API_KEY=sk-or-v1-..." >> .env.local

# Restart dev server
pnpm run dev
```

### Issue: "D1 database error: not found"

**Solution**:
```bash
# Create database
wrangler d1 create chat-cf-db

# Copy database_id to wrangler.jsonc

# Apply schema
wrangler d1 execute chat-cf-db --file ./specs/001-ai-chat-stream/contracts/database.sql --local
```

### Issue: "404 on /api/chat/stream"

**Solution**:
```bash
# Check that wrangler is running
pnpm run dev

# Verify handler exists in src/index.ts
grep "POST /api/chat/stream" src/index.ts
```

### Issue: Streaming chunks not appearing in browser

**Solution**:
1. Open **DevTools** → **Network**
2. Trigger a chat request
3. Look for `/api/chat/stream` request
4. Check **Response** tab (should show SSE chunks)
5. If blank, check **Console** for JavaScript errors

### Issue: "Session ID is required"

**Solution**:
```bash
# Ensure X-Session-ID header is set
curl -H "X-Session-ID: $SESSION_ID" ...

# Or in React, check that sessionId is stored in localStorage
```

---

## 9. Next Steps

1. **Implement handlers** (`src/handlers/chat-stream.ts`): Connect to OpenRouter API
2. **Implement React components** (`public/src/components/`): Build UI with streaming display
3. **Add tests** (`tests/`): Unit tests for handlers, E2E tests for streaming
4. **Performance optimization**: Monitor latency, optimize prompts, tune D1 queries

---

## 10. Useful Commands Reference

```bash
# Development
pnpm run dev               # Start local dev server
pnpm run cf-typegen       # Regenerate worker-configuration.d.ts

# Build & Deploy
pnpm run build            # Production build
pnpm run deploy           # Deploy to Cloudflare (minified)

# Database
wrangler d1 create chat-cf-db                  # Create local D1
wrangler d1 execute chat-cf-db --command "..." # Execute SQL (local or production)

# Testing
curl -X POST http://localhost:8787/api/chat/stream \
  -H "X-Session-ID: $SESSION_ID" \
  --data-raw '{"prompt": "..."}' \
  --no-buffer
```

---

## Files of Interest

- **Backend entry**: `src/index.ts` (Hono app, route definitions)
- **Chat handler**: `src/handlers/chat-stream.ts` (SSE streaming logic)
- **Frontend app**: `public/src/App.tsx` (React root component)
- **Chat UI**: `public/src/components/chat-interface.tsx` (Message display + input form)
- **API client**: `public/src/services/api.ts` (Fetch wrapper for `/api/chat/stream`)
- **Database schema**: `specs/001-ai-chat-stream/contracts/database.sql` (D1 DDL)
- **API spec**: `specs/001-ai-chat-stream/contracts/api.openapi.yaml` (OpenAPI 3.1)

---

## Support

For issues or questions, check:
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/) (compatible format)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
