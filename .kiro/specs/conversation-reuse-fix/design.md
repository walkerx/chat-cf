# Design Document

## Overview

This design addresses the conversation reuse bug by modifying the chat stream handler logic and database client to properly manage conversation lifecycle. The key change is implementing "active conversation" semantics where a client session automatically continues its most recent conversation unless explicitly creating a new one.

## Architecture

### Current Flow (Buggy)
```
Client sends message without conversationId
  → Handler creates NEW conversation every time
  → Context is lost between messages
```

### Fixed Flow
```
Client sends message without conversationId
  → Handler queries for active conversation
  → If found: reuse it (load message history)
  → If not found: create new conversation
  → Return conversationId in first chunk
```

## Components and Interfaces

### DatabaseClient (src/services/db.ts)

**New Method: `getActiveConversation`**
```typescript
async getActiveConversation(sessionId: string): Promise<Conversation | null>
```

Returns the most recently updated conversation for a session, or null if none exists.

**Implementation:**
- Query conversations table WHERE session_id = sessionId
- ORDER BY updated_at DESC
- LIMIT 1
- Uses existing index `idx_conv_session_updated` for performance

### ChatStreamHandler (src/handlers/chat-stream.ts)

**Modified Logic:**

1. Parse request body (prompt, conversationId)
2. Ensure session exists
3. **Conversation resolution:**
   - If conversationId provided explicitly:
     - Load that conversation
     - Verify it belongs to session (401 if not)
     - Load message history
   - If conversationId NOT provided:
     - Query for active conversation
     - If found: reuse it, load message history
     - If not found: create new conversation
4. Save user message
5. Stream AI response
6. Include conversationId in first chunk

### Frontend (public/src/hooks/useChat.ts)

**Modified Logic:**

1. Extract conversationId from first chunk
2. Store it in state for subsequent requests
3. Provide `startNewConversation()` method that clears conversationId

## Data Models

No schema changes required. Existing tables support this behavior:

```sql
-- conversations table already has:
-- - session_id (foreign key to client_sessions)
-- - updated_at (timestamp, indexed)
-- - Index: idx_conv_session_updated on (session_id, updated_at DESC)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active conversation consistency
*For any* client session with existing conversations, querying for the active conversation should return the conversation with the maximum updated_at timestamp
**Validates: Requirements 3.1**

### Property 2: Conversation reuse determinism
*For any* client session and message sequence, if no conversationId is provided, all messages should be added to the same conversation (the active one)
**Validates: Requirements 1.1**

### Property 3: Conversation isolation
*For any* two different client sessions, their active conversations should be completely independent (no cross-session conversation access)
**Validates: Requirements 1.4**

### Property 4: ConversationId round-trip
*For any* streaming response, if a conversationId is included in the first chunk, subsequent requests using that conversationId should load the same conversation
**Validates: Requirements 4.1, 4.2**

### Property 5: Authorization invariant
*For any* request with an explicit conversationId, if the conversation's session_id does not match the request's session_id, the system should reject the request
**Validates: Requirements 1.4**

## Error Handling

| Error Condition | HTTP Status | Error Code | Behavior |
|----------------|-------------|------------|----------|
| ConversationId provided but not found | 404 | NOT_FOUND | Return error immediately |
| ConversationId belongs to different session | 401 | UNAUTHORIZED | Return error immediately |
| Database query fails | 500 | INTERNAL_ERROR | Return error chunk in stream |
| No active conversation found | N/A | N/A | Create new conversation (not an error) |

## Testing Strategy

### Unit Tests

1. **DatabaseClient.getActiveConversation**
   - Returns null when no conversations exist
   - Returns most recent conversation when multiple exist
   - Returns correct conversation for specific session

2. **ChatStreamHandler conversation resolution**
   - Creates new conversation when none exists
   - Reuses active conversation when no conversationId provided
   - Loads specific conversation when conversationId provided
   - Rejects conversation from different session

### Property-Based Tests

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property tests.

Each property-based test should run a minimum of 100 iterations.

1. **Property 1: Active conversation consistency**
   - Generate random conversations with different updated_at timestamps
   - Verify getActiveConversation returns the one with max timestamp
   - **Feature: conversation-reuse-fix, Property 1: Active conversation consistency**

2. **Property 2: Conversation reuse determinism**
   - Generate random message sequences for a session
   - Send all without conversationId
   - Verify all messages belong to same conversation
   - **Feature: conversation-reuse-fix, Property 2: Conversation reuse determinism**

3. **Property 3: Conversation isolation**
   - Generate random sessions and conversations
   - Verify each session's active conversation is independent
   - **Feature: conversation-reuse-fix, Property 3: Conversation isolation**

4. **Property 4: ConversationId round-trip**
   - Generate random conversation
   - Extract conversationId from response
   - Use it in next request
   - Verify same conversation is loaded
   - **Feature: conversation-reuse-fix, Property 4: ConversationId round-trip**

5. **Property 5: Authorization invariant**
   - Generate random session and conversation pairs
   - Attempt to access conversation with wrong session
   - Verify all attempts are rejected with 401
   - **Feature: conversation-reuse-fix, Property 5: Authorization invariant**

### Integration Tests

1. Multi-turn conversation flow (send 3 messages, verify context maintained)
2. New conversation creation (clear conversationId, verify new conversation created)
3. Explicit conversation switching (provide different conversationId, verify switch)

## Implementation Notes

- The `getActiveConversation` method already exists in the current codebase (added during initial fix attempt)
- The chat-stream handler logic has been partially updated but needs completion
- Frontend changes are minimal (extract conversationId from chunk, store in state)
- No database migrations required (schema already supports this)
