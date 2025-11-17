# Design Document

## Overview

This design replaces the custom fetch-based OpenRouter API client with the official OpenAI SDK. OpenRouter provides an OpenAI-compatible API, which means we can use the OpenAI SDK by configuring it with OpenRouter's base URL (`https://openrouter.ai/api/v1`). This approach provides several benefits:

- **Type Safety**: Official TypeScript types for all API requests and responses
- **Error Handling**: Built-in error handling and retry logic
- **Streaming Support**: Native support for SSE streaming with proper type definitions
- **Maintenance**: Automatic updates and bug fixes from the official SDK

The migration will be transparent to the rest of the application - the `OpenRouterClient` class will maintain its current interface while using the OpenAI SDK internally.

## Architecture

### Current Architecture

```
Handler (chat-stream.ts)
    ↓
OpenRouterClient (custom fetch)
    ↓
parseSSEStream (custom SSE parser)
    ↓
StreamChunk (our model)
```

### New Architecture

```
Handler (chat-stream.ts)
    ↓
OpenRouterClient (OpenAI SDK wrapper)
    ↓
OpenAI SDK streaming
    ↓
Adapter layer (SDK → StreamChunk)
    ↓
StreamChunk (our model)
```

## Components and Interfaces

### 1. OpenAI SDK Integration

**Package**: `openai` (official npm package)

**Configuration**:
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: config.apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://your-app.com', // Optional
    'X-Title': 'Your App Name', // Optional
  },
});
```

### 2. Updated OpenRouterClient Class

The `OpenRouterClient` class will be refactored to wrap the OpenAI SDK while maintaining backward compatibility:

**Interface (unchanged)**:
```typescript
export class OpenRouterClient {
  constructor(config: OpenRouterConfig);
  
  async *streamChatCompletion(
    request: OpenRouterRequest,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunk, void, unknown>;
  
  async chatCompletion(
    request: OpenRouterRequest,
    signal?: AbortSignal
  ): Promise<string>;
}
```

**Internal Implementation**:
```typescript
export class OpenRouterClient {
  private readonly client: OpenAI;
  
  constructor(config: OpenRouterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
    });
  }
  
  async *streamChatCompletion(
    request: OpenRouterRequest,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      stream: true,
    }, {
      signal, // Pass AbortSignal for cancellation support
    });
    
    let index = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield createStreamChunk(index++, content, 'content');
      }
    }
  }
  
  async chatCompletion(
    request: OpenRouterRequest,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      stream: false,
    }, {
      signal,
    });
    
    return response.choices[0]?.message?.content || '';
  }
}
```

### 3. Stream Adapter Layer

The OpenAI SDK returns `Stream<ChatCompletionChunk>` objects. We need to adapt these to our `StreamChunk` format:

**Adapter Function**:
```typescript
function adaptOpenAIChunkToStreamChunk(
  chunk: ChatCompletionChunk,
  index: number
): StreamChunk | null {
  const content = chunk.choices[0]?.delta?.content;
  if (!content) {
    return null; // Skip empty chunks
  }
  
  return createStreamChunk(index, content, 'content');
}
```

### 4. Error Handling

The OpenAI SDK throws `APIError` instances with structured error information:

```typescript
import { APIError } from 'openai';

try {
  // API call
} catch (error) {
  if (error instanceof APIError) {
    // error.status - HTTP status code
    // error.message - Error message
    // error.code - Error code
    throw new Error(
      `OpenRouter API error: ${error.status} ${error.message}`
    );
  }
  throw error;
}
```

## Data Models

### OpenAI SDK Types (provided by SDK)

```typescript
// From 'openai' package
interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}
```

### Our StreamChunk Model (unchanged)

```typescript
export interface StreamChunk {
  index: number;
  text: string;
  type: StreamChunkType;
  timestamp: string;
}
```

## Error Handling

### SDK Error Types

The OpenAI SDK provides structured error classes:

1. **APIError**: Base class for all API errors
   - `status`: HTTP status code
   - `message`: Error message
   - `code`: Error code (if available)

2. **APIConnectionError**: Network/connection errors
3. **APITimeoutError**: Request timeout errors
4. **RateLimitError**: Rate limit exceeded
5. **AuthenticationError**: Invalid API key

### Error Handling Strategy

```typescript
async *streamChatCompletion(
  request: OpenRouterRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      stream: true,
    }, { signal });
    
    let index = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield createStreamChunk(index++, content, 'content');
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(
        `OpenRouter API error: ${error.status} ${error.message}`
      );
    }
    throw error;
  }
}
```

## Testing Strategy

### 1. Unit Tests

**Test File**: `tests/unit/services/openrouter.test.ts`

Test cases:
- SDK initialization with correct configuration
- Streaming response conversion to StreamChunk format
- Non-streaming response extraction
- Error handling for various SDK error types
- AbortSignal propagation

### 2. Integration Tests

**Test File**: `tests/integration/streaming.test.ts` (existing)

Verify:
- End-to-end streaming with real OpenRouter API
- Response format matches expected StreamChunk structure
- Error responses are handled correctly
- Existing tests pass without modification

### 3. Contract Tests

**Test File**: `tests/contract/chat-stream.test.ts` (existing)

Verify:
- API contract remains unchanged
- Response format is identical to previous implementation
- Error responses match expected format

## Migration Steps

1. **Install OpenAI SDK**
   ```bash
   pnpm add openai
   ```

2. **Refactor OpenRouterClient**
   - Replace fetch calls with OpenAI SDK
   - Implement stream adapter
   - Update error handling

3. **Remove Custom SSE Parser**
   - The `parseSSEStream` function in `src/utils/stream.ts` will no longer be needed for OpenRouter calls
   - Keep it for now in case it's used elsewhere, or remove if only used by OpenRouter

4. **Run Tests**
   - Verify all existing tests pass
   - Add new unit tests for SDK integration

5. **Verify Bundle Size**
   - Check that bundle size remains under 50KB target
   - The OpenAI SDK is tree-shakeable, so only used parts will be bundled

## Cloudflare Workers Compatibility

### Fetch API

The OpenAI SDK uses the standard `fetch` API, which is natively supported in Cloudflare Workers. No polyfills needed.

### AbortSignal Support

The SDK supports `AbortSignal` for request cancellation, which works in Workers runtime.

### Bundle Size Considerations

- The OpenAI SDK is modular and tree-shakeable
- Only the chat completions module will be bundled
- Estimated additional bundle size: ~15-20KB (minified)
- Total bundle should remain well under 50KB target

### Environment Variables

No changes needed - API key is still accessed via `c.env.OPENROUTER_API_KEY` from Cloudflare bindings.

## Benefits of This Approach

1. **Type Safety**: Full TypeScript support with official types
2. **Reliability**: Battle-tested SDK used by thousands of applications
3. **Maintainability**: Automatic updates and bug fixes
4. **Error Handling**: Structured error types and better error messages
5. **Future-Proofing**: Easy to add new OpenAI/OpenRouter features
6. **Code Reduction**: Remove custom SSE parsing logic

## Backward Compatibility

The migration maintains 100% backward compatibility:

- Same public interface for `OpenRouterClient`
- Same `StreamChunk` format
- Same error handling behavior
- No changes required in handlers or other services
- All existing tests should pass without modification
