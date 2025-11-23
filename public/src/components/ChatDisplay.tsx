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
	userAvatarUrl?: string | null;
}

export function ChatDisplay({
	messages,
	isStreaming = false,
	hasMoreMessages = false,
	loadMoreMessages = () => { },
	characterName,
	userName,
	characterCard,
	userAvatarUrl
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

	const getAvatar = (role: string) => {
		if (role === 'user') {
			if (userAvatarUrl) {
				return <img src={userAvatarUrl} alt="User" className="message-avatar-img" />;
			}
			return <div className="message-avatar-placeholder">{(userName || 'U')[0].toUpperCase()}</div>;
		}
		if (role === 'assistant') {
			if (characterCard?.data?.avatar) {
				return <img src={characterCard.data.avatar} alt="Character" className="message-avatar-img" />;
			}
			return <div className="message-avatar-placeholder">{(characterName || 'C')[0].toUpperCase()}</div>;
		}
		return null;
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
						{messages.map((message) => {
							const isTyping = message.role === 'assistant' && message.content === '' && isStreaming;
							return (
								<div
									key={message.id}
									className={`message message-${message.role} ${isTyping ? 'typing-indicator' : ''}`}
									role="article"
									aria-label={`${getSenderName(message.role)} ${t('chat.message')}`}
								>
									<div className="message-avatar">
										{getAvatar(message.role)}
									</div>
									<div className="message-body">
										<div className="message-role" aria-label={t('chat.messageSender')}>
											{getSenderName(message.role)}
										</div>
										<div className="message-content">
											{isTyping ? (
												<div className="typing-dots">
													<span className="typing-dot"></span>
													<span className="typing-dot"></span>
													<span className="typing-dot"></span>
												</div>
											) : (
												<div dangerouslySetInnerHTML={{ __html: processMessageContent(message) }} />
											)}
										</div>
										<div className="message-timestamp" aria-label={t('chat.messageTime')}>
											{new Date(message.created_at).toLocaleTimeString()}
										</div>
									</div>
								</div>
							);
						})}
						{/* Invisible element at the end for auto-scrolling */}
						<div ref={messagesEndRef} />
					</div>
				</>
			)}
			<style>{`
				.message {
					display: flex;
					gap: 1rem;
					align-items: flex-start;
				}
				.message-avatar {
					flex-shrink: 0;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					overflow: hidden;
				}
				.message-avatar-img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
				.message-avatar-placeholder {
					width: 100%;
					height: 100%;
					background: var(--surface-hover);
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: bold;
					color: var(--text-secondary);
				}
				.message-body {
					flex: 1;
					min-width: 0;
				}
				.message-role {
					margin-bottom: 0.25rem;
					font-weight: 500;
					font-size: 0.9rem;
					color: var(--text-secondary);
				}
			`}</style>
		</div>
	);
}
