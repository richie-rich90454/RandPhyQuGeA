import type {JSX} from "solid-js";
import {createEffect, createSignal, onCleanup, Show, For} from "solid-js";
import {Button, Card, CardHeader, CardTitle, CardSubtitle, CardContent, Badge, EmptyState, Spinner} from "../components/ui";
import {parseSpecification, generateQuestion, loadDefaultSpec} from "../../services/physicsCore";
import type {Specification, GeneratedQuestion} from "../../types/models";
import styles from "./SpecEditor.module.css";
const STORAGE_KEY="randphyqugea:spec-editor:text";
const DEBOUNCE_MS=400;
function loadSavedSpec(): string {
	try {
		let saved=localStorage.getItem(STORAGE_KEY);
		if (saved !== null) return saved;
	} catch {
		// localStorage unavailable
	}
	return "";
}
function saveSpec(text: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, text);
	} catch {
		// localStorage unavailable
	}
}
function downloadFile(filename: string, content: string): void {
	let blob=new Blob([content], {type: "text/plain;charset=utf-8"});
	let url=URL.createObjectURL(blob);
	let anchor=document.createElement("a");
	anchor.href=url;
	anchor.download=filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}
interface ParseState {
	status: "idle" | "parsing" | "success" | "error";
	spec?: Specification;
	error?: string;
}
export function SpecEditor(): JSX.Element {
	let [specText, setSpecText]=createSignal<string>(loadSavedSpec());
	let [parseState, setParseState]=createSignal<ParseState>({status: "idle"});
	let [previewQuestion, setPreviewQuestion]=createSignal<GeneratedQuestion | null>(null);
	let [previewError, setPreviewError]=createSignal<string | null>(null);
	let [loadingDefault, setLoadingDefault]=createSignal(false);
	let [saved, setSaved]=createSignal(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let runPreview=(text: string) => {
		if (text.trim() === "") {
			setParseState({status: "idle"});
			setPreviewQuestion(null);
			setPreviewError(null);
			return;
		}
		setParseState({status: "parsing"});
		parseSpecification(text).then((spec) => {
			setParseState({status: "success", spec});
			setPreviewError(null);
			return generateQuestion(spec);
		}).then((question) => {
			setPreviewQuestion(question);
		}).catch((err: unknown) => {
			let message=err instanceof Error ? err.message : String(err);
			setParseState({status: "error", error: message});
			setPreviewQuestion(null);
			setPreviewError(message);
		});
	};
	createEffect(() => {
		let text=specText();
		saveSpec(text);
		setSaved(true);
		let timer=setTimeout(() => setSaved(false), 1500);
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer=setTimeout(() => {
			runPreview(text);
		}, DEBOUNCE_MS);
		onCleanup(() => {
			clearTimeout(timer);
			if (debounceTimer) clearTimeout(debounceTimer);
		});
	});
	let handleLoadDefault=() => {
		setLoadingDefault(true);
		loadDefaultSpec().then((text) => {
			setSpecText(text);
		}).finally(() => {
			setLoadingDefault(false);
		});
	};
	let handleExport=() => {
		downloadFile("specification.txt", specText());
	};
	let handleClear=() => {
		setSpecText("");
	};
	let unitCount=() => parseState().spec?.units.length ?? 0;
	let topicCount=() => parseState().spec?.topics.length ?? 0;
	let skillCount=() => parseState().spec?.skills.length ?? 0;
	let templateCount=() => parseState().spec?.templates.length ?? 0;
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
				<h1 class={styles.title}>Live Spec Editor</h1>
				<p class={styles.subtitle}>Edit a question specification and preview generated questions in real time.</p>
			</header>
			<div class={styles.toolbar}>
				<Button variant="secondary" size="sm" onClick={handleLoadDefault} loading={loadingDefault()}>Load default spec</Button>
				<Button variant="ghost" size="sm" onClick={handleExport} disabled={specText().trim() === ""}>Export .txt</Button>
				<Button variant="ghost" size="sm" onClick={handleClear} disabled={specText() === ""}>Clear</Button>
				<Show when={saved()}>
					<Badge variant="success">Saved</Badge>
				</Show>
			</div>
			<div class={styles.layout}>
				<Card class={styles.editorCard} padding="md">
					<CardHeader>
						<CardTitle>Specification</CardTitle>
						<CardSubtitle>Edit the spec text below — changes auto-save to localStorage.</CardSubtitle>
					</CardHeader>
					<CardContent>
						<textarea
							class={styles.editor}
							value={specText()}
							onInput={(e) => setSpecText(e.currentTarget.value)}
							placeholder="[UNIT id:kinematics name:Kinematics]&#10;[TOPIC id:proj-motion name:&quot;Projectile Motion&quot; unit:kinematics]&#10;[SKILL id:calc-trajectory name:&quot;Calculate Trajectory&quot; topic:proj-motion]&#10;[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]"
							spellcheck={false}
							aria-label="Specification text editor"
						/>
					</CardContent>
				</Card>
				<div class={styles.previewColumn}>
					<Card class={styles.statusCard} padding="md">
						<CardHeader>
							<CardTitle>Parse Status</CardTitle>
						</CardHeader>
						<CardContent>
							<Show
								when={parseState().status === "idle"}
								fallback={
									<Show
										when={parseState().status === "parsing"}
										fallback={
											<Show
												when={parseState().status === "success"}
												fallback={
													<div class={styles.errorBlock}>
														<Badge variant="error">Error</Badge>
														<pre class={styles.errorText}>{parseState().error}</pre>
													</div>
												}
											>
												<div class={styles.statusRow}>
													<Badge variant="success">Valid</Badge>
													<span class={styles.statusText}>Parsed successfully</span>
												</div>
												<div class={styles.stats}>
													<div class={styles.stat}><span class={styles.statLabel}>Units</span><span class={styles.statValue}>{unitCount()}</span></div>
													<div class={styles.stat}><span class={styles.statLabel}>Topics</span><span class={styles.statValue}>{topicCount()}</span></div>
													<div class={styles.stat}><span class={styles.statLabel}>Skills</span><span class={styles.statValue}>{skillCount()}</span></div>
													<div class={styles.stat}><span class={styles.statLabel}>Templates</span><span class={styles.statValue}>{templateCount()}</span></div>
												</div>
											</Show>
										}
									>
										<div class={styles.statusRow}>
											<Spinner size="sm" />
											<span class={styles.statusText}>Parsing…</span>
										</div>
									</Show>
								}
							>
								<EmptyState title="No spec loaded" description="Type or load a spec to see the parse status." />
							</Show>
						</CardContent>
					</Card>
					<Card class={styles.previewCard} padding="md">
						<CardHeader>
							<CardTitle>Sample Question</CardTitle>
							<CardSubtitle>Generated from the current spec.</CardSubtitle>
						</CardHeader>
						<CardContent>
							<Show
								when={previewQuestion()}
								fallback={
									<Show when={previewError()}>
										<EmptyState title="Generation failed" description={previewError() ?? undefined} />
									</Show>
								}
							>
								{(question) => (
									<div class={styles.questionBlock}>
										<div class={styles.questionMeta}>
											<Badge variant="info">{question().question_type}</Badge>
											<Badge variant="default">Difficulty {question().difficulty}</Badge>
											<Badge variant="success">{question().response_mode}</Badge>
										</div>
										<p class={styles.questionText}>{question().text}</p>
										<Show when={question().choices}>
											<ul class={styles.choices}>
												<For each={question().choices}>{(choice, index) => (
													<li class={question().correct_choice_index === index() ? styles.correctChoice : styles.choice}>
														{String.fromCharCode(65 + index())}. {choice}
													</li>
												)}</For>
											</ul>
										</Show>
										<div class={styles.answerBlock}>
											<span class={styles.answerLabel}>Answer:</span>
											<span class={styles.answerValue}>{question().answer}</span>
										</div>
										<Show when={question().solution_text}>
											<div class={styles.solutionBlock}>
												<span class={styles.answerLabel}>Solution:</span>
												<span class={styles.solutionText}>{question().solution_text}</span>
											</div>
										</Show>
									</div>
								)}
							</Show>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
export default SpecEditor;
