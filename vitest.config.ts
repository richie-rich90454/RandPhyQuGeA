import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/physics/**'],
			thresholds: {lines: 90, functions: 90, branches: 85, statements: 90}
		}
	}
});
