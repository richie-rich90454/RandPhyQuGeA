import type {JSX, JSXElement} from "solid-js";
import {For, Show, createEffect, createMemo, createSignal, onCleanup, onMount, splitProps} from "solid-js";
import {Portal} from "solid-js/web";
import styles from "./CommandPalette.module.css";
/** A single actionable entry in the command palette. */
export interface Command {
	/** Stable identifier. */
	id: string;
	/** Human-readable label shown in the list. */
	label: string;
	/** Section header the command is grouped under. */
	section: string;
	/** Optional keywords used for fuzzy matching. */
	keywords?: string;
	/** Optional leading icon. */
	icon?: JSXElement;
	/** Invoked when the command is selected. */
	perform: () => void;
}
/** Action callbacks wired to the default command registry. Omitted callbacks are no-ops. */
export interface CommandPaletteActions {
	onStartPractice?: () => void;
	onOpenSettings?: () => void;
	onPrintWorksheet?: () => void;
	onViewProgress?: () => void;
	onToggleTheme?: () => void;
	onOpenShortcuts?: () => void;
	onResumeSession?: () => void;
	onClearData?: () => void;
	onExportData?: () => void;
}
function navigate(hash: string): void {
	window.location.hash=hash;
}
/**
 * Build the default command registry from optional action callbacks.
 *
 * Navigation commands set `window.location.hash` directly so they work
 * before a router is mounted; action commands defer to the supplied
 * callbacks (no-ops when omitted).
 */
export function createDefaultCommands(actions: CommandPaletteActions): Command[] {
	return [
		{id: "start-practice", label: "Start Practice", section: "Actions", keywords: "practice begin start", perform: () => actions.onStartPractice?.()},
		{id: "open-settings", label: "Open Settings", section: "Actions", keywords: "settings preferences config", perform: () => actions.onOpenSettings?.()},
		{id: "print-worksheet", label: "Print Worksheet", section: "Actions", keywords: "print export worksheet pdf", perform: () => actions.onPrintWorksheet?.()},
		{id: "view-progress", label: "View Progress", section: "Actions", keywords: "progress stats analytics", perform: () => actions.onViewProgress?.()},
		{id: "toggle-theme", label: "Toggle Theme", section: "Actions", keywords: "theme dark light dim", perform: () => actions.onToggleTheme?.()},
		{id: "open-shortcuts", label: "Open Shortcuts", section: "Actions", keywords: "shortcuts keyboard help", perform: () => actions.onOpenShortcuts?.()},
		{id: "resume-session", label: "Resume Session", section: "Actions", keywords: "resume session continue", perform: () => actions.onResumeSession?.()},
		{id: "clear-data", label: "Clear Data", section: "Actions", keywords: "clear reset data", perform: () => actions.onClearData?.()},
		{id: "export-data", label: "Export Data", section: "Actions", keywords: "export download data json", perform: () => actions.onExportData?.()},
		{id: "go-playground", label: "Go to Playground", section: "Navigation", keywords: "playground components showcase", perform: () => navigate("/playground")},
		{id: "go-spec-editor", label: "Go to Spec Editor", section: "Navigation", keywords: "spec editor live preview", perform: () => navigate("/spec-editor")},
		{id: "go-wizard", label: "Go to Wizard", section: "Navigation", keywords: "wizard template authoring", perform: () => navigate("/wizard")},
		{id: "go-dx-dashboard", label: "Go to DX Dashboard", section: "Navigation", keywords: "dx dashboard coverage perf", perform: () => navigate("/dx")},
	];
}
function isSubsequence(haystack: string, query: string): boolean {
	let i=0;
	for (let ch of haystack) {
		if (ch === query[i]) i=i+1;
		if (i === query.length) return true;
	}
	return false;
}
function fuzzyMatch(command: Command, query: string): boolean {
	let label=command.label.toLowerCase();
	if (label.includes(query)) return true;
	let keywords=command.keywords?.toLowerCase() ?? "";
	if (keywords.includes(query)) return true;
	if (isSubsequence(label, query)) return true;
	if (isSubsequence(keywords, query)) return true;
	return false;
}
export interface CommandPaletteProps {
	/** Whether the palette is visible. */
	open: boolean;
	/** Called with the next open state (toggle on Ctrl+K, close on Escape/backdrop). */
	onOpenChange: (open: boolean) => void;
	/** Commands to display; defaults to the built-in registry. */
	commands?: Command[];
	/** Optional action callbacks for the default registry. Ignored when `commands` is supplied. */
	actions?: CommandPaletteActions;
}
/**
 * Glassmorphism command palette opened with Ctrl+K / Cmd+K.
 *
 * Renders a portal overlay with a search input and a filtered, grouped
 * command list. Fuzzy subsequence matching filters by label and keywords.
 * Keyboard: ArrowUp/Down move the selection, Enter runs the highlighted
 * command, Escape closes, Ctrl+K/Cmd+K toggles open state. The selected
 * item is highlighted and scrolled into view.
 */
