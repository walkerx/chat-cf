/**
 * React hooks for state management
 * Manage messages, streaming state, error state, conversation ID
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message } from "../../../src/models/message.js";
import { streamChat, getConversation, listConversations, getCharacterCard, getLatestCharacterConversation } from "../services/api.js";
import { getOrCreateSessionId } from "../services/session.js";
import { generateMessageId } from "../../../src/models/message.js";

export interface ChatState {
	messages: Message[];
	isStreaming: boolean;
	error: string | null;
	conversationId: string | null;
	sessionId: string;
	characterCardId: string | null;
	characterGreeting: string | null;
	streamEnabled: boolean;
}

/**
 * Conversation cache entry
 */
interface ConversationCacheEntry {
	messages: Message[];
	conversationId: string;
	timestamp: number;
}

/**
 * In-memory cache for loaded conversations
 * Key: conversationId, Value: cached messages and metadata
 */
const conversationCache = new Map<string, ConversationCacheEntry>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

export interface UseChatReturn {
	messages: Message[];
	isStreaming: boolean;
	error: string | null;
	conversationId: string | null;
	sessionId: string;
	characterCardId: string | null;
	characterGreeting: string | null;
	sendMessage: (prompt: string) => Promise<void>;
	abortStream: () => void;
	clearError: () => void;
	setConversationId: (id: string | null) => void;
	setCharacterCardId: (id: string | null) => void;
	startNewConversation: () => void;
	loadCharacterConversation: (characterId: string) => Promise<void>;
	clearMessages: () => void;
	streamEnabled: boolean;
	setStreamEnabled: (enabled: boolean) => void;
}

/**
 * useChat hook
 */
export function useChat(): UseChatReturn {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [characterCardId, setCharacterCardId] = useState<string | null>(null);
	const [characterGreeting, setCharacterGreeting] = useState<string | null>(null);
	const [streamEnabled, setStreamEnabled] = useState<boolean>(true);
	const [sessionId] = useState(() => getOrCreateSessionId());
	const abortRef = useRef<(() => void) | null>(null);

	// Load conversation history on mount
	useEffect(() => {
		async function loadHistory() {
			try {
				// Get the most recent conversation for this session
				const conversations = await listConversations(sessionId);

				if (conversations.length > 0) {
					const mostRecent = conversations[0];
					const { messages: historyMessages } = await getConversation(
						mostRecent.id,
						sessionId
					);

					setConversationId(mostRecent.id);
					setMessages(historyMessages);
				}
			} catch (err) {
				console.error("Failed to load conversation history:", err);
				// Don't show error to user, just start fresh
			}
		}

		loadHistory();
	}, [sessionId]);

	// Load character greeting when character card is selected
	useEffect(() => {
		async function loadCharacterGreeting() {
			if (!characterCardId) {
				setCharacterGreeting(null);
				return;
			}

			try {
				const card = await getCharacterCard(characterCardId);
				setCharacterGreeting(card.data.data.first_mes);
			} catch (err) {
				console.error("Failed to load character greeting:", err);
				setCharacterGreeting(null);
			}
		}

		loadCharacterGreeting();
	}, [characterCardId]);

	const sendMessage = useCallback(
		async (prompt: string) => {
			if (!prompt.trim()) {
				return;
			}

			setError(null);
			setIsStreaming(true);

			// Add user message
			const userMessage: Message = {
				id: generateMessageId(),
				conversation_id: conversationId || "",
				role: "user",
				content: prompt,
				created_at: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMessage]);

			try {
				const { chunks, abort } = await streamChat(
					{
						prompt,
						conversationId: conversationId || undefined,
						characterCardId: characterCardId || undefined,
						stream: streamEnabled,
					},
					sessionId
				);

				abortRef.current = abort;

				// Create assistant message placeholder
				let assistantMessage: Message | null = null;
				let fullContent = "";

				let currentConversationId = conversationId;

				for await (const chunk of chunks) {
					// Extract conversationId from first chunk if present
					if (chunk.conversationId && !currentConversationId) {
						currentConversationId = chunk.conversationId;
						setConversationId(chunk.conversationId);
					}

					if (chunk.type === "error") {
						// Handle error chunk
						try {
							const errorData = JSON.parse(chunk.text);
							setError(errorData.message || "An error occurred");
						} catch {
							setError(chunk.text);
						}
						break;
					}

					if (chunk.type === "content") {
						fullContent += chunk.text;

						// Update or create assistant message
						if (!assistantMessage) {
							assistantMessage = {
								id: generateMessageId(),
								conversation_id: chunk.conversationId || currentConversationId || "",
								role: "assistant",
								content: fullContent,
								created_at: new Date().toISOString(),
							};
							setMessages((prev) => [...prev, assistantMessage!]);
						} else {
							// Update existing message
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === assistantMessage!.id
										? { ...msg, content: fullContent }
										: msg
								)
							);
						}
					}
				}

				// Update cache with new messages after streaming completes
				if (currentConversationId && assistantMessage) {
					setMessages((currentMessages) => {
						conversationCache.set(currentConversationId!, {
							messages: currentMessages,
							conversationId: currentConversationId!,
							timestamp: Date.now(),
						});
						return currentMessages;
					});
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to send message";
				setError(errorMessage);
			} finally {
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[conversationId, characterCardId, sessionId, streamEnabled]
	);

	const abortStream = useCallback(() => {
		if (abortRef.current) {
			abortRef.current();
			abortRef.current = null;
			setIsStreaming(false);
		}
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const startNewConversation = useCallback(() => {
		setConversationId(null);
		setMessages([]);
		setError(null);
		setCharacterGreeting(null);
		// Keep characterCardId so new conversation uses same character
	}, []);

	/**
	 * Load the most recent conversation for a specific character
	 * If no conversation exists, starts fresh with empty messages
	 * Ensures conversation isolation between characters
	 * Uses in-memory cache to avoid re-fetching on navigation
	 */
	const loadCharacterConversation = useCallback(async (characterId: string) => {
		try {
			setError(null);

			// Get the latest conversation for this character
			const latestConversation = await getLatestCharacterConversation(characterId, sessionId);

			if (latestConversation) {
				// Check cache first
				const cached = conversationCache.get(latestConversation.id);
				const now = Date.now();

				if (cached && (now - cached.timestamp) < CACHE_TTL) {
					// Use cached data
					setConversationId(cached.conversationId);
					setMessages(cached.messages);
				} else {
					// Load from API and cache
					const { messages: historyMessages } = await getConversation(
						latestConversation.id,
						sessionId
					);

					// Update cache
					conversationCache.set(latestConversation.id, {
						messages: historyMessages,
						conversationId: latestConversation.id,
						timestamp: now,
					});

					setConversationId(latestConversation.id);
					setMessages(historyMessages);
				}
			} else {
				// No conversation exists - start fresh
				setConversationId(null);
				setMessages([]);
			}
		} catch (err) {
			console.error("Failed to load character conversation:", err);
			setError("Failed to load conversation history");
			// Start fresh on error
			setConversationId(null);
			setMessages([]);
		}
	}, [sessionId]);

	/**
	 * Clear all messages from the current conversation
	 * Useful when switching characters or starting fresh
	 */
	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		isStreaming,
		error,
		conversationId,
		sessionId,
		characterCardId,
		characterGreeting,
		sendMessage,
		abortStream,
		clearError,
		setConversationId,
		setCharacterCardId,
		startNewConversation,
		loadCharacterConversation,
		clearMessages,
		streamEnabled,
		setStreamEnabled,
	};
}

