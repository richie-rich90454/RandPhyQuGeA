import type {JSX} from "solid-js";
import {Modal} from "./Modal";
import {Button} from "./Button";
import type {ButtonVariant} from "./Button";
import styles from "./ConfirmDialog.module.css";
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
/** Controlled confirmation dialog built on top of Modal. */
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element {
	let confirmVariant: ButtonVariant=props.destructive ? "danger" : "primary";
	return (
		<Modal
			open={props.open}
			onClose={props.onCancel}
			title={props.title}
			ariaLabel={props.title}
			footer={
				<>
					<Button variant="secondary" onClick={props.onCancel}>{props.cancelLabel ?? "Cancel"}</Button>
					<Button variant={confirmVariant} onClick={props.onConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
				</>
			}
		>
			<p class={styles.message}>{props.message}</p>
		</Modal>
	);
}
