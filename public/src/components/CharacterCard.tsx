/**
 * Character Card Component
 * Individual character card with hover effects and history indicators
 */

import { useState, memo, type KeyboardEvent, type ReactNode } from "react";
import type { CharacterWithHistory } from "../pages/GalleryPage.js";

export interface CharacterCardProps {
	character: CharacterWithHistory;
	onClick: () => void;
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void;
	searchQuery?: string;
}

export const CharacterCard = memo(function CharacterCard({
	character,
	onClick,
	onDelete,
	onEdit,
	searchQuery = "",
}: CharacterCardProps) {
	const [showMenu, setShowMenu] = useState(false);
	const { card, conversationCount, lastMessageAt } =
		character;

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onClick();
		}
	};

	return (
		<div
			className="character-card"
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`Chat with ${card.data.data.name}. ${card.data.data.description}`}
		>
			<div className="card-image">
				{card.data.data.avatar ? (
					<img src={card.data.data.avatar} alt={card.data.data.name} className="card-avatar-img" />
				) : (
					<div className="card-avatar" aria-hidden="true">
						{card.data.data.name[0].toUpperCase()}
					</div>
				)}
			</div>
			<style>{`
				.card-avatar-img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
			`}</style>

			<div className="card-content">
				<h3 className="card-name">
					{highlightText(card.data.data.name, searchQuery)}
				</h3>
				<p className="card-description">
					{highlightText(truncate(card.data.data.description, 100), searchQuery)}
				</p>

				{card.data.data.personality && (
					<p className="card-personality">
						{highlightText(truncate(card.data.data.personality, 60), searchQuery)}
					</p>
				)}
			</div>

			{conversationCount > 0 && (
				<div className="card-history-badge" aria-label={`${conversationCount} conversation${conversationCount > 1 ? "s" : ""}, last active ${lastMessageAt ? formatRelativeTime(lastMessageAt) : ""}`}>
					<span className="badge-count">
						{conversationCount} chat{conversationCount > 1 ? "s" : ""}
					</span>
					{lastMessageAt && (
						<span className="badge-time">{formatRelativeTime(lastMessageAt)}</span>
					)}
				</div>
			)}

			{(onEdit || onDelete) && (
				<div className="card-actions" onClick={(e) => e.stopPropagation()}>
					<button
						onClick={() => setShowMenu(!showMenu)}
						aria-label="Character actions menu"
						aria-expanded={showMenu}
						aria-haspopup="true"
					>
						⋮
					</button>
					{showMenu && (
						<div className="card-menu" role="menu">
							{onEdit && (
								<button
									onClick={() => onEdit(card.id)}
									role="menuitem"
									aria-label={`Edit ${card.data.data.name}`}
								>
									Edit
								</button>
							)}
							{onDelete && (
								<button
									onClick={() => onDelete(card.id)}
									role="menuitem"
									aria-label={`Delete ${card.data.data.name}`}
								>
									Delete
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
});

/**
 * Truncate text to specified length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
	const now = new Date();
	const then = new Date(timestamp);
	const diffMs = now.getTime() - then.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return then.toLocaleDateString();
}

/**
 * Highlight matching text in a string
 * Returns JSX with highlighted spans for matching text
 */
function highlightText(text: string, query: string): ReactNode {
	if (!query.trim()) {
		return text;
	}

	const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
	const parts = text.split(regex);

	return parts.map((part, index) => {
		if (part.toLowerCase() === query.toLowerCase()) {
			return (
				<mark key={index} className="search-highlight">
					{part}
				</mark>
			);
		}
		return part;
	});
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
