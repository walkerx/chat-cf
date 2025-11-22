/**
 * Gallery Page Component
 * Main gallery page that displays character cards with conversation history
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CharacterCardListItem } from "../services/api.js";
import { listCharacterCards, listConversations, deleteCharacterCard } from "../services/api.js";
import { getOrCreateSessionId } from "../services/session.js";
import { useAuth } from "../contexts/AuthContext.js";
import { GalleryGrid } from "../components/GalleryGrid.js";
import { GalleryHeader } from "../components/GalleryHeader.js";
import { UploadModal } from "../components/UploadModal.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { AuthPrompt } from "../components/AuthPrompt.js";
import { useDebounce } from "../hooks/useDebounce.js";

export interface CharacterWithHistory {
	card: CharacterCardListItem;
	conversationCount: number;
	lastMessageAt?: string;
	lastMessagePreview?: string;
}

export function GalleryPage() {
	const { t } = useTranslation();
	const [characters, setCharacters] = useState<CharacterWithHistory[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const [error, setError] = useState<string | null>(null);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		characterId: string;
		characterName: string;
		hasConversations: boolean;
		conversationCount: number;
	} | null>(null);
	const sessionId = getOrCreateSessionId();
	const navigate = useNavigate();
	const { user, signOut } = useAuth();
	const [showAuthPrompt, setShowAuthPrompt] = useState(false);

	// Load characters and their conversation history
	useEffect(() => {
		async function loadCharactersWithHistory() {
			try {
				setLoading(true);
				setError(null);

				const cards = await listCharacterCards();
				const conversations = await listConversations(sessionId);

				// Map conversations to characters
				const charactersWithHistory = cards.map((card) => {
					const characterConversations = conversations.filter(
						(c) => c.character_card_id === card.id
					);

					// Find most recent conversation
					const mostRecent = characterConversations.length > 0
						? characterConversations.reduce((latest, current) =>
							new Date(current.updated_at) > new Date(latest.updated_at)
								? current
								: latest
						)
						: null;

					return {
						card,
						conversationCount: characterConversations.length,
						lastMessageAt: mostRecent?.updated_at,
						lastMessagePreview: mostRecent?.title || undefined,
					};
				});

				setCharacters(charactersWithHistory);
			} catch (err) {
				console.error("Failed to load characters:", err);

				// Handle specific error cases
				if (err instanceof Error) {
					const errorMessage = err.message.toLowerCase();

					// Network errors
					if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("failed to fetch")) {
						setError(t('error.network'));
					}
					// Failed to load conversations (non-critical)
					else if (errorMessage.includes("conversation")) {
						setError(t('gallery.loadError') + '. ' + t('gallery.noCharacters'));
					}
					// Generic error
					else {
						setError(err.message || t('gallery.loadError'));
					}
				} else {
					setError(t('error.generic'));
				}
			} finally {
				setLoading(false);
			}
		}

		loadCharactersWithHistory();
	}, [sessionId]);

	// Filter characters based on debounced search query
	// Memoized to avoid recalculating on every render
	const filteredCharacters = useMemo(() => {
		if (!debouncedSearchQuery.trim()) return characters;

		const query = debouncedSearchQuery.toLowerCase();
		return characters.filter((ch) => {
			const name = ch.card.data.data.name.toLowerCase();
			const description = ch.card.data.data.description.toLowerCase();
			const personality = ch.card.data.data.personality?.toLowerCase() || "";

			return (
				name.includes(query) ||
				description.includes(query) ||
				personality.includes(query)
			);
		});
	}, [characters, debouncedSearchQuery]);

	const handleSelectCharacter = useCallback((characterId: string) => {
		if (!user) {
			// Not logged in - show prompt and redirect
			setShowAuthPrompt(true);
			setTimeout(() => setShowAuthPrompt(false), 3000);
			setTimeout(() => navigate('/auth'), 500);
			return;
		}
		navigate(`/chat/${characterId}`);
	}, [navigate, user]);

	const handleUpload = useCallback(() => {
		if (!user) {
			// Not logged in - redirect to auth page
			navigate('/auth');
			return;
		}
		setShowUploadModal(true);
	}, [user, navigate]);

	const handleUploadSuccess = useCallback((newCard: CharacterCardListItem) => {
		// Add the new character to the list with no conversation history
		const newCharacter: CharacterWithHistory = {
			card: newCard,
			conversationCount: 0,
			lastMessageAt: undefined,
			lastMessagePreview: undefined,
		};

		setCharacters((prev) => [...prev, newCharacter]);
		setShowUploadModal(false);
	}, []);

	const handleCloseModal = useCallback(() => {
		setShowUploadModal(false);
	}, []);

	const handleDeleteCharacter = useCallback((characterId: string) => {
		// Find the character to get its name and conversation count
		setCharacters((currentCharacters) => {
			const character = currentCharacters.find((ch) => ch.card.id === characterId);
			if (!character) return currentCharacters;

			setDeleteConfirm({
				characterId,
				characterName: character.card.data.data.name,
				hasConversations: character.conversationCount > 0,
				conversationCount: character.conversationCount,
			});

			return currentCharacters;
		});
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteConfirm) return;

		try {
			// Call delete API
			await deleteCharacterCard(deleteConfirm.characterId);

			// Remove character from local state
			setCharacters(
				characters.filter((ch) => ch.card.id !== deleteConfirm.characterId)
			);

			// Close confirmation dialog
			setDeleteConfirm(null);
		} catch (err) {
			console.error("Failed to delete character:", err);

			// Handle specific error cases
			if (err instanceof Error) {
				const errorMessage = err.message.toLowerCase();

				// Character not found (already deleted)
				if (errorMessage.includes("404") || errorMessage.includes("not found")) {
					setError("Character not found. It may have already been deleted.");
					// Still remove from local state
					setCharacters(
						characters.filter((ch) => ch.card.id !== deleteConfirm.characterId)
					);
				}
				// Network errors
				else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
					setError("Network error. Please check your connection and try again.");
				}
				// Generic error
				else {
					setError(err.message || "Failed to delete character");
				}
			} else {
				setError("An unexpected error occurred while deleting the character");
			}

			setDeleteConfirm(null);
		}
	}, [deleteConfirm]);

	const cancelDelete = useCallback(() => {
		setDeleteConfirm(null);
	}, []);

	const handleEditCharacter = useCallback((characterId: string) => {
		// Edit functionality - placeholder for future implementation
		console.log("Edit character:", characterId);
		console.log("Edit character:", characterId);
	}, []);

	const handleAuthAction = useCallback(async () => {
		if (user) {
			await signOut();
		} else {
			navigate("/auth");
		}
	}, [user, signOut, navigate]);

	if (loading) {
		return (
			<div className="gallery-page">
				<div className="gallery-loading" role="status" aria-live="polite">
					{t('gallery.loading')}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="gallery-page">
				<div className="gallery-error" role="alert">
					<p>{t('gallery.errorPrefix')} {error}</p>
					<button onClick={() => window.location.reload()} aria-label={t('gallery.retryButton')}>
						{t('gallery.retryButton')}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="gallery-page" role="main">
			<GalleryHeader
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onUpload={handleUpload}
				showSearch={characters.length > 5}
				user={user}
				onAuthAction={handleAuthAction}
			/>

			{filteredCharacters.length === 0 && debouncedSearchQuery && (
				<div className="gallery-empty" role="status" aria-live="polite">
					<p>{t('gallery.noSearchResults')}</p>
				</div>
			)}

			{(filteredCharacters.length > 0 || (!debouncedSearchQuery && characters.length === 0)) && (
				<GalleryGrid
					characters={filteredCharacters}
					onSelectCharacter={handleSelectCharacter}
					onDeleteCharacter={handleDeleteCharacter}
					onEditCharacter={handleEditCharacter}
					searchQuery={debouncedSearchQuery}
				/>
			)}

			{showUploadModal && (
				<UploadModal
					onClose={handleCloseModal}
					onUploadSuccess={handleUploadSuccess}
				/>
			)}

			{deleteConfirm && (
				<ConfirmDialog
					title={t('gallery.deleteTitle')}
					message={
						deleteConfirm.hasConversations
							? t('gallery.deleteMessageWithConversations', {
								name: deleteConfirm.characterName,
								count: deleteConfirm.conversationCount,
								plural: deleteConfirm.conversationCount > 1 ? 's' : ''
							}) + ' ' + t('gallery.undoWarning')
							: t('gallery.deleteMessage', { name: deleteConfirm.characterName }) + ' ' + t('gallery.undoWarning')
					}
					confirmLabel={t('gallery.deleteConfirm')}
					cancelLabel={t('gallery.deleteCancel')}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
					isDestructive={true}
				/>
			)}

			{showAuthPrompt && (
				<AuthPrompt message={t('gallery.authPrompt')} />
			)}
		</div>
	);
}
