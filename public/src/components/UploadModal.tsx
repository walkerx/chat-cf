/**
 * Upload Modal Component
 * Modal for uploading new character cards from JSON files
 */

import { useState } from "react";
import type { CharacterCardV3, CharacterCardListItem } from "../services/api.js";
import { createCharacterCard } from "../services/api.js";

export interface UploadModalProps {
	onClose: () => void;
	onUploadSuccess: (card: CharacterCardListItem) => void;
}

export function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setUploading(true);
			setError(null);

			// Read file content
			const text = await file.text();
			
			// Parse JSON
			let card: any;
			try {
				card = JSON.parse(text);
			} catch (parseError) {
				throw new Error("Invalid JSON format. Please upload a valid JSON file.");
			}

			// Validate character card structure
			if (!card || typeof card !== "object") {
				throw new Error("Invalid character card format.");
			}

			if (card.spec !== "chara_card_v3") {
				throw new Error(
					"Invalid character card spec. Expected 'chara_card_v3'."
				);
			}

			if (card.spec_version !== "3.0") {
				throw new Error(
					"Invalid character card version. Expected '3.0'."
				);
			}

			const data = card.data;
			if (!data || typeof data !== "object") {
				throw new Error("Character card missing 'data' field.");
			}

			// Validate required fields
			if (typeof data.name !== "string" || data.name.length === 0) {
				throw new Error("Character card must have a non-empty 'name' field.");
			}

			if (typeof data.description !== "string" || data.description.length === 0) {
				throw new Error(
					"Character card must have a non-empty 'description' field."
				);
			}

			if (typeof data.first_mes !== "string" || data.first_mes.length === 0) {
				throw new Error(
					"Character card must have a non-empty 'first_mes' field."
				);
			}

			// Upload to server
			const created = await createCharacterCard(card as CharacterCardV3);
			onUploadSuccess(created);
		} catch (err) {
			// Handle specific error cases
			if (err instanceof Error) {
				const errorMessage = err.message.toLowerCase();
				
				// Network errors
				if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("failed to fetch")) {
					setError("Network error. Please check your connection and try again.");
				}
				// Server errors
				else if (errorMessage.includes("500") || errorMessage.includes("server error")) {
					setError("Server error. Please try again later.");
				}
				// Use the original error message for validation errors
				else {
					setError(err.message);
				}
			} else {
				setError("Upload failed. Please try again.");
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
					<h2 id="upload-modal-title">Upload Character Card</h2>
					<button
						className="modal-close"
						onClick={onClose}
						aria-label="Close upload modal"
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
						<p>Select a Character Card V3 JSON file to upload.</p>
						<p className="upload-hint">
							The file must contain valid CCv3 format with name, description,
							and first_mes fields.
						</p>
					</div>

					<input
						type="file"
						accept=".json,application/json"
						onChange={handleFileUpload}
						disabled={uploading}
						className="file-input"
						aria-label="Select character card JSON file"
					/>

					{uploading && (
						<div className="upload-progress" role="status" aria-live="polite">
							Uploading character...
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button
						className="modal-button modal-button-secondary"
						onClick={onClose}
						disabled={uploading}
						aria-label="Cancel upload"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
