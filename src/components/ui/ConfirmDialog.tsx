import {Modal} from './Modal';
/** Props for the {@link ConfirmDialog} component. */
export interface ConfirmDialogProps {
	/** When true the dialog is visible. */
	open: boolean;
	/** Title rendered in the modal header. */
	title: string;
	/** Body message explaining the action the user is about to confirm. */
	message: string;
	/** Label for the confirm button. Defaults to "Confirm". */
	confirmLabel?: string;
	/** Label for the cancel button. Defaults to "Cancel". */
	cancelLabel?: string;
	/** When true the confirm button uses destructive (danger) styling. */
	destructive?: boolean;
	/** Called when the user confirms the action. */
	onConfirm: () => void;
	/** Called when the user cancels or dismisses the dialog. */
	onCancel: () => void;
}
/**
 * Controlled confirmation dialog built on top of {@link Modal}.
 *
 * Renders a title, a message, and Cancel/Confirm buttons in the modal
 * footer. When `destructive` is true the confirm button is styled as a
 * danger action. All focus trap, scroll lock, Escape-to-close, and
 * return-focus behaviour is inherited from the underlying Modal so
 * callers do not need to re-implement it. The modal close button and
 * Escape key both route through `onCancel`.
 */
export function ConfirmDialog({open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, onConfirm, onCancel}: ConfirmDialogProps) {
	return (
		<Modal
			open={open}
			onClose={onCancel}
			title={title}
			ariaLabel={title}
			footer={
				<>
					<button type="button" className="secondary-button confirm-cancel" onClick={onCancel}>
						{cancelLabel}
					</button>
					<button type="button" className={`primary-button confirm-button ${destructive ? 'destructive' : ''}`} onClick={onConfirm}>
						{confirmLabel}
					</button>
				</>
			}
		>
			<p className="confirm-message">{message}</p>
		</Modal>
	);
}
