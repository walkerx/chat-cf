# Product Overview

## What This Is

An AI chat application with streaming responses, built on Cloudflare Workers. Users send text prompts and receive real-time AI-generated responses via Server-Sent Events (SSE). Supports multi-turn conversations with persistent history.

## Core Features

- **Streaming Chat**: Real-time AI responses delivered incrementally (target: first chunk within 1 second)
- **Multi-turn Conversations**: Context-aware responses using conversation history
- **Session-based Tracking**: Anonymous users identified by session ID (no authentication required for MVP)
- **Conversation Persistence**: Full history stored in Cloudflare D1 database

## Architecture

- **Backend**: Hono framework on Cloudflare Workers (serverless edge)
- **Frontend**: React 18+ SPA with clean, modern UI
- **AI Provider**: OpenRouter (OpenAI-compatible API supporting multiple models)
- **Database**: Cloudflare D1 (SQLite-based edge database)

## Key Constraints

- Text-only input (no images, files, or rich formatting)
- Fail-fast error strategy (immediate error feedback, no retry logic)
- Target: 100 concurrent streaming sessions
- MVP scope: Simple chat interface without user accounts
