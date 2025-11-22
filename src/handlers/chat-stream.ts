/**
 * Chat streaming handler
 * POST /api/chat/stream - Stream AI responses via SSE
 */

import type { Context } from "hono";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
import { DatabaseClient } from "../services/db.js";
import { OpenRouterClient } from "../services/openrouter.js";
import { getOrGenerateSessionId } from "../utils/session.js";
import { prepareContextForOpenRouter } from "../utils/prompt.js";
import { createStandardErrorResponse, formatErrorAsStreamChunk } from "../utils/errors.js";
import { generateConversationId, type Conversation } from "../models/conversation.js";
import { generateMessageId } from "../models/message.js";
import { PromptBuilder, type CompiledContext } from "../services/prompt-builder.js";
import { CBSProcessor } from "../services/cbs-processor.js";

/**
 * POST /api/chat/stream
 * Stream AI chat response via Server-Sent Events
 */
export async function handleChatStream(
	c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
	const sessionId = c.req.header("X-Session-ID") || getOrGenerateSessionId(null);

	// Parse request body
	let body: { prompt?: string; conversationId?: string; characterCardId?: string; userName?: string };
	try {
		body = await c.req.json();
	} catch (error) {
		return c.json(createStandardErrorResponse("INVALID_REQUEST"), 400);
	}

	// Validate prompt
	const prompt = body.prompt?.trim();
	if (!prompt || prompt.length === 0) {
		return c.json(createStandardErrorResponse("INVALID_REQUEST"), 400);
	}

	if (prompt.length > 10000) {
		return c.json(createStandardErrorResponse("INVALID_REQUEST"), 400);
	}

	// Get userName from body or default to "User"
	const userName = body.userName?.trim() || "User";

	// Initialize services
	const db = new DatabaseClient(c.env.DB);

	// Get API key from Cloudflare bindings (secrets or .dev.vars)
	const apiKey = c.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		return c.json(
			createStandardErrorResponse("INTERNAL_ERROR"),
			500
		);
	}

	// Get AI model from environment (defaults to deepseek)
	const aiModel = c.env.AI_MODEL || "deepseek/deepseek-v3.2-exp";

	const openRouter = new OpenRouterClient({
		apiKey,
	});

	// Ensure session exists in database (required for foreign key constraint)
	await db.getOrCreateSession(sessionId);

	// Get or create conversation
	let conversationId = body.conversationId;
	let messageHistory: ChatCompletionMessageParam[] = [];
	let characterCardId = body.characterCardId;
	let compiledContext: CompiledContext | undefined;
	let useCharacterCardPrompt = false;

	if (conversationId) {
		// Explicit conversation ID provided - load it
		const result = await db.getConversationWithCharacterCard(conversationId);
		if (!result) {
			return c.json(createStandardErrorResponse("NOT_FOUND"), 404);
		}

		// Verify conversation belongs to session
		if (result.conversation.session_id !== sessionId) {
			return c.json(createStandardErrorResponse("UNAUTHORIZED"), 401);
		}

		// Load character card if present
		if (result.conversation.character_card_id) {
			characterCardId = result.conversation.character_card_id;
			useCharacterCardPrompt = true;

			// Load compiled context if available
			if (result.conversation.compiled_context) {
				try {
					compiledContext = JSON.parse(result.conversation.compiled_context);
				} catch (error) {
					console.error("Failed to parse compiled context:", error);
					// Will recompile below
				}
			}
		}

		// Prepare message history
		if (useCharacterCardPrompt) {
			// Will use PromptBuilder, just store messages
			messageHistory = result.messages.map(m => ({
				role: m.role,
				content: m.content,
			}));
		} else {
			// Use traditional prompt preparation
			messageHistory = prepareContextForOpenRouter(result.messages, prompt);
		}
	} else {
		// No conversation ID provided - reuse active conversation or create new one
		// No conversation ID provided - reuse active conversation or create new one
		let activeConversation: Conversation | null = null;

		if (characterCardId) {
			activeConversation = await db.getActiveCharacterConversation(sessionId, characterCardId!);
		} else {
			activeConversation = await db.getActiveConversation(sessionId);
		}

		if (activeConversation) {
			// Reuse existing active conversation
			conversationId = activeConversation.id;
			const result = await db.getConversationWithCharacterCard(conversationId);
			if (result) {
				// Load character card if present
				if (result.conversation.character_card_id) {
					characterCardId = result.conversation.character_card_id;
					useCharacterCardPrompt = true;

					// Load compiled context if available
					if (result.conversation.compiled_context) {
						try {
							compiledContext = JSON.parse(result.conversation.compiled_context);
						} catch (error) {
							console.error("Failed to parse compiled context:", error);
							// Will recompile below
							compiledContext = undefined;
						}
					}
				}

				// Prepare message history
				if (useCharacterCardPrompt) {
					messageHistory = result.messages.map(m => ({
						role: m.role,
						content: m.content,
					}));
				} else {
					messageHistory = prepareContextForOpenRouter(result.messages, prompt);
				}
			} else {
				// Fallback if messages can't be loaded
				messageHistory = [{ role: "user", content: prompt }];
			}
		} else {
			// Create new conversation (first conversation for this session)
			conversationId = generateConversationId();
			await db.createConversation(conversationId, sessionId, undefined, characterCardId);
			messageHistory = [{ role: "user", content: prompt }];

			// If character card provided, mark for use and save greeting message
			if (characterCardId) {
				useCharacterCardPrompt = true;

				// Load character card and save greeting as first message
				const characterCardData = await db.getCharacterCard(characterCardId);
				if (characterCardData && characterCardData.data.data.first_mes) {
					// Process CBS macros in greeting (replace {{user}} and {{char}})
					const cbsProcessor = new CBSProcessor();
					const charName = characterCardData.data.data.nickname || characterCardData.data.data.name;
					const processedGreeting = cbsProcessor.process(
						characterCardData.data.data.first_mes,
						{
							charName,
							userName,
							conversationId,
						}
					);

					const greetingMessageId = generateMessageId();
					await db.createMessage(
						greetingMessageId,
						conversationId,
						"assistant",
						processedGreeting
					);
				}
			}
		}
	}

	if (!conversationId) {
		return c.json(createStandardErrorResponse("INTERNAL_ERROR"), 500);
	}

	// If using character card, compile static context if needed and build full prompt
	if (useCharacterCardPrompt && characterCardId) {
		// Load character card if not already loaded
		const characterCardData = await db.getCharacterCard(characterCardId);
		if (!characterCardData) {
			return c.json(createStandardErrorResponse("NOT_FOUND"), 404);
		}

		// DEBUG: Log character card data
		console.log(`[DEBUG] Character Card ID: ${characterCardId}`);
		console.log(`[DEBUG] Character Card post_history_instructions: '${characterCardData.data.data.post_history_instructions}'`);

		const promptBuilder = new PromptBuilder();

		// Check if compiled context is stale (missing new fields)
		// If character card has post_history_instructions but compiled context doesn't, force recompile
		if (compiledContext && characterCardData.data.data.post_history_instructions && !compiledContext.postHistoryInstructions) {
			console.log("[DEBUG] Compiled context is stale (missing post_history_instructions), forcing recompile");
			compiledContext = undefined;
		}

		// Compile static context if not already compiled
		if (!compiledContext) {
			console.log("[DEBUG] Compiling static context...");
			compiledContext = await promptBuilder.compileStaticContext(
				characterCardData.data,
				userName
			);
			console.log(`[DEBUG] Compiled Context postHistoryInstructions: '${compiledContext.postHistoryInstructions}'`);

			// Store compiled context in database for future use
			await db.updateConversationCompiledContext(
				conversationId,
				JSON.stringify(compiledContext)
			);
		} else {
			console.log("[DEBUG] Using existing compiled context");
			console.log(`[DEBUG] Existing Compiled Context postHistoryInstructions: '${compiledContext.postHistoryInstructions}'`);
		}

		// Convert message history from ChatCompletionMessageParam to Message[]
		// Filter out system messages as Message type only supports user/assistant
		const messages = messageHistory
			.filter(msg => msg.role === 'user' || msg.role === 'assistant')
			.map((msg, index) => ({
				id: `history-${index}`,
				conversation_id: conversationId,
				role: msg.role as "user" | "assistant",
				content: typeof msg.content === 'string' ? msg.content : '',
				created_at: new Date().toISOString(),
			}));

		messageHistory = await promptBuilder.buildPrompt({
			compiledContext,
			characterCard: characterCardData.data,
			messages,
			userPrompt: prompt,
			userName,
			conversationId,
		});
	}

	// Save user message
	const userMessageId = generateMessageId();
	await db.createMessage(userMessageId, conversationId, "user", prompt);

	// Track first chunk latency
	const startTime = Date.now();
	let firstChunkReceived = false;
	let fullResponse = "";

	// Create SSE stream
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Create abort controller for cancellation support
				const abortController = new AbortController();

				// Stream from OpenRouter
				let chunkIndex = 0;
				for await (const chunk of openRouter.streamChatCompletion(
					{
						model: aiModel,
						messages: messageHistory,
						max_tokens: 5000,
					},
					abortController.signal
				)) {
					// Track first chunk latency
					if (!firstChunkReceived) {
						const latency = Date.now() - startTime;
						console.log(
							JSON.stringify({
								type: "first_chunk_latency",
								latency_ms: latency,
								sessionId,
								conversationId,
							})
						);
						firstChunkReceived = true;
					}

					// Accumulate full response
					if (chunk.type === "content") {
						fullResponse += chunk.text;
					}

					// Send chunk to client
					// Include conversationId in first chunk only for efficiency
					const chunkData = `data: ${JSON.stringify({
						index: chunkIndex,
						text: chunk.text,
						type: chunk.type,
						timestamp: chunk.timestamp,
						...(chunkIndex === 0 ? { conversationId } : {}),
					})}\n\n`;
					controller.enqueue(encoder.encode(chunkData));
					chunkIndex++;
				}

				// Save assistant message after streaming completes
				if (fullResponse) {
					const assistantMessageId = generateMessageId();
					await db.createMessage(
						assistantMessageId,
						conversationId,
						"assistant",
						fullResponse
					);
				}

				// Send completion marker
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
				controller.close();
			} catch (error) {
				// Handle errors
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				console.error("Streaming error:", errorMessage);

				// Send error chunk
				const errorChunk = formatErrorAsStreamChunk(
					0,
					"INTERNAL_ERROR",
					errorMessage
				);
				const errorData = `data: ${JSON.stringify({
					index: 0,
					text: errorChunk.text,
					type: errorChunk.type,
					timestamp: errorChunk.timestamp,
				})}\n\n`;
				controller.enqueue(encoder.encode(errorData));
				controller.close();
			}
		},
	});

	// Return SSE response
	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

