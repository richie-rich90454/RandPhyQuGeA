import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {EmptyState} from "../ui/EmptyState";
import {MathRenderer} from "../MathRenderer";
import {useUiStore} from "../../stores/uiStore";
import {FormulaLibrary} from "../../../lib/physics/FormulaLibrary";
import type {FormulaEntry} from "../../../types/models";
import styles from "./FormulaCheatSheetModal.module.css";
/** Sentinel value representing "all topics" in the topic filter. */
const ALL_TOPICS="__all__";
/** Pill label for a topic id, prettified for human display. */
function prettifyTopic(topicId: string): string {
	return topicId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function BookIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" stroke-linejoin="round" />
			<path d="M20 7v13H7" stroke-linejoin="round" />
			<path d="M9 8h6M9 12h6" stroke-linecap="round" />
		</svg>
	);
}
export interface FormulaCheatSheetModalProps {
	/** Override the formula library used to source entries (defaults to standard). */
	library?: FormulaLibrary;
}
/**
 * Formula cheat-sheet overlay mapped to `#formulas-modal`.
 *
 * Renders the curated {@link FormulaLibrary} as a searchable, topic-filterable
 * list. Each entry shows its name, LaTeX expression (rendered via
 * {@link MathRenderer}), description, and the set of variables it references.
 * The topic `<select>` derives its options from the formulas themselves so the
 * modal stays in sync with the library contents. Pure presentation — no
 * mutations of any store besides the UI store's `closeModal` action.
 */
export function FormulaCheatSheetModal(props: FormulaCheatSheetModalProps): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal === "formulas");
	let close=() => useUiStore.getState().closeModal();
	let library=() => props.library ?? FormulaCheatSheetModal.defaultLibrary;
	let [query, setQuery]=createSignal<string>("");
	let [topic, setTopic]=createSignal<string>(ALL_TOPICS);
	let topics=createMemo<string[]>(() => {
		let seen=new Set<string>();
		let list: string[]=[];
		for (let f of library().getAll()) {
			let tid=f.topic_id;
			if (!tid || seen.has(tid)) continue;
			seen.add(tid);
			list.push(tid);
		}
		return list.sort((a, b) => a.localeCompare(b));
	});
	let filtered=createMemo<FormulaEntry[]>(() => {
		let lib=library();
		let q=query().trim().toLowerCase();
		let tid=topic();
		let entries: FormulaEntry[];
		if (tid === ALL_TOPICS) {
			entries=lib.getAll();
		} else {
			entries=lib.getByTopic(tid);
		}
		if (q === "") return entries;
		return entries.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
	});
	return (
		<Modal
			open={isOpen()}
			onClose={close}
			modalId="formulas-modal"
			title="Formula Cheat Sheet"
			titleId="formulas-title"
			ariaLabel="Formula cheat sheet"
			class={styles.formulas}
			footer={<Button variant="primary" size="md" onClick={close}>Close</Button>}
		>
			<div class={styles.controls}>
				<label class={styles.searchField}>
					<span class={styles.searchLabel}>Search</span>
					<input
						type="search"
						class={styles.searchInput}
						placeholder="Search formulas..."
						value={query()}
						onInput={(e) => setQuery(e.currentTarget.value)}
						aria-label="Search formulas by name or description"
					/>
				</label>
				<label class={styles.topicField}>
					<span class={styles.topicLabel}>Topic</span>
					<select
						class={styles.topicSelect}
						value={topic()}
						onChange={(e) => setTopic(e.currentTarget.value)}
						aria-label="Filter formulas by topic"
					>
						<option value={ALL_TOPICS}>All topics</option>
						<For each={topics()}>{(tid) => (
							<option value={tid}>{prettifyTopic(tid)}</option>
						)}</For>
					</select>
				</label>
			</div>
			<p class={styles.resultCount} aria-live="polite">
				{filtered().length} formula{filtered().length === 1 ? "" : "s"}
			</p>
			<Show when={filtered().length > 0} fallback={
				<EmptyState illustration={<BookIcon />} title="No formulas match your search" description="Try a different keyword or topic." />
			}>
				<ul class={styles.formulaList} role="list">
					<For each={filtered()}>{(formula) => (
						<li class={styles.formulaItem}>
							<div class={styles.formulaHeader}>
								<h3 class={styles.formulaName}>{formula.name}</h3>
								<Show when={formula.topic_id}>
									<span class={styles.formulaTopic}>{prettifyTopic(formula.topic_id!)}</span>
								</Show>
							</div>
							<div class={styles.formulaExpression}>
								<MathRenderer display={true} tex={formula.latex} />
							</div>
							<p class={styles.formulaDescription}>{formula.description}</p>
							<Show when={formula.variables.length > 0}>
								<dl class={styles.variables}>
									<dt class={styles.variablesLabel}>Variables:</dt>
									<dd class={styles.variablesList}>
										<For each={formula.variables}>{(v, i) => (
											<>
												<Show when={i() > 0}>
													<span class={styles.variableSeparator} aria-hidden="true">, </span>
												</Show>
												<code class={styles.variable}>{v}</code>
											</>
										)}</For>
									</dd>
								</dl>
							</Show>
						</li>
					)}</For>
				</ul>
			</Show>
		</Modal>
	);
}
export namespace FormulaCheatSheetModal {
	/** Default formula library instance shared across renders. */
	export const defaultLibrary: FormulaLibrary=new FormulaLibrary();
}
