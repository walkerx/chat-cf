/**
 * GalleryErrorBoundary Component
 * Error boundary specifically for the gallery page
 */

import { type ReactNode, type ErrorInfo } from "react";
import { ErrorBoundary } from "./ErrorBoundary.js";

export interface GalleryErrorBoundaryProps {
	children: ReactNode;
}

function GalleryErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="gallery-page">
			<div className="error-boundary">
				<div className="error-boundary-content">
					<h2>Gallery Error</h2>
					<p className="error-boundary-message">
						{error.message || "Failed to load the character gallery"}
					</p>
					<div className="error-boundary-actions">
						<button
							className="error-boundary-retry"
							onClick={reset}
						>
							Try Again
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

export function GalleryErrorBoundary({ children }: GalleryErrorBoundaryProps) {
	const handleError = (error: Error, errorInfo: ErrorInfo) => {
		console.error("Gallery error:", error, errorInfo);
	};

	const fallback = (error: Error, reset: () => void) => {
		return <GalleryErrorFallback error={error} reset={reset} />;
	};

	return (
		<ErrorBoundary fallback={fallback} onError={handleError}>
			{children}
		</ErrorBoundary>
	);
}
