/**
 * Confirm Dialog Component
 * Modal dialog for confirming destructive actions
 */

import React from "react";

export interface ConfirmDialogProps {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isDestructive?: boolean;
}

export function ConfirmDialog({
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
	isDestructive = false,
}: ConfirmDialogProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onCancel();
		}
	};

	return (
		<div
			className="modal-overlay"
			onClick={onCancel}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-dialog-title"
			aria-describedby="confirm-dialog-message"
		>
			<div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2 id="confirm-dialog-title">{title}</h2>
					<button
						className="modal-close"
						onClick={onCancel}
						aria-label="Close dialog"
					>
						×
					</button>
				</div>

				<div className="modal-body">
					<p id="confirm-dialog-message" className="confirm-message">
						{message}
					</p>
				</div>

				<div className="modal-footer">
					<button
						className="modal-button modal-button-secondary"
						onClick={onCancel}
						aria-label={cancelLabel}
					>
						{cancelLabel}
					</button>
					<button
						className={`modal-button ${
							isDestructive ? "modal-button-destructive" : "modal-button-primary"
						}`}
						onClick={onConfirm}
						aria-label={confirmLabel}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
