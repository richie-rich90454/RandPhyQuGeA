import type {JSX} from "solid-js";
import {Show, createMemo, splitProps} from "solid-js";
import katex from "katex";
import styles from "./MathRenderer.module.css";
const mathCache = new Map<string, string>();
/** Clears the module-level KaTeX render cache. Intended for tests. */
export function clearMathCache(): void {
	mathCache.clear();
}
export interface MathRendererProps {
	/** TeX source to render. */
	tex: string;
	/** Whether to render in display (block) mode. */
	display?: boolean;
	/** Extra class for the container. */
	class?: string;
}
/** Renders TeX source to HTML via KaTeX, re-rendering when tex changes. */
export function MathRenderer(props: MathRendererProps): JSX.Element {
	let [local] = splitProps(props, ["tex", "display", "class"]);
	let html = createMemo(() => {
		let key = `${local.display ? "d" : "i"}:${local.tex}`;
		let cached = mathCache.get(key);
		if (cached !== undefined) {
			return cached;
		}
		let rendered = katex.renderToString(local.tex, {
			displayMode: local.display ?? false,
			throwOnError: false,
		});
		if (rendered.includes("katex-error")) {
			let escaped = local.tex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			mathCache.set(key, escaped);
			return escaped;
		}
		mathCache.set(key, rendered);
		return rendered;
	});
	return (
		<Show when={local.display} fallback={<span class={`${styles.inline} ${local.class ?? ""}`} innerHTML={html()} />}>
			<div class={`${styles.display} ${local.class ?? ""}`} innerHTML={html()} />
		</Show>
	);
}
