/**
 * ChatErrorBoundary Component
 * Error boundary specifically for the chat page
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary.js";

export interface ChatErrorBoundaryProps {
	children: React.ReactNode;
}

function ChatErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
	const navigate = useNavigate();

	return (
		<div className="chat-page">
			<div className="error-boundary">
				<div className="error-boundary-content">
					<h2>Chat Error</h2>
					<p className="error-boundary-message">
						{error.message || "An error occurred in the chat interface"}
					</p>
					<div className="error-boundary-actions">
						<button
							className="error-boundary-retry"
							onClick={reset}
						>
							Try Again
						</button>
						<button
							className="error-boundary-home"
							onClick={() => navigate("/")}
						>
							Back to Gallery
						</button>
						<button
							className="error-boundary-reload"
							onClick={() => window.location.reload()}
						>
							Reload Page
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function ChatErrorBoundary({ children }: ChatErrorBoundaryProps) {
	const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
		console.error("Chat error:", error, errorInfo);
	};

	const fallback = (error: Error, reset: () => void) => {
		return <ChatErrorFallback error={error} reset={reset} />;
	};

	return (
		<ErrorBoundary fallback={fallback} onError={handleError}>
			{children}
		</ErrorBoundary>
	);
}
