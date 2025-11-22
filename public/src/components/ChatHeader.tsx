/**
 * Chat Header Component
 * Header with back button, character name, and new conversation button
 */


import type { User } from "@supabase/supabase-js";

export interface ChatHeaderProps {
	characterName: string | null;
	onBack: () => void;
	onNewConversation: () => void;
	isStreaming?: boolean;
	user: User | null;
	onAuthAction: () => void;
}

export function ChatHeader({
	characterName,
	onBack,
	onNewConversation,
	isStreaming = false,
	user,
	onAuthAction,
}: ChatHeaderProps) {
	return (
		<header className="chat-header">
			<button
				className="back-button"
				onClick={onBack}
				title="Back to gallery"
				aria-label="Back to gallery"
			>
				← Back
			</button>
			<h1 className="chat-title">{characterName || "AI Chat"}</h1>
			<button
				className="new-conversation-button"
				onClick={onNewConversation}
				disabled={isStreaming}
				aria-label="Start new conversation"
			>
				+ New Chat
			</button>
			<button
				className="auth-button"
				onClick={onAuthAction}
				aria-label={user ? "Sign out" : "Sign in"}
			>
				{user ? "Sign Out" : "Sign In"}
			</button>
		</header>
	);
}
