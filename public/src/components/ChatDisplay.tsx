/**
 * ChatDisplay React component
 * Display streaming chunks in real-time, show partial text as it arrives, clear after stream completes
 */


import type { Message } from "../../../src/models/message.js";

export interface ChatDisplayProps {
	messages: Message[];
}

export function ChatDisplay({ messages }: ChatDisplayProps) {
	return (
		<div className="chat-display" role="log" aria-live="polite" aria-label="Chat messages">
			{messages.length === 0 ? (
				<div className="empty-state" role="status">
					No messages yet. Start a conversation!
				</div>
			) : (
				<div className="messages">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`message message-${message.role}`}
							role="article"
							aria-label={`${message.role} message`}
						>
							<div className="message-role" aria-label="Message sender">
								{message.role}
							</div>
							<div className="message-content">{message.content}</div>
							<div className="message-timestamp" aria-label="Message time">
								{new Date(message.created_at).toLocaleTimeString()}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

