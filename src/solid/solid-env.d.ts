/// <reference types="vite/client" />
/// <reference types="solid-js" />
declare module "node:fs" {
	export function readFileSync(path: string, encoding: string): string;
}
declare module "node:path" {
	export function join(...paths: string[]): string;
}
declare const process: {
	cwd(): string;
};
