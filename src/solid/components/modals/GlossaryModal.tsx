import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {EmptyState} from "../ui/EmptyState";
import {MathRenderer} from "../MathRenderer";
import {useUiStore} from "../../stores/uiStore";
import {Glossary} from "../../../lib/physics/reference/Glossary";
import type {GlossaryEntry} from "../../../lib/physics/reference/Glossary";
import styles from "./GlossaryModal.module.css";
/** Sentinel value representing "all categories" in the category filter. */
const ALL_CATEGORIES = "__all__";
/** Pill label for a category id, prettified for human display. */
function prettifyCategory(categoryId: string): string {
	return categoryId
		.split("-")
		.map(w => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
function GlossaryIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" stroke-linejoin="round" />
			<path d="M20 7v13H7" stroke-linejoin="round" />
			<path d="M9 8h6M9 12h6" stroke-linecap="round" />
		</svg>
	);
}
export interface GlossaryModalProps {
	/** Override the glossary used to source entries (defaults to standard). */
	glossary?: Glossary;
}
/**
 * Glossary overlay mapped to `#glossary-modal`.
 *
 * Renders the curated {@link Glossary} as a searchable, category-filterable
 * list. Each entry shows its term, an optional LaTeX symbol (rendered via
 * {@link MathRenderer}), definition, category pill, and related terms as
 * cross-reference chips. The category `<select>` derives its options from the
 * glossary itself so the modal stays in sync with the entry set. Pure
 * presentation — no mutations of any store besides the UI store's
 * `closeModal` action.
 */
export function GlossaryModal(props: GlossaryModalProps): JSX.Element {
	let isOpen = useUiStore(s => s.activeModal === "glossary");
	let close = () => useUiStore.getState().closeModal();
	let glossary = () => props.glossary ?? GlossaryModal.defaultGlossary;
	let [query, setQuery] = createSignal<string>("");
	let [category, setCategory] = createSignal<string>(ALL_CATEGORIES);
	let categories = createMemo<string[]>(() => {
		let seen = new Set<string>();
		let list: string[] = [];
		for (let e of glossary().getAll()) {
			if (seen.has(e.category)) continue;
			seen.add(e.category);
			list.push(e.category);
		}
		return list.sort((a, b) => a.localeCompare(b));
	});
	let filtered = createMemo<GlossaryEntry[]>(() => {
		let g = glossary();
		let q = query().trim().toLowerCase();
		let cat = category();
		let entries: GlossaryEntry[];
		if (cat === ALL_CATEGORIES) {
			entries = g.getAll();
		} else {
			entries = g.getByCategory(cat);
		}
		if (q === "") return entries;
		return entries.filter(e => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
	});
	return (
		<Modal
			open={isOpen()}
			onClose={close}
			modalId="glossary-modal"
			title="Glossary"
			titleId="glossary-title"
			ariaLabel="Glossary of physics terms"
			class={styles.glossary}
			footer={
				<Button variant="primary" size="md" onClick={close}>
					Close
				</Button>
			}
		>
			<div class={styles.controls}>
				<label class={styles.searchField}>
					<span class={styles.searchLabel}>Search</span>
					<input
						type="search"
						class={styles.searchInput}
						placeholder="Search terms or definitions..."
						value={query()}
						onInput={e => setQuery(e.currentTarget.value)}
						aria-label="Search glossary by term or definition"
					/>
				</label>
				<label class={styles.categoryField}>
					<span class={styles.categoryLabel}>Category</span>
					<select class={styles.categorySelect} value={category()} onChange={e => setCategory(e.currentTarget.value)} aria-label="Filter glossary by category">
						<option value={ALL_CATEGORIES}>All categories</option>
						<For each={categories()}>{cat => <option value={cat}>{prettifyCategory(cat)}</option>}</For>
					</select>
				</label>
			</div>
			<p class={styles.resultCount} aria-live="polite">
				{filtered().length} term{filtered().length === 1 ? "" : "s"}
			</p>
			<Show when={filtered().length > 0} fallback={<EmptyState illustration={<GlossaryIcon />} title="No terms match your search" description="Try a different keyword or category." />}>
				<ul class={styles.termList} role="list">
					<For each={filtered()}>
						{entry => (
							<li class={styles.termItem}>
								<div class={styles.termHeader}>
									<h3 class={styles.termName}>{entry.term}</h3>
									<Show when={entry.latex}>
										<span class={styles.termSymbol}>
											<MathRenderer display={false} tex={entry.latex!} />
										</span>
									</Show>
								</div>
								<p class={styles.termDefinition}>{entry.definition}</p>
								<div class={styles.termMeta}>
									<span class={styles.termCategory}>{prettifyCategory(entry.category)}</span>
									<Show when={entry.related && entry.related.length > 0}>
										<span class={styles.relatedLabel}>Related:</span>
										<ul class={styles.relatedList} role="list">
											<For each={entry.related}>
												{(r, i) => (
													<>
														<Show when={i() > 0}>
															<span class={styles.relatedSeparator} aria-hidden="true">
																,{" "}
															</span>
														</Show>
														<li class={styles.relatedItem}>{r}</li>
													</>
												)}
											</For>
										</ul>
									</Show>
								</div>
							</li>
						)}
					</For>
				</ul>
			</Show>
		</Modal>
	);
}
export namespace GlossaryModal {
	/** Default glossary instance shared across renders. */
	export const defaultGlossary: Glossary = new Glossary();
}
