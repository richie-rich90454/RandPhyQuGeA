import type {JSX, JSXElement} from "solid-js";
import {Show, createMemo, createSignal, onCleanup, onMount} from "solid-js";
import {Button} from "../ui/Button";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useUiStore} from "../../stores/uiStore";
import {useServiceProvider} from "../../providers/ServiceProvider";
import {SessionService} from "../../../services/SessionService";
import {AnalyticsService} from "../../../services/AnalyticsService";
import {PhysicsService} from "../../../services/PhysicsService";
import type {ISessionService} from "../../../services/contracts";
import styles from "./AnswerSection.module.css";
function CheckIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
function ArrowRightIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
export interface AnswerSectionProps {
    /** Answer input card slot (AnswerCard in task 3.8d). */
    answerCard?: JSXElement;
    /** Results feedback card slot (ResultsCard in task 3.8e). */
    resultsCard?: JSXElement;
    /** Extra class for the answer section wrapper. */
    class?: string;
    /** Error sink invoked when `submit` or `advance` reject. When omitted the error re-throws. */
    onError?: (message: string) => void;
}
/**
 * Answer section grid mapped to `.answer-section`.
 *
 * Solid port of {@link ../../../components/practice/AnswerSection} with the
 * {@link ../../../hooks/useAnswerActions} logic inlined. Composes the answer
 * input card (supplied via the `answerCard` slot), primary action buttons
 * (Check / Next), and the results feedback card (supplied via the
 * `resultsCard` slot). Submission and advance logic is wired directly to the
 * OOP service layer with lazy `SessionService` resolution so the component
 * renders idle without a provider. Global keyboard shortcuts (1-4 for MCQ
 * choices, Enter/Shift+Enter to submit or advance) are attached at this level.
 * `@phosphor-icons/react` icons are replaced with inline SVG.
 */
export function AnswerSection(props: AnswerSectionProps): JSX.Element {
    let showFeedback = usePracticeStore(s => s.showFeedback);
    let userAnswer = usePracticeStore(s => s.userAnswer);
    let selectedChoiceIndex = usePracticeStore(s => s.selectedChoiceIndex);
    let selectedChoiceIndices = usePracticeStore(s => s.selectedChoiceIndices);
    let session = usePracticeStore(s => s.session);
    let currentQuestion = usePracticeStore(selectCurrentQuestion);
    let [isSubmitting, setIsSubmitting] = createSignal(false);
    let cachedSession: ISessionService | null = null;
    let resolveSession = (): ISessionService => {
        if (!cachedSession) {
            let {core} = useServiceProvider();
            let physics = new PhysicsService(core);
            cachedSession = new SessionService(physics, new AnalyticsService());
        }
        return cachedSession;
    };
    let isMultiSelect = createMemo(() => currentQuestion()?.correct_choice_indices !== undefined);
    let canSubmit = createMemo(() => {
        if (!session() || !currentQuestion() || showFeedback()) return false;
        if (isMultiSelect()) return selectedChoiceIndices().length > 0;
        return userAnswer().trim() !== "" || selectedChoiceIndex() >= 0;
    });
    let canAdvance = createMemo(() => {
        let s = session();
        if (!s || !showFeedback()) return false;
        return s.currentIndex < s.questions.length - 1;
    });
    let submit = async () => {
        let store = usePracticeStore.getState();
        let q = selectCurrentQuestion(store);
        if (!store.session || !q || store.showFeedback) return;
        if (isSubmitting()) return;
        setIsSubmitting(true);
        try {
            let sessionService = resolveSession();
            let answer = store.userAnswer;
            let choiceIndex: number | undefined = undefined;
            if (q.correct_choice_indices !== undefined) {
                let sorted = [...store.selectedChoiceIndices].toSorted((a, b) => a - b);
                answer = sorted.join(",");
            } else {
                choiceIndex = store.selectedChoiceIndex >= 0 ? store.selectedChoiceIndex : undefined;
            }
            let result = await sessionService.submitAnswer(answer, choiceIndex);
            useProgressStore.getState().addResults([result]);
            usePracticeStore.setState({
                session: sessionService.getSession(),
                showFeedback: true,
                lastResult: {isCorrect: result.is_correct, correctAnswer: q.answer},
            });
        } catch (err) {
            if (props.onError) {
                props.onError(err instanceof Error ? err.message : String(err));
            } else {
                throw err;
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    let advance = async () => {
        let store = usePracticeStore.getState();
        if (!store.session || !store.showFeedback) return;
        try {
            let sessionService = resolveSession();
            let advanced = await sessionService.advanceQuestion();
            if (advanced) {
                usePracticeStore.setState({
                    session: sessionService.getSession(),
                    userAnswer: "",
                    selectedChoiceIndex: -1,
                    selectedChoiceIndices: [],
                    showFeedback: false,
                    lastResult: null,
                });
            } else {
                await sessionService.finishSession();
                usePracticeStore.setState({
                    session: sessionService.getSession(),
                });
            }
        } catch (err) {
            if (props.onError) {
                props.onError(err instanceof Error ? err.message : String(err));
            } else {
                throw err;
            }
        }
    };
    let handleKeyDown = (event: KeyboardEvent) => {
        if (useUiStore.getState().activeModal) return;
        let store = usePracticeStore.getState();
        let q = selectCurrentQuestion(store);
        let target = event.target;
        let isTyping = target instanceof HTMLElement && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable);
        let digit = event.key;
        if (!isTyping && !store.showFeedback && q?.response_mode === "mcq" && q.choices && q.choices.length > 0 && q.correct_choice_indices === undefined) {
            if (digit >= "1" && digit <= "9") {
                let index = parseInt(digit, 10) - 1;
                if (index < q.choices.length) {
                    event.preventDefault();
                    usePracticeStore.getState().selectChoice(index);
                }
            }
        }
        if (event.key === "Enter") {
            if (store.showFeedback && canAdvance()) {
                event.preventDefault();
                void advance();
            } else if (event.shiftKey && canSubmit()) {
                event.preventDefault();
                void submit();
            }
        }
    };
    onMount(() => {
        window.addEventListener("keydown", handleKeyDown);
    });
    onCleanup(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });
    return (
        <div class={`${styles.answerSection} ${props.class ?? ""}`}>
            <div class={styles.answerCardWrapper}>
                {props.answerCard}
                <div class={styles.answerActions}>
                    <Show
                        when={showFeedback()}
                        fallback={
                            <Button variant="primary" size="md" leftIcon={<CheckIcon />} onClick={() => void submit()} disabled={!canSubmit() || isSubmitting()} loading={isSubmitting()}>
                                Check
                            </Button>
                        }
                    >
                        <Button variant="primary" size="md" rightIcon={<ArrowRightIcon />} onClick={() => void advance()} disabled={!canAdvance() || isSubmitting()} loading={isSubmitting()}>
                            Next
                        </Button>
                    </Show>
                </div>
            </div>
            {props.resultsCard}
        </div>
    );
}
