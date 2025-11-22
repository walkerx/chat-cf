/**
 * App root component
 * Integrate ChatDisplay + ChatInputForm + ErrorDisplay, wire hooks (useChat), manage streaming state, pass callbacks
 */


import { useChat } from "./hooks/useChat.js";
import { ChatDisplay } from "./components/ChatDisplay.js";
import { ChatInputForm } from "./components/ChatInputForm.js";
import { ErrorDisplay } from "./components/ErrorDisplay.js";
import { CharacterCardSelector } from "./components/CharacterCardSelector.js";

export function App() {
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
				<h1>AI Chat</h1>
				<button
					className="new-conversation-button"
					onClick={startNewConversation}
					disabled={isStreaming}
					title="Start a new conversation"
				>
					+ New Conversation
				</button>
			</header>
			<main className="app-main">
				<CharacterCardSelector
					selectedCardId={characterCardId}
					onSelectCard={setCharacterCardId}
					disabled={isStreaming}
				/>
				{characterGreeting && messages.length === 0 && (
					<div className="character-greeting">
						<div className="greeting-label">Character Greeting:</div>
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

