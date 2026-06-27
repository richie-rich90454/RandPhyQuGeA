import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
	plugins: [
		react()
	],
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: true,
		fs: {
			deny: ["reference"],
		},
	},
	envPrefix: ["VITE_", "TAURI_"],
	optimizeDeps: {
		entries: ["index.html"],
	},
	build: {
		target: "es2021",
		minify: "oxc",
		sourcemap: true,
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{ name: "react", test: /node_modules[\\/](react|react-dom)[\\/]/, priority: 20 },
						{ name: "katex", test: /node_modules[\\/]katex[\\/]/, priority: 15 },
						{ name: "zustand", test: /node_modules[\\/]zustand[\\/]/, priority: 15 },
						{ name: "fontsource", test: /node_modules[\\/]@fontsource[\\/]/, priority: 15 },
					],
				},
				minify: {
					compress: {
						dropConsole: true,
						dropDebugger: true,
					},
				},
			},
		},
	},
});
