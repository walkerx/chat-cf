/**
 * ChatDisplay React component
 * Display streaming chunks in real-time, show partial text as it arrives, clear after stream completes
 */


import { useEffect, useRef } from "react";
import type { Message } from "../../../src/models/message.js";

export interface ChatDisplayProps {
	messages: Message[];
	isStreaming?: boolean;
	hasMoreMessages?: boolean;
	loadMoreMessages?: () => void;
}

export function ChatDisplay({ messages, isStreaming = false, hasMoreMessages = false, loadMoreMessages = () => { } }: ChatDisplayProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when messages change or streaming status changes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isStreaming]);

	return (
		<div className="chat-display" role="log" aria-live="polite" aria-label="Chat messages">
			{messages.length === 0 ? (
				<div className="empty-state" role="status">
					No messages yet. Start a conversation!
				</div>
			) : (
				<>
					{hasMoreMessages && (
						<button className="load-more-button" onClick={loadMoreMessages} aria-label="Load more messages">
							Load earlier messages
						</button>
					)}
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
						{isStreaming && (
							<div className="message message-assistant typing-indicator" role="status" aria-label="AI is typing">
								<div className="message-role">assistant</div>
								<div className="typing-dots">
									<span className="typing-dot"></span>
									<span className="typing-dot"></span>
									<span className="typing-dot"></span>
								</div>
							</div>
						)}
						{/* Invisible element at the end for auto-scrolling */}
						<div ref={messagesEndRef} />
					</div>
				</>
			)}
		</div>
	);
}
