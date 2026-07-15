import {createSignal, onCleanup, onMount} from "solid-js";
import type {Accessor} from "solid-js";
import {A11yChecker} from "../../lib/a11y/A11yChecker";
import type {A11yIssue} from "../../lib/a11y/A11yChecker";
export interface CreateA11yInspectorOptions {
	/** Checker instance; defaults to a new A11yChecker. */
	checker?: A11yChecker;
	/** Root node to scan; defaults to document. */
	root?: () => ParentNode;
	/** Whether the overlay is initially open; defaults to false. */
	initiallyOpen?: boolean;
}
export interface CreateA11yInspectorReturn {
	/** Reactive list of accessibility issues found in the last scan. */
	issues: Accessor<A11yIssue[]>;
	/** Reactive count of error-severity issues. */
	errorCount: Accessor<number>;
	/** Reactive count of warning-severity issues. */
	warningCount: Accessor<number>;
	/** Reactive true when the overlay is visible. */
	isOpen: Accessor<boolean>;
	/** Toggle the overlay visibility. */
	toggle: () => void;
	/** Set the overlay visibility. */
	setOpen: (value: boolean) => void;
	/** Re-run the a11y scan immediately. */
	refresh: () => void;
	/** The underlying checker instance. */
	checker: A11yChecker;
}
/**
 * Dev-only accessibility inspector. Runs an {@link A11yChecker} scan against
 * the document (or a custom root) and exposes the results as reactive signals.
 * The overlay visibility is a toggleable signal so a dev-only button can show
 * or hide the panel. The scan runs once on mount and again on `refresh()`.
 */
export function createA11yInspector(options: CreateA11yInspectorOptions = {}): CreateA11yInspectorReturn {
	let checker=options.checker ?? new A11yChecker();
	let getRoot=options.root ?? (() => document);
	let [issues, setIssues]=createSignal<A11yIssue[]>([]);
	let [isOpen, setOpen]=createSignal<boolean>(options.initiallyOpen ?? false);
	let refresh=() => {
		try {
			setIssues(checker.check(getRoot()));
		} catch {
			setIssues([]);
		}
	};
	onMount(() => {
		refresh();
	});
	let errorCount=() => issues().filter(i => i.severity==="error").length;
	let warningCount=() => issues().filter(i => i.severity==="warning").length;
	let toggle=() => setOpen(!isOpen());
	return {issues, errorCount, warningCount, isOpen, toggle, setOpen, refresh, checker};
}
