/**
 * GalleryErrorBoundary Component
 * Error boundary specifically for the gallery page
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary.js";

export interface GalleryErrorBoundaryProps {
	children: React.ReactNode;
}

export function GalleryErrorBoundary({ children }: GalleryErrorBoundaryProps) {
	const navigate = useNavigate();

	const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
		console.error("Gallery error:", error, errorInfo);
	};

	const fallback = (error: Error, reset: () => void) => {
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
	};

	return (
		<ErrorBoundary fallback={fallback} onError={handleError}>
			{children}
		</ErrorBoundary>
	);
}
