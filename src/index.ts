import { Hono } from "hono";
import { loggerMiddleware } from "./middleware/logger.js";
import { rateLimiterMiddleware } from "./middleware/rate-limiter.js";
import { supabaseAuthMiddleware } from "./middleware/auth.js";
import { getOrGenerateSessionId } from "./utils/session.js";
import { createStandardErrorResponse } from "./utils/errors.js";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Simple CORS middleware
app.use("*", async (c, next) => {
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	c.header("Access-Control-Allow-Headers", "Content-Type, X-Session-ID");
	if (c.req.method === "OPTIONS") {
		return c.body(null, 204);
	}
	await next();
});

// Middleware pipeline
app.use("*", loggerMiddleware);
app.use("/api/*", rateLimiterMiddleware);

// Health check endpoint
app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// Session ID validation middleware
app.use("/api/*", async (c, next) => {
	const sessionId = c.req.header("X-Session-ID");
	if (!sessionId) {
		// Generate new session ID if missing
		const newSessionId = getOrGenerateSessionId(null);
		c.header("X-Session-ID", newSessionId);
	} else {
		// Validate existing session ID
		const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			sessionId
		);
		if (!isValid) {
			return c.json(createStandardErrorResponse("UNAUTHORIZED"), 401);
		}
	}
	await next();
});

// Error handling middleware
app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.json(
		createStandardErrorResponse("INTERNAL_ERROR"),
		500
	);
});

// API routes
import { handleChatStream } from "./handlers/chat-stream.js";
import { handleListConversations, handleGetConversation, handleGetActiveCharacterConversation } from "./handlers/conversations.js";
import {
	handleCreateCharacterCard,
	handleListCharacterCards,
	handleGetCharacterCard,
	handleUpdateCharacterCard,
	handleDeleteCharacterCard,
} from "./handlers/character-cards.js";

// All chat endpoints require authentication
app.post("/api/chat/stream", supabaseAuthMiddleware, handleChatStream);

// All conversation endpoints require authentication
app.get("/api/conversations", supabaseAuthMiddleware, handleListConversations);
app.get("/api/conversations/:conversationId", supabaseAuthMiddleware, handleGetConversation);
app.get("/api/conversations/active/:characterCardId", supabaseAuthMiddleware, handleGetActiveCharacterConversation);

// Character card routes
app.post("/api/character-cards", supabaseAuthMiddleware, handleCreateCharacterCard); // Require auth
app.get("/api/character-cards", handleListCharacterCards); // Public access for homepage
app.get("/api/character-cards/:id", handleGetCharacterCard); // Public access for homepage
app.put("/api/character-cards/:id", supabaseAuthMiddleware, handleUpdateCharacterCard); // Require auth
app.delete("/api/character-cards/:id", supabaseAuthMiddleware, handleDeleteCharacterCard); // Require auth

// Upload routes
import { handleUpload, handleGetAvatar } from "./handlers/upload.js";
app.post("/api/upload", supabaseAuthMiddleware, handleUpload); // 上传接口使用通用认证中间件
app.get("/api/avatars/:key", handleGetAvatar); // 获取头像接口通常无需认证，保持公开访问

export default app;
