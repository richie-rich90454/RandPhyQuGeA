import {defineConfig} from "vitest/config";
import solid from "vite-plugin-solid";
let solidFiles=/src[\\/]solid[\\/]/;
export default defineConfig({
    plugins: [
        solid({include: [solidFiles], hot: false}),
    ],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/solid/__tests__/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/lib/physics/**"],
            thresholds: {lines: 90, branches: 90, functions: 85, statements: 90},
        },
    },
});
