module.exports={
	root: true,
	env: {browser: true, es2021: true, node: true},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react-hooks/recommended",
		"prettier"
	],
	parser: "@typescript-eslint/parser",
	ignorePatterns: ["dist", "src-tauri", "node_modules"],
	rules: {
		// AGENTS.md: no blank lines anywhere in source files.
		// Prettier preserves but does not limit blank lines, so ESLint enforces the cap.
		"no-multiple-empty-lines": ["error", {max: 0, maxEOF: 0, maxBOF: 0}]
	}
};
