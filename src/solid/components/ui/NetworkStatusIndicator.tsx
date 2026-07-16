import type {JSX} from "solid-js";
import styles from "./NetworkStatusIndicator.module.css";
export interface NetworkStatusIndicatorProps {
	/** Reactive true when the effective connection is online. */
	online: () => boolean;
	/** Reactive true when the user has forced offline mode. */
	forcedOffline: () => boolean;
	/** Toggle the forced-offline override. */
	onToggle: () => void;
}
/**
 * Compact network-status indicator with an offline-testing toggle. Shows a
 * green "Online" pill when connected, an amber "Offline" pill when the
 * browser is disconnected, and an amber "Forced offline" pill when the user
 * has simulated disconnection. The toggle button lets testers flip the
 * forced-offline state. Status changes are announced via an aria-live region.
 */
export function NetworkStatusIndicator(props: NetworkStatusIndicatorProps): JSX.Element {
	let statusText = () => {
		if (props.forcedOffline()) return "Forced offline";
		if (props.online()) return "Online";
		return "Offline";
	};
	let isOnline = () => props.online() && !props.forcedOffline();
	return (
		<div class={styles.root} data-online={isOnline() ? "true" : "false"}>
			<span class={`${styles.pill} ${isOnline() ? styles.online : styles.offline}`} aria-live="polite" aria-atomic="true">
				<span class={styles.dot} aria-hidden="true" />
				{statusText()}
			</span>
			<button
				type="button"
				class={styles.toggle}
				onClick={() => props.onToggle()}
				aria-pressed={props.forcedOffline()}
				title={props.forcedOffline() ? "Stop simulating offline" : "Simulate offline"}
			>
				{props.forcedOffline() ? <span>Restore online</span> : <span>Simulate offline</span>}
			</button>
		</div>
	);
}
