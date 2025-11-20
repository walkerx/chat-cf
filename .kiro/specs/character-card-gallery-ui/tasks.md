# Implementation Plan

- [x] 1. Set up routing infrastructure
  - Install react-router-dom package
  - Update main.tsx to use BrowserRouter with Routes
  - Create route structure: "/" for gallery, "/chat/:characterId?" for chat
  - _Requirements: 1.1, 2.1, 4.2_

- [x] 2. Create page components structure
- [x] 2.1 Create GalleryPage component
  - Create public/src/pages/GalleryPage.tsx
  - Implement state management for characters, loading, and search
  - Load characters with conversation history on mount
  - Implement character selection navigation
  - _Requirements: 1.1, 1.2, 3.5_

- [x] 2.2 Create ChatPage component
  - Create public/src/pages/ChatPage.tsx
  - Extract character ID from URL params
  - Integrate with existing useChat hook
  - Load character-specific conversation on mount
  - Implement back navigation to gallery
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_

- [ ]* 2.3 Write property test for navigation with character selection
  - **Property 2: Navigation with character selection**
  - **Validates: Requirements 2.1**

- [ ]* 2.4 Write property test for client-side navigation
  - **Property 25: Client-side navigation**
  - **Validates: Requirements 9.4**

- [x] 3. Implement gallery grid and character cards
- [x] 3.1 Create GalleryGrid component
  - Create public/src/components/GalleryGrid.tsx
  - Implement responsive CSS grid layout
  - Handle empty state when no characters exist
  - Pass character selection callback to cards
  - _Requirements: 1.2, 1.5_

- [x] 3.2 Create CharacterCard component
  - Create public/src/components/CharacterCard.tsx
  - Display character name, description, and personality
  - Implement hover effects and card styling
  - Add click handler for navigation
  - _Requirements: 1.3, 8.1, 8.2_

- [x] 3.3 Add history indicators to character cards
  - Display conversation count badge when conversations exist
  - Show last message timestamp
  - Calculate and display most recent conversation info
  - Hide indicator when no conversation history
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.4 Write property test for character card display completeness
  - **Property 1: Character card display completeness**
  - **Validates: Requirements 1.3**

- [ ]* 3.5 Write property test for history indicator presence
  - **Property 14: History indicator presence**
  - **Validates: Requirements 5.1**

- [ ]* 3.6 Write property test for no indicator without history
  - **Property 17: No indicator without history**
  - **Validates: Requirements 5.4**

- [x] 4. Implement conversation management per character
- [x] 4.1 Extend API service with character-specific conversation helpers
  - Add getCharacterConversations() function to api.ts
  - Add getLatestCharacterConversation() function
  - Implement conversation filtering by character_card_id
  - _Requirements: 3.4, 3.5_

- [x] 4.2 Update useChat hook for character-specific loading
  - Add loadCharacterConversation() method
  - Add clearMessages() method
  - Modify conversation loading to filter by character
  - Ensure conversation isolation between characters
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 4.3 Write property test for conversation isolation
  - **Property 7: Conversation isolation**
  - **Validates: Requirements 3.1**

- [ ]* 4.4 Write property test for conversation restoration
  - **Property 8: Conversation restoration**
  - **Validates: Requirements 3.2**

- [ ]* 4.5 Write property test for conversation filtering
  - **Property 11: Conversation filtering by character**
  - **Validates: Requirements 3.5**

- [ ]* 4.6 Write property test for multiple conversations per character
  - **Property 9: Multiple conversations per character**
  - **Validates: Requirements 3.3**

- [x] 5. Create chat header with navigation
- [x] 5.1 Create ChatHeader component
  - Create public/src/components/ChatHeader.tsx
  - Add back button with navigation to gallery
  - Display character name in header
  - Add "New Chat" button for starting fresh conversations
  - _Requirements: 4.1, 4.2, 2.5_

