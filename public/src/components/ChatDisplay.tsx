/**
 * ChatDisplay React component
 * Display streaming chunks in real-time, show partial text as it arrives, clear after stream completes
 */


import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "../../../src/models/message.js";

export interface ChatDisplayProps {
	messages: Message[];
	isStreaming?: boolean;
	hasMoreMessages?: boolean;
	loadMoreMessages?: () => void;
	characterName?: string | null;
	userName?: string | null;
}

export function ChatDisplay({
	messages,
	isStreaming = false,
	hasMoreMessages = false,
	loadMoreMessages = () => { },
	characterName,
	userName
}: ChatDisplayProps) {
	const { t } = useTranslation();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when messages change or streaming status changes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isStreaming]);

	const getSenderName = (role: string) => {
		if (role === 'user') {
			return userName || t('chat.messageSender'); // Fallback if no username
		}
		if (role === 'assistant') {
			return characterName || t('chat.assistant');
		}
		return role;
	};

	return (
		<div className="chat-display" role="log" aria-live="polite" aria-label={t('chat.messagesLabel')}>
			{messages.length === 0 ? (
				<div className="empty-state" role="status">
					{t('chat.noMessages')}
				</div>
			) : (
				<>
					{hasMoreMessages && (
						<button className="load-more-button" onClick={loadMoreMessages} aria-label={t('chat.loadMore')}>
							{t('chat.loadMore')}
						</button>
					)}
					<div className="messages">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`message message-${message.role}`}
								role="article"
								aria-label={`${getSenderName(message.role)} ${t('chat.message')}`}
							>
								<div className="message-role" aria-label={t('chat.messageSender')}>
									{getSenderName(message.role)}
								</div>
								<div className="message-content">{message.content}</div>
								<div className="message-timestamp" aria-label={t('chat.messageTime')}>
									{new Date(message.created_at).toLocaleTimeString()}
								</div>
							</div>
						))}
						{isStreaming && (
							<div className="message message-assistant typing-indicator" role="status" aria-label={t('chat.aiTyping')}>
								<div className="message-role">{characterName || t('chat.assistant')}</div>
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
