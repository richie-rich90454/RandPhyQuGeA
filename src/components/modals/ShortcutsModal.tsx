import {Modal} from '../ui';
import {useUiStore} from '../../stores/uiStore';
/** Keyboard shortcut bindings displayed in the shortcuts modal. */
const SHORTCUTS: {keys: string; description: string}[] = [
	{keys: 'Ctrl+G', description: 'Generate new question'},
	{keys: 'Shift+Enter', description: 'Check answer'},
	{keys: 'Ctrl+1', description: 'Switch to Single mode'},
	{keys: 'Ctrl+2', description: 'Switch to Mental mode'},
	{keys: 'Ctrl+,', description: 'Open settings'},
	{keys: 'Ctrl+Shift+T', description: 'Toggle theme'}
];
/**
 * Keyboard shortcuts reference overlay mapped to `#shortcuts-modal`.
 *
 * Renders a two-column table of every global shortcut (generate, check,
 * mode switching, settings, theme toggle) with `<kbd>` key caps. Opened
 * from the utility toolbar; dismissed via the "Got it" button, Escape,
 * or backdrop click.
 */
export function ShortcutsModal() {
	const isOpen = useUiStore(state => state.activeModal === 'shortcuts');
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
				<button type="button" className="primary-button" onClick={closeModal}>
					Got it
				</button>
			}
		>
			<table className="shortcuts-table">
				<thead>
					<tr>
						<th scope="col">Keys</th>
						<th scope="col">Action</th>
					</tr>
				</thead>
				<tbody>
					{SHORTCUTS.map(shortcut => (
						<tr key={shortcut.keys}>
							<td>
								<kbd>{shortcut.keys}</kbd>
							</td>
							<td>{shortcut.description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</Modal>
	);
}
