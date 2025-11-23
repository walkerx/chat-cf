/**
 * Frontend entry point
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ChatProvider } from "./contexts/ChatContext.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { AppRoot } from "./AppRoot.js";
import "./i18n.js";
import "./styles/app.css";
import "./styles/gallery.css";
import "./styles/chat.css";
import "./styles/auth.css";
import "./styles/profile-setup.css";
import "./styles/animations.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

console.log("[DEBUG] Initializing React app with React version:", React.version);



const root = createRoot(rootElement);
root.render(
	<React.StrictMode>
		<HelmetProvider>
			<BrowserRouter>
				<AuthProvider>
					<ChatProvider>
						<AppRoot />
					</ChatProvider>
				</AuthProvider>
			</BrowserRouter>
		</HelmetProvider>
	</React.StrictMode>
);


