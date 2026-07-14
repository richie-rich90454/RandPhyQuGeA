import type {JSX} from "solid-js";
import {Show, For, createMemo} from "solid-js";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {EmptyState} from "../ui/EmptyState";
import {Badge} from "../ui/Badge";
import type {BadgeVariant} from "../ui/Badge";
import {MathText} from "../MathText";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {useSpecStore} from "../../stores/specStore";
import {findTopicName, choiceLetter} from "../../../lib/utils";
import styles from "./QuestionCard.module.css";
interface DifficultyMeta {
	label: string;
	variant: BadgeVariant;
}
const DIFFICULTY_META: Record<number, DifficultyMeta>={
	1: {label: "Easy", variant: "success"},
	2: {label: "Medium", variant: "warning"},
	3: {label: "Hard", variant: "error"},
};
function getDifficultyMeta(difficulty: number): DifficultyMeta {
	if (difficulty<=0) {
		return {label: "Intro", variant: "default"};
	}
	return DIFFICULTY_META[difficulty] ?? {label: "Hard", variant: "error"};
}
function QuestionIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" stroke-linecap="round" />
			<circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
		</svg>
	);
}
function BarbellIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<line x1="4" y1="12" x2="20" y2="12" stroke-linecap="round" />
			<rect x="2" y="9" width="3" height="6" rx="1" />
			<rect x="19" y="9" width="3" height="6" rx="1" />
			<rect x="6" y="10" width="2" height="4" rx="0.5" />
			<rect x="16" y="10" width="2" height="4" rx="0.5" />
		</svg>
	);
}
/**
 * Question display card mapped to `.question-card`.
 *
 * Solid port of {@link ../../../components/practice/QuestionCard}. Reads the
 * current question from the practice store and the parsed spec from the spec
 * store. When no question is loaded, renders the empty-state placeholder; when
 * a question is loaded, renders the topic name and difficulty as header
 * badges, the question text (with inline LaTeX support via `MathText`), and
 * radio-style choice cards for multiple-choice questions with arrow-key
 * navigation. Framer Motion swap animations are replaced by CSS;
 * `@phosphor-icons/react` icons are replaced with inline SVG. Reduced-motion
 * preference is read from the settings store (animation suppression is handled
 * via CSS media queries in this port).
 */
