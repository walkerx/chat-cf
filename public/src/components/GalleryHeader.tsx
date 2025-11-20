/**
 * Gallery Header Component
 * Header with search input and upload button for the character gallery
 */

import React, { memo } from "react";

export interface GalleryHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onUpload: () => void;
	showSearch: boolean;
}

export const GalleryHeader = memo(function GalleryHeader({
	searchQuery,
	onSearchChange,
	onUpload,
	showSearch,
}: GalleryHeaderProps) {
	return (
		<header className="gallery-header">
			<h1>Character Gallery</h1>
			<div className="gallery-header-actions">
				{showSearch && (
					<input
						type="text"
						className="gallery-search"
						placeholder="Search characters..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						aria-label="Search characters by name, description, or personality"
					/>
				)}
				<button
					className="upload-button"
					onClick={onUpload}
					aria-label="Upload a new character card"
				>
					+ Upload Character
				</button>
			</div>
		</header>
	);
});
