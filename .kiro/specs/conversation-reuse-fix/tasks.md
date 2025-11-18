# Implementation Plan

- [x] 1. Complete backend conversation reuse logic
  - Verify `getActiveConversation` method exists and works correctly in DatabaseClient
  - Update chat-stream handler to properly reuse active conversations
  - Add conversationId to SSE response chunks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

- [x] 1.1 Verify and test DatabaseClient.getActiveConversation
  - Ensure method returns most recent conversation by updated_at
  - Ensure method returns null when no conversations exist
  - _Requirements: 3.1, 3.3_

- [ ]* 1.2 Write property test for active conversation consistency
  - **Property 1: Active conversation consistency**
  - **Validates: Requirements 3.1**

- [x] 1.3 Update chat-stream handler conversation resolution logic
  - Implement logic to reuse active conversation when no conversationId provided
  - Ensure explicit conversationId is respected
  - Ensure proper error handling for invalid conversationId
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.4 Write property test for conversation reuse determinism
  - **Property 2: Conversation reuse determinism**
  - **Validates: Requirements 1.1**

- [ ]* 1.5 Write property test for conversation isolation
  - **Property 3: Conversation isolation**
  - **Validates: Requirements 1.4**

- [x] 1.6 Add conversationId to SSE response first chunk
  - Modify stream chunk generation to include conversationId
  - Ensure conversationId is sent only in first chunk for efficiency
  - _Requirements: 4.1_

- [ ]* 1.7 Write property test for conversationId round-trip
  - **Property 4: ConversationId round-trip**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 1.8 Write property test for authorization invariant
  - **Property 5: Authorization invariant**
  - **Validates: Requirements 1.4**

- [x] 2. Update frontend to track conversationId
  - Modify useChat hook to extract conversationId from stream chunks
  - Store conversationId in state for subsequent requests
  - Add method to clear conversationId for new conversations
  - _Requirements: 4.2, 4.3_

- [x] 2.1 Update useChat hook to extract conversationId
  - Parse conversationId from first chunk of streaming response
  - Update state when conversationId is received
  - _Requirements: 4.2_

- [x] 2.2 Add startNewConversation method to useChat
  - Clear stored conversationId
  - Clear messages array
  - Prepare for fresh conversation
  - _Requirements: 4.3_

- [ ]* 2.3 Write unit tests for useChat conversationId handling
  - Test conversationId extraction from chunks
  - Test startNewConversation clears state
  - Test subsequent requests include conversationId
  - _Requirements: 4.2, 4.3_

- [x] 3. Add UI for starting new conversations
  - Add "New Conversation" button to App header
  - Wire button to startNewConversation method
  - Provide visual feedback when starting new conversation
  - _Requirements: 2.1_

- [x] 3.1 Add NewConversation button component
  - Create button in App header
  - Style consistently with existing UI
  - _Requirements: 2.1_

- [x] 3.2 Wire button to startNewConversation
  - Connect onClick handler to useChat.startNewConversation
  - Ensure button is disabled during streaming
  - _Requirements: 2.1_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. Integration testing
  - Test multi-turn conversation flow end-to-end
  - Test new conversation creation
  - Test explicit conversation switching
  - _Requirements: 1.1, 1.2, 1.3, 2.1_
