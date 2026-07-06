import {useRef, type KeyboardEvent} from "react";
import {motion} from "framer-motion";
import {X} from "@phosphor-icons/react";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {MathToolbar} from "./MathToolbar";
import {MathText} from "../MathText";
import {QUESTION_TYPES} from "../../types/models";
import {shake} from "../../lib/motion";
import {useReducedMotion} from "../../hooks/useReducedMotion";
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
    const currentQuestion = usePracticeStore(selectCurrentQuestion);
    const userAnswer = usePracticeStore(state => state.userAnswer);
    const setUserAnswer = usePracticeStore(state => state.setUserAnswer);
    const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
    const selectChoice = usePracticeStore(state => state.selectChoice);
    const showFeedback = usePracticeStore(state => state.showFeedback);
    const lastResult = usePracticeStore(state => state.lastResult);
    const {reducedMotion} = useReducedMotion();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const choicesContainerRef = useRef<HTMLDivElement>(null);
    const isMcq = currentQuestion?.question_type === QUESTION_TYPES.MC && currentQuestion.choices && currentQuestion.choices.length > 0;
    const hasQuestion = currentQuestion !== null;
    const inputDisabled = !hasQuestion || showFeedback;
    const shouldShake = showFeedback && lastResult !== null && !lastResult.isCorrect;
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
        setUserAnswer("");
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
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % count;
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
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
    const previewHasContent = userAnswer.trim() !== "";
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
                                className={selectedChoiceIndex === index ? "choice-button selected" : "choice-button"}
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
                    {hasQuestion ? "Enter a numeric value or expression. Use LaTeX for symbols." : ""}
                </div>
            </motion.div>
        </div>
    );
}
