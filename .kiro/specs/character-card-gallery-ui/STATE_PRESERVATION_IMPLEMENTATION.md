# State Preservation Implementation

## Overview

This document describes the implementation of state preservation during navigation between the gallery and chat pages, fulfilling Requirements 4.3 and 4.4.

## Implementation Strategy

The solution uses **React Context** combined with **Session Storage** to preserve conversation state across navigation. This approach provides:

1. **In-memory state sharing** - React Context shares state across all components
2. **Persistence** - Session Storage preserves state across page navigations
3. **Automatic restoration** - State is automatically restored when returning to the chat

## Key Components

### 1. ChatContext (`public/src/contexts/ChatContext.tsx`)

A new React Context provider that:
- Manages all chat state (messages, conversationId, characterCardId, etc.)
- Automatically saves state to session storage whenever it changes
- Automatically restores state from session storage on mount
- Provides the same interface as the original `useChat` hook

**Key Features:**
- Uses `sessionStorage` to persist state (survives page navigation but not browser close)
- Saves state on every update using `useEffect`
- Loads state on initial mount
- Handles storage errors gracefully (logs error but continues)

### 2. Updated Main Entry Point (`public/src/main.tsx`)

Wraps the entire application with `ChatProvider`:
```typescript
<ChatProvider>
  <Routes>
    <Route path="/" element={<GalleryPage />} />
    <Route path="/chat/:characterId?" element={<ChatPage />} />
  </Routes>
</ChatProvider>
```

This ensures all pages have access to the shared chat state.

### 3. Updated ChatPage (`public/src/pages/ChatPage.tsx`)

Modified to:
- Use `useChatContext()` instead of `useChat()`
- Check if returning to the same character before reloading conversation
- Preserve existing state when navigating back to the same character

**State Preservation Logic:**
```typescript
// Check if we're returning to the same character
if (chat.characterCardId === characterId) {
  // Same character - state is already preserved
  return;
}

// Different character - load new conversation
chat.setCharacterCardId(characterId);
await chat.loadCharacterConversation(characterId);
```

## How It Works

### Scenario 1: Navigate from Chat to Gallery and Back

1. **User is chatting with Character A**
   - Messages: ["Hello", "Hi there!"]
   - ConversationId: "conv-123"
   - CharacterCardId: "char-a"

2. **User clicks "Back" to gallery**
   - State is saved to session storage
   - Context preserves state in memory
   - User sees gallery

3. **User clicks Character A again**
   - ChatPage loads
   - Detects characterId === chat.characterCardId
   - Skips reloading conversation
   - Messages and state are preserved exactly as they were

### Scenario 2: Switch Between Characters

1. **User is chatting with Character A**
   - State saved to storage

2. **User navigates to gallery and selects Character B**
   - ChatPage detects characterId !== chat.characterCardId
   - Loads Character B's conversation
   - State updated with Character B's messages

3. **User navigates back to Character A**
   - ChatPage loads Character A's conversation from database
   - State updated with Character A's messages

## Storage Format

Session storage key: `"chat_state"`

Stored data:
```typescript
{
  messages: Message[],
  conversationId: string | null,
  characterCardId: string | null
}
```

## Error Handling

- **Storage quota exceeded**: Logs error, continues without persistence
- **Invalid JSON in storage**: Logs error, starts with empty state
- **Storage not available**: Falls back to in-memory only

## Benefits

1. **No data loss** - State persists during navigation
2. **Fast navigation** - No need to reload when returning to same character
3. **Seamless UX** - Users can freely navigate without losing context
4. **Browser-native** - Uses standard Web APIs (sessionStorage)
5. **Automatic cleanup** - Session storage clears when browser closes

## Testing

The implementation has been verified through:
- TypeScript type checking (no errors)
- Frontend build (successful)
- Code review against requirements

## Requirements Validation

✅ **Requirement 4.3**: "WHEN returning to the gallery THEN the Application SHALL preserve the current conversation state"
- Implemented via ChatContext + session storage

✅ **Requirement 4.4**: "WHEN a user navigates back THEN the Application SHALL not lose any chat history"
- State is preserved in both memory and storage
- Restored automatically when returning to chat

## Future Enhancements

Potential improvements:
1. Add localStorage for longer persistence
2. Implement state versioning for migrations
3. Add compression for large message histories
4. Implement selective state clearing (e.g., clear old conversations)
