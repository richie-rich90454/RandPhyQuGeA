import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {Select} from "../ui/Select";
import {Switch} from "../ui/Switch";
import {Spinner} from "../ui/Spinner";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {MathText} from "../MathText";
import {useUiStore} from "../../stores/uiStore";
import {useSpecStore} from "../../stores/specStore";
import {useToast} from "../ui/Toast";
import {useServiceProvider} from "../../providers/ServiceProvider";
import {PhysicsService} from "../../../services/PhysicsService";
import {ExportService} from "../../../services/ExportService";
import type {IPhysicsService, IExportService, GenerateOptions} from "../../../services/contracts";
import type {GeneratedQuestion} from "../../../types/models";
import styles from "./PrintModal.module.css";
/** Minimum worksheet question count. */
const MIN_COUNT=5;
/** Maximum worksheet question count. */
const MAX_COUNT=50;
/** Default worksheet question count. */
const DEFAULT_COUNT=10;
/** Difficulty options for the worksheet. */
const DIFFICULTY_OPTIONS: {value: "easy" | "medium" | "hard" | "mixed"; label: string}[]=[
	{value: "easy", label: "Easy"},
	{value: "medium", label: "Medium"},
	{value: "hard", label: "Hard"},
	{value: "mixed", label: "Mixed (random)"},
];
/** Scope options for the worksheet. */
const SCOPE_OPTIONS: {value: string; label: string}[]=[
	{value: "simple", label: "Simple Math"},
	{value: "algebra", label: "Algebra"},
	{value: "precalc", label: "Precalculus"},
	{value: "calc", label: "Calculus"},
	{value: "all", label: "All"},
];
/** Difficulty range mapping for worksheet generation. */
const DIFFICULTY_RANGES: Record<"easy" | "medium" | "hard", {minDifficulty: number; maxDifficulty: number}>={
	easy: {minDifficulty: 1, maxDifficulty: 2},
	medium: {minDifficulty: 3, maxDifficulty: 5},
	hard: {minDifficulty: 6, maxDifficulty: 7},
};
/** Check whether a unit matches a scope keyword by id or name. */
function scopeMatchesUnit(scope: string, unit: {id: string; name: string}): boolean {
	let haystack=`${unit.id} ${unit.name}`.toLowerCase();
	if (scope==="simple") return haystack.includes("simple") || haystack.includes("math");
	if (scope==="algebra") return haystack.includes("algebra");
	if (scope==="precalc") return haystack.includes("precalc") || haystack.includes("pre-calc");
	if (scope==="calc") return haystack.includes("calc") && !haystack.includes("precalc") && !haystack.includes("pre-calc");
	return true;
}
export interface PrintModalProps {
	/** Override the physics service used for worksheet generation. */
	physics?: IPhysicsService;
	/** Override the export service used for printing. */
	exportService?: IExportService;
}
/**
 * Print worksheet overlay mapped to `#print-modal`.
 *
 * Solid port of {@link ../../../components/modals/PrintModal}. Renders worksheet
 * options (question count slider 5–50, multi-select topic pills, scope,
 * difficulty, answer-key toggle), generates a batch of questions on demand
 * through the injected physics service, shows a numbered preview, and delegates
 * printing to `window.print()` via the injected export service. Services
 * default to instances built from the {@link useServiceProvider} core; pass
 * `physics`/`exportService` to inject test doubles. `@media print` styles in
 * the co-located CSS module hide the options, actions, and app chrome so only
 * the preview list is printed.
 */
