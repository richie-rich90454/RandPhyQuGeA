// Flat config replacement for the legacy .eslintrc.cjs.
// Preserves the exact same policy:
//   eslint:recommended + plugin:@typescript-eslint/recommended
//   + plugin:react-hooks/recommended + prettier (disable formatting rules)
//   + no-multiple-empty-lines (AGENTS.md "no blank lines" rule).
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
	{
		ignores: ["dist", "src-tauri", "node_modules", "coverage"],
	},
	// eslint:recommended
	js.configs.recommended,
	// plugin:@typescript-eslint/recommended (flat equivalent).
	// This array wires up the @typescript-eslint parser + plugin, applies the
	// recommended TS rules to **/*.{ts,tsx,...}, and applies the eslint-recommended
	// overrides that turn off conflicting core rules (no-undef, no-unused-vars,
	// no-redeclare, ...) in TS files.
	...tseslint.configs["flat/recommended"],
	{
		files: ["**/*.{ts,tsx}"],
		plugins: {
			"react-hooks": reactHooks,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	// Disable formatting rules that conflict with Prettier (replaces "prettier" extend).
	eslintConfigPrettier,
	{
		// AGENTS.md: no blank lines anywhere in source files.
		// Prettier preserves but does not cap blank lines, so ESLint enforces it.
		rules: {
			"no-multiple-empty-lines": ["error", { max: 0, maxEOF: 0, maxBOF: 0 }],
		},
	},
];
