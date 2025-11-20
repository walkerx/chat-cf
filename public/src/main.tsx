/**
 * Frontend entry point
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext.js";
import { GalleryPage } from "./pages/GalleryPage.js";
import { ChatPage } from "./pages/ChatPage.js";
import { GalleryErrorBoundary } from "./components/GalleryErrorBoundary.js";
import { ChatErrorBoundary } from "./components/ChatErrorBoundary.js";
import "./styles/app.css";
import "./styles/gallery.css";
import "./styles/chat.css";
import "./styles/animations.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
	<React.StrictMode>
		<BrowserRouter>
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
						path="/chat/:characterId?" 
						element={
							<ChatErrorBoundary>
								<ChatPage />
							</ChatErrorBoundary>
						} 
					/>
				</Routes>
			</ChatProvider>
		</BrowserRouter>
	</React.StrictMode>
);

