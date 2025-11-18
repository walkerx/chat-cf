/**
 * React hooks for state management
 * Manage messages, streaming state, error state, conversation ID
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message } from "../../../src/models/message.js";
import { streamChat, getConversation, listConversations } from "../services/api.js";
import { getOrCreateSessionId } from "../services/session.js";
import { generateMessageId } from "../../../src/models/message.js";

export interface ChatState {
	messages: Message[];
	isStreaming: boolean;
	error: string | null;
	conversationId: string | null;
	sessionId: string;
}

export interface UseChatReturn {
	messages: Message[];
	isStreaming: boolean;
	error: string | null;
	conversationId: string | null;
	sessionId: string;
	sendMessage: (prompt: string) => Promise<void>;
	abortStream: () => void;
	clearError: () => void;
	setConversationId: (id: string | null) => void;
	startNewConversation: () => void;
}

/**
 * useChat hook
 */
export function useChat(): UseChatReturn {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(null);
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

	const sendMessage = useCallback(
		async (prompt: string) => {
			if (!prompt.trim() || isStreaming) {
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
				const errorMessage =
					err instanceof Error ? err.message : "Failed to send message";
				setError(errorMessage);
			} finally {
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[conversationId, sessionId]
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
	}, []);

	return {
		messages,
		isStreaming,
		error,
		conversationId,
		sessionId,
		sendMessage,
		abortStream,
		clearError,
		setConversationId,
		startNewConversation,
	};
}

