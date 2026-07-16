import {defineConfig} from "vite";
import solid from "vite-plugin-solid";
let solidFiles = /src[\\/]solid[\\/]/;
export default defineConfig({
	plugins: [solid({include: [solidFiles]})],
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
						{name: "solid", test: /node_modules[\\/]solid-js[\\/]/, priority: 20},
						{name: "katex", test: /node_modules[\\/]katex[\\/]/, priority: 15},
						{name: "zustand", test: /node_modules[\\/]zustand[\\/]/, priority: 15},
						{name: "fontsource", test: /node_modules[\\/]@fontsource[\\/]/, priority: 15},
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
