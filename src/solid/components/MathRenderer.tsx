import type {JSX} from "solid-js";
import {Show, createMemo, splitProps} from "solid-js";
import katex from "katex";
import styles from "./MathRenderer.module.css";
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
	let [local]=splitProps(props, ["tex", "display", "class"]);
	let html=createMemo(() => {
		return katex.renderToString(local.tex, {
			displayMode: local.display ?? false,
			throwOnError: false,
		});
	});
	return (
		<Show
			when={local.display}
			fallback={<span class={`${styles.inline} ${local.class ?? ""}`} innerHTML={html()} />}
		>
			<div class={`${styles.display} ${local.class ?? ""}`} innerHTML={html()} />
		</Show>
	);
}
