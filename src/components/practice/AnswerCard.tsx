import {useRef} from 'react';
import {usePracticeStore} from '../../stores/practiceStore';
import {MathToolbar} from './MathToolbar';
import {MathText} from '../MathText';
import {MathRenderer} from '../MathRenderer';
import type {GeneratedQuestion} from '../../types/models';
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
	const isMcq = currentQuestion?.question_type === 'MultipleChoice' && currentQuestion.choices && currentQuestion.choices.length > 0;
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
	const previewHasContent = userAnswer.trim() !== '';
	return (
		<div className="answer-card card">
			<div className="card-header">
				<h2 className="card-title">Your Answer</h2>
			</div>
			<div className="card-content answer-content">
				<MathToolbar onInsert={handleInsertSymbol} disabled={inputDisabled || isMcq === true} />
				{isMcq && currentQuestion?.choices ? (
					<div className="choices-container" id="mcq-choices-container">
						{currentQuestion.choices.map((choice, index) => (
							<button key={index} type="button" className={selectedChoiceIndex === index ? 'choice-button selected' : 'choice-button'} disabled={inputDisabled} onClick={() => selectChoice(index)}>
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
						{previewHasContent ? <MathRenderer tex={userAnswer} /> : null}
					</div>
				)}
				<div id="expected-format" className="expected-format">
					{hasQuestion ? 'Enter a numeric value or expression. Use LaTeX for symbols.' : ''}
				</div>
			</div>
		</div>
	);
}
