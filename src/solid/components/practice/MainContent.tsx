import type {JSX, JSXElement} from "solid-js";
import styles from "./MainContent.module.css";
export interface MainContentProps {
	/** Practice surface composed into the content stack (question card + answer section). */
	children?: JSXElement;
	/** Analytics/progress panel rendered below the practice surface. */
	analytics?: JSXElement;
	/** Extra class for the main content wrapper. */
	class?: string;
}
/**
 * Main content area mapped to `.main-content`.
 *
 * Solid port of {@link ../../../components/practice/MainContent}. Composes the
 * practice surface (question card + answer section, supplied via the
 * `children` slot) and the analytics/progress panel (supplied via the
 * `analytics` slot). The surrounding `<main id="main-content">` landmark is
 * rendered by `AppShell`, so this component only provides the practice surface
 * layout. The React `ScrollReveal` animation is replaced by CSS; the concrete
 * sub-components are supplied by the caller so this shell stays decoupled
 * (mirrors the AppShell/ControlToolbarTop slot pattern).
 */
export function MainContent(props: MainContentProps): JSX.Element {
	return (
		<div class={`${styles.mainContent} ${props.class ?? ""}`}>
			<div class={styles.contentStack}>
				{props.children}
			</div>
			{props.analytics}
		</div>
	);
}
