import type {JSX} from "solid-js";
import {For} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {useUiStore} from "../../stores/uiStore";
import styles from "./ShortcutsModal.module.css";
/** A single keyboard shortcut entry. */
interface Shortcut {
	/** Key combination shown in the first column. */
	keys: string;
	/** Human-readable action description. */
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
			{keys: "Ctrl+G", description: "Generate a new question"},
			{keys: "Shift+Enter", description: "Check your answer"},
			{keys: "Enter", description: "Submit answer or advance to the next question"},
			{keys: "1 — 4", description: "Select a multiple-choice option"},
			{keys: "Arrow keys", description: "Navigate multiple-choice options"},
		],
	},
	{
		title: "Modes",
		shortcuts: [
			{keys: "Ctrl+1", description: "Switch to Single mode"},
			{keys: "Ctrl+2", description: "Switch to Mental mode"},
		],
	},
	{
		title: "App",
		shortcuts: [
			{keys: "Ctrl+,", description: "Open Settings"},
			{keys: "Ctrl+Shift+T", description: "Toggle light/dark theme"},
			{keys: "Escape", description: "Close the current dialog"},
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
/**
 * Keyboard shortcuts reference overlay mapped to `#shortcuts-modal`.
 *
 * Solid port of {@link ../../../components/modals/ShortcutsModal}. Renders
 * grouped tables of every global shortcut with `<kbd>` key caps. Opened from
 * the utility toolbar; dismissed via the close button, Escape, or backdrop
 * click.
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
				<p class={styles.introText}>Use these shortcuts to stay in flow while practicing.</p>
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
										<th scope="col" class={styles.keyHeader}>Keys</th>
										<th scope="col" class={styles.actionHeader}>Action</th>
									</tr>
								</thead>
								<tbody>
									<For each={group.shortcuts}>{(shortcut) => (
										<tr>
											<td class={styles.keys}><kbd>{shortcut.keys}</kbd></td>
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
