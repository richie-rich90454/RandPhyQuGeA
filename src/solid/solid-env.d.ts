/// <reference types="vite/client" />
/// <reference types="solid-js" />
declare module "node:fs" {
	export function readFileSync(path: string, encoding: string): string;
	export interface Dirent {
		name: string;
		isDirectory(): boolean;
		isFile(): boolean;
	}
	export function readdirSync(path: string, options: {withFileTypes: true}): Dirent[];
}
declare module "node:path" {
	export function join(...paths: string[]): string;
	export function relative(from: string, to: string): string;
}
declare const process: {
	cwd(): string;
};
