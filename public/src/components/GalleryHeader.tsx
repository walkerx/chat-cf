/**
 * Gallery Header Component
 * Header with search input and upload button for the character gallery
 */

import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";
import { UserMenu } from "./UserMenu.js";
import { LanguageSwitcher } from "./LanguageSwitcher.js";

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
	const { t } = useTranslation();

	return (
		<header className="gallery-header">
			<h1>{t('gallery.title')}</h1>
			<div className="gallery-header-actions">
				{showSearch && (
					<input
						type="text"
						className="gallery-search"
						placeholder={t('gallery.searchPlaceholder')}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						aria-label={t('gallery.searchLabel')}
					/>
				)}
				<LanguageSwitcher />
				{user && (
					<button
						className="upload-button"
						onClick={onUpload}
						aria-label={t('gallery.uploadLabel')}
					>
						{t('gallery.uploadCharacter')}
					</button>
				)}
				{user ? (
					<UserMenu />
				) : (
					<button
						className="auth-button"
						onClick={onAuthAction}
						aria-label={t('auth.login')}
					>
						{t('auth.login')}
					</button>
				)}
			</div>
		</header>
	);
});
