/**
 * Gallery Header Component
 * Header with search input and upload button for the character gallery
 */

import { memo } from "react";
import type { User } from "@supabase/supabase-js";

export interface GalleryHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onUpload: () => void;
	showSearch: boolean;
	user: User | null;
	onAuthAction: () => void;
}

export const GalleryHeader = memo(function GalleryHeader({
	searchQuery,
	onSearchChange,
	onUpload,
	showSearch,
	user,
	onAuthAction,
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
				{user && (
					<button
						className="upload-button"
						onClick={onUpload}
						aria-label="Upload a new character card"
					>
						+ Upload Character
					</button>
				)}
				<button
					className="auth-button"
					onClick={onAuthAction}
					aria-label={user ? "Sign out" : "Sign in"}
				>
					{user ? "Sign Out" : "Sign In"}
				</button>
			</div>
		</header>
	);
});
