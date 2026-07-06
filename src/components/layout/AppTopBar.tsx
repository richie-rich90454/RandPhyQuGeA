import {Atom} from "@phosphor-icons/react";
import {UtilityButtons} from "../practice/UtilityButtons";
/**
 * Clean top navigation bar for the application shell.
 *
 * Renders the app wordmark on the left and the global utility actions on the
 * right. The bar is a single line on desktop and stays within the 64-72px
 * height range to keep the interface feeling focused and app-like.
 */
export function AppTopBar() {
	return (
		<header className="app-top-bar">
			<div className="app-top-bar-inner">
				<a href="/" className="app-wordmark" aria-label="RandPhyQuGeA home">
					<Atom weight="fill" className="app-wordmark-icon" aria-hidden="true" />
					<span className="app-wordmark-text">RandPhyQuGeA</span>
				</a>
				<nav className="app-top-actions" aria-label="Primary actions">
					<UtilityButtons />
				</nav>
			</div>
		</header>
	);
}