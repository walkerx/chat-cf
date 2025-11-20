/**
 * ErrorBoundary Component
 * Catches React errors and displays user-friendly error messages
 * Allows recovery without full page reload
 */

import React, { Component, ReactNode } from "react";

export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (error: Error, reset: () => void) => ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	resetError = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.resetError);
			}

			return (
				<div className="error-boundary">
					<div className="error-boundary-content">
						<h2>Something went wrong</h2>
						<p className="error-boundary-message">
							{this.state.error.message || "An unexpected error occurred"}
						</p>
						<div className="error-boundary-actions">
							<button
								className="error-boundary-retry"
								onClick={this.resetError}
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
			);
		}

		return this.props.children;
	}
}