- [ ]* 5.2 Write property test for character name in header
  - **Property 6: Character name in header**
  - **Validates: Requirements 2.5**

- [ ]* 5.3 Write property test for back navigation
  - **Property 12: Back navigation**
  - **Validates: Requirements 4.2**

- [x] 6. Implement search and filter functionality
- [x] 6.1 Create GalleryHeader component with search
  - Create public/src/components/GalleryHeader.tsx
  - Add search input field
  - Implement search query state management
  - Add upload button
  - _Requirements: 7.1, 6.1_

- [x] 6.2 Implement search filtering logic
  - Filter characters by name, description, and personality
  - Implement case-insensitive matching
  - Handle empty search results
  - Implement search reset on clear
  - _Requirements: 7.2, 7.4, 7.5_

- [x] 6.3 Add search result highlighting
  - Highlight matching text in character cards
  - Apply highlight CSS styling
  - _Requirements: 7.3_

- [ ]* 6.4 Write property test for search filtering
  - **Property 20: Search filtering**
  - **Validates: Requirements 7.2**

- [ ]* 6.5 Write property test for search reset
  - **Property 22: Search reset**
  - **Validates: Requirements 7.5**

- [ ]* 6.6 Write property test for search highlight
  - **Property 21: Search highlight**
  - **Validates: Requirements 7.3**

- [x] 7. Implement character upload functionality
- [x] 7.1 Create UploadModal component
  - Create public/src/components/UploadModal.tsx
  - Implement modal overlay and content
  - Add file input for JSON upload
  - Handle file reading and parsing
  - Validate character card format
  - _Requirements: 6.2, 6.3, 6.5_

- [x] 7.2 Integrate upload with gallery
  - Connect upload button to modal
  - Update character list on successful upload
  - Display new character immediately
  - Handle upload errors with user-friendly messages
  - _Requirements: 6.3, 6.4, 6.5_

- [ ]* 7.3 Write property test for character upload success
  - **Property 18: Character upload success**
  - **Validates: Requirements 6.3, 6.4**

- [ ]* 7.4 Write property test for invalid upload error handling
  - **Property 19: Invalid upload error handling**
  - **Validates: Requirements 6.5**

- [x] 8. Implement character management actions
- [x] 8.1 Add action menu to character cards
  - Add menu icon/button to CharacterCard component
  - Implement menu dropdown with edit/delete options
  - Handle menu open/close state
  - _Requirements: 10.1, 10.2_

- [x] 8.2 Implement character deletion
  - Add delete confirmation dialog
  - Call delete API endpoint
  - Remove character from gallery on success
  - Handle deletion errors
  - _Requirements: 10.3, 10.4_

- [x] 8.3 Add warning for deleting characters with history
  - Check if character has conversations before deletion
  - Display warning about orphaned conversations
  - Allow user to confirm or cancel
  - _Requirements: 10.5_

- [ ]* 8.4 Write property test for character deletion
  - **Property 28: Character deletion**
  - **Validates: Requirements 10.4**

- [ ]* 8.5 Write property test for deletion warning
  - **Property 29: Deletion warning for characters with history**
  - **Validates: Requirements 10.5**

- [x] 9. Update existing chat integration
- [x] 9.1 Modify ChatPage to load character data
  - Load character card from database using ID from URL
  - Set character in useChat hook
  - Display character greeting on first load
  - Handle character not found errors
  - _Requirements: 9.1, 9.2, 2.2_

- [x] 9.2 Ensure compiled context usage
  - Verify prompt builder uses character's compiled context
  - Test that character-specific prompts are generated
  - _Requirements: 9.3_

- [ ]* 9.3 Write property test for greeting display
  - **Property 3: Greeting display on chat entry**
  - **Validates: Requirements 2.2**

- [ ]* 9.4 Write property test for character ID propagation
  - **Property 23: Character ID propagation**
  - **Validates: Requirements 9.1, 9.2**

