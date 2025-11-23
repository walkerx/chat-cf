/**
 * ChatInputForm React component
 * Text input field (text-only validation per spec.md), submit button, disable during streaming, clear input after submit
 */

import { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";

export interface ChatInputFormProps {
	onSubmit: (prompt: string) => void;
	onCancel?: () => void;
	isStreaming: boolean;
	disabled?: boolean;
	streamEnabled: boolean;
	onToggleStream: (enabled: boolean) => void;
}

export function ChatInputForm({
	onSubmit,
	onCancel,
	isStreaming,
	disabled = false,
	streamEnabled,
	onToggleStream,
}: ChatInputFormProps) {
	const { t } = useTranslation();
	const [input, setInput] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || disabled || isStreaming) {
			return;
		}

		onSubmit(trimmed);
		setInput("");
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<form className="chat-input-form" onSubmit={handleSubmit} aria-label="Chat message form">
			<input
				type="text"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				placeholder={t('chat.inputPlaceholder')}
				disabled={disabled || isStreaming}
				className="chat-input"
				aria-label="Message input"
				aria-describedby="chat-input-hint"
			/>
			<span id="chat-input-hint" style={{ display: 'none' }}>
				{t('chat.inputPlaceholder')}
			</span>
			{isStreaming ? (
				<button
					type="button"
					onClick={handleCancel}
					className="chat-button chat-button-cancel"
					aria-label={t('chat.cancelStreaming')}
				>
					{t('common.cancel')}
				</button>
			) : (
				<div className="chat-controls">
					<div
						className="toggle-container"
						title={t('chat.toggleStreaming')}
						onClick={() => {
							if (!disabled && !isStreaming) {
								onToggleStream(!streamEnabled);
							}
						}}
						style={{ cursor: (disabled || isStreaming) ? 'not-allowed' : 'pointer' }}
					>
						<div className={`toggle-switch ${streamEnabled ? 'active' : ''}`}>
							<div className="toggle-thumb"></div>
						</div>
						<span>{t('chat.stream')}</span>
					</div>
					<button
						type="submit"
						disabled={disabled || isStreaming || !input.trim()}
						className="chat-button chat-button-submit"
						aria-label={t('chat.send')}
					>
						{t('chat.send')}
					</button>
				</div>
			)}
		</form>
	);
}

