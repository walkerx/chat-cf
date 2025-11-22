/**
 * Chat Context Provider
 * Provides shared chat state across the application to preserve state during navigation
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import type { Message } from "../../../src/models/message.js";
import { streamChat, getConversation, getCharacterCard, getLatestCharacterConversation } from "../services/api.js";
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
}

export interface ChatContextValue {
	messages: Message[];
	isStreaming: boolean;
	error: string | null;
	conversationId: string | null;
	sessionId: string;
	characterCardId: string | null;
	characterGreeting: string | null;
	sendMessage: (prompt: string, userName?: string) => Promise<void>;
	abortStream: () => void;
	clearError: () => void;
	setConversationId: (id: string | null) => void;
	setCharacterCardId: (id: string | null) => void;
	startNewConversation: () => void;
	loadCharacterConversation: (characterId: string) => Promise<void>;
	clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const STORAGE_KEY = "chat_state";

interface StoredChatState {
	messages: Message[];
	conversationId: string | null;
	characterCardId: string | null;
}

/**
 * Load chat state from session storage
 */
function loadStateFromStorage(): Partial<StoredChatState> {
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (err) {
		console.error("Failed to load chat state from storage:", err);
	}
	return {};
}

/**
 * Save chat state to session storage
 */
function saveStateToStorage(state: StoredChatState): void {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (err) {
		console.error("Failed to save chat state to storage:", err);
	}
}

export function ChatProvider({ children }: { children: ReactNode }) {
	console.log("[DEBUG] ChatProvider initializing");
	const [sessionId] = useState(() => getOrCreateSessionId());

	// Load initial state from storage
	const storedState = loadStateFromStorage();
	console.log("[DEBUG] Loaded state from storage:", storedState);

	const [messages, setMessages] = useState<Message[]>(storedState.messages || []);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(storedState.conversationId || null);
	const [characterCardId, setCharacterCardId] = useState<string | null>(storedState.characterCardId || null);
	const [characterGreeting, setCharacterGreeting] = useState<string | null>(null);
	const abortRef = useRef<(() => void) | null>(null);

	// Save state to storage whenever it changes
	useEffect(() => {
		saveStateToStorage({
			messages,
			conversationId,
			characterCardId,
		});
	}, [messages, conversationId, characterCardId]);

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
		async (prompt: string, userName?: string) => {
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
						userName: userName || undefined,
					},
					sessionId
				);

				abortRef.current = abort;

				// Create assistant message placeholder
				let assistantMessage: Message | null = null;
				let fullContent = "";

				for await (const chunk of chunks) {
					// Extract conversationId from first chunk if present
					if (chunk.conversationId && !conversationId) {
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
								conversation_id: chunk.conversationId || conversationId || "",
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
			} catch (err) {
				// Handle specific error cases
				let errorMessage = "Failed to send message";

				if (err instanceof Error) {
					const errMsg = err.message.toLowerCase();

					// Network errors
					if (errMsg.includes("network") || errMsg.includes("fetch") || errMsg.includes("failed to fetch")) {
						errorMessage = "Network error. Please check your connection and try again.";
					}
					// Aborted requests
					else if (errMsg.includes("abort")) {
						errorMessage = "Message cancelled";
					}
					// Server errors
					else if (errMsg.includes("500") || errMsg.includes("server error")) {
						errorMessage = "Server error. Please try again later.";
					}
					// Rate limiting
					else if (errMsg.includes("429") || errMsg.includes("rate limit")) {
						errorMessage = "Too many requests. Please wait a moment and try again.";
					}
					// Use original error message for other cases
					else {
						errorMessage = err.message;
					}
				}

				setError(errorMessage);
			} finally {
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[conversationId, characterCardId, sessionId]
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
	 */
	const loadCharacterConversation = useCallback(async (characterId: string) => {
		try {
			setError(null);

			// Get the latest conversation for this character
			const latestConversation = await getLatestCharacterConversation(characterId, sessionId);

			if (latestConversation) {
				// Load existing conversation history
				const { messages: historyMessages } = await getConversation(
					latestConversation.id,
					sessionId
				);
				setConversationId(latestConversation.id);
				setMessages(historyMessages);
			} else {
				// No conversation exists - start fresh
				setConversationId(null);
				setMessages([]);
			}
		} catch (err) {
			console.error("Failed to load character conversation:", err);

			// Handle specific error cases
			let errorMessage = "Failed to load conversation history";

			if (err instanceof Error) {
				const errMsg = err.message.toLowerCase();

				// Network errors
				if (errMsg.includes("network") || errMsg.includes("fetch") || errMsg.includes("failed to fetch")) {
					errorMessage = "Network error. Unable to load conversation history.";
				}
				// Not found errors (conversation deleted)
				else if (errMsg.includes("404") || errMsg.includes("not found")) {
					errorMessage = "Conversation not found. Starting a new conversation.";
				}
				// Use original error message for other cases
				else {
					errorMessage = err.message;
				}
			}

			setError(errorMessage);
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

	const value: ChatContextValue = {
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
	};

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to access chat context
 */
export function useChatContext(): ChatContextValue {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
}
