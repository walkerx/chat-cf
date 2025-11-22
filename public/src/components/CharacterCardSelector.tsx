/**
 * CharacterCardSelector component
 * Allows users to select a character card from available cards or upload a new one
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CharacterCardListItem } from "../services/api.js";
import { listCharacterCards, createCharacterCard, type CharacterCardV3 } from "../services/api.js";

export interface CharacterCardSelectorProps {
	selectedCardId: string | null;
	onSelectCard: (cardId: string | null) => void;
	disabled?: boolean;
}

export function CharacterCardSelector({
	selectedCardId,
	onSelectCard,
	disabled = false,
}: CharacterCardSelectorProps) {
	const { t } = useTranslation();
	const [cards, setCards] = useState<CharacterCardListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showUpload, setShowUpload] = useState(false);

	// Load character cards on mount
	useEffect(() => {
		async function loadCards() {
			try {
				setLoading(true);
				const loadedCards = await listCharacterCards();
				setCards(loadedCards);
			} catch (err) {
				setError(err instanceof Error ? err.message : t('character.loadError'));
			} finally {
				setLoading(false);
			}
		}

		loadCards();
	}, []);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setError(null);
			const text = await file.text();
			const card = JSON.parse(text) as CharacterCardV3;

			// Validate basic structure
			if (card.spec !== "chara_card_v3" || !card.data?.name) {
				throw new Error(t('upload.invalidFormat'));
			}

			// Upload to server
			const created = await createCharacterCard(card);
			setCards([...cards, created]);
			onSelectCard(created.id);
			setShowUpload(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : t('upload.error'));
		}

		// Reset file input
		event.target.value = "";
	};

	const selectedCard = cards.find((c) => c.id === selectedCardId);

	if (loading) {
		return <div className="character-card-selector loading">{t('character.loading')}</div>;
	}

	return (
		<div className="character-card-selector">
			<div className="selector-header">
				<label htmlFor="character-select">{t('character.selectCharacter')}:</label>
				<button
					type="button"
					onClick={() => setShowUpload(!showUpload)}
					disabled={disabled}
					className="upload-button"
					title={t('character.uploadCard')}
				>
					{showUpload ? t('common.cancel') : "+ " + t('character.upload')}
				</button>
			</div>

			{error && <div className="selector-error">{error}</div>}

			{showUpload ? (
				<div className="upload-section">
					<input
						type="file"
						accept=".json"
						onChange={handleFileUpload}
						disabled={disabled}
						className="file-input"
					/>
					<p className="upload-hint">{t('upload.uploadHint')}</p>
				</div>
			) : (
				<>
					<select
						id="character-select"
						value={selectedCardId || ""}
						onChange={(e) => onSelectCard(e.target.value || null)}
						disabled={disabled || cards.length === 0}
						className="character-select"
					>
						<option value="">{t('character.noCharacterSelected')}</option>
						{cards.map((card) => (
							<option key={card.id} value={card.id}>
								{card.data.data.name}
							</option>
						))}
					</select>

					{selectedCard && (
						<div className="character-preview">
							<div className="character-name">{selectedCard.data.data.name}</div>
							<div className="character-description">
								{selectedCard.data.data.description}
							</div>
							{selectedCard.data.data.personality && (
								<div className="character-personality">
									<strong>{t('character.personality')}:</strong> {selectedCard.data.data.personality}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
