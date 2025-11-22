/**
 * Frontend entry point
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { GalleryPage } from "./pages/GalleryPage.js";
import { ChatPage } from "./pages/ChatPage.js";
import AuthPage from "./components/AuthPage.js";
import { GalleryErrorBoundary } from "./components/GalleryErrorBoundary.js";
import { ChatErrorBoundary } from "./components/ChatErrorBoundary.js";
import "./styles/app.css";
import "./styles/gallery.css";
import "./styles/chat.css";
import "./styles/auth.css";
import "./styles/animations.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

console.log("[DEBUG] Initializing React app with React version:", React.version);

const root = createRoot(rootElement);
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<ChatProvider>
					<Routes>
						<Route
							path="/"
							element={
								<GalleryErrorBoundary>
									<GalleryPage />
								</GalleryErrorBoundary>
							}
						/>
						<Route
							path="/auth"
							element={<AuthPage />}
						/>
						<Route
							path="/chat/:characterId?"
							element={
								<ChatErrorBoundary>
									<ChatPage />
								</ChatErrorBoundary>
							}
						/>
					</Routes>
				</ChatProvider>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>
);

