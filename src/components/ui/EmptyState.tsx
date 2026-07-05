import {type ReactNode} from "react";
import {cn} from "../../lib/utils";
export interface EmptyStateProps {
	/** Decorative illustration (primary slot). */
	illustration?: ReactNode;
	/** @deprecated Use `illustration` instead. */
	icon?: ReactNode;
	/** Primary message text. */
	title: string;
	/** Secondary explanatory text. */
	description?: string;
	/** Optional call-to-action node. */
	action?: ReactNode;
	className?: string;
}
/** Empty-state placeholder mapped to the reference `.empty-state` class. */
export function EmptyState({illustration, icon, title, description, action, className}: EmptyStateProps) {
	const media=illustration ?? icon;
	return (
		<div className={cn("empty-state flex flex-col items-center justify-center gap-3 p-4 text-center", className)}>
			{media && <span aria-hidden="true" className="inline-flex text-text-muted">{media}</span>}
			<h3 className="text-h3 text-text-primary">{title}</h3>
			{description && <p className="text-body text-text-secondary max-w-[260px]">{description}</p>}
			{action}
		</div>
	);
}
