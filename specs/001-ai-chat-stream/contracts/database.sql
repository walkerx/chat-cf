-- D1 Schema: AI Chat (Streaming)
-- Purpose: Define tables for conversation persistence
-- Date: 2025-11-14
-- Database: Cloudflare D1 (SQLite)

-- ============================================================================
-- ClientSession: Track anonymous users and their session lifecycle
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_activity TEXT NOT NULL,
  metadata TEXT,
  CHECK (created_at <= last_activity)
);

CREATE INDEX IF NOT EXISTS idx_session_activity ON client_sessions (last_activity DESC);

-- ============================================================================
-- Conversation: Group related messages into multi-turn chat sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES client_sessions (id) ON DELETE CASCADE,
  CHECK (created_at <= updated_at)
);

CREATE INDEX IF NOT EXISTS idx_conv_session_updated 
  ON conversations (session_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_updated 
  ON conversations (updated_at DESC);

-- ============================================================================
-- Message: Individual messages (user or assistant) within a conversation
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
  CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX IF NOT EXISTS idx_msg_conversation 
  ON messages (conversation_id, created_at ASC);

-- ============================================================================
-- Notes:
-- - StreamChunk is ephemeral (not persisted to database)
-- - All timestamps are ISO 8601 format (e.g., "2025-11-14T10:30:00Z")
-- - All IDs are UUIDs stored as TEXT
-- - JSON metadata stored as TEXT and parsed/serialized by application
-- ============================================================================
