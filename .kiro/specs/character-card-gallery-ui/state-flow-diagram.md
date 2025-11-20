# State Preservation Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Application                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ChatProvider (Context)                     │ │
│  │  - messages: Message[]                                  │ │
│  │  - conversationId: string | null                        │ │
│  │  - characterCardId: string | null                       │ │
│  │  - isStreaming, error, etc.                             │ │
│  └────────────────────────────────────────────────────────┘ │
│           ↕                                    ↕              │
│  ┌─────────────────┐                 ┌─────────────────┐    │
│  │  GalleryPage    │                 │   ChatPage      │    │
│  │  (Route: /)     │ ←─ navigate ──→ │ (Route: /chat)  │    │
│  └─────────────────┘                 └─────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                          ↕
                  Session Storage
              ┌─────────────────────┐
              │  Key: "chat_state"  │
              │  {                  │
              │    messages,        │
              │    conversationId,  │
              │    characterCardId  │
              │  }                  │
              └─────────────────────┘
```

## State Flow During Navigation

### Flow 1: Chat → Gallery → Chat (Same Character)

```
1. User in ChatPage with Character A
   ┌──────────────────────────────┐
   │ ChatContext State:           │
   │ - characterCardId: "char-a"  │
   │ - conversationId: "conv-123" │
   │ - messages: [msg1, msg2]     │
   └──────────────────────────────┘
                ↓
         (auto-save to storage)
                ↓
   ┌──────────────────────────────┐
   │ Session Storage:             │
   │ {                            │
   │   characterCardId: "char-a", │
   │   conversationId: "conv-123",│
   │   messages: [msg1, msg2]     │
   │ }                            │
   └──────────────────────────────┘

2. User clicks "Back" → Navigate to GalleryPage
   - Context state remains in memory
   - Storage has backup copy

3. User clicks Character A card → Navigate to ChatPage
   - ChatPage checks: characterCardId === "char-a"? YES
   - Skip loading conversation
   - Use existing state from context
   - Messages preserved! ✓
```

### Flow 2: Chat → Gallery → Chat (Different Character)

```
1. User in ChatPage with Character A
   ┌──────────────────────────────┐
   │ ChatContext State:           │
   │ - characterCardId: "char-a"  │
   │ - conversationId: "conv-123" │
   │ - messages: [msg1, msg2]     │
   └──────────────────────────────┘

2. User navigates to gallery, selects Character B
   - ChatPage checks: characterCardId === "char-b"? NO
   - Load Character B's conversation from database
   - Update context state
                ↓
   ┌──────────────────────────────┐
   │ ChatContext State:           │
   │ - characterCardId: "char-b"  │
   │ - conversationId: "conv-456" │
   │ - messages: [msg3, msg4]     │
   └──────────────────────────────┘
                ↓
         (auto-save to storage)
```

### Flow 3: Page Refresh (Context Lost, Storage Restores)

```
1. User refreshes browser
   - React context is destroyed
   - Session storage persists

2. App remounts
   - ChatProvider initializes
   - Loads state from session storage
                ↓
   ┌──────────────────────────────┐
   │ Session Storage:             │
   │ {                            │
   │   characterCardId: "char-b", │
   │   conversationId: "conv-456",│
   │   messages: [msg3, msg4]     │
   │ }                            │
   └──────────────────────────────┘
                ↓
   ┌──────────────────────────────┐
   │ ChatContext State:           │
   │ - characterCardId: "char-b"  │
   │ - conversationId: "conv-456" │
   │ - messages: [msg3, msg4]     │
   └──────────────────────────────┘
   - State restored! ✓
```

## Key Implementation Details

### ChatContext Auto-Save

```typescript
// Save state to storage whenever it changes
useEffect(() => {
  saveStateToStorage({
    messages,
    conversationId,
    characterCardId,
  });
}, [messages, conversationId, characterCardId]);
```

### ChatContext Auto-Restore

```typescript
// Load initial state from storage
const storedState = loadStateFromStorage();

const [messages, setMessages] = useState<Message[]>(
  storedState.messages || []
);
const [conversationId, setConversationId] = useState<string | null>(
  storedState.conversationId || null
);
```

### ChatPage Smart Loading

```typescript
// Check if we're returning to the same character
if (chat.characterCardId === characterId) {
  // Same character - state is already preserved
  setLoadingCharacter(false);
  return;
}

// Different character - load conversation
chat.setCharacterCardId(characterId);
await chat.loadCharacterConversation(characterId);
```

## Benefits Summary

| Scenario | Without State Preservation | With State Preservation |
|----------|---------------------------|------------------------|
| Navigate back to same character | Reloads conversation from DB | Uses cached state (instant) |
| Switch characters | Loads new conversation | Loads new conversation |
| Page refresh | Loses all state | Restores from storage |
| Browser close | Loses all state | Loses state (session ends) |
| Data loss risk | High (any navigation) | Low (only on browser close) |
