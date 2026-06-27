import {useRef, type KeyboardEvent} from 'react';
import {usePracticeStore} from '../../stores/practiceStore';
import {MathToolbar} from './MathToolbar';
import {MathText} from '../MathText';
import type {GeneratedQuestion} from '../../types/models';
import {QUESTION_TYPES} from '../../types/models';
/** Clear (✕) icon path for the clear-answer button. */
const CLEAR_ICON = 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';
/**
 * Answer input card mapped to `.answer-card`.
 *
 * Renders the math toolbar, the answer input area (textarea for short-answer
 * questions or choice buttons for multiple-choice), a live KaTeX preview of
 * the user's answer, and an expected-format hint. Symbol insertion from the
 * math toolbar writes LaTeX at the textarea cursor and updates the practice
 * store.
 */
export function AnswerCard() {
	const currentQuestion = usePracticeStore(state => state.questions[state.currentIndex] ?? null) as GeneratedQuestion | null;
	const userAnswer = usePracticeStore(state => state.userAnswer);
	const setUserAnswer = usePracticeStore(state => state.setUserAnswer);
	const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
	const selectChoice = usePracticeStore(state => state.selectChoice);
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const choicesContainerRef = useRef<HTMLDivElement>(null);
	const isMcq = currentQuestion?.question_type === QUESTION_TYPES.MC && currentQuestion.choices && currentQuestion.choices.length > 0;
	const hasQuestion = currentQuestion !== null;
	const inputDisabled = !hasQuestion || showFeedback;
	const handleInsertSymbol = (latex: string) => {
		const textarea = textareaRef.current;
		if (!textarea || inputDisabled) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const next = userAnswer.slice(0, start) + latex + userAnswer.slice(end);
		setUserAnswer(next);
		requestAnimationFrame(() => {
			const pos = start + latex.length;
			textarea.focus();
			textarea.setSelectionRange(pos, pos);
		});
	};
	const handleClear = () => {
		setUserAnswer('');
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.focus();
		}
	};
	const handleChoiceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const choices = currentQuestion?.choices;
		if (!choices || choices.length === 0) return;
		const count = choices.length;
		const currentIndex = selectedChoiceIndex >= 0 ? selectedChoiceIndex : -1;
		let nextIndex: number | null = null;
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
			nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % count;
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
			nextIndex = currentIndex < 0 ? count - 1 : (currentIndex - 1 + count) % count;
		}
		if (nextIndex !== null) {
			event.preventDefault();
			selectChoice(nextIndex);
			const container = choicesContainerRef.current;
			if (container) {
				requestAnimationFrame(() => {
					const target = container.querySelector<HTMLButtonElement>(`[data-choice-index="${nextIndex}"]`);
					target?.focus();
				});
			}
		}
	};
	const previewHasContent = userAnswer.trim() !== '';
	return (
		<div className="answer-card card">
			<div className="card-header">
				<h2 className="card-title">Your Answer</h2>
			</div>
			<div className="card-content answer-content">
				<MathToolbar onInsert={handleInsertSymbol} disabled={inputDisabled || isMcq === true} />
				{isMcq && currentQuestion?.choices ? (
					<div ref={choicesContainerRef} className="choices-container" id="mcq-choices-container" role="radiogroup" aria-label="Answer choices" onKeyDown={handleChoiceKeyDown}>
						{currentQuestion.choices.map((choice, index) => (
							<button
								key={`${choice}-${index}`}
								type="button"
								role="radio"
								aria-checked={selectedChoiceIndex === index}
								tabIndex={selectedChoiceIndex === index ? 0 : -1}
								data-choice-index={index}
								className={selectedChoiceIndex === index ? 'choice-button selected' : 'choice-button'}
								disabled={inputDisabled}
								onClick={() => selectChoice(index)}
							>
								<MathText text={choice} />
							</button>
						))}
					</div>
				) : (
					<div className="answer-input-wrapper">
						<textarea
							ref={textareaRef}
							id="answer-box"
							className="answer-input"
							placeholder="Enter your answer here. Use Shift + Enter to submit."
							value={userAnswer}
							onChange={event => setUserAnswer(event.target.value)}
							disabled={inputDisabled}
							aria-label="Answer"
							aria-describedby="expected-format"
						/>
						{previewHasContent && (
							<button type="button" id="clear-answer" className="icon-button clear-answer-btn" aria-label="Clear answer" title="Clear answer input" onClick={handleClear}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d={CLEAR_ICON} />
								</svg>
							</button>
						)}
					</div>
				)}
				{!isMcq && (
					<div className={previewHasContent ? 'math-preview has-content' : 'math-preview'} id="preview">
						{previewHasContent ? <MathText text={userAnswer} /> : null}
					</div>
				)}
				<div id="expected-format" className="expected-format">
					{hasQuestion ? 'Enter a numeric value or expression. Use LaTeX for symbols.' : ''}
				</div>
			</div>
		</div>
	);
}
