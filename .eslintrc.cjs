module.exports={
	root: true,
	env: {browser: true, es2021: true, node: true},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react-hooks/recommended"
	],
	parser: "@typescript-eslint/parser",
	ignorePatterns: ["dist", "src-tauri", "node_modules"],
	rules: {
		indent: ["error", "tab"],
		"no-multiple-empty-lines": ["error", {max: 0, maxEOF: 0, maxBOF: 0}],
		semi: ["error", "always"],
		"no-trailing-spaces": ["error"],
		"brace-style": ["error", "stroustrup"],
		// AGENTS.md wants NO spaces around infix operators, but ESLint has no
		// such core rule (only space-infix-ops, which enforces the opposite).
		// Prettier also cannot disable operator spacing, so this stays unenforced.
		"comma-spacing": ["error", {before: false, after: true}],
		"space-before-function-paren": ["error", "never"],
		quotes: ["error", "single", {avoidEscape: true, allowTemplateLiterals: true}]
	}
};