export function PrintModal(props: PrintModalProps): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal==="print");
	let specification=useSpecStore(s => s.specification);
	let {toast}=useToast();
	let [questionCount, setQuestionCount]=createSignal<number>(DEFAULT_COUNT);
	let [selectedTopicIds, setSelectedTopicIds]=createSignal<string[]>([]);
	let [scope, setScope]=createSignal<string>("all");
	let [difficulty, setDifficulty]=createSignal<"easy" | "medium" | "hard" | "mixed">("medium");
	let [includeAnswerKey, setIncludeAnswerKey]=createSignal<boolean>(true);
	let [questions, setQuestions]=createSignal<GeneratedQuestion[]>([]);
	let [isGenerating, setIsGenerating]=createSignal<boolean>(false);
	let [error, setError]=createSignal<string | null>(null);
	let cachedPhysics: IPhysicsService | null=null;
	let cachedExport: IExportService | null=null;
	let resolvePhysics=(): IPhysicsService => {
		if (props.physics) return props.physics;
		if (!cachedPhysics) {
			let {core}=useServiceProvider();
			cachedPhysics=new PhysicsService(core);
		}
		return cachedPhysics;
	};
	let resolveExport=(): IExportService => {
		if (props.exportService) return props.exportService;
		if (!cachedExport) {
			cachedExport=new ExportService();
		}
		return cachedExport;
	};
	let topicOptions=createMemo<{value: string; label: string; topicId: string}[]>(() => {
		let spec=specification();
		if (!spec) return [];
		return spec.topics.filter(topic => {
			if (scope()==="all") return true;
			let unit=spec.units.find(u => u.id===topic.unit_id);
			return unit !== undefined && scopeMatchesUnit(scope(), unit);
		}).map(topic => {
			let unit=spec.units.find(u => u.id===topic.unit_id);
			return {value: topic.id, label: `${unit?.name ?? "Unknown"} - ${topic.name}`, topicId: topic.id};
		});
	});
	let scopeSelectOptions=SCOPE_OPTIONS.map(option => ({value: option.value, label: option.label}));
	let difficultySelectOptions=DIFFICULTY_OPTIONS.map(option => ({value: option.value, label: option.label}));
	let toggleTopic=(topicId: string) => {
		let current=selectedTopicIds();
		if (current.includes(topicId)) {
			setSelectedTopicIds(current.filter(id => id !== topicId));
		} else {
			setSelectedTopicIds([...current, topicId]);
		}
	};
	let handleGenerate=async () => {
		let spec=specification();
		if (!spec) {
			setError("No specification loaded.");
			return;
		}
		setIsGenerating(true);
		setError(null);
		try {
			let d=difficulty();
			let selected=selectedTopicIds();
			let options: GenerateOptions;
			let topicId: string | undefined=selected.length===1 ? selected[0] : undefined;
			if (d==="mixed") {
				options={topicId};
			} else {
				options={topicId, ...DIFFICULTY_RANGES[d]};
			}
			let batch=await resolvePhysics().generateBatch(spec, questionCount(), options);
			setQuestions(batch);
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			toast({variant: "error", message: "Failed to generate worksheet: " + message});
			setQuestions([]);
		} finally {
			setIsGenerating(false);
		}
	};
	let handlePrint=() => {
		if (questions().length===0) return;
		try {
			resolveExport().printWorksheet(questions(), includeAnswerKey());
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			setError(message);
		}
	};
	let handleScope=(event: Event) => {
		let target=event.target as HTMLSelectElement;
		setScope(target.value);
		setSelectedTopicIds([]);
	};
	let handleDifficulty=(event: Event) => {
		let target=event.target as HTMLSelectElement;
		setDifficulty(target.value as "easy" | "medium" | "hard" | "mixed");
	};
	let handleCountInput=(event: Event) => {
		let target=event.target as HTMLInputElement;
		let next=Number(target.value);
		if (Number.isFinite(next)) {
			let clamped=Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.round(next)));
			setQuestionCount(clamped);
		}
	};
	let handleCountSlider=(event: Event) => {
		let target=event.target as HTMLInputElement;
		let next=Number(target.value);
		setQuestionCount(next);
	};
	let close=() => useUiStore.getState().closeModal();
	return (
		<Modal
			open={isOpen()}
			onClose={close}
			modalId="print-modal"
			title="Print Worksheet"
			titleId="print-title"
			ariaLabel="Print worksheet"
			class={styles.print}
			footer={
				<>
					<Button variant="secondary" size="md" onClick={close}>Close</Button>
					<Show when={questions().length>0}>
						<Button variant="primary" size="md" onClick={handlePrint} disabled={isGenerating()}>Print Worksheet</Button>
					</Show>
				</>
			}
		>
			<Card variant="filled" class={styles.optionsCard}>
				<CardHeader>
					<CardTitle>Options</CardTitle>
				</CardHeader>
				<CardContent class={styles.optionsContent}>
					<div class={styles.option}>
						<label for="print-question-count" class={styles.optionTitle}>Number of questions</label>
						<span class={styles.optionHint}>Choose between {MIN_COUNT} and {MAX_COUNT} questions.</span>
						<div class={styles.countControl}>
							<input
								id="print-question-count"
								type="range"
								min={MIN_COUNT}
								max={MAX_COUNT}
								step={1}
								value={questionCount()}
								onInput={handleCountSlider}
								class={styles.countSlider}
								aria-label="Number of questions slider"
							/>
							<input
								type="number"
								min={MIN_COUNT}
								max={MAX_COUNT}
								value={questionCount()}
								onInput={handleCountInput}
								class={styles.countInput}
								aria-label="Number of questions"
							/>
						</div>
					</div>
					<div class={styles.option}>
						<label for="print-scope" class={styles.optionTitle}>Topic scope</label>
						<span class={styles.optionHint}>Filter topics by subject area.</span>
						<Select id="print-scope" variant="scope" options={scopeSelectOptions} value={scope()} onChange={handleScope} />
					</div>
					<div class={styles.option}>
						<span class={styles.optionTitle}>Topics</span>
						<span class={styles.optionHint}>Select one or more topics, or leave empty to use all topics in scope.</span>
						<Show when={topicOptions().length>0} fallback={
							<p class={styles.topicsEmpty}>No topics available for the selected scope.</p>
						}>
							<div class={styles.topicPills} role="group" aria-label="Topics">
								<For each={topicOptions()}>{(option) => (
									<button
										type="button"
										aria-pressed={selectedTopicIds().includes(option.topicId)}
										class={`${styles.topicPill} ${selectedTopicIds().includes(option.topicId) ? styles.topicPillActive : ""}`}
										onClick={() => toggleTopic(option.topicId)}
									>
										{option.label}
									</button>
								)}</For>
							</div>
						</Show>
					</div>
					<div class={styles.option}>
						<label for="print-difficulty" class={styles.optionTitle}>Difficulty</label>
						<span class={styles.optionHint}>Base challenge level for generated questions.</span>
						<Select id="print-difficulty" variant="scope" options={difficultySelectOptions} value={difficulty()} onChange={handleDifficulty} />
					</div>
					<div class={styles.option}>
						<Switch id="print-answer-key" label="Include answer key" hint="Show answers and solutions in the printed worksheet." checked={includeAnswerKey()} onCheckedChange={setIncludeAnswerKey} />
					</div>
					<div class={styles.actions}>
						<Button variant="primary" size="md" onClick={() => void handleGenerate()} disabled={isGenerating() || !specification()} aria-busy={isGenerating()}>
							<Show when={isGenerating()} fallback={<span>Generate Worksheet</span>}>
								<span class={styles.generating}><Spinner size="sm" /> Generating...</span>
							</Show>
						</Button>
					</div>
					<Show when={error()}>
						<p class={styles.error} role="alert">{error()}</p>
					</Show>
				</CardContent>
			</Card>
			<Show when={questions().length>0}>
				<Card variant="default" class={styles.previewCard}>
					<CardHeader>
						<CardTitle>Preview ({questions().length} questions)</CardTitle>
					</CardHeader>
					<CardContent class={styles.previewContent}>
						<ol class={styles.previewList}>
							<For each={questions()}>{(question, index) => (
								<li class={styles.previewItem} value={index()+1}>
									<MathText text={question.text} />
									<Show when={includeAnswerKey()}>
										<span class={styles.previewAnswer}> - <MathText text={question.answer} /></span>
									</Show>
								</li>
							)}</For>
						</ol>
					</CardContent>
				</Card>
			</Show>
		</Modal>
	);
}
