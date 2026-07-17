import type {JSX, ParentProps} from "solid-js";
import {ErrorBoundary, Show, createSignal} from "solid-js";
import styles from "./ErrorBoundary.module.css";
type FallbackRender = (error: Error, retry: () => void) => JSX.Element;
type ErrorBoundaryRetryProps = {
    fallback?: FallbackRender;
    maxRetries?: number;
};
interface DefaultErrorFallbackProps {
    error: Error;
    retryCount: () => number;
    maxRetries: number;
    onRetry: () => void;
}
function DefaultErrorFallback(props: DefaultErrorFallbackProps): JSX.Element {
    return (
        <div class={styles.fallback} role="alert">
            <p class={styles.message}>Something went wrong: {props.error.message}</p>
            <Show when={props.retryCount() < props.maxRetries} fallback={<p class={styles.exhausted}>Maximum retries reached. Please reload the page.</p>}>
                <button class={styles.retry} onClick={props.onRetry} type="button">
                    Try again
                </button>
            </Show>
        </div>
    );
}
function ErrorBoundaryRetry(props: ParentProps<ErrorBoundaryRetryProps>): JSX.Element {
    let maxRetries = props.maxRetries ?? 3;
    let [retryCount, setRetryCount] = createSignal(0);
    function handleRetry(reset: () => void): void {
        setRetryCount(retryCount() + 1);
        reset();
    }
    let fallbackRender: FallbackRender = (err, reset) => {
        if (props.fallback) {
            return props.fallback(err, () => handleRetry(reset));
        }
        return <DefaultErrorFallback error={err} retryCount={retryCount} maxRetries={maxRetries} onRetry={() => handleRetry(reset)} />;
    };
    return <ErrorBoundary fallback={fallbackRender}>{props.children}</ErrorBoundary>;
}
export {ErrorBoundaryRetry};
export type {FallbackRender, ErrorBoundaryRetryProps};
