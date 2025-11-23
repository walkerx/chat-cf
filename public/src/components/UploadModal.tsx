/**
 * Upload Modal Component
 * Modal for uploading new character cards from JSON files
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CharacterCardV3, CharacterCardListItem } from "../services/api.js";
import { createCharacterCard, uploadImage } from "../services/api.js";
import { extractCharacterCardFromPNG, extractAvatarFromPNG } from "../utils/pngCharacterCard.js";

export interface UploadModalProps {
	onClose: () => void;
	onUploadSuccess: (card: CharacterCardListItem) => void;
}

export function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
	const { t } = useTranslation();
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setUploading(true);
			setError(null);

			let card: CharacterCardV3 | null = null;
			let avatarUrl: string | undefined;

			// Check if it's a PNG file
			if (file.type === 'image/png') {
				// Extract character card data from PNG
				card = await extractCharacterCardFromPNG(file);

				if (!card) {
					throw new Error(t('upload.invalidFormat') + ' - No character card data found in PNG');
				}

				// Extract and convert the PNG image to WebP for avatar
				try {
					const avatarBlob = await extractAvatarFromPNG(file);
					const avatarFile = new File([avatarBlob], 'avatar.webp', { type: 'image/webp' });
					const uploadResult = await uploadImage(avatarFile);
					avatarUrl = uploadResult.url;
				} catch (avatarError) {
					console.warn('Failed to extract/upload avatar from PNG:', avatarError);
					// Continue without avatar - it's not critical
				}
			} else if (file.type === 'application/json' || file.name.endsWith('.json')) {
				// Read JSON file content
				const text = await file.text();

				// Parse JSON
				try {
					card = JSON.parse(text);
				} catch (parseError) {
					throw new Error(t('upload.invalidJSON'));
				}
			} else {
				throw new Error(t('upload.invalidFormat') + ' - Only JSON and PNG files are supported');
			}

			// Validate character card structure
			if (!card || typeof card !== "object") {
				throw new Error(t('upload.invalidFormat'));
			}

			if (card.spec !== "chara_card_v3") {
				throw new Error(t('upload.invalidSpec'));
			}

			if (card.spec_version !== "3.0") {
				throw new Error(t('upload.invalidVersion'));
			}

			const data = card.data;
			if (!data || typeof data !== "object") {
				throw new Error(t('upload.missingData'));
			}

			// Validate required fields
			if (typeof data.name !== "string" || data.name.length === 0) {
				throw new Error(t('upload.missingName'));
			}

			if (typeof data.description !== "string" || data.description.length === 0) {
				throw new Error(t('upload.missingDescription'));
			}

			if (typeof data.first_mes !== "string" || data.first_mes.length === 0) {
				throw new Error(t('upload.missingFirstMessage'));
			}

			// If we extracted an avatar URL, add it to the card data
			if (avatarUrl) {
				card.data.avatar = avatarUrl;
			}

			// Upload to server
			const created = await createCharacterCard(card);
			onUploadSuccess(created);
		} catch (err) {
			// Handle specific error cases
			if (err instanceof Error) {
				const errorMessage = err.message.toLowerCase();

				// Network errors
				if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("failed to fetch")) {
					setError(t('error.network'));
				}
				// Server errors
				else if (errorMessage.includes("500") || errorMessage.includes("server error")) {
					setError(t('error.serverError'));
				}
				// Use the original error message for validation errors
				else {
					setError(err.message);
				}
			} else {
				setError(t('upload.error'));
			}
		} finally {
			setUploading(false);
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			className="modal-overlay"
			onClick={onClose}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="upload-modal-title"
		>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2 id="upload-modal-title">{t('upload.title')}</h2>
					<button
						className="modal-close"
						onClick={onClose}
						aria-label={t('upload.closeModal')}
					>
						×
					</button>
				</div>

				<div className="modal-body">
					{error && (
						<div className="modal-error" role="alert" aria-live="assertive">
							{error}
						</div>
					)}

					<div className="upload-instructions">
						<p>{t('upload.selectFile')}</p>
						<p className="upload-hint">
							{t('upload.fileRequirements')}
						</p>
					</div>

					<input
						type="file"
						accept=".json,.png,application/json,image/png"
						onChange={handleFileUpload}
						disabled={uploading}
						className="file-input"
						aria-label={t('upload.selectFileLabel')}
					/>

					{uploading && (
						<div className="upload-progress" role="status" aria-live="polite">
							{t('upload.uploading')}
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button
						className="modal-button modal-button-secondary"
						onClick={onClose}
						disabled={uploading}
						aria-label={t('upload.cancelUpload')}
					>
						{t('common.cancel')}
					</button>
				</div>
			</div>
		</div>
	);
}
