import type {JSX} from "solid-js";
import {Show, createMemo, For} from "solid-js";
import katex from "katex";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {MathToolbar} from "./MathToolbar";
import {MathText} from "../MathText";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {choiceLetter} from "../../../lib/utils";
import styles from "./AnswerCard.module.css";
const MATH_DELIMITER_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
function hasKatexError(text: string): boolean {
	MATH_DELIMITER_PATTERN.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = MATH_DELIMITER_PATTERN.exec(text)) !== null) {
		let math = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
		try {
			katex.renderToString(math, {throwOnError: true});
		} catch {
			return true;
		}
	}
	return false;
}
function XIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
		</svg>
	);
}
function WarningIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M12 3l10 18H2L12 3z" stroke-linejoin="round" />
			<line x1="12" y1="10" x2="12" y2="14" stroke-linecap="round" />
			<circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
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
	let currentQuestion = usePracticeStore(selectCurrentQuestion);
	let userAnswer = usePracticeStore(s => s.userAnswer);
	let selectedChoiceIndex = usePracticeStore(s => s.selectedChoiceIndex);
	let selectedChoiceIndices = usePracticeStore(s => s.selectedChoiceIndices);
	let showFeedback = usePracticeStore(s => s.showFeedback);
	let lastResult = usePracticeStore(s => s.lastResult);
	let textareaEl: HTMLTextAreaElement | null = null;
	let isMcq = createMemo(() => {
		let q = currentQuestion();
		return Boolean(q && q.response_mode === "mcq" && q.choices && q.choices.length > 0);
	});
	let isMultiSelect = createMemo(() => {
		let q = currentQuestion();
		return Boolean(q && q.correct_choice_indices !== undefined);
	});
	let hasQuestion = createMemo(() => currentQuestion() !== null);
	let inputDisabled = createMemo(() => !hasQuestion() || showFeedback());
	let shouldShake = createMemo(() => showFeedback() && lastResult() !== null && !lastResult()!.isCorrect);
	let previewHasContent = createMemo(() => userAnswer().trim() !== "");
	let previewError = createMemo(() => {
		if (!previewHasContent()) return false;
		return hasKatexError(userAnswer());
	});
	let selectedChoice = createMemo(() => {
		let q = currentQuestion();
		if (!isMcq() || isMultiSelect() || !q?.choices || selectedChoiceIndex() < 0) return null;
		return q.choices[selectedChoiceIndex()] ?? null;
	});
	let selectedChoices = createMemo(() => {
		let q = currentQuestion();
		if (!isMcq() || !isMultiSelect() || !q?.choices) return [];
		let indices = selectedChoiceIndices();
		return indices.map(i => q.choices![i]).filter((c): c is string => c !== undefined);
	});
	let handleInsertSymbol = (latex: string) => {
		let textarea = textareaEl;
		if (!textarea || inputDisabled() || isMcq()) return;
		let start = textarea.selectionStart;
		let end = textarea.selectionEnd;
		textarea.focus();
		textarea.setSelectionRange(start, end);
		let inserted = false;
		try {
			if (typeof document.execCommand === "function") {
				inserted = document.execCommand("insertText", false, latex);
			}
		} catch {
			inserted = false;
		}
		if (!inserted) {
			let current = userAnswer();
			let next = current.slice(0, start) + latex + current.slice(end);
			usePracticeStore.getState().setUserAnswer(next);
		}
		requestAnimationFrame(() => {
			let pos = start + latex.length;
			textarea.focus();
			textarea.setSelectionRange(pos, pos);
		});
	};
	let handleClear = () => {
		usePracticeStore.getState().setUserAnswer("");
		if (textareaEl) {
			textareaEl.focus();
		}
	};
	let handleClearChoice = () => {
		if (isMultiSelect()) {
			usePracticeStore.getState().setSelectedChoiceIndices([]);
		} else {
			usePracticeStore.getState().selectChoice(-1);
		}
	};
	let handleAnswerInput = (e: InputEvent) => {
		let target = e.target as HTMLTextAreaElement;
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
					<Show
						when={isMcq()}
						fallback={
							<div class={styles.answerInputWrapper}>
								<label htmlFor="answer-box" class={styles.answerLabel}>
									Answer
								</label>
								<textarea
									ref={(el: HTMLTextAreaElement) => {
										textareaEl = el;
									}}
									id="answer-box"
									class={styles.answerInput}
									placeholder="Enter your answer here. Use Shift + Enter to submit."
									value={userAnswer()}
									onInput={handleAnswerInput}
									disabled={inputDisabled()}
									aria-describedby="expected-format"
								/>
								<Show when={previewHasContent()}>
									<button type="button" id="clear-answer" class={styles.clearAnswerBtn} aria-label="Clear answer" title="Clear answer input" onClick={handleClear}>
										<XIcon />
									</button>
								</Show>
							</div>
						}
					>
						<div class={styles.answerInputWrapper}>
							<div
								class={`${styles.answerInput} ${styles.answerMcqSummary} ${selectedChoice() || selectedChoices().length > 0 ? styles.hasContent : ""}`}
								aria-label="Selected answer"
								role="status"
							>
								<Show
									when={isMultiSelect()}
									fallback={
										<Show when={selectedChoice()} fallback={<span class={styles.answerPlaceholder}>Select an option in the question card</span>}>
											<span class={styles.choiceLetter} aria-hidden="true">
												{choiceLetter(selectedChoiceIndex())}
											</span>
											<MathText text={selectedChoice()!} />
										</Show>
									}
								>
									<Show when={selectedChoices().length > 0} fallback={<span class={styles.answerPlaceholder}>Select options in the question card</span>}>
										<For each={selectedChoiceIndices()}>
											{idx => {
												let q = currentQuestion();
												let label = q?.choices?.[idx] ?? "";
												return (
													<span class={styles.multiSelectChoice}>
														<span class={styles.choiceLetter} aria-hidden="true">
															{choiceLetter(idx)}
														</span>
														<MathText text={label} />
													</span>
												);
											}}
										</For>
									</Show>
								</Show>
							</div>
							<Show when={selectedChoice() || selectedChoices().length > 0}>
								<button type="button" id="clear-answer" class={styles.clearAnswerBtn} aria-label="Clear answer" title="Clear answer input" onClick={handleClearChoice}>
									<XIcon />
								</button>
							</Show>
						</div>
					</Show>
					<Show when={!isMcq()}>
						<div class={`${styles.mathPreview} ${previewHasContent() ? styles.hasContent : ""} ${previewError() ? styles.previewError : ""}`} id="preview">
							<Show when={previewHasContent()} fallback={<span class={styles.previewPlaceholder}>Preview will appear here</span>}>
								<Show when={previewError()} fallback={<MathText text={userAnswer()} />}>
									<span class={styles.previewErrorContent} role="alert" aria-label="Invalid LaTeX">
										<WarningIcon />
										<span class={styles.previewRawText}>{userAnswer()}</span>
									</span>
								</Show>
							</Show>
						</div>
					</Show>
					<div id="expected-format" class={styles.expectedFormat}>
						<Show when={hasQuestion()}>
							<Show when={isMcq()} fallback="Enter a numeric value or expression. Use LaTeX for symbols.">
								<Show when={isMultiSelect()} fallback="Select the option that best answers the question.">
									Select all options that apply to the question.
								</Show>
							</Show>
						</Show>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
