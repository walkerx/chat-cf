/**
 * API client service
 * Fetch wrapper for /api/chat/stream (SSE with EventSource or fetch), /api/conversations (list), /api/conversations/{id} (load history)
 */

import type { StreamChunk } from "../../../src/models/stream-chunk.js";
import type { Conversation } from "../../../src/models/conversation.js";
import type { Message } from "../../../src/models/message.js";
import { getOrCreateSessionId } from "./session.js";

const API_BASE = ""; // Relative to current origin

export interface ChatStreamRequest {
	prompt: string;
	conversationId?: string;
	characterCardId?: string;
	userName?: string;
}

export interface ChatStreamResponse {
	chunks: AsyncIterable<StreamChunk>;
	abort: () => void;
}

/**
 * Stream chat completion via SSE
 */
export async function streamChat(
	request: ChatStreamRequest,
	sessionId?: string
): Promise<ChatStreamResponse> {
	const sid = sessionId || getOrCreateSessionId();
	const abortController = new AbortController();

	const response = await fetch(`${API_BASE}/api/chat/stream`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Session-ID": sid,
		},
		body: JSON.stringify(request),
		signal: abortController.signal,
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	if (!response.body) {
		throw new Error("Response has no body");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	async function* readChunks(): AsyncGenerator<StreamChunk, void, unknown> {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || !trimmed.startsWith("data: ")) continue;

					const data = trimmed.slice(6); // Remove "data: " prefix
					if (data === "[DONE]") {
						return;
					}

					try {
						const chunk = JSON.parse(data) as StreamChunk;
						yield chunk;
					} catch (error) {
						console.error("Failed to parse chunk:", error);
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	return {
		chunks: readChunks(),
		abort: () => abortController.abort(),
	};
}

/**
 * List conversations for a session
 */
export async function listConversations(
	sessionId?: string
): Promise<Conversation[]> {
	const sid = sessionId || getOrCreateSessionId();

	const response = await fetch(`${API_BASE}/api/conversations?sessionId=${sid}`, {
		method: "GET",
		headers: {
			"X-Session-ID": sid,
		},
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data.conversations || [];
}

/**
 * Get conversation with messages
 */
export async function getConversation(
	conversationId: string,
	sessionId?: string
): Promise<{ conversation: Conversation; messages: Message[] }> {
	const sid = sessionId || getOrCreateSessionId();

	const response = await fetch(
		`${API_BASE}/api/conversations/${conversationId}`,
		{
			method: "GET",
			headers: {
				"X-Session-ID": sid,
			},
		}
	);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

/**
 * Character Card API types
 */
export interface CharacterCardData {
	name: string;
	description: string;
	first_mes: string;
	personality?: string;
	scenario?: string;
	system_prompt?: string;
	alternate_greetings?: string[];
	nickname?: string;
	tags?: string[];
	creator?: string;
	[key: string]: any;
}

export interface CharacterCardV3 {
	spec: "chara_card_v3";
	spec_version: "3.0";
	data: CharacterCardData;
}

export interface CharacterCardListItem {
	id: string;
	name: string;
	data: CharacterCardV3;
	created_at: string;
	modified_at: string;
}

/**
 * List all character cards
 */
export async function listCharacterCards(
	limit: number = 50
): Promise<CharacterCardListItem[]> {
	const response = await fetch(
		`${API_BASE}/api/character-cards?limit=${limit}`,
		{
			method: "GET",
		}
	);

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data.character_cards || [];
}

/**
 * Get a specific character card
 */
export async function getCharacterCard(
	id: string
): Promise<CharacterCardListItem> {
	const response = await fetch(`${API_BASE}/api/character-cards/${id}`, {
		method: "GET",
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

/**
 * Create a new character card
 */
export async function createCharacterCard(
	card: CharacterCardV3
): Promise<CharacterCardListItem> {
	const response = await fetch(`${API_BASE}/api/character-cards`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(card),
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

/**
 * Get conversations for a specific character
 * Filters all conversations by character_card_id
 */
export async function getCharacterConversations(
	characterId: string,
	sessionId?: string
): Promise<Conversation[]> {
	const allConversations = await listConversations(sessionId);
	return allConversations.filter(c => c.character_card_id === characterId);
}

/**
 * Get the most recent conversation for a character
 * Returns null if no conversations exist for this character
 */
export async function getLatestCharacterConversation(
	characterId: string,
	sessionId?: string
): Promise<Conversation | null> {
	const conversations = await getCharacterConversations(characterId, sessionId);
	return conversations.length > 0 ? conversations[0] : null;
}

/**
 * Delete a character card
 */
/**
 * Delete a character card
 */
export async function deleteCharacterCard(id: string): Promise<void> {
	const response = await fetch(`${API_BASE}/api/character-cards/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}
}

/**
 * Upload an image
 */
export async function uploadImage(file: File): Promise<{ url: string; key: string }> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch(`${API_BASE}/api/upload`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

/**
 * Update a character card
 */
export async function updateCharacterCard(
	id: string,
	card: CharacterCardV3
): Promise<CharacterCardListItem> {
	const response = await fetch(`${API_BASE}/api/character-cards/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(card),
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return await response.json();
}

