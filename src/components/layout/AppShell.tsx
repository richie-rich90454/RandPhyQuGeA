import {Children} from "react";
import type {ReactNode} from "react";
import pkg from "../../../package.json";
import {AppTopBar} from "./AppTopBar";
export interface AppShellProps {
	/** Practice surface composed inside the main landmark. */
	children?: ReactNode;
}
/**
 * Application shell layout.
 *
 * Renders a skip-link, a subtle fixed mesh/gradient background, a clean
 * top navigation bar with the app wordmark and global actions, the control
 * toolbar, a `<main id="main-content">` landmark, and a compact footer.
 * The first child passed to the shell is treated as the control toolbar; the
 * remaining children render inside the main landmark.
 */
export function AppShell({children}: AppShellProps) {
	const childArray=Children.toArray(children);
	const toolbar=childArray[0];
	const rest=childArray.slice(1);
	return (
		<>
			<a href="#main-content" className="skip-link">
				Skip to main content
			</a>
			<div className="app-background" aria-hidden="true">
				<div className="app-background-gradient" />
				<div className="app-background-mesh" />
			</div>
			<div className="app-container">
				<AppTopBar />
				<div className="app-content">
					{toolbar}
					<main id="main-content" className="app-main" tabIndex={-1} aria-label="Main content">
						{rest}
					</main>
				</div>
				<footer className="app-footer">
					<span className="footer-text">RandPhyQuGeA v{pkg.version}</span>
					<span className="footer-dot" aria-hidden="true">·</span>
					<span className="footer-text">© 2026 Richard&apos;s Blogs</span>
				</footer>
			</div>
		</>
	);
}