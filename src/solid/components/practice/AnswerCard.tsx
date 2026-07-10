import type {JSX} from "solid-js";
import {Show, createMemo} from "solid-js";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {MathToolbar} from "./MathToolbar";
import {MathText} from "../MathText";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {QUESTION_TYPES} from "../../../types/models";
import {choiceLetter} from "../../../lib/utils";
import styles from "./AnswerCard.module.css";
function XIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
		</svg>
	);
}
/**
 * Answer input card mapped to `.answer-card`.
 *
 * Solid port of {@link ../../../components/practice/AnswerCard}. Renders the
 * math toolbar, the answer input area (textarea for short-answer questions or
 * a read-only selected-choice summary for multiple-choice), a live KaTeX
 * preview of the user's answer, and an expected-format hint. Symbol insertion
 * from the math toolbar writes LaTeX at the textarea cursor and updates the
 * practice store. Framer Motion shake on incorrect answers is replaced by a
 * CSS class; `@phosphor-icons/react` icons are replaced with inline SVG.
 * Reduced-motion preference is handled via CSS media queries.
 */
export function AnswerCard(): JSX.Element {
	let currentQuestion=usePracticeStore(selectCurrentQuestion);
	let userAnswer=usePracticeStore(s => s.userAnswer);
	let selectedChoiceIndex=usePracticeStore(s => s.selectedChoiceIndex);
	let showFeedback=usePracticeStore(s => s.showFeedback);
	let lastResult=usePracticeStore(s => s.lastResult);
	let textareaEl: HTMLTextAreaElement | null=null;
	let isMcq=createMemo(() => {
		let q=currentQuestion();
		return Boolean(q && q.question_type === QUESTION_TYPES.MC && q.choices && q.choices.length > 0);
	});
	let hasQuestion=createMemo(() => currentQuestion() !== null);
	let inputDisabled=createMemo(() => !hasQuestion() || showFeedback());
	let shouldShake=createMemo(() => showFeedback() && lastResult() !== null && !lastResult()!.isCorrect);
	let previewHasContent=createMemo(() => userAnswer().trim() !== "");
	let selectedChoice=createMemo(() => {
		let q=currentQuestion();
		if (!isMcq() || !q?.choices || selectedChoiceIndex() < 0) return null;
		return q.choices[selectedChoiceIndex()] ?? null;
	});
	let handleInsertSymbol=(latex: string) => {
		let textarea=textareaEl;
		if (!textarea || inputDisabled() || isMcq()) return;
		let start=textarea.selectionStart;
		let end=textarea.selectionEnd;
		let current=userAnswer();
		let next=current.slice(0, start) + latex + current.slice(end);
		usePracticeStore.getState().setUserAnswer(next);
		requestAnimationFrame(() => {
			let pos=start + latex.length;
			textarea.focus();
			textarea.setSelectionRange(pos, pos);
		});
	};
	let handleClear=() => {
		usePracticeStore.getState().setUserAnswer("");
		if (textareaEl) {
			textareaEl.focus();
		}
	};
	let handleClearChoice=() => {
		usePracticeStore.getState().selectChoice(-1);
	};
	let handleAnswerInput=(e: InputEvent) => {
		let target=e.target as HTMLTextAreaElement;
		usePracticeStore.getState().setUserAnswer(target.value);
	};
	return (
		<Card class={styles.answerCard} variant="default" padding="none">
			<CardHeader>
				<CardTitle>Your Answer</CardTitle>
			</CardHeader>
			<CardContent>
				<div class={`${styles.answerContent} ${shouldShake() ? styles.shake : ""}`}>
					<MathToolbar onInsert={handleInsertSymbol} disabled={inputDisabled() || isMcq()} />
					<Show when={isMcq()} fallback={
						<div class={styles.answerInputWrapper}>
							<textarea
								ref={(el: HTMLTextAreaElement) => { textareaEl=el; }}
								id="answer-box"
								class={styles.answerInput}
								placeholder="Enter your answer here. Use Shift + Enter to submit."
								value={userAnswer()}
								onInput={handleAnswerInput}
								disabled={inputDisabled()}
								aria-label="Answer"
								aria-describedby="expected-format"
							/>
							<Show when={previewHasContent()}>
								<button type="button" id="clear-answer" class={styles.clearAnswerBtn} aria-label="Clear answer" title="Clear answer input" onClick={handleClear}>
									<XIcon />
								</button>
							</Show>
						</div>
					}>
						<div class={styles.answerInputWrapper}>
							<div
								class={`${styles.answerInput} ${styles.answerMcqSummary} ${selectedChoice() ? styles.hasContent : ""}`}
								aria-label="Selected answer"
								role="status"
							>
								<Show when={selectedChoice()} fallback={
									<span class={styles.answerPlaceholder}>Select an option in the question card</span>
								}>
									<span class={styles.choiceLetter} aria-hidden="true">{choiceLetter(selectedChoiceIndex())}</span>
									<MathText text={selectedChoice()!} />
								</Show>
							</div>
							<Show when={selectedChoice()}>
								<button type="button" id="clear-answer" class={styles.clearAnswerBtn} aria-label="Clear answer" title="Clear answer input" onClick={handleClearChoice}>
									<XIcon />
								</button>
							</Show>
						</div>
					</Show>
					<Show when={!isMcq()}>
						<div class={`${styles.mathPreview} ${previewHasContent() ? styles.hasContent : ""}`} id="preview">
							<Show when={previewHasContent()}>
								<MathText text={userAnswer()} />
							</Show>
						</div>
					</Show>
					<div id="expected-format" class={styles.expectedFormat}>
						<Show when={hasQuestion()}>
							<Show when={isMcq()} fallback="Enter a numeric value or expression. Use LaTeX for symbols.">
								Select the option that best answers the question.
							</Show>
						</Show>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