export function CommandPalette(props: CommandPaletteProps): JSX.Element {
	let [local]=splitProps(props, ["open", "onOpenChange", "commands", "actions"]);
	let [query, setQuery]=createSignal("");
	let [selected, setSelected]=createSignal(0);
	let inputEl: HTMLInputElement | null=null;
	let listEl: HTMLDivElement | null=null;
	let commands=createMemo(() => local.commands ?? createDefaultCommands(local.actions ?? {}));
	let filtered=createMemo(() => {
		let q=query().trim().toLowerCase();
		if (!q) return commands();
		return commands().filter((command) => fuzzyMatch(command, q));
	});
	let groups=createMemo(() => {
		let list=filtered();
		let map=new Map<string, Command[]>();
		for (let command of list) {
			let bucket=map.get(command.section);
			if (bucket) {
				bucket.push(command);
			} else {
				map.set(command.section, [command]);
			}
		}
		return Array.from(map.entries());
	});
	let flatIndexFor=(command: Command): number => {
		let list=filtered();
		return list.findIndex((entry) => entry.id === command.id);
	};
	let clampSelected=() => {
		let list=filtered();
		if (list.length === 0) return;
		let idx=selected();
		if (idx<0) setSelected(0);
		if (idx>=list.length) setSelected(list.length-1);
	};
	let reset=() => {
		setQuery("");
		setSelected(0);
	};
	let close=() => {
		local.onOpenChange(false);
	};
	let execute=(command: Command) => {
		command.perform();
		close();
	};
	let handleToggleKey=(event: KeyboardEvent) => {
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "k") {
			event.preventDefault();
			local.onOpenChange(!local.open);
		}
	};
	onMount(() => {
		document.addEventListener("keydown", handleToggleKey);
	});
	onCleanup(() => {
		document.removeEventListener("keydown", handleToggleKey);
	});
	let handleInputKeyDown=(event: KeyboardEvent) => {
		let list=filtered();
		if (event.key === "ArrowDown") {
			event.preventDefault();
			if (list.length === 0) return;
			setSelected((prev) => Math.min(prev+1, list.length-1));
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			if (list.length === 0) return;
			setSelected((prev) => Math.max(prev-1, 0));
		} else if (event.key === "Enter") {
			event.preventDefault();
			let current=list[selected()];
			if (current) execute(current);
		} else if (event.key === "Escape") {
			event.preventDefault();
			close();
		}
	};
	let handleQueryInput=(event: InputEvent) => {
		let target=event.target as HTMLInputElement;
		setQuery(target.value);
		setSelected(0);
	};
	let setInputRef=(el: HTMLInputElement) => {
		inputEl=el;
	};
	let setListRef=(el: HTMLDivElement) => {
		listEl=el;
	};
	createEffect(() => {
		if (!local.open) return;
		reset();
		queueMicrotask(() => {
			if (inputEl) inputEl.focus();
		});
	});
	createEffect(() => {
		filtered();
		clampSelected();
	});
	createEffect(() => {
		let idx=selected();
		let list=listEl;
		if (!list) return;
		let child=list.children[idx] as HTMLElement | undefined;
		if (child && typeof child.scrollIntoView === "function") child.scrollIntoView({block: "nearest"});
	});
	return (
		<Show when={local.open}>
			<Portal mount={document.body}>
				<div class={styles.overlay} role="dialog" aria-modal="true" aria-label="Command palette" onClick={close}>
					<div class={`glass ${styles.panel}`} onClick={(event) => event.stopPropagation()}>
						<div class={styles.search}>
							<svg class={styles.searchIcon} viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
								<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
								<path d="M14 14l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
							</svg>
							<input
								ref={setInputRef}
								type="text"
								class={styles.input}
								placeholder="Type a command or search..."
								aria-label="Search commands"
								aria-autocomplete="list"
								aria-controls="command-palette-list"
								value={query()}
								onInput={handleQueryInput}
								onKeyDown={handleInputKeyDown}
							/>
							<kbd class={styles.escHint} aria-hidden="true">Esc</kbd>
						</div>
						<div ref={setListRef} id="command-palette-list" class={styles.list} role="listbox" aria-label="Commands">
							<Show when={filtered().length>0} fallback={
							<div class={styles.empty}>
								<svg class={styles.emptyIcon} viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
									<circle cx="11" cy="11" r="7" />
									<path d="M21 21l-4.3-4.3" stroke-linecap="round" />
								</svg>
								<span>No matching commands.</span>
							</div>
						}>
								<For each={groups()}>{([section, items]) => (
									<div class={styles.section} role="group" aria-label={section}>
										<div class={styles.sectionLabel} aria-hidden="true">{section}</div>
										<For each={items}>{(command) => {
											let isSelected=() => flatIndexFor(command) === selected();
											return (
												<button
													type="button"
													role="option"
													aria-selected={isSelected()}
													data-command-id={command.id}
													class={`${styles.item} ${isSelected() ? styles.itemSelected : ""}`}
													onMouseEnter={() => setSelected(flatIndexFor(command))}
													onClick={() => execute(command)}
												>
													<Show when={command.icon}>
														<span class={styles.itemIcon}>{command.icon}</span>
													</Show>
													<span class={styles.itemLabel}>{command.label}</span>
												</button>
											);
										}}</For>
									</div>
								)}</For>
							</Show>
						</div>
						<div class={styles.hint}>
							<span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
							<span><kbd>Enter</kbd> to run · <kbd>Esc</kbd> to close</span>
						</div>
					</div>
				</div>
			</Portal>
		</Show>
	);
}
