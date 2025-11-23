/**
 * Chat Page Component
 * Wrapper for existing chat interface with character-specific conversation loading
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatContext } from "../contexts/ChatContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { ChatDisplay } from "../components/ChatDisplay.js";
import { ChatInputForm } from "../components/ChatInputForm.js";
import { ErrorDisplay } from "../components/ErrorDisplay.js";
import { ChatHeader } from "../components/ChatHeader.js";
import {
	getCharacterCard,
	type CharacterCardListItem,
} from "../services/api.js";

export function ChatPage() {
	const { characterId } = useParams<{ characterId: string }>();
	const navigate = useNavigate();
	const chat = useChatContext();
	const [characterName, setCharacterName] = useState<string | null>(null);
	const [characterCard, setCharacterCard] = useState<CharacterCardListItem | null>(null);
	const [loadingCharacter, setLoadingCharacter] = useState(true);
	const [characterError, setCharacterError] = useState<string | null>(null);
	const { user, signOut, username } = useAuth();

	// Load character data and conversation when page loads
	useEffect(() => {
		async function loadCharacterData() {
			if (!characterId) {
				setLoadingCharacter(false);
				setCharacterName(null);
				chat.setCharacterCardId(null);
				return;
			}

			try {
				setLoadingCharacter(true);
				setCharacterError(null);

				// Check if we're returning to the same character
				// If so, preserve the existing state (messages, conversationId)
				if (chat.characterCardId === characterId) {
					// Same character - update local state from context
					if (chat.characterCard) {
						setCharacterName(chat.characterCard.data.data.name);
						setCharacterCard(chat.characterCard);
					}
					setLoadingCharacter(false);
					return;
				}

				// Different character - set character and load conversation
				chat.setCharacterCardId(characterId);

				// Load character-specific conversation with username
				await chat.loadCharacterConversation(characterId, username || undefined);

				// Update local state from context after loading
				if (chat.characterCard) {
					setCharacterName(chat.characterCard.data.data.name);
					setCharacterCard(chat.characterCard);
				}
			} catch (err) {
				console.error("Failed to load character:", err);

				// Handle specific error cases
				if (err instanceof Error) {
					const errorMessage = err.message.toLowerCase();

					// Character not found (404)
					if (errorMessage.includes("404") || errorMessage.includes("not found")) {
						setCharacterError("Character not found. It may have been deleted.");
					}
					// Network errors
					else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
						setCharacterError("Network error. Please check your connection and try again.");
					}
					// Failed to load conversations
					else if (errorMessage.includes("conversation")) {
						setCharacterError("Failed to load conversation history. You can still start a new chat.");
					}
					// Generic error
					else {
						setCharacterError(err.message || "Failed to load character");
					}
				} else {
					setCharacterError("An unexpected error occurred");
				}
			} finally {
				setLoadingCharacter(false);
			}
		}

		loadCharacterData();
	}, [characterId, username]);

	// Update local character state when context changes
	useEffect(() => {
		if (chat.characterCard && chat.characterCardId === characterId) {
			setCharacterName(chat.characterCard.data.data.name);
			setCharacterCard(chat.characterCard);
		}
	}, [chat.characterCard, chat.characterCardId, characterId]);

	const handleBack = () => {
		navigate("/");
	};

	const handleNewConversation = () => {
		chat.startNewConversation();
	};

	const handleAuthAction = async () => {
		if (user) {
			await signOut();
		} else {
			navigate("/auth");
		}
	};

	const handleSendMessage = async (prompt: string) => {
		await chat.sendMessage(prompt, username || undefined);
	};

	if (loadingCharacter) {
		return (
			<div className="chat-page" role="main">
				<div className="chat-loading" role="status" aria-live="polite">
					Loading character...
				</div>
			</div>
		);
	}

	if (characterError) {
		return (
			<div className="chat-page" role="main">
				<div className="chat-error" role="alert">
					<p>Error: {characterError}</p>
					<button onClick={handleBack} aria-label="Return to character gallery">
						Back to Gallery
					</button>
				</div>
			</div>
		);
	}

	// Show login prompt if not authenticated
	if (!user) {
		return (
			<div className="chat-page" role="main">
				<ChatHeader
					characterName={characterName}
					onBack={handleBack}
					onNewConversation={handleNewConversation}
					isStreaming={false}
					user={user}
					onAuthAction={handleAuthAction}
				/>
				<main className="chat-content" aria-label="Chat conversation">
					<div className="auth-required-overlay" role="alert">
						<div className="auth-required-content">
							<h2>Authentication Required</h2>
							<p>Please sign in to start chatting with characters.</p>
							<button
								className="auth-required-button"
								onClick={() => navigate('/auth')}
								aria-label="Go to sign in page"
							>
								Sign In to Continue
							</button>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="chat-page" role="main">
			<ChatHeader
				characterName={characterName}
				onBack={handleBack}
				onNewConversation={handleNewConversation}
				isStreaming={chat.isStreaming}
				user={user}
				onAuthAction={handleAuthAction}
			/>

			<main className="chat-content" aria-label="Chat conversation">
				<ErrorDisplay error={chat.error} onDismiss={chat.clearError} />
				<ChatDisplay
					messages={chat.messages}
					isStreaming={chat.isStreaming}
					hasMoreMessages={chat.hasMoreMessages}
					loadMoreMessages={chat.loadMoreMessages}
					characterName={characterName}
					userName={username}
					characterCard={characterCard?.data}
					userAvatarUrl={user?.user_metadata?.avatar_url}
				/>
				<ChatInputForm
					onSubmit={handleSendMessage}
					onCancel={chat.abortStream}
					isStreaming={chat.isStreaming}
					streamEnabled={chat.streamEnabled}
					onToggleStream={chat.setStreamEnabled}
				/>
			</main>
		</div>
	);
}
