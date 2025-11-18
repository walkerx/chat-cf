# Requirements Document

## Introduction

This specification addresses a critical design flaw in the conversation management system. Currently, when a client sends a chat message without explicitly providing a `conversationId`, the system creates a new conversation every time. This breaks the multi-turn conversation experience, as each message starts a fresh conversation instead of continuing the existing one.

The correct behavior should be: **a client session should automatically reuse its active conversation unless the user explicitly starts a new conversation**.

## Glossary

- **ClientSession**: An anonymous user session identified by a session ID, typically stored in browser localStorage
- **Conversation**: A logical grouping of related messages representing a multi-turn chat dialogue
- **ActiveConversation**: The most recently updated conversation for a given client session
- **ChatStreamHandler**: The backend API endpoint that processes chat requests and returns streaming responses

## Requirements

### Requirement 1

**User Story:** As a user, I want my follow-up messages to continue the same conversation automatically, so that the AI maintains context from my previous messages without requiring me to manually track conversation IDs.

#### Acceptance Criteria

1. WHEN a client sends a chat message without a conversationId THEN the ChatStreamHandler SHALL reuse the most recently updated conversation for that session
2. WHEN a client session has no existing conversations THEN the ChatStreamHandler SHALL create a new conversation
3. WHEN a client explicitly provides a conversationId THEN the ChatStreamHandler SHALL use that specific conversation regardless of which conversation is most recent
4. WHEN a client provides a conversationId that does not belong to their session THEN the ChatStreamHandler SHALL return an UNAUTHORIZED error
5. WHEN a client provides a conversationId that does not exist THEN the ChatStreamHandler SHALL return a NOT_FOUND error

### Requirement 2

**User Story:** As a user, I want to start a new conversation when I choose to, so that I can discuss different topics without mixing context.

#### Acceptance Criteria

1. WHEN a client explicitly requests a new conversation (by setting conversationId to null or a special "new" value) THEN the ChatStreamHandler SHALL create a new conversation
2. WHEN a new conversation is created THEN the ChatStreamHandler SHALL return the new conversationId in the response
3. WHEN a conversation is reused THEN the ChatStreamHandler SHALL include all previous messages from that conversation as context

### Requirement 3

**User Story:** As a developer, I want the database layer to efficiently retrieve the active conversation for a session, so that the system performs well under load.

#### Acceptance Criteria

1. WHEN querying for the active conversation THEN the DatabaseClient SHALL return the conversation with the most recent updated_at timestamp for the given session
2. WHEN multiple conversations exist for a session THEN the DatabaseClient SHALL use the existing index on (session_id, updated_at) for efficient queries
3. WHEN no conversations exist for a session THEN the DatabaseClient SHALL return null without throwing an error

### Requirement 4

**User Story:** As a frontend developer, I want to receive the conversationId in the streaming response, so that I can track which conversation is active and allow users to switch between conversations.

#### Acceptance Criteria

1. WHEN the first chunk of a streaming response is sent THEN the ChatStreamHandler SHALL include the conversationId in that chunk
2. WHEN the frontend receives a conversationId THEN the useChat hook SHALL store it for subsequent requests
3. WHEN a user starts a new conversation THEN the frontend SHALL clear the stored conversationId before sending the first message
