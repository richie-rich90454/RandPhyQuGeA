import {useMemo} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Question} from "@phosphor-icons/react";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {useSpecStore} from "../../stores/specStore";
import {findTopicName} from "../../lib/utils";
import {Card, CardHeader, CardTitle, CardSubtitle, CardContent, EmptyState} from "../ui";
import {MathText} from "../MathText";
import {questionSwap} from "../../lib/motion";
import {useReducedMotion} from "../../hooks/useReducedMotion";
/**
 * Question display card mapped to `.question-card`.
 *
 * Reads the current question from the practice store and the parsed spec from
 * the spec store. When no question is loaded, renders the empty-state
 * placeholder; when a question is loaded, renders the topic name as the card
 * subtitle and the question text (with inline LaTeX support) in the
 * `.question-display` region.
 */
export function QuestionCard() {
    const currentQuestion = usePracticeStore(selectCurrentQuestion);
    const specification = useSpecStore(state => state.specification);
    const {reducedMotion} = useReducedMotion();
    const topicName = useMemo(() => findTopicName(specification, currentQuestion?.topic_id), [specification, currentQuestion?.topic_id]);
    const contentKey = currentQuestion ? currentQuestion.id : "empty";
    const content = currentQuestion ? (
        <MathText text={currentQuestion.text} />
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
                <CardSubtitle>{topicName ?? "Select a topic"}</CardSubtitle>
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
