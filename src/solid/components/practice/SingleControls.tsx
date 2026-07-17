import type {JSX} from "solid-js";
import {Show, createEffect, createMemo, createSignal, onCleanup, onMount} from "solid-js";
import {ToolbarGroup} from "../ui/Toolbar";
import {Button} from "../ui/Button";
import {Select} from "../ui/Select";
import {Switch} from "../ui/Switch";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/Tooltip";
import {useToast} from "../ui/Toast";
import {usePracticeStore, selectIsActive, selectCurrentQuestion} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {createPracticeActions} from "../../primitives/createPracticeActions";
import {useServiceProvider} from "../../providers/ServiceProvider";
import {PhysicsService} from "../../../services/PhysicsService";
import {SessionService} from "../../../services/SessionService";
import {AnalyticsService} from "../../../services/AnalyticsService";
import {resolveTopicId} from "../../../lib/utils";
import {QUESTION_TYPES} from "../../../types/models";
import type {Specification} from "../../../types/models";
import type {Session} from "../../../services/contracts";
import type {IPhysicsService, ISessionService} from "../../../services/contracts";
import styles from "./SingleControls.module.css";
function handleScope(e: Event): void {
    let target = e.target;
    if (!(target instanceof HTMLSelectElement)) throw new Error("Expected HTMLSelectElement");
    useSettingsStore.getState().setDefaultScope(target.value);
}
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
    let options: {value: string; label: string}[] = [{value: "all", label: "All"}];
    if (specification) {
        for (let unit of specification.units) {
            options.push({value: unit.id, label: unit.name});
        }
    }
    return options;
}
function PlusIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
    );
}
function CheckIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
/**
 * Single-mode bottom-row controls mapped to `#single-controls`.
 *
 * Solid port of {@link ../../../components/practice/SingleControls} with the
 * {@link ../../../hooks/useSingleMode} logic inlined. Renders the Generate
 * (Ctrl+G) and Check (Shift+Enter) buttons inside an actions group, and the
 * Auto toggle, scope select, and Shuffle toggle inside an options group.
 * Generate resolves a topic, calls `PhysicsService.generateQuestion`, builds a
 * Single-mode session, and hands it to `SessionService`. Check delegates to
 * `createPracticeActions`. Auto-generate fires 3s after feedback is shown;
 * Ctrl+G triggers generate globally. Services are resolved lazily from the
 * `ServiceProvider` context. `@phosphor-icons/react` icons are replaced with
 * inline SVG.
 */
export function SingleControls(): JSX.Element {
    let selectedTopicId = usePracticeStore(s => s.selectedTopicId);
    let autoEnabled = useSettingsStore(s => s.autoContinueEnabled);
    let scope = useSettingsStore(s => s.defaultScope);
    let shuffle = useSettingsStore(s => s.shuffleByDefault);
    let responseMode = useSettingsStore(s => s.defaultResponseMode);
    let isActive = usePracticeStore(selectIsActive);
    let showFeedback = usePracticeStore(s => s.showFeedback);
    let userAnswer = usePracticeStore(s => s.userAnswer);
    let selectedChoiceIndex = usePracticeStore(s => s.selectedChoiceIndex);
    let selectedChoiceIndices = usePracticeStore(s => s.selectedChoiceIndices);
    let currentQuestion = usePracticeStore(selectCurrentQuestion);
    let specification = useSpecStore(s => s.specification);
    let {toast} = useToast();
    let [isGenerating, setIsGenerating] = createSignal(false);
    let canCheck = createMemo(() => {
        if (!isActive() || showFeedback()) return false;
        if (currentQuestion()?.correct_choice_indices !== undefined) {
            return selectedChoiceIndices().length > 0;
        }
        return userAnswer().trim() !== "" || selectedChoiceIndex() >= 0;
    });
    let scopeOptions = createMemo(() => buildScopeOptions(specification()));
    let cachedPhysics: IPhysicsService | null = null;
    let cachedSession: ISessionService | null = null;
    let resolveServices = (): {physics: IPhysicsService; session: ISessionService} => {
        if (!cachedSession) {
            let {core} = useServiceProvider();
            cachedPhysics = new PhysicsService(core);
            cachedSession = new SessionService(cachedPhysics, new AnalyticsService());
        }
        return {physics: cachedPhysics!, session: cachedSession};
    };
    let generate = async () => {
        if (isGenerating()) return;
        let spec = specification();
        if (!spec) return;
        setIsGenerating(true);
        let topicId = resolveTopicId(spec, scope(), shuffle(), selectedTopicId());
        let questionType = responseMode() === "mcq" ? QUESTION_TYPES.MC : undefined;
        try {
            let {physics, session} = resolveServices();
            let question = await physics.generateQuestion(spec, {topicId, questionType});
            let now = Date.now();
            let sessionObj: Session = {
                id: crypto.randomUUID(),
                specification: spec,
                questions: [question],
                mode: "Single",
                currentIndex: 0,
                results: [],
                isActive: true,
                isFinished: false,
                questionStartTime: now,
                sessionStartTime: now,
            };
            await session.resumeSession({session: sessionObj, createdAt: new Date().toISOString()});
            let store = usePracticeStore.getState();
            store.setSession(sessionObj);
            store.resetAnswerUi();
        } catch (err) {
            let message = err instanceof Error ? err.message : String(err);
            toast({variant: "error", message: "Failed to generate question: " + message});
        } finally {
            setIsGenerating(false);
        }
    };
    let {check} = createPracticeActions({mode: "Single", onError: message => toast({variant: "error", message: "Failed to check answer: " + message})});
    createEffect(() => {
        if (!showFeedback() || !autoEnabled()) return;
        let id = window.setTimeout(() => {
            void generate();
        }, 3000);
        onCleanup(() => window.clearTimeout(id));
    });
    let handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && (event.key === "g" || event.key === "G")) {
            event.preventDefault();
            void generate();
        }
    };
    onMount(() => {
        window.addEventListener("keydown", handleKeyDown);
    });
    onCleanup(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });
    return (
        <div id="single-controls" class={styles.wrapper}>
            <ToolbarGroup label="Actions" class={styles.actions}>
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Button variant="primary" size="sm" leftIcon={<PlusIcon />} loading={isGenerating()} onClick={() => void generate()}>
                            {isGenerating() ? "Generating…" : "Generate"}
                            <Show when={!isGenerating()}>
                                <kbd class={styles.shortcut}>Ctrl+G</kbd>
                            </Show>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Generate a new question</TooltipContent>
                </Tooltip>
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Button variant="secondary" size="sm" leftIcon={<CheckIcon />} onClick={() => void check()} disabled={!canCheck()}>
                            Check
                            <kbd class={styles.shortcut}>Shift+Enter</kbd>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Check your answer</TooltipContent>
                </Tooltip>
            </ToolbarGroup>
            <ToolbarGroup label="Options" class={styles.options}>
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Auto" checked={autoEnabled()} onCheckedChange={checked => useSettingsStore.getState().setAutoContinueEnabled(checked)} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Auto-generate next question after 3 seconds</TooltipContent>
                </Tooltip>
                <Select id="scope-select" variant="scope" aria-label="Scope" options={scopeOptions()} value={scope()} onInput={handleScope} />
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Shuffle" checked={shuffle()} onCheckedChange={checked => useSettingsStore.getState().setShuffleByDefault(checked)} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Randomly pick topics</TooltipContent>
                </Tooltip>
            </ToolbarGroup>
        </div>
    );
}
