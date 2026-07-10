import type {JSX} from "solid-js";
import {Show, createMemo} from "solid-js";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {EmptyState} from "../ui/EmptyState";
import {MathText} from "../MathText";
import {MathRenderer} from "../MathRenderer";
import {usePracticeStore, selectCurrentQuestion, type AnswerFeedback} from "../../stores/practiceStore";
import styles from "./ResultsCard.module.css";
type SolutionRender={kind: "katex"; latex: string} | {kind: "text"; text: string};
function EnvelopeIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3 7l9 6 9-6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function CheckIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function XIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
		</svg>
	);
}
/**
 * Results feedback card mapped to `.results-card`.
 *
 * Solid port of {@link ../../../components/practice/ResultsCard}. Reads
 * `showFeedback` and `lastResult` from the practice store. When no feedback is
 * available, renders the empty-state placeholder. When feedback is shown,
 * renders a correct (green) or incorrect (red) banner with the correct answer
 * and the solution (LaTeX-rendered via `MathRenderer` when available, plain
 * text via `MathText` otherwise). Framer Motion swap animations are replaced
 * by CSS; `@phosphor-icons/react` icons are replaced with inline SVG.
 * Reduced-motion preference is handled via CSS media queries.
 */
export function ResultsCard(): JSX.Element {
	let showFeedback=usePracticeStore(s => s.showFeedback);
	let lastResult=usePracticeStore(s => s.lastResult);
	let currentQuestion=usePracticeStore(selectCurrentQuestion);
	let solutionRender=createMemo((): SolutionRender | null => {
		let q=currentQuestion();
		if (!q) return null;
		let latex=q.solution_latex;
		if (latex && latex.trim() !== "") {
			return {kind: "katex", latex};
		}
		if (q.solution_text.trim() !== "") {
			return {kind: "text", text: q.solution_text};
		}
		return null;
	});
	let hasFeedback=createMemo(() => showFeedback() && lastResult() !== null && currentQuestion() !== null);
	return (
		<Card class={styles.resultsCard} variant="default" padding="none">
			<CardHeader>
				<CardTitle>Results</CardTitle>
			</CardHeader>
			<CardContent>
				<div id="answer-results" class={styles.resultsDisplay} role="status" aria-live="polite">
					<Show when={hasFeedback()} fallback={
						<EmptyState illustration={<EnvelopeIcon />} title="Your results will appear here after checking" />
					}>
						<FeedbackContent lastResult={lastResult()!} solutionRender={solutionRender()} />
					</Show>
				</div>
			</CardContent>
		</Card>
	);
}
interface FeedbackContentProps {
	lastResult: AnswerFeedback;
	solutionRender: SolutionRender | null;
}
function FeedbackContent(props: FeedbackContentProps): JSX.Element {
	let isCorrect=props.lastResult.isCorrect;
	let correctAnswer=props.lastResult.correctAnswer;
	let displayClass=`${styles.resultsDisplay} ${styles.hasContent} ${isCorrect ? styles.correct : styles.incorrect}`;
	let bannerClass=isCorrect ? styles.resultSuccess : styles.resultError;
	let heading=isCorrect ? "Correct!" : "Incorrect";
	let solKind=createMemo(() => props.solutionRender?.kind);
	let solLatex=createMemo(() => {
		let sr=props.solutionRender;
		return sr && sr.kind === "katex" ? sr.latex : "";
	});
	let solText=createMemo(() => {
		let sr=props.solutionRender;
		return sr && sr.kind === "text" ? sr.text : "";
	});
	return (
		<div class={displayClass}>
			<div class={bannerClass}>
				<Show when={isCorrect} fallback={<XIcon />}>
					<CheckIcon />
				</Show>
				<div>
					<h3>{heading}</h3>
					<p>
						Correct answer: <MathText text={correctAnswer} />
					</p>
				</div>
			</div>
			<Show when={props.solutionRender}>
				<div class={styles.solutionDisplay}>
					<h4>Solution</h4>
					<Show when={solKind() === "katex"} fallback={<MathText text={solText()} />}>
						<MathRenderer display={true} tex={solLatex()} />
					</Show>
				</div>
			</Show>
		</div>
	);
}
