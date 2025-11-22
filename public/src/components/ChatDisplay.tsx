/**
 * ChatDisplay React component
 * Display streaming chunks in real-time, show partial text as it arrives, clear after stream completes
 */


import { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "../../../src/models/message.js";
import type { CharacterCardV3 } from "../services/api.js";
import { RegexScriptProcessor } from "../services/regex-script-processor.js";
import { sanitizeHTML } from "../utils/sanitize.js";

export interface ChatDisplayProps {
	messages: Message[];
	isStreaming?: boolean;
	hasMoreMessages?: boolean;
	loadMoreMessages?: () => void;
	characterName?: string | null;
	userName?: string | null;
	characterCard?: CharacterCardV3 | null;
}

export function ChatDisplay({
	messages,
	isStreaming = false,
	hasMoreMessages = false,
	loadMoreMessages = () => { },
	characterName,
	userName,
	characterCard
}: ChatDisplayProps) {
	const { t } = useTranslation();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Initialize regex script processor
	const regexProcessor = useMemo(() => new RegexScriptProcessor(), []);

	// Extract regex scripts from character card
	const regexScripts = useMemo(() => {
		if (!characterCard) return [];
		return RegexScriptProcessor.extractScripts(characterCard);
	}, [characterCard]);

	// Extract allowed tags from scripts dynamically
	// This avoids hardcoding specific tags like <dm>, <zbj> etc.
	const allowedTags = useMemo(() => {
		return RegexScriptProcessor.extractTagsFromScripts(regexScripts);
	}, [regexScripts]);

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

	// Process message content with regex scripts
	const processMessageContent = (message: Message): string => {
		let content = message.content;

		// Apply regex scripts if available
		if (regexScripts.length > 0) {
			try {
				content = regexProcessor.process(
					content,
					regexScripts,
					{
						isAIMessage: message.role === 'assistant',
						isMarkdown: true,
					}
				);
			} catch (error) {
				console.error('Failed to process regex scripts:', error);
				// Fall back to original content on error
			}
		}

		// Sanitize HTML for security, allowing dynamically extracted tags
		return sanitizeHTML(content, allowedTags);
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
								<div
									className="message-content"
									dangerouslySetInnerHTML={{ __html: processMessageContent(message) }}
								/>
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
