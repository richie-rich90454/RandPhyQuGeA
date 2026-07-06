import {useState, useCallback, Children, isValidElement, cloneElement, type ReactNode, type ReactElement} from "react";
import {Modal, Button, Select, Switch, Card, CardContent, CardHeader, CardTitle, Spinner, useToast} from "../ui";
import {MathText} from "../MathText";
import {useUiStore} from "../../stores/uiStore";
import {useSpecStore} from "../../stores/specStore";
import {useServices} from "../../hooks/useServices";
import type {GeneratedQuestion} from "../../types/models";
/** Question count options for the worksheet. */
const COUNT_OPTIONS = [5, 10, 20, 30] as const;
/** Difficulty options for the worksheet. */
const DIFFICULTY_OPTIONS:{value: "easy" | "medium" | "hard" | "mixed"; label: string}[]=[
	{value: "easy", label: "Easy"},
	{value: "medium", label: "Medium"},
	{value: "hard", label: "Hard"},
	{value: "mixed", label: "Mixed (random)"},
];
/** Scope options for the worksheet. */
const SCOPE_OPTIONS:{value: string; label: string}[]=[
	{value: "simple", label: "Simple Math"},
	{value: "algebra", label: "Algebra"},
	{value: "precalc", label: "Precalculus"},
	{value: "calc", label: "Calculus"},
	{value: "all", label: "All"},
];
/** Difficulty range mapping for worksheet generation. */
const DIFFICULTY_RANGES: Record<"easy" | "medium" | "hard", {minDifficulty: number; maxDifficulty: number}>= {
	easy: {minDifficulty: 1, maxDifficulty: 2},
	medium: {minDifficulty: 3, maxDifficulty: 5},
	hard: {minDifficulty: 6, maxDifficulty: 7},
};
/** Check whether a unit matches a scope keyword by id or name. */
function scopeMatchesUnit(scope: string, unit: {id: string; name: string}): boolean {
	const haystack=`${unit.id} ${unit.name}`.toLowerCase();
	if (scope === "simple") return haystack.includes("simple") || haystack.includes("math");
	if (scope === "algebra") return haystack.includes("algebra");
	if (scope === "precalc") return haystack.includes("precalc") || haystack.includes("pre-calc");
	if (scope === "calc") return haystack.includes("calc") && !haystack.includes("precalc") && !haystack.includes("pre-calc");
	return true;
}
interface WorksheetOptionProps {
	label?: string;
	hint?: string;
	controlId?: string;
	children?: ReactNode;
}
function WorksheetOption({label, hint, controlId, children}: WorksheetOptionProps) {
	const hintId=controlId && hint ? `${controlId}-hint` : undefined;
	const control=hintId
		? Children.map(children, child =>
				isValidElement(child)
					? cloneElement(child as ReactElement<{ "aria-describedby"?: string }>, {"aria-describedby": hintId})
					: child
			)
		: children;
	return (
		<div className="worksheet-option">
			<div className="worksheet-option-label">
				{controlId ? (
					<label htmlFor={controlId} className="worksheet-option-title">
						{label}
					</label>
				) : (
					<span className="worksheet-option-title">{label}</span>
				)}
				{hint && <span id={hintId} className="worksheet-option-hint">{hint}</span>}
			</div>
			<div className="worksheet-option-control">
				{control}
			</div>
		</div>
	);
}
/**
 * Print worksheet overlay mapped to `#print-modal`.
 *
 * Renders worksheet options (question count, topic, scope, difficulty,
 * answer-key toggle), generates a batch of questions on demand through the
 * injected {@link IPhysicsService}, shows a numbered preview, and delegates
 * printing to the injected {@link IExportService}. The topic dropdown is
 * populated from the loaded specification; "All topics" generates across
 * every topic in the selected scope.
 */
