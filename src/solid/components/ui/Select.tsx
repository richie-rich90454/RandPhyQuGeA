import type {ComponentProps, JSX, JSXElement} from "solid-js";
import {For, Show, splitProps} from "solid-js";
import styles from "./Select.module.css";
/** Select option value/label pair. */
export interface SelectOption {
	value: string;
	label: string;
}
/** Visual style. */
export type SelectVariant = "scope" | "difficulty" | "default";
export interface SelectProps extends ComponentProps<"select"> {
	/** Optional visible label. */
	label?: string;
	/** Optional error message. */
	error?: string;
	/** Optional hint text. */
	hint?: JSXElement;
	/** Options rendered as `<option>` children. */
	options: SelectOption[];
	/** `scope` or `difficulty` apply pill-shaped variants. */
	variant?: SelectVariant;
}
let variantClass: Record<SelectVariant, string | undefined> = {
	scope: styles.scope,
	difficulty: styles.difficulty,
	default: undefined,
};
let idCounter = 0;
function generateId(): string {
	idCounter = idCounter + 1;
	return `solid-select-${idCounter}`;
}
/** Select primitive with design-token styling, error/hint states, and a custom chevron. */
export function Select(props: SelectProps): JSX.Element {
	let [local, others] = splitProps(props, ["label", "error", "hint", "options", "variant", "class", "id"]);
	let generatedId = generateId();
	let selectId = () => local.id ?? generatedId;
	let errorId = () => `${selectId()}-error`;
	let hintId = () => `${selectId()}-hint`;
	let describedBy = () => [local.error ? errorId() : null, local.hint ? hintId() : null].filter(Boolean).join(" ") || undefined;
	let variant = local.variant ?? "default";
	return (
		<div class={styles.wrapper}>
			<Show when={local.label}>
				<label for={selectId()} class={styles.label}>
					{local.label}
				</label>
			</Show>
			<div class={styles.control}>
				<select
					id={selectId()}
					aria-invalid={Boolean(local.error)}
					aria-describedby={describedBy()}
					class={`${styles.select} ${local.error ? styles.errorSelect : ""} ${variantClass[variant] ?? ""} ${local.class ?? ""}`}
					{...others}
				>
					<For each={local.options}>{option => <option value={option.value}>{option.label}</option>}</For>
				</select>
				<span class={styles.chevron} aria-hidden="true">
					▾
				</span>
			</div>
			<Show when={local.error}>
				<p id={errorId()} class={styles.error}>
					{local.error}
				</p>
			</Show>
			<Show when={local.hint}>
				<p id={hintId()} class={styles.hint}>
					{local.hint}
				</p>
			</Show>
		</div>
	);
}