export function QuestionCard(): JSX.Element {
	let currentQuestion=usePracticeStore(selectCurrentQuestion);
	let selectedChoiceIndex=usePracticeStore(s => s.selectedChoiceIndex);
	let selectedChoiceIndices=usePracticeStore(s => s.selectedChoiceIndices);
	let showFeedback=usePracticeStore(s => s.showFeedback);
	let specification=useSpecStore(s => s.specification);
	let choicesContainerEl: HTMLDivElement | null=null;
	let topicName=createMemo(() => findTopicName(specification(), currentQuestion()?.topic_id));
	let difficultyMeta=createMemo(() => {
		let q=currentQuestion();
		return q ? getDifficultyMeta(q.difficulty) : null;
	});
	let isMcq=createMemo(() => {
		let q=currentQuestion();
		return Boolean(q && q.response_mode === "mcq" && q.choices && q.choices.length > 0);
	});
	let isMultiSelect=createMemo(() => {
		let q=currentQuestion();
		return Boolean(q && q.correct_choice_indices !== undefined);
	});
	let hasQuestion=createMemo(() => currentQuestion() !== null);
	let choicesDisabled=createMemo(() => !hasQuestion() || showFeedback());
	let diagramSvg=createMemo(() => {
		let q=currentQuestion();
		let svg=q?.diagram_svg;
		if (!svg || svg.trim()==="") return "";
		return svg;
	});
	let handleSelectChoice=(index: number) => {
		usePracticeStore.getState().selectChoice(index);
	};
	let handleToggleChoice=(index: number) => {
		usePracticeStore.getState().toggleChoice(index);
	};
	let handleChoiceKeyDown=(event: KeyboardEvent) => {
		if (isMultiSelect()) return;
		let q=currentQuestion();
		let choices=q?.choices;
		if (!choices || choices.length===0) return;
		let count=choices.length;
		let currentIndex=selectedChoiceIndex()>=0 ? selectedChoiceIndex() : -1;
		let nextIndex: number | null=null;
		if (event.key==="ArrowDown" || event.key==="ArrowRight") {
			nextIndex=currentIndex<0 ? 0 : (currentIndex+1)%count;
		} else if (event.key==="ArrowUp" || event.key==="ArrowLeft") {
			nextIndex=currentIndex<0 ? count-1 : (currentIndex-1+count)%count;
		}
		if (nextIndex!==null) {
			event.preventDefault();
			handleSelectChoice(nextIndex);
			let container=choicesContainerEl;
			if (container) {
				requestAnimationFrame(() => {
					let target=container!.querySelector<HTMLButtonElement>(`[data-choice-index="${nextIndex}"]`);
					target?.focus();
				});
			}
		}
	};
	return (
		<Card class={styles.questionCard} variant="default" padding="none">
			<CardHeader>
				<CardTitle>Question</CardTitle>
				<div class={styles.questionMeta}>
					<Show when={topicName()}>
						<Badge variant="default" size="sm">{topicName()}</Badge>
					</Show>
					<Show when={difficultyMeta()}>
						<Badge variant={difficultyMeta()!.variant} size="sm">
							<BarbellIcon />
							{difficultyMeta()!.label}
						</Badge>
					</Show>
				</div>
			</CardHeader>
			<CardContent>
				<div class={styles.questionDisplay} aria-live="polite" role="region" aria-label="Question display" aria-atomic="true">
					<Show when={currentQuestion()} fallback={
						<EmptyState illustration={<QuestionIcon />} title="Pick a topic and click Generate to start" />
					}>
						<div class={styles.questionText}>
						<MathText text={currentQuestion()!.text} />
					</div>
					<Show when={diagramSvg()}>
						<div class={styles.diagram} role="img" aria-label="Question diagram" innerHTML={diagramSvg()} />
					</Show>
					<Show when={isMcq() && currentQuestion()!.choices}>
							<Show when={isMultiSelect()} fallback={
								<div
									ref={(el: HTMLDivElement) => { choicesContainerEl=el; }}
									class={`${styles.choicesContainer} ${styles.questionChoices}`}
									id="mcq-choices-container"
									role="radiogroup"
									aria-label="Answer choices"
									onKeyDown={handleChoiceKeyDown}
								>
									<For each={currentQuestion()!.choices!}>{(choice, index) => (
										<button
											type="button"
											role="radio"
											aria-checked={selectedChoiceIndex()===index()}
											tabIndex={selectedChoiceIndex()===index() ? 0 : -1}
											data-choice-index={index()}
											class={`${styles.choiceButton} ${selectedChoiceIndex()===index() ? styles.selected : ""}`}
											disabled={choicesDisabled()}
											onClick={() => handleSelectChoice(index())}
										>
											<span class={styles.choiceLetter} aria-hidden="true">{choiceLetter(index())}</span>
											<span class={styles.choiceText}>
												<MathText text={choice} />
											</span>
										</button>
									)}</For>
								</div>
							}>
								<div
									ref={(el: HTMLDivElement) => { choicesContainerEl=el; }}
									class={`${styles.choicesContainer} ${styles.questionChoices}`}
									id="mcq-choices-container"
									role="group"
									aria-label="Answer choices"
								>
									<For each={currentQuestion()!.choices!}>{(choice, index) => (
										<button
											type="button"
											role="checkbox"
											aria-checked={selectedChoiceIndices().includes(index())}
											data-choice-index={index()}
											class={`${styles.choiceButton} ${selectedChoiceIndices().includes(index()) ? styles.selected : ""}`}
											disabled={choicesDisabled()}
											onClick={() => handleToggleChoice(index())}
										>
											<span class={styles.choiceLetter} aria-hidden="true">{choiceLetter(index())}</span>
											<span class={styles.choiceText}>
												<MathText text={choice} />
											</span>
										</button>
									)}</For>
								</div>
							</Show>
						</Show>
					</Show>
				</div>
			</CardContent>
		</Card>
	);
}
