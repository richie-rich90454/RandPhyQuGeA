import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {ErrorBoundaryRetry} from "./components/ErrorBoundary";
import {ToastProvider} from "./components/ui/ToastProvider";
import {CommandPalette} from "./components/CommandPalette";
import styles from "./App.module.css";
function App(): JSX.Element {
	let [paletteOpen, setPaletteOpen]=createSignal(false);
	return (
		<ErrorBoundaryRetry>
			<ToastProvider>
				<CommandPalette open={paletteOpen()} onOpenChange={setPaletteOpen} />
				<div class={styles.shell}>
					<main class={styles.card}>
						<h1 class={styles.title}>RandPhyQuGeA</h1>
						<p class={styles.status}>SolidJS migration in progress</p>
						<p class={styles.note}>The React application continues to run at the root entry. This Solid preview is available at /src/solid/index.html during development. Phase 0 scaffolding is underway.</p>
						<p class={styles.note}>Press <kbd>Ctrl+K</kbd> to open the command palette.</p>
					</main>
				</div>
			</ToastProvider>
		</ErrorBoundaryRetry>
	);
}
export default App;
