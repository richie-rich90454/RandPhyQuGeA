import type {JSX} from "solid-js";
import {createSignal, createMemo, Show, For} from "solid-js";
import {Button, Card, CardHeader, CardTitle, CardSubtitle, CardContent, Badge, EmptyState, Spinner, NetworkStatusIndicator} from "../components/ui";
import {A11yInspectorOverlay} from "../components/dev/A11yInspectorOverlay";
import {createPerfBudget} from "../primitives/createPerfBudget";
import {createNetworkStatus} from "../primitives/createNetworkStatus";
import {createA11yInspector} from "../primitives/createA11yInspector";
import {PerfBudget} from "../../lib/perf/PerfBudget";
import {parseSpecification, generateQuestion, generateBatch, exportQuestions, loadDefaultSpec} from "../../services/physicsCore";
import styles from "./DxDashboard.module.css";
interface EnvInfo {
	userAgent: string;
	viewport: string;
	devicePixelRatio: number;
	hardwareConcurrency: number;
}
interface BenchmarkResult {
	operation: string;
	iterations: number;
	timeMs: number;
}
interface DxMetric {
	label: string;
	value: string;
}
const DX_METRICS: DxMetric[]=[
	{label: "Solid Routes", value: "4"},
	{label: "Question Types", value: "5"},
	{label: "UI Components", value: "18"},
	{label: "Coverage Target", value: "90%"},
];
function getEnvInfo(): EnvInfo {
	return {
		userAgent: navigator.userAgent,
		viewport: `${window.innerWidth}x${window.innerHeight}`,
		devicePixelRatio: window.devicePixelRatio,
		hardwareConcurrency: navigator.hardwareConcurrency,
	};
}
function formatMs(ms: number): string {
	if (ms<1) return `${ms.toFixed(2)} ms`;
	return `${ms.toFixed(1)} ms`;
}
export function DxDashboard(): JSX.Element {
	let [envInfo]=createSignal<EnvInfo>(getEnvInfo());
	let [results, setResults]=createSignal<BenchmarkResult[]>([]);
	let [running, setRunning]=createSignal(false);
	let [error, setError]=createSignal<string | null>(null);
	let perfBudget=createPerfBudget({observe: true});
	let network=createNetworkStatus({listen: true});
	let a11y=createA11yInspector({initiallyOpen: false});
	let maxTime=createMemo(() => {
		let rows=results();
		if (rows.length===0) return 0;
		let peak=0;
		for (let row of rows) {
			if (row.timeMs>peak) peak=row.timeMs;
		}
		return peak;
	});
	let handleRunBenchmark=async () => {
		setRunning(true);
		setError(null);
		setResults([]);
		try {
			let newResults: BenchmarkResult[]=[];
			let specText=await loadDefaultSpec();
			let start=performance.now();
			let spec=await parseSpecification(specText);
			newResults.push({operation: "Parse default spec", iterations: 1, timeMs: performance.now()-start});
			start=performance.now();
			await generateQuestion(spec);
			newResults.push({operation: "Generate 1 question", iterations: 1, timeMs: performance.now()-start});
			start=performance.now();
			await generateBatch(spec, 10);
			newResults.push({operation: "Generate batch (10)", iterations: 10, timeMs: performance.now()-start});
			start=performance.now();
			let qs100=await generateBatch(spec, 100);
			newResults.push({operation: "Generate batch (100)", iterations: 100, timeMs: performance.now()-start});
			start=performance.now();
			await exportQuestions(qs100, "json");
			newResults.push({operation: "Export 100 questions (JSON)", iterations: 100, timeMs: performance.now()-start});
			setResults(newResults);
		} catch (err: unknown) {
			let message=err instanceof Error ? err.message : String(err);
			setError(message);
		} finally {
			setRunning(false);
		}
	};
	let handleBack=() => {
		window.location.hash="";
	};
	return (
		<div class={styles.root}>
			<header class={styles.header}>
				<button type="button" class={styles.backLink} onClick={handleBack} aria-label="Back to app">
					<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
						<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					Back to app
				</button>
				<h1 class={styles.title}>DX Dashboard</h1>
				<p class={styles.subtitle}>Coverage targets, environment info, and live performance benchmarks for the physics core.</p>
				<div class={styles.statusRow}>
				<NetworkStatusIndicator
					online={network.online}
					forcedOffline={network.forcedOffline}
					onToggle={network.toggleForcedOffline}
				/>
				<button
					type="button"
					class={styles.a11yToggle}
					onClick={() => a11y.toggle()}
					aria-pressed={a11y.isOpen()}
				>
					A11y Inspector ({a11y.errorCount()})
				</button>
			</div>
		</header>
			<div class={styles.grid}>
				<Card class={styles.card} padding="md">
					<CardHeader>
						<CardTitle>Environment</CardTitle>
						<CardSubtitle>Runtime context for this session.</CardSubtitle>
					</CardHeader>
					<CardContent>
						<dl class={styles.envList}>
							<div class={styles.envRow}>
								<dt class={styles.envLabel}>User Agent</dt>
								<dd class={styles.envValue}>{envInfo().userAgent}</dd>
							</div>
							<div class={styles.envRow}>
								<dt class={styles.envLabel}>Viewport</dt>
								<dd class={styles.envValue}>{envInfo().viewport}</dd>
							</div>
							<div class={styles.envRow}>
								<dt class={styles.envLabel}>Device Pixel Ratio</dt>
								<dd class={styles.envValue}>{envInfo().devicePixelRatio}</dd>
							</div>
							<div class={styles.envRow}>
								<dt class={styles.envLabel}>Hardware Concurrency</dt>
								<dd class={styles.envValue}>{envInfo().hardwareConcurrency}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
				<Card class={styles.card} padding="md">
					<CardHeader>
						<CardTitle>DX Metrics</CardTitle>
						<CardSubtitle>Reference values for the SolidJS surface.</CardSubtitle>
					</CardHeader>
					<CardContent>
						<div class={styles.metricsGrid}>
							<For each={DX_METRICS}>{(metric) => (
								<div class={styles.metricCell}>
									<span class={styles.metricValue}>{metric.value}</span>
									<span class={styles.metricLabel}>{metric.label}</span>
								</div>
							)}</For>
						</div>
					</CardContent>
				</Card>
				<Card class={styles.card} padding="md">
					<CardHeader>
						<CardTitle>Performance Benchmark</CardTitle>
						<CardSubtitle>Times the core pipeline against the bundled default spec.</CardSubtitle>
					</CardHeader>
					<CardContent>
						<div class={styles.benchActions}>
							<Button variant="primary" size="sm" onClick={handleRunBenchmark} loading={running()} disabled={running()}>Run benchmark</Button>
							<Show when={running()}>
								<div class={styles.benchStatus}>
									<Spinner size="sm" />
									<span>Running…</span>
								</div>
							</Show>
						</div>
						<Show when={error()}>
							<div class={styles.errorBlock}>
								<Badge variant="error">Error</Badge>
								<pre class={styles.errorText}>{error()}</pre>
							</div>
						</Show>
						<Show
							when={results().length>0}
							fallback={
								<Show when={!running()}>
									<EmptyState title="No results yet" description="Click Run benchmark to measure parse, generation, and export timings." />
								</Show>
							}
						>
							<table class={styles.benchTable}>
								<thead>
									<tr>
										<th scope="col">Operation</th>
										<th scope="col">Iterations</th>
										<th scope="col">Time</th>
									</tr>
								</thead>
								<tbody>
									<For each={results()}>{(result) => {
										let pct=maxTime()>0 ? Math.max(4, Math.round((result.timeMs/maxTime())*100)) : 0;
										return (
											<tr>
												<td>{result.operation}</td>
												<td class={styles.cellNum}>{result.iterations}</td>
												<td class={styles.cellTime}>
													<span class={styles.cellTimeValue}>{formatMs(result.timeMs)}</span>
													<span class={styles.cellTimeBar} style={{"width": `${pct}%`}} aria-hidden="true" />
												</td>
											</tr>
										);
									}}</For>
								</tbody>
							</table>
						</Show>
					</CardContent>
				</Card>
				<Card class={styles.card} padding="md">
					<CardHeader>
						<CardTitle>Perf Budget</CardTitle>
						<CardSubtitle>Live resource-size budget monitor for the loaded assets.</CardSubtitle>
					</CardHeader>
					<CardContent>
						<div class={styles.budgetActions}>
							<Button variant="primary" size="sm" onClick={() => perfBudget.refresh()}>Refresh budget</Button>
							<Show when={perfBudget.allPassed()} fallback={<Badge variant="error">Over budget</Badge>}>
								<Badge variant="success">Within budget</Badge>
							</Show>
						</div>
						<table class={styles.benchTable}>
							<thead>
								<tr>
									<th scope="col">Category</th>
									<th scope="col">Assets</th>
									<th scope="col">Actual</th>
									<th scope="col">Limit</th>
									<th scope="col">Status</th>
								</tr>
							</thead>
							<tbody>
								<For each={perfBudget.results()}>{(row) => (
									<tr>
										<td>{row.category}</td>
										<td class={styles.cellNum}>{row.count}</td>
										<td class={styles.cellNum}>{PerfBudget.formatBytes(row.actualBytes)}</td>
										<td class={styles.cellNum}>{PerfBudget.formatBytes(row.limitBytes)}</td>
										<td>
											<Show when={row.passed} fallback={<Badge variant="error">fail</Badge>}>
												<Badge variant="success">pass</Badge>
											</Show>
										</td>
									</tr>
								)}</For>
							</tbody>
						</table>
					</CardContent>
				</Card>
			</div>
			<A11yInspectorOverlay
				isOpen={a11y.isOpen}
				issues={a11y.issues}
				errorCount={a11y.errorCount}
				warningCount={a11y.warningCount}
				onToggle={a11y.toggle}
				onRefresh={a11y.refresh}
			/>
		</div>
	);
}
export default DxDashboard;
