import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";


export default defineConfig({
	plugins: [react()],
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
	publicDir: "../static",
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
