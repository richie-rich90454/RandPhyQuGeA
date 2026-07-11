import type {JSX} from "solid-js";
import {For} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {useUiStore} from "../../stores/uiStore";
import styles from "./ShortcutsModal.module.css";
/** A single keyboard shortcut entry with action, key combo, and description. */
interface Shortcut {
	/** Short name of the action. */
	action: string;
	/** Key combination shown in the shortcut column. */
	shortcut: string;
	/** Detailed description of what the shortcut does. */
	description: string;
}
/** A named group of shortcuts for the reference modal. */
interface ShortcutGroup {
	/** Group heading. */
	title: string;
	/** Shortcuts belonging to the group. */
	shortcuts: Shortcut[];
}
/** Shortcut groups displayed in the shortcuts reference modal. */
const GROUPS: ShortcutGroup[]=[
	{
		title: "Practice",
		shortcuts: [
			{action: "Generate question", shortcut: "Ctrl+G", description: "Create a new random question with current settings."},
			{action: "Check answer", shortcut: "Shift+Enter", description: "Evaluate your answer and show feedback."},
			{action: "Submit / Next", shortcut: "Enter", description: "Submit answer or advance to the next question."},
			{action: "Select MCQ option", shortcut: "1 — 4", description: "Choose a multiple-choice option by number."},
			{action: "Navigate MCQ", shortcut: "Arrow keys", description: "Move between multiple-choice options."},
		],
	},
	{
		title: "Modes",
		shortcuts: [
			{action: "Single mode", shortcut: "Ctrl+1", description: "Switch to single-question practice mode."},
			{action: "Mental mode", shortcut: "Ctrl+2", description: "Switch to mental math timed practice."},
		],
	},
	{
		title: "App",
		shortcuts: [
			{action: "Open settings", shortcut: "Ctrl+,", description: "Open the settings modal."},
			{action: "Toggle theme", shortcut: "Ctrl+Shift+T", description: "Cycle through light, dark, dim, and system themes."},
			{action: "Close dialog", shortcut: "Escape", description: "Close the current modal or dialog."},
		],
	},
];
function KeyboardIcon(): JSX.Element {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect x="2" y="6" width="20" height="12" rx="2" />
			<path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h0M18 14h0M8 14h8" />
		</svg>
	);
}
/** Navigate between rows within a group using arrow keys. */
function handleRowKeyDown(event: KeyboardEvent): void {
	let current=event.currentTarget as HTMLElement;
	if (event.key==="ArrowDown") {
		event.preventDefault();
		let next=current.nextElementSibling as HTMLElement | null;
		next?.focus();
	} else if (event.key==="ArrowUp") {
		event.preventDefault();
		let prev=current.previousElementSibling as HTMLElement | null;
		prev?.focus();
	}
}
/**
 * Keyboard shortcuts reference overlay mapped to `#shortcuts-modal`.
 *
 * Solid port of {@link ../../../components/modals/ShortcutsModal}. Renders
 * grouped tables of every global shortcut with three columns (Action,
 * Shortcut, Description) and `<kbd>` key caps. Rows are keyboard-focusable
 * and navigable with Up/Down arrow keys. Opened from the utility toolbar;
 * dismissed via the close button, Escape, or backdrop click.
 */
export function ShortcutsModal(): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal==="shortcuts");
	let close=() => useUiStore.getState().closeModal();
	return (
		<Modal
			open={isOpen()}
			onClose={close}
			modalId="shortcuts-modal"
			title="Keyboard Shortcuts"
			titleId="shortcuts-title"
			ariaLabel="Keyboard shortcuts"
			class={styles.shortcuts}
			footer={<Button variant="primary" size="md" onClick={close}>Got it</Button>}
		>
			<div class={styles.intro}>
				<span class={styles.introIcon}><KeyboardIcon /></span>
				<p class={styles.introText}>Use these shortcuts to stay in flow while practicing. Navigate rows with arrow keys.</p>
			</div>
			<div class={styles.groups}>
				<For each={GROUPS}>{(group) => (
					<Card variant="filled" class={styles.groupCard}>
						<CardHeader>
							<CardTitle>{group.title}</CardTitle>
						</CardHeader>
						<CardContent class={styles.groupContent}>
							<table class={styles.table}>
								<thead>
									<tr>
										<th scope="col" class={styles.actionHeader}>Action</th>
										<th scope="col" class={styles.shortcutHeader}>Shortcut</th>
										<th scope="col" class={styles.descriptionHeader}>Description</th>
									</tr>
								</thead>
								<tbody>
									<For each={group.shortcuts}>{(shortcut) => (
										<tr tabindex="0" onKeyDown={handleRowKeyDown} class={styles.row}>
											<td class={styles.action}>{shortcut.action}</td>
											<td class={styles.shortcut}><kbd>{shortcut.shortcut}</kbd></td>
											<td class={styles.description}>{shortcut.description}</td>
										</tr>
									)}</For>
								</tbody>
							</table>
						</CardContent>
					</Card>
				)}</For>
			</div>
		</Modal>
	);
}
