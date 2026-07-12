import type {JSX} from "solid-js";
import {createSignal, Switch, Match} from "solid-js";
import {ErrorBoundaryRetry} from "./components/ErrorBoundary";
import {ToastProvider} from "./components/ui/ToastProvider";
import {CommandPalette} from "./components/CommandPalette";
import {createHashRouter} from "./primitives/createHashRouter";
import {Playground} from "./pages/Playground";
import {SpecEditor} from "./pages/SpecEditor";
import {Wizard} from "./pages/Wizard";
import {DxDashboard} from "./pages/DxDashboard";
import styles from "./App.module.css";
function App(): JSX.Element {
	let [paletteOpen, setPaletteOpen]=createSignal(false);
	let router=createHashRouter();
	return (
		<ErrorBoundaryRetry>
			<ToastProvider>
				<CommandPalette open={paletteOpen()} onOpenChange={setPaletteOpen} />
				<Switch>
					<Match when={router.route() === "/playground"}>
						<Playground />
					</Match>
					<Match when={router.route() === "/spec-editor"}>
						<SpecEditor />
					</Match>
					<Match when={router.route() === "/wizard"}>
						<Wizard />
					</Match>
					<Match when={router.route() === "/dx"}>
						<DxDashboard />
					</Match>
					<Match when={true}>
						<div class={styles.shell}>
							<main class={styles.card}>
								<h1 class={styles.title}>RandPhyQuGeA</h1>
								<p class={styles.status}>SolidJS migration in progress</p>
								<p class={styles.note}>The React application continues to run at the root entry. This Solid preview is available at /src/solid/index.html during development. Phase 0 scaffolding is underway.</p>
								<p class={styles.note}>Press <kbd>Ctrl+K</kbd> to open the command palette.</p>
							</main>
						</div>
					</Match>
				</Switch>
			</ToastProvider>
		</ErrorBoundaryRetry>
	);
}
export default App;
