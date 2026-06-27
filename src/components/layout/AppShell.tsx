/**
 * Reference-matching application shell.
 *
 * Renders the animated liquid background (`#wave-container > .liquid-bg`),
 * the `.app-container` with its `.app-content` body (into which the
 * control toolbar and main content are composed via children) and the
 * `.app-footer`. This replaces the previous sidebar/bottom-nav shell so
 * the app becomes one practice surface per the reference design.
 */
import {Children} from 'react';
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
 * user prefers reduced motion (handled in `globals.css`). A skip-link is
 * rendered first so keyboard users can jump straight to `#main-content`.
 * The first child (the control toolbar) is wrapped in `<header>`/`<nav>`
 * so it is exposed as primary navigation, with a visually-hidden `<h1>`
 * before it; the remaining children (main content + modals) render as
 * siblings so the `<main>` landmark stays top-level.
 */
export function AppShell({children}: AppShellProps) {
	const childArray = Children.toArray(children);
	const toolbar = childArray[0];
	const rest = childArray.slice(1);
	return (
		<>
			<a href="#main-content" className="skip-link">
				Skip to main content
			</a>
			<div id="wave-container" aria-hidden="true">
				<div className="liquid-bg" />
			</div>
			<div className="app-container">
				<div className="app-content">
					<header>
						<h1 className="visually-hidden app-title">RandPhyQuGeA</h1>
						<nav aria-label="Primary">{toolbar}</nav>
					</header>
					{rest}
				</div>
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
