/**
 * Reference-matching application shell.
 *
 * Renders the animated liquid background (`#wave-container > .liquid-bg`),
 * the `.app-container` with its `.app-content` body (into which the
 * control toolbar and main content are composed via children) and the
 * `.app-footer`. This replaces the previous sidebar/bottom-nav shell so
 * the app becomes one practice surface per the reference design.
 */
import type {ReactNode} from 'react';
/** Application version surfaced in the footer (mirrors package.json). */
const APP_VERSION = '0.1.0';
export interface AppShellProps {
	/** Practice surface composed inside `.app-content`. */
	children?: ReactNode;
}
/**
 * Application shell layout.
 *
 * The wave container is marked `aria-hidden` because it is purely
 * decorative; the liquid animation is disabled automatically when the
 * user prefers reduced motion (handled in `globals.css`).
 */
export function AppShell({children}: AppShellProps) {
	return (
		<>
			<div id="wave-container" aria-hidden="true">
				<div className="liquid-bg" />
			</div>
			<div className="app-container">
				<div className="app-content">{children}</div>
				<footer className="app-footer">
					<div className="footer-content">
						<span className="footer-text">RandPhyQuGeA v{APP_VERSION}</span>
						<span className="footer-text">© 2026 Richard&apos;s Blogs</span>
					</div>
				</footer>
			</div>
		</>
	);
}
