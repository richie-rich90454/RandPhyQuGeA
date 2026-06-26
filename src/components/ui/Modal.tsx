import {useEffect, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {cn} from '../../lib/utils';
export interface ModalProps {
	/** When true the `.show` class is applied, revealing the dialog. */
	open: boolean;
	/** Called when the user requests dismissal (Escape/backdrop/close button). */
	onClose: () => void;
	/** Dialog title rendered in the header. */
	title?: string;
	/** Labelled-by id override for the title heading. */
	titleId?: string;
	/** Id applied to the outer `.modal` element (matches reference selectors). */
	modalId?: string;
	/** Modal body content. */
	children?: ReactNode;
	/** Optional footer actions. */
	footer?: ReactNode;
	/** Extra classes appended to `.modal-content`. */
	className?: string;
	/** Accessible name when no title is supplied. */
	ariaLabel?: string;
}
/**
 * Modal dialog mapped to reference classes.
 *
 * Renders into a portal as `.modal` with the `.show` class toggled by `open`.
 * The structure `.modal-content > (.modal-header, .modal-body, .modal-footer)`
 * matches the reference so all glass styling applies. Escape and backdrop
 * clicks call `onClose`. The optional `modalId` is set on the outer `.modal`
 * element so reference id-scoped CSS selectors (e.g. `#shortcuts-modal table`)
 * apply without extra wrapper elements.
 */
export function Modal({open, onClose, title, titleId, modalId, children, footer, className, ariaLabel}: ModalProps) {
	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, onClose]);
	if (!open) {
		return null;
	}
	const labelledBy = title ? (titleId ?? 'modal-title') : undefined;
	return createPortal(
		<div id={modalId} className={cn('modal', 'show')} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-label={ariaLabel} onClick={onClose}>
			<div className={cn('modal-content', className)} onClick={event => event.stopPropagation()}>
				<div className="modal-header">
					{title && (
						<h2 id={labelledBy ?? undefined} className="modal-title">
							{title}
						</h2>
					)}
					<button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="modal-body">{children}</div>
				{footer && <div className="modal-footer">{footer}</div>}
			</div>
		</div>,
		document.body
	);
}
