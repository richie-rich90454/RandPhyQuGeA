import type {ComponentProps, JSX, JSXElement} from "solid-js";
import {Show, splitProps} from "solid-js";
import styles from "./Input.module.css";
let idCounter=0;
function generateId(): string {
	idCounter=idCounter+1;
	return `solid-input-${idCounter}`;
}
export interface InputProps extends ComponentProps<"input"> {
	/** Optional visible label. */
	label?: string;
	/** Optional error message. */
	error?: string;
	/** Optional hint text. */
	hint?: JSXElement;
}
/** Text input primitive with label, error, and hint affordances. */
export function Input(props: InputProps): JSX.Element {
	let [local, others]=splitProps(props, ["label", "error", "hint", "class", "id"]);
	let generatedId=generateId();
	let inputId=() => local.id ?? generatedId;
	let errorId=() => `${inputId()}-error`;
	let hintId=() => `${inputId()}-hint`;
	let describedBy=() => [local.error ? errorId() : null, local.hint ? hintId() : null].filter(Boolean).join(" ") || undefined;
	return (
		<div class={styles.wrapper}>
			<Show when={local.label}>
				<label for={inputId()} class={styles.label}>{local.label}</label>
			</Show>
			<input
				id={inputId()}
				aria-invalid={Boolean(local.error)}
				aria-describedby={describedBy()}
				class={`${styles.input} ${local.error ? styles.errorInput : ""} ${local.class ?? ""}`}
				{...others}
			/>
			<Show when={local.error}>
				<p id={errorId()} class={styles.error}>{local.error}</p>
			</Show>
			<Show when={local.hint}>
				<p id={hintId()} class={styles.hint}>{local.hint}</p>
			</Show>
		</div>
	);
}
