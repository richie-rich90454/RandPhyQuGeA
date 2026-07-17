import type {JSX} from "solid-js";
import {createSignal, createMemo, Show, For} from "solid-js";
import {Button, Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter, Badge, EmptyState, Spinner} from "../components/ui";
import {parseSpecification, generateQuestion} from "../../services/physicsCore";
import {QUESTION_TYPE_ALIASES} from "../../types/models";
import type {GeneratedQuestion} from "../../types/models";
import styles from "./Wizard.module.css";
interface WizardState {
    questionType: string;
    difficulty: number;
    templateId: string;
    topicId: string;
    skillId: string;
    textTemplate: string;
    answerExpression: string;
    variables: string;
    distractors: string;
    solutionTemplate: string;
}
const DEFAULT_STATE: WizardState = {
    questionType: "MultipleChoice",
    difficulty: 2,
    templateId: "Q1",
    topicId: "T1",
    skillId: "S1",
    textTemplate: "A car accelerates from {v0} m/s to {v} m/s in {t} s.",
    answerExpression: "(v - v0) / t",
    variables: "v0: Type=double;Min=0;Max=20;Step=1\nv: Type=double;Min=20;Max=40;Step=1\nt: Type=double;Min=1;Max=10;Step=0.5",
    distractors: "(v + v0) / t\nv / t",
    solutionTemplate: "Use a = (v - v0) / t.",
};
const STEPS = ["Type & Difficulty", "Identifiers & Text", "Answer & Variables", "Preview & Export"];
const QUESTION_TYPE_FULL_NAMES = Object.keys(QUESTION_TYPE_ALIASES).filter(k => k !== QUESTION_TYPE_ALIASES[k]);
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5];
function generateSpecText(state: WizardState): string {
    let lines: string[] = [];
    lines.push("[UNIT]");
    lines.push("Id: U1");
    lines.push("Name: Wizard Unit");
    lines.push("[TOPIC]");
    lines.push(`Id: ${state.topicId || "T1"}`);
    lines.push("Name: Wizard Topic");
    lines.push("UnitId: U1");
    lines.push("[SKILL]");
    lines.push(`Id: ${state.skillId || "S1"}`);
    lines.push("Name: Wizard Skill");
    lines.push(`TopicId: ${state.topicId || "T1"}`);
    lines.push("[TEMPLATE]");
    lines.push(`Id: ${state.templateId || "Q1"}`);
    lines.push(`TopicId: ${state.topicId || "T1"}`);
    lines.push(`SkillId: ${state.skillId || "S1"}`);
    lines.push(`QuestionType: ${state.questionType}`);
    lines.push(`Difficulty: ${state.difficulty}`);
    lines.push(`TextTemplate: ${state.textTemplate}`);
    lines.push(`AnswerExpression: ${state.answerExpression}`);
    if (state.solutionTemplate) {
        lines.push(`SolutionTemplate: ${state.solutionTemplate}`);
    }
    for (let line of state.variables.split("\n")) {
        let trimmed = line.trim();
        if (trimmed) lines.push(`Var.${trimmed}`);
    }
    for (let line of state.distractors.split("\n")) {
        let trimmed = line.trim();
        if (trimmed) lines.push(`Distractor: ${trimmed}`);
    }
    return lines.join("\n");
}
function downloadFile(filename: string, content: string): void {
    let blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    let url = URL.createObjectURL(blob);
    let anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
export function Wizard(): JSX.Element {
    let [state, setState] = createSignal<WizardState>(DEFAULT_STATE);
    let [currentStep, setCurrentStep] = createSignal(0);
    let [previewQuestion, setPreviewQuestion] = createSignal<GeneratedQuestion | null>(null);
    let [previewError, setPreviewError] = createSignal<string | null>(null);
    let [generating, setGenerating] = createSignal(false);
    let [copied, setCopied] = createSignal(false);
    let update = (patch: Partial<WizardState>) => {
        setState(prev => ({...prev, ...patch}));
    };
    let specPreview = createMemo(() => generateSpecText(state()));
    let handleNext = () => {
        if (currentStep() < STEPS.length - 1) setCurrentStep(currentStep() + 1);
    };
    let handleBack = () => {
        if (currentStep() > 0) setCurrentStep(currentStep() - 1);
    };
    let handleGenerate = () => {
        let text = specPreview();
        setGenerating(true);
        setPreviewQuestion(null);
        setPreviewError(null);
        parseSpecification(text)
            .then(spec => {
                return generateQuestion(spec);
            })
            .then(question => {
                setPreviewQuestion(question);
            })
            .catch((err: unknown) => {
                let message = err instanceof Error ? err.message : String(err);
                setPreviewError(message);
            })
            .finally(() => {
                setGenerating(false);
            });
    };
    let handleCopy = () => {
        let text = specPreview();
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                navigator.clipboard
                    .writeText(text)
                    .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    })
                    .catch(() => {});
            }
        } catch {
            // clipboard unavailable
        }
    };
    let handleExport = () => {
        downloadFile("wizard-template.txt", specPreview());
    };
    let handleBackToApp = () => {
        window.location.hash = "";
    };
    return (
        <div class={styles.root}>
            <header class={styles.header}>
                <button type="button" class={styles.backLink} onClick={handleBackToApp} aria-label="Back to app">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                        <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    Back to app
                </button>
                <h1 class={styles.title}>Template Authoring Wizard</h1>
                <p class={styles.subtitle}>Build a question template step by step and preview the generated question.</p>
            </header>
            <nav class={styles.stepper} aria-label="Wizard steps">
                <For each={STEPS}>
                    {(step, index) => (
                        <div class={index() === currentStep() ? styles.stepActive : index() < currentStep() ? styles.stepDone : styles.step}>
                            <span class={styles.stepNumber}>{index() + 1}</span>
                            <span class={styles.stepLabel}>{step}</span>
                        </div>
                    )}
                </For>
            </nav>
            <Card padding="lg">
                <CardHeader>
                    <CardTitle>{STEPS[currentStep()]}</CardTitle>
                    <CardSubtitle>
                        Step {currentStep() + 1} of {STEPS.length}
                    </CardSubtitle>
                </CardHeader>
                <CardContent>
                    <Show when={currentStep() === 0}>
                        <div class={styles.form}>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Question Type</span>
                                <select class={styles.select} value={state().questionType} onChange={e => update({questionType: e.currentTarget.value})} aria-label="Question type">
                                    <For each={QUESTION_TYPE_FULL_NAMES}>{t => <option value={t}>{t}</option>}</For>
                                </select>
                            </label>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Difficulty (1-5)</span>
                                <select class={styles.select} value={String(state().difficulty)} onChange={e => update({difficulty: Number(e.currentTarget.value)})} aria-label="Difficulty">
                                    <For each={DIFFICULTY_LEVELS}>{d => <option value={String(d)}>{d}</option>}</For>
                                </select>
                            </label>
                        </div>
                    </Show>
                    <Show when={currentStep() === 1}>
                        <div class={styles.form}>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Template Id</span>
                                <input class={styles.input} type="text" value={state().templateId} onInput={e => update({templateId: e.currentTarget.value})} aria-label="Template id" />
                                <span class={styles.fieldHint}>Unique identifier for this template (e.g. Q1, proj-motion-1).</span>
                            </label>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Topic Id</span>
                                <input class={styles.input} type="text" value={state().topicId} onInput={e => update({topicId: e.currentTarget.value})} aria-label="Topic id" />
                                <span class={styles.fieldHint}>Must match a Topic Id defined in the spec.</span>
                            </label>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Skill Id</span>
                                <input class={styles.input} type="text" value={state().skillId} onInput={e => update({skillId: e.currentTarget.value})} aria-label="Skill id" />
                                <span class={styles.fieldHint}>Must match a Skill Id defined in the spec.</span>
                            </label>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Text Template</span>
                                <textarea
                                    class={styles.textarea}
                                    value={state().textTemplate}
                                    onInput={e => update({textTemplate: e.currentTarget.value})}
                                    spellcheck={false}
                                    aria-label="Text template"
                                />
                                <span class={styles.fieldHint}>
                                    Use {"{variable}"} placeholders for substitution (e.g. {"{v0}"}, {"{t}"}).
                                </span>
                            </label>
                        </div>
                    </Show>
                    <Show when={currentStep() === 2}>
                        <div class={styles.form}>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Answer Expression</span>
                                <input
                                    class={styles.input}
                                    type="text"
                                    value={state().answerExpression}
                                    onInput={e => update({answerExpression: e.currentTarget.value})}
                                    aria-label="Answer expression"
                                />
                                <span class={styles.fieldHint}>Mathematical expression using variable names (e.g. (v - v0) / t).</span>
                            </label>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Variables (one per line: name: Type=...;Min=...;Max=...;Step=...)</span>
                                <textarea class={styles.textarea} value={state().variables} onInput={e => update({variables: e.currentTarget.value})} spellcheck={false} aria-label="Variables" />
                            </label>
                            <Show when={state().questionType === "MultipleChoice"}>
                                <label class={styles.field}>
                                    <span class={styles.fieldLabel}>Distractors (one expression per line)</span>
                                    <textarea
                                        class={styles.textarea}
                                        value={state().distractors}
                                        onInput={e => update({distractors: e.currentTarget.value})}
                                        spellcheck={false}
                                        aria-label="Distractors"
                                    />
                                </label>
                            </Show>
                            <label class={styles.field}>
                                <span class={styles.fieldLabel}>Solution Template (optional)</span>
                                <textarea
                                    class={styles.textarea}
                                    value={state().solutionTemplate}
                                    onInput={e => update({solutionTemplate: e.currentTarget.value})}
                                    spellcheck={false}
                                    aria-label="Solution template"
                                />
                            </label>
                        </div>
                    </Show>
                    <Show when={currentStep() === 3}>
                        <div class={styles.previewSection}>
                            <div class={styles.previewActions}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCopy}
                                    leftIcon={
                                        <Show
                                            when={copied()}
                                            fallback={
                                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                                                    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                                                    <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                                                </svg>
                                            }
                                        >
                                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                                                <path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </Show>
                                    }
                                >
                                    <Show when={copied()} fallback={<>Copy spec</>}>
                                        Copied!
                                    </Show>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleExport}>
                                    Export .txt
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleGenerate} loading={generating()}>
                                    Generate sample question
                                </Button>
                            </div>
                            <pre class={styles.specPreview}>
                                <code>{specPreview()}</code>
                            </pre>
                            <Show when={generating()}>
                                <div class={styles.loadingRow}>
                                    <Spinner size="sm" />
                                    <span>Generating…</span>
                                </div>
                            </Show>
                            <Show when={previewError()}>
                                <EmptyState title="Generation failed" description={previewError() ?? undefined} />
                            </Show>
                            <Show when={previewQuestion()}>
                                {question => (
                                    <div class={styles.questionBlock}>
                                        <div class={styles.questionMeta}>
                                            <Badge variant="info">{question().question_type}</Badge>
                                            <Badge variant="default">Difficulty {question().difficulty}</Badge>
                                            <Badge variant="success">{question().response_mode}</Badge>
                                        </div>
                                        <p class={styles.questionText}>{question().text}</p>
                                        <Show when={question().choices}>
                                            <ul class={styles.choices}>
                                                <For each={question().choices}>
                                                    {(choice, index) => (
                                                        <li class={question().correct_choice_index === index() ? styles.correctChoice : styles.choice}>
                                                            {String.fromCharCode(65 + index())}. {choice}
                                                        </li>
                                                    )}
                                                </For>
                                            </ul>
                                        </Show>
                                        <div class={styles.answerBlock}>
                                            <span class={styles.answerLabel}>Answer:</span>
                                            <span class={styles.answerValue}>{question().answer}</span>
                                        </div>
                                    </div>
                                )}
                            </Show>
                        </div>
                    </Show>
                </CardContent>
                <CardFooter>
                    <div class={styles.footerActions}>
                        <Button variant="ghost" size="md" onClick={handleBack} disabled={currentStep() === 0}>
                            Back
                        </Button>
                        <Button variant="primary" size="md" onClick={handleNext} disabled={currentStep() === STEPS.length - 1}>
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
export default Wizard;
