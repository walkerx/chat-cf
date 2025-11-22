/**
 * App root component
 * Integrate ChatDisplay + ChatInputForm + ErrorDisplay, wire hooks (useChat), manage streaming state, pass callbacks
 */


import { useChat } from "./hooks/useChat.js";
import { useDocumentMeta } from "./hooks/useDocumentMeta.js";
import { ChatDisplay } from "./components/ChatDisplay.js";
import { ChatInputForm } from "./components/ChatInputForm.js";
import { ErrorDisplay } from "./components/ErrorDisplay.js";
import { CharacterCardSelector } from "./components/CharacterCardSelector.js";
import { LanguageSwitcher } from "./components/LanguageSwitcher.js";
import { useTranslation } from "react-i18next";

export function App() {
	const { t } = useTranslation();
	useDocumentMeta(); // Update document meta tags when language changes

	const {
		messages,
		isStreaming,
		error,
		characterCardId,
		characterGreeting,
		sendMessage,
		abortStream,
		clearError,
		setCharacterCardId,
		startNewConversation,
	} = useChat();

	return (
		<div className="app">
			<header className="app-header">
				<h1>{t('app.title')}</h1>
				<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
					<LanguageSwitcher />
					<button
						className="new-conversation-button"
						onClick={startNewConversation}
						disabled={isStreaming}
						title={t('app.newConversation')}
					>
						{t('app.newConversation')}
					</button>
				</div>
			</header>
			<main className="app-main">
				<CharacterCardSelector
					selectedCardId={characterCardId}
					onSelectCard={setCharacterCardId}
					disabled={isStreaming}
				/>
				{characterGreeting && messages.length === 0 && (
					<div className="character-greeting">
						<div className="greeting-label">{t('app.characterGreeting')}:</div>
						<div className="greeting-content">{characterGreeting}</div>
					</div>
				)}
				<ErrorDisplay error={error} onDismiss={clearError} />
				<ChatDisplay messages={messages} />
				<ChatInputForm
					onSubmit={sendMessage}
					onCancel={abortStream}
					isStreaming={isStreaming}
				/>
			</main>
		</div>
	);
}

