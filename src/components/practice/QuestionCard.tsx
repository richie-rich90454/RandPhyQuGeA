import {useMemo, useRef, type KeyboardEvent} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Question, Barbell} from "@phosphor-icons/react";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {useSpecStore} from "../../stores/specStore";
import {findTopicName, choiceLetter} from "../../lib/utils";
import {Card, CardHeader, CardTitle, CardContent, EmptyState, Badge} from "../ui";
import {MathText} from "../MathText";
import {QUESTION_TYPES} from "../../types/models";
import type {BadgeVariant} from "../ui";
import {questionSwap} from "../../lib/motion";
import {useReducedMotion} from "../../hooks/useReducedMotion";
interface DifficultyMeta {
    label: string;
    variant: BadgeVariant;
}
const DIFFICULTY_META: Record<number, DifficultyMeta> = {
    1: {label: "Easy", variant: "success"},
    2: {label: "Medium", variant: "warning"},
    3: {label: "Hard", variant: "error"},
};
function getDifficultyMeta(difficulty: number): DifficultyMeta {
    if (difficulty <= 0) {
        return {label: "Intro", variant: "default"};
    }
    return DIFFICULTY_META[difficulty] ?? {label: "Hard", variant: "error"};
}
/**
 * Question display card mapped to `.question-card`.
 *
 * Reads the current question from the practice store and the parsed spec from
 * the spec store. When no question is loaded, renders the empty-state
 * placeholder; when a question is loaded, renders the topic name and
 * difficulty as header badges, the question text (with inline LaTeX support),
 * and radio-style choice cards for multiple-choice questions.
 */
export function QuestionCard() {
    const currentQuestion = usePracticeStore(selectCurrentQuestion);
    const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
    const selectChoice = usePracticeStore(state => state.selectChoice);
    const showFeedback = usePracticeStore(state => state.showFeedback);
    const specification = useSpecStore(state => state.specification);
    const {reducedMotion} = useReducedMotion();
    const choicesContainerRef = useRef<HTMLDivElement>(null);
    const topicName = useMemo(() => findTopicName(specification, currentQuestion?.topic_id), [specification, currentQuestion?.topic_id]);
    const difficultyMeta = useMemo(() => currentQuestion ? getDifficultyMeta(currentQuestion.difficulty) : null, [currentQuestion]);
    const contentKey = currentQuestion ? currentQuestion.id : "empty";
    const isMcq = currentQuestion?.question_type === QUESTION_TYPES.MC && currentQuestion.choices && currentQuestion.choices.length > 0;
    const hasQuestion = currentQuestion !== null;
    const choicesDisabled = !hasQuestion || showFeedback;
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
    const content = currentQuestion ? (
        <>
            <div className="question-text">
                <MathText text={currentQuestion.text} />
            </div>
            {isMcq && currentQuestion.choices && (
                <div
                    ref={choicesContainerRef}
                    className="choices-container question-choices"
                    id="mcq-choices-container"
                    role="radiogroup"
                    aria-label="Answer choices"
                    onKeyDown={handleChoiceKeyDown}
                >
                    {currentQuestion.choices.map((choice, index) => (
                        <button
                            key={`${currentQuestion.id}-choice-${index}`}
                            type="button"
                            role="radio"
                            aria-checked={selectedChoiceIndex === index}
                            tabIndex={selectedChoiceIndex === index ? 0 : -1}
                            data-choice-index={index}
                            className={selectedChoiceIndex === index ? "choice-button selected" : "choice-button"}
                            disabled={choicesDisabled}
                            onClick={() => selectChoice(index)}
                        >
                            <span className="choice-letter" aria-hidden="true">{choiceLetter(index)}</span>
                            <span className="choice-text">
                                <MathText text={choice} />
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </>
    ) : (
        <EmptyState
            icon={<Question weight="duotone" size={48} aria-hidden="true" />}
            title="Pick a topic and click Generate to start"
        />
    );
    return (
        <Card className="question-card" variant="default" padding="none">
            <CardHeader>
                <CardTitle>Question</CardTitle>
                <div className="question-meta">
                    {topicName && (
                        <Badge variant="default" size="sm">{topicName}</Badge>
                    )}
                    {difficultyMeta && (
                        <Badge variant={difficultyMeta.variant} size="sm">
                            <Barbell weight="regular" size={12} aria-hidden="true" />
                            {difficultyMeta.label}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="question-display" aria-live="polite" role="region" aria-label="Question display">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={contentKey}
                            variants={reducedMotion ? undefined : questionSwap}
                            initial={reducedMotion ? false : "hidden"}
                            animate={reducedMotion ? false : "visible"}
                            exit={reducedMotion ? undefined : "exit"}
                        >
                            {content}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
