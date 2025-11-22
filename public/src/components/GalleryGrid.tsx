/**
 * Gallery Grid Component
 * Responsive grid layout for displaying character cards
 */

import { memo } from "react";
import type { CharacterWithHistory } from "../pages/GalleryPage.js";
import { CharacterCard } from "./CharacterCard.js";

export interface GalleryGridProps {
	characters: CharacterWithHistory[];
	onSelectCharacter: (characterId: string) => void;
	onDeleteCharacter?: (characterId: string) => void;
	onEditCharacter?: (characterId: string) => void;
	searchQuery?: string;
}

export const GalleryGrid = memo(function GalleryGrid({
	characters,
	onSelectCharacter,
	onDeleteCharacter,
	onEditCharacter,
	searchQuery = "",
}: GalleryGridProps) {
	if (characters.length === 0) {
		return (
			<div className="gallery-empty" role="status" aria-live="polite">
				<p>No characters yet. Upload your first character to get started!</p>
			</div>
		);
	}

	return (
		<div className="gallery-grid" role="list" aria-label="Character cards">
			{characters.map((ch) => (
				<div key={ch.card.id} role="listitem">
					<CharacterCard
						character={ch}
						onClick={() => onSelectCharacter(ch.card.id)}
						onDelete={onDeleteCharacter}
						onEdit={onEditCharacter}
						searchQuery={searchQuery}
					/>
				</div>
			))}
		</div>
	);
});
