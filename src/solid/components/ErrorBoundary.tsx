import type {JSX, ParentProps} from "solid-js";
import {ErrorBoundary, Show, createSignal} from "solid-js";
import styles from "./ErrorBoundary.module.css";
type FallbackRender = (error: Error, retry: () => void) => JSX.Element;
type ErrorBoundaryRetryProps = {
	fallback?: FallbackRender;
	maxRetries?: number;
};
function ErrorBoundaryRetry(props: ParentProps<ErrorBoundaryRetryProps>): JSX.Element {
	let maxRetries = props.maxRetries ?? 3;
	let [retryCount, setRetryCount] = createSignal(0);
	function handleRetry(reset: () => void): void {
		setRetryCount(retryCount() + 1);
		reset();
	}
	return (
		<ErrorBoundary
			fallback={(err, reset) => {
				if (props.fallback) {
					return props.fallback(err, () => handleRetry(reset));
				}
				return (
					<div class={styles.fallback} role="alert">
						<p class={styles.message}>Something went wrong: {err.message}</p>
						<Show when={retryCount() < maxRetries} fallback={<p class={styles.exhausted}>Maximum retries reached. Please reload the page.</p>}>
							<button class={styles.retry} onClick={() => handleRetry(reset)} type="button">
								Try again
							</button>
						</Show>
					</div>
				);
			}}
		>
			{props.children}
		</ErrorBoundary>
	);
}
export {ErrorBoundaryRetry};
export type {FallbackRender, ErrorBoundaryRetryProps};