export function PrintModal() {
	const isOpen=useUiStore(state => state.activeModal === "print");
	const closeModal=useUiStore(state => state.closeModal);
	const specification=useSpecStore(state => state.specification);
	const {physics, export: exportService}=useServices();
	const {toast}=useToast();
	const [questionCount, setQuestionCount]=useState<number>(10);
	const [topicId, setTopicId]=useState<string>("all");
	const [scope, setScope]=useState<string>("all");
	const [difficulty, setDifficulty]=useState<"easy" | "medium" | "hard" | "mixed">("medium");
	const [includeAnswerKey, setIncludeAnswerKey]=useState<boolean>(true);
	const [questions, setQuestions]=useState<GeneratedQuestion[]>([]);
	const [isGenerating, setIsGenerating]=useState<boolean>(false);
	const [error, setError]=useState<string | null>(null);
	const handleGenerate=useCallback(async () => {
		if (!specification) {
			setError("No specification loaded.");
			return;
		}
		setIsGenerating(true);
		setError(null);
		try {
			const options=difficulty === "mixed"
				? {topicId: topicId === "all" ? undefined : topicId}
				: {topicId: topicId === "all" ? undefined : topicId, ...DIFFICULTY_RANGES[difficulty]};
			const batch=await physics.generateBatch(specification, questionCount, options);
			setQuestions(batch);
		} catch (err) {
			const message=err instanceof Error ? err.message : String(err);
			toast({variant: "error", message: "Failed to generate worksheet: " + message});
			setQuestions([]);
		} finally {
			setIsGenerating(false);
		}
	}, [specification, questionCount, topicId, difficulty, physics, toast]);
	const handlePrint=useCallback(() => {
		if (questions.length === 0) return;
		try {
			exportService.printWorksheet(questions, includeAnswerKey);
		} catch (err) {
			const message=err instanceof Error ? err.message : String(err);
			setError(message);
		}
	}, [questions, includeAnswerKey, exportService]);
	const topicOptions=specification
		? specification.topics
			.filter(topic => {
				if (scope === "all") return true;
				const unit=specification.units.find(u => u.id === topic.unit_id);
				return unit !== undefined && scopeMatchesUnit(scope, unit);
			})
			.map(topic => {
				const unit=specification.units.find(u => u.id === topic.unit_id);
				return {value: topic.id, label: `${unit?.name ?? "Unknown"} - ${topic.name}`};
			})
		: [];
	const countSelectOptions=COUNT_OPTIONS.map(count => ({value: String(count), label: String(count)}));
	const topicSelectOptions=[{value: "all", label: "All topics (from selected scope)"}, ...topicOptions];
	const scopeSelectOptions=SCOPE_OPTIONS.map(option => ({value: option.value, label: option.label}));
	const difficultySelectOptions=DIFFICULTY_OPTIONS.map(option => ({value: option.value, label: option.label}));
	return (
		<Modal
			open={isOpen}
			onClose={closeModal}
			modalId="print-modal"
			title="Print Worksheet"
			titleId="print-title"
			ariaLabel="Print worksheet"
			footer={
				<>
					<Button variant="secondary" size="md" onClick={closeModal}>
						Close
					</Button>
					{questions.length > 0 && (
						<Button variant="primary" size="md" onClick={handlePrint} disabled={isGenerating}>
							Print Worksheet
						</Button>
					)}
				</>
			}
		>
			<Card variant="filled" className="worksheet-options-card">
				<CardHeader>
					<CardTitle>Options</CardTitle>
				</CardHeader>
				<CardContent className="worksheet-options-content">
					<WorksheetOption label="Number of questions" controlId="print-question-count">
						<Select
							id="print-question-count"
							variant="scope"
							options={countSelectOptions}
							value={String(questionCount)}
							onChange={event => setQuestionCount(Number(event.target.value))}
						/>
					</WorksheetOption>
					<WorksheetOption label="Topic scope" hint="Filter topics by subject area." controlId="print-scope">
						<Select
							id="print-scope"
							variant="scope"
							options={scopeSelectOptions}
							value={scope}
							onChange={event => {
								setScope(event.target.value);
								setTopicId("all");
							}}
						/>
					</WorksheetOption>
					<WorksheetOption label="Topic" hint="Limit the worksheet to a single topic." controlId="print-topic">
						<Select
							id="print-topic"
							variant="scope"
							options={topicSelectOptions}
							value={topicId}
							onChange={event => setTopicId(event.target.value)}
							disabled={topicSelectOptions.length <= 1}
						/>
					</WorksheetOption>
					<WorksheetOption label="Difficulty" hint="Base challenge level for generated questions." controlId="print-difficulty">
						<Select
							id="print-difficulty"
							variant="scope"
							options={difficultySelectOptions}
							value={difficulty}
							onChange={event => setDifficulty(event.target.value as "easy" | "medium" | "hard" | "mixed")}
						/>
					</WorksheetOption>
					<WorksheetOption>
						<Switch
							id="print-answer-key"
							label="Include answer key"
							hint="Show answers and solutions in the printed worksheet."
							checked={includeAnswerKey}
							onCheckedChange={setIncludeAnswerKey}
						/>
					</WorksheetOption>
					<div className="worksheet-actions">
						<Button variant="primary" size="md" onClick={handleGenerate} disabled={isGenerating || !specification} aria-busy={isGenerating}>
							{isGenerating ? <><Spinner size="sm" className="mr-2" /> Generating...</> : "Generate Worksheet"}
						</Button>
					</div>
					{error && (
						<p className="worksheet-error" role="alert">
							{error}
						</p>
					)}
				</CardContent>
			</Card>
			{questions.length > 0 && (
				<Card variant="default" className="worksheet-preview-card">
					<CardHeader>
						<CardTitle>Preview ({questions.length} questions)</CardTitle>
					</CardHeader>
					<CardContent className="worksheet-preview-content">
						<ol className="worksheet-preview-list">
							{questions.map((question, index) => (
								<li key={question.id} value={index + 1}>
									<MathText text={question.text} />
									{includeAnswerKey && (
										<span className="preview-answer">
											{" "}
											- <MathText text={question.answer} />
										</span>
									)}
								</li>
							))}
						</ol>
					</CardContent>
				</Card>
			)}
		</Modal>
	);
}
