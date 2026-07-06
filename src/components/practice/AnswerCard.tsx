import {useRef} from "react";
import {motion} from "framer-motion";
import {X} from "@phosphor-icons/react";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {MathToolbar} from "./MathToolbar";
import {MathText} from "../MathText";
import {QUESTION_TYPES} from "../../types/models";
import {choiceLetter} from "../../lib/utils";
import {shake} from "../../lib/motion";
import {useReducedMotion} from "../../hooks/useReducedMotion";
/**
 * Answer input card mapped to `.answer-card`.
 *
 * Renders the math toolbar, the answer input area (textarea for short-answer
 * questions or a read-only selected-choice summary for multiple-choice), a
 * live KaTeX preview of the user's answer, and an expected-format hint.
 * Symbol insertion from the math toolbar writes LaTeX at the textarea cursor
 * and updates the practice store.
 */
export function AnswerCard() {
    const currentQuestion = usePracticeStore(selectCurrentQuestion);
    const userAnswer = usePracticeStore(state => state.userAnswer);
    const setUserAnswer = usePracticeStore(state => state.setUserAnswer);
    const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
    const showFeedback = usePracticeStore(state => state.showFeedback);
    const lastResult = usePracticeStore(state => state.lastResult);
    const {reducedMotion} = useReducedMotion();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMcq = currentQuestion?.question_type === QUESTION_TYPES.MC && currentQuestion.choices && currentQuestion.choices.length > 0;
    const hasQuestion = currentQuestion !== null;
    const inputDisabled = !hasQuestion || showFeedback;
    const shouldShake = showFeedback && lastResult !== null && !lastResult.isCorrect;
    const handleInsertSymbol = (latex: string) => {
        const textarea = textareaRef.current;
        if (!textarea || inputDisabled || isMcq) return;
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
        setUserAnswer("");
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.focus();
        }
    };
    const previewHasContent = userAnswer.trim() !== "";
    const selectedChoice = isMcq && currentQuestion?.choices && selectedChoiceIndex >= 0 ? currentQuestion.choices[selectedChoiceIndex] : null;
    return (
        <div className="answer-card card">
            <div className="card-header">
                <h2 className="card-title">Your Answer</h2>
            </div>
            <motion.div
                className="card-content answer-content"
                variants={reducedMotion ? undefined : shake}
                initial="initial"
                animate={reducedMotion || !shouldShake ? "initial" : "shake"}
            >
                <MathToolbar onInsert={handleInsertSymbol} disabled={inputDisabled || isMcq === true} />
                {isMcq ? (
                    <div className="answer-input-wrapper">
                        <div
                            className={selectedChoice ? "answer-input answer-mcq-summary has-content" : "answer-input answer-mcq-summary"}
                            aria-label="Selected answer"
                            role="status"
                        >
                            {selectedChoice ? (
                                <>
                                    <span className="choice-letter" aria-hidden="true">{choiceLetter(selectedChoiceIndex)}</span>
                                    <MathText text={selectedChoice} />
                                </>
                            ) : (
                                <span className="answer-placeholder">Select an option in the question card</span>
                            )}
                        </div>
                        {selectedChoice && (
                            <button type="button" id="clear-answer" className="icon-button clear-answer-btn" aria-label="Clear answer" title="Clear answer input" onClick={() => usePracticeStore.getState().selectChoice(-1)}>
                                <X weight="bold" size={14} aria-hidden="true" />
                            </button>
                        )}
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
                                <X weight="bold" size={14} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
                {!isMcq && (
                    <div className={previewHasContent ? "math-preview has-content" : "math-preview"} id="preview">
                        {previewHasContent ? <MathText text={userAnswer} /> : null}
                    </div>
                )}
                <div id="expected-format" className="expected-format">
                    {hasQuestion ? (isMcq ? "Select the option that best answers the question." : "Enter a numeric value or expression. Use LaTeX for symbols.") : ""}
                </div>
            </motion.div>
        </div>
    );
}