- [ ]* 9.5 Write property test for compiled context usage
  - **Property 24: Compiled context usage**
  - **Validates: Requirements 9.3**

- [x] 10. Implement state preservation during navigation
- [x] 10.1 Add navigation state management
  - Ensure conversation state persists when navigating to gallery
  - Restore conversation when returning to chat
  - Prevent data loss during navigation
  - _Requirements: 4.3, 4.4_

- [ ]* 10.2 Write property test for state preservation
  - **Property 13: State preservation on navigation**
  - **Validates: Requirements 4.3, 4.4**

- [x] 11. Add comprehensive error handling
- [x] 11.1 Implement error boundaries
  - Add error boundary component for gallery
  - Add error boundary component for chat
  - Display user-friendly error messages
  - Allow recovery without full page reload
  - _Requirements: 9.5_

- [x] 11.2 Handle specific error cases
  - Character not found errors
  - Failed to load conversations
  - Upload errors
  - Network errors
  - _Requirements: 9.5_

- [ ]* 11.3 Write property test for error resilience
  - **Property 26: Error resilience**
  - **Validates: Requirements 9.5**

- [x] 12. Style the gallery interface
- [x] 12.1 Create gallery-specific CSS
  - Create public/src/styles/gallery.css
  - Implement responsive grid layout
  - Add card styling with shadows and hover effects
  - Style search bar and upload button
  - Add modal styling
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 12.2 Create chat page CSS updates
  - Update chat header styling
  - Add back button styling
  - Ensure responsive design
  - _Requirements: 8.3, 8.4_

- [x] 12.3 Add animations and transitions
  - Add smooth transitions between views
  - Implement card hover animations
  - Add modal fade-in/fade-out
  - _Requirements: 8.2, 8.5_

- [x] 13. Implement accessibility features
- [x] 13.1 Add keyboard navigation
  - Ensure all interactive elements are keyboard accessible
  - Add proper tab order
  - Implement keyboard shortcuts for common actions
  - _Requirements: 8.1_

- [x] 13.2 Add ARIA labels and roles
  - Add ARIA labels to character cards
  - Add ARIA labels to buttons and inputs
  - Ensure screen reader compatibility
  - _Requirements: 8.4_

- [x] 13.3 Ensure color contrast
  - Verify text meets WCAG AA standards
  - Test with contrast checking tools
  - _Requirements: 8.3_

- [-] 14. Optimize performance
- [x] 14.1 Implement search debouncing
  - Debounce search input to reduce filtering operations
  - Target < 50ms response time
  - _Requirements: 7.2_

- [x] 14.2 Add memoization
  - Memoize filtered character lists
  - Memoize character card components
  - Memoize search results
  - _Requirements: 1.2, 7.2_

- [ ] 14.3 Implement conversation caching
  - Cache loaded conversations in memory
  - Avoid re-fetching on navigation
  - _Requirements: 3.2, 4.3_

- [ ] 15. Add integration tests
- [ ]* 15.1 Write end-to-end gallery to chat flow test
  - Test: Gallery → Select Character → Chat → Send Message → Back
  - Verify conversation persistence
  - _Requirements: 2.1, 2.3, 4.2_

- [ ]* 15.2 Write character upload flow test
  - Test: Upload → Verify in Gallery → Select → Chat
  - _Requirements: 6.3, 6.4, 2.1_

- [ ]* 15.3 Write character switching test
  - Test: Character A → Character B → Character A
  - Verify conversation isolation
  - _Requirements: 3.1, 3.2_

- [ ] 16. Update documentation
- [ ] 16.1 Update README with gallery feature
  - Document new gallery interface
  - Add screenshots or GIFs
  - Explain character management features
  - _Requirements: 1.1_

- [ ] 16.2 Add inline code documentation
  - Document new components
  - Add JSDoc comments
  - Document props and interfaces
  - _Requirements: All_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
