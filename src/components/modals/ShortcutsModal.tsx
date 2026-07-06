import {Keyboard} from "@phosphor-icons/react";
import {Modal, Button, Card, CardContent, CardHeader, CardTitle} from "../ui";
import {useUiStore} from "../../stores/uiStore";
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
const GROUPS: ShortcutGroup[] = [
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
/**
 * Keyboard shortcuts reference overlay mapped to `#shortcuts-modal`.
 *
 * Renders grouped tables of every global shortcut with `<kbd>` key caps.
 * Opened from the utility toolbar; dismissed via the close button, Escape,
 * or backdrop click.
 */
export function ShortcutsModal() {
	const isOpen = useUiStore(state => state.activeModal === "shortcuts");
	const closeModal = useUiStore(state => state.closeModal);
	return (
		<Modal
			open={isOpen}
			onClose={closeModal}
			modalId="shortcuts-modal"
			title="Keyboard Shortcuts"
			titleId="shortcuts-title"
			ariaLabel="Keyboard shortcuts"
			footer={
				<Button variant="primary" size="md" onClick={closeModal}>
					Got it
				</Button>
			}
		>
			<div className="shortcuts-intro">
				<Keyboard className="h-5 w-5 text-accent-600" aria-hidden="true" />
				<p className="shortcuts-intro-text">Use these shortcuts to stay in flow while practicing.</p>
			</div>
			<div className="shortcuts-groups">
				{GROUPS.map(group => (
					<Card key={group.title} variant="filled" className="shortcuts-group-card">
						<CardHeader className="shortcuts-group-header">
							<CardTitle className="shortcuts-group-title">{group.title}</CardTitle>
						</CardHeader>
						<CardContent className="shortcuts-group-content">
							<table className="shortcuts-table">
								<thead>
									<tr>
										<th scope="col" className="shortcuts-table-key-header">Keys</th>
										<th scope="col" className="shortcuts-table-action-header">Action</th>
									</tr>
								</thead>
								<tbody>
									{group.shortcuts.map(shortcut => (
										<tr key={`${group.title}-${shortcut.keys}`}>
											<td className="shortcuts-table-keys">
												<kbd>{shortcut.keys}</kbd>
											</td>
											<td className="shortcuts-table-description">{shortcut.description}</td>
										</tr>
									))}
									</tbody>
								</table>
							</CardContent>
						</Card>
					))}
				</div>
			</Modal>
	);
}
