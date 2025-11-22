import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

function parseDevVars() {
	const devVarsPath = resolve(process.cwd(), ".dev.vars");
	if (!fs.existsSync(devVarsPath)) return {};

	const content = fs.readFileSync(devVarsPath, "utf-8");
	const vars: Record<string, string> = {};

	content.split("\n").forEach((line) => {
		const match = line.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			const value = match[2].trim().replace(/^["']|["']$/g, "");
			// Only expose VITE_ variables to the client
			if (key.startsWith("VITE_")) {
				vars[`import.meta.env.${key}`] = JSON.stringify(value);
			}
		}
	});
	return vars;
}

export default defineConfig({
	plugins: [react()],
	define: parseDevVars(),
	build: {
		outDir: resolve(process.cwd(), "dist"),
		emptyOutDir: true,
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			input: resolve(process.cwd(), "public/index.html"),
			output: {
				manualChunks: {
					'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
					'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
					'vendor-supabase': ['@supabase/supabase-js'],
				},
			},
		},
	},
	root: "./public",
	envDir: "../",
	publicDir: false,
	base: "/",
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
});
