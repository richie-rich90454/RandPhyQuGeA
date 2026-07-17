import type {JSX, JSXElement} from "solid-js";
import {createMemo, createSignal, For, Show} from "solid-js";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardSubtitle,
    CardContent,
    CardFooter,
    Badge,
    Pill,
    ProgressBar,
    Spinner,
    Switch,
    Slider,
    Input,
    Select,
    EmptyState,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "../components/ui";
import type {ButtonVariant, ButtonSize} from "../components/ui";
import styles from "./Playground.module.css";
interface SectionProps {
    title: string;
    description?: string;
    code: string;
    children: JSXElement;
}
function CopyButton(props: {title: string; code: string}): JSX.Element {
    let [copied, setCopied] = createSignal(false);
    let handleCopy = () => {
        let text = props.code;
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
            // clipboard unavailable; no-op
        }
    };
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label={`Copy code for ${props.title}`}
            class={`${styles.copyButton} ${copied() ? styles.copyButtonCopied : ""}`}
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
            <Show when={copied()} fallback={<>Copy code</>}>
                Copied!
            </Show>
        </Button>
    );
}
function Section(props: SectionProps): JSX.Element {
    return (
        <Card class={styles.section} padding="lg">
            <CardHeader>
                <div class={styles.sectionHeading}>
                    <CardTitle>{props.title}</CardTitle>
                    <CopyButton title={props.title} code={props.code} />
                </div>
                <Show when={props.description}>
                    <CardSubtitle>{props.description}</CardSubtitle>
                </Show>
            </CardHeader>
            <CardContent>
                <div class={styles.preview}>{props.children}</div>
                <pre class={styles.code}>
                    <code>{props.code}</code>
                </pre>
            </CardContent>
        </Card>
    );
}
let handleBack = () => {
    window.location.hash = "";
};
function BackLink(): JSX.Element {
    return (
        <button type="button" class={styles.backLink} onClick={handleBack} aria-label="Back to app">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Back to app
        </button>
    );
}
const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const BUTTON_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg"];
const BUTTON_VARIANT_SET = new Set<string>(BUTTON_VARIANTS);
const BUTTON_SIZE_SET = new Set<string>(BUTTON_SIZES);
function isButtonVariant(value: string): value is ButtonVariant {
    return BUTTON_VARIANT_SET.has(value);
}
function toButtonVariant(value: string): ButtonVariant {
    return isButtonVariant(value) ? value : "primary";
}
function isButtonSize(value: string): value is ButtonSize {
    return BUTTON_SIZE_SET.has(value);
}
function toButtonSize(value: string): ButtonSize {
    return isButtonSize(value) ? value : "md";
}
const BADGE_VARIANTS = ["default", "success", "warning", "error", "info"] as const;
const PILL_VARIANTS = ["default", "active", "outline"] as const;
const CARD_VARIANTS = ["default", "hover", "filled", "outline", "layer-02"] as const;
export function Playground(): JSX.Element {
    let [buttonVariant, setButtonVariant] = createSignal<ButtonVariant>("primary");
    let [buttonSize, setButtonSize] = createSignal<ButtonSize>("md");
    let [buttonLoading, setButtonLoading] = createSignal(false);
    let [switchChecked, setSwitchChecked] = createSignal(true);
    let [sliderValue, setSliderValue] = createSignal<[number, number]>([25, 75]);
    let [inputValue, setInputValue] = createSignal("");
    let [selectValue, setSelectValue] = createSignal("kinematics");
    let buttonCode = createMemo(() => `<Button variant="${buttonVariant()}" size="${buttonSize()}" loading={${buttonLoading()}}>\n  Live Button\n</Button>`);
    let buttonVariantsCode = `<Button variant="primary">Primary</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="ghost">Ghost</Button>\n<Button variant="danger">Danger</Button>`;
    let buttonSizesCode = `<Button size="xs">XS</Button>\n<Button size="sm">SM</Button>\n<Button size="md">MD</Button>\n<Button size="lg">LG</Button>`;
    let buttonLoadingCode = `<Button loading>Submitting…</Button>`;
    let cardCode = `<Card variant="default" padding="md">\n  <CardHeader>\n    <CardTitle>Title</CardTitle>\n    <CardSubtitle>Subtitle</CardSubtitle>\n  </CardHeader>\n  <CardContent>Body</CardContent>\n  <CardFooter>Footer</CardFooter>\n</Card>`;
    let badgeCode = `<Badge variant="default">Default</Badge>\n<Badge variant="success">Success</Badge>\n<Badge variant="warning">Warning</Badge>\n<Badge variant="error">Error</Badge>\n<Badge variant="info">Info</Badge>`;
    let pillCode = `<Pill name="Default" />\n<Pill name="Active" variant="active" />\n<Pill name="Outline" variant="outline" />`;
    let progressBarCode = `<ProgressBar value={60} />\n<ProgressBar indeterminate />`;
    let spinnerCode = `<Spinner size="sm" />\n<Spinner size="md" />\n<Spinner size="lg" standalone />`;
    let switchCode = `<Switch checked={true} label="Enable feature" onCheckedChange={set} />`;
    let sliderCode = `<Slider min={0} max={100} value={[25, 75]} onChange={set} label="Range" />`;
    let inputCode = `<Input label="Answer" placeholder="Enter…" hint="Units required" />`;
    let selectCode = `<Select label="Topic" options={…} variant="default" />`;
    let emptyStateCode = `<EmptyState title="No questions yet" description="Generate one to begin" />`;
    let tabsCode = `<Tabs defaultValue="a">\n  <TabsList>\n    <TabsTrigger value="a">A</TabsTrigger>\n    <TabsTrigger value="b">B</TabsTrigger>\n  </TabsList>\n  <TabsContent value="a">…</TabsContent>\n</Tabs>`;
    let accordionCode = `<Accordion defaultValue="1">\n  <AccordionItem value="1">\n    <AccordionTrigger>Section 1</AccordionTrigger>\n    <AccordionContent>…</AccordionContent>\n  </AccordionItem>\n</Accordion>`;
    return (
        <div class={styles.root}>
            <header class={styles.header}>
                <BackLink />
                <h1 class={styles.title}>Component Playground</h1>
                <p class={styles.subtitle}>Live showcase of every UI primitive with variants, states, and copyable code.</p>
            </header>
            <Section title="Button — Live Editor" description="Toggle the variant, size, and loading state to see the button update in real time." code={buttonCode()}>
                <div class={styles.liveControls}>
                    <label class={styles.controlLabel}>
                        Variant
                        <select class={styles.controlSelect} value={buttonVariant()} onChange={e => setButtonVariant(toButtonVariant(e.currentTarget.value))}>
                            <For each={BUTTON_VARIANTS}>{v => <option value={v}>{v}</option>}</For>
                        </select>
                    </label>
                    <label class={styles.controlLabel}>
                        Size
                        <select class={styles.controlSelect} value={buttonSize()} onChange={e => setButtonSize(toButtonSize(e.currentTarget.value))}>
                            <For each={BUTTON_SIZES}>{s => <option value={s}>{s}</option>}</For>
                        </select>
                    </label>
                    <label class={styles.controlLabel}>
                        Loading
                        <input type="checkbox" checked={buttonLoading()} onChange={e => setButtonLoading(e.currentTarget.checked)} />
                    </label>
                </div>
                <div class={styles.livePreview}>
                    <Show when={`${buttonVariant()}-${buttonSize()}-${buttonLoading()}`} keyed>
                        <Button variant={buttonVariant()} size={buttonSize()} loading={buttonLoading()}>
                            Live Button
                        </Button>
                    </Show>
                </div>
            </Section>
            <Section title="Button — Variants" code={buttonVariantsCode}>
                <div class={styles.row}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                </div>
            </Section>
            <Section title="Button — Sizes" code={buttonSizesCode}>
                <div class={styles.row}>
                    <Button size="xs">XS</Button>
                    <Button size="sm">SM</Button>
                    <Button size="md">MD</Button>
                    <Button size="lg">LG</Button>
                </div>
            </Section>
            <Section title="Button — Loading" code={buttonLoadingCode}>
                <div class={styles.row}>
                    <Button loading>Submitting…</Button>
                </div>
            </Section>
            <Section title="Card" description="Polymorphic surface with variants, padding, and composable sub-parts." code={cardCode}>
                <div class={styles.row}>
                    <For each={CARD_VARIANTS}>
                        {v => (
                            <Card variant={v} padding="md" class={styles.cardSample}>
                                <CardHeader>
                                    <CardTitle>{v}</CardTitle>
                                </CardHeader>
                                <CardContent>Card content</CardContent>
                                <CardFooter>Footer</CardFooter>
                            </Card>
                        )}
                    </For>
                </div>
            </Section>
            <Section title="Badge" description="Compact pill-shaped labels for statuses and counts." code={badgeCode}>
                <div class={styles.row}>
                    <For each={BADGE_VARIANTS}>{v => <Badge variant={v}>{v}</Badge>}</For>
                </div>
            </Section>
            <Section title="Pill" description="Toggle buttons with active/outline variants." code={pillCode}>
                <div class={styles.row}>
                    <For each={PILL_VARIANTS}>{v => <Pill name={v} variant={v} />}</For>
                </div>
            </Section>
            <Section title="ProgressBar" description="Determinate and indeterminate progress indicators." code={progressBarCode}>
                <div class={styles.column}>
                    <ProgressBar value={60} ariaLabel="Determinate progress" />
                    <ProgressBar indeterminate ariaLabel="Indeterminate progress" />
                </div>
            </Section>
            <Section title="Spinner" description="CSS-only animated spinner in three sizes." code={spinnerCode}>
                <div class={styles.row}>
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" standalone />
                </div>
            </Section>
            <Section title="Switch" description="Toggle with controlled and disabled states." code={switchCode}>
                <div class={styles.column}>
                    <Switch checked={switchChecked()} label="Enable feature" hint="Controlled switch" onCheckedChange={setSwitchChecked} />
                    <Switch defaultChecked={false} label="Disabled off" disabled />
                </div>
            </Section>
            <Section title="Slider" description="Dual-thumb range slider with a filled track." code={sliderCode}>
                <Slider min={0} max={100} value={sliderValue()} onChange={v => setSliderValue(v)} label="Range" hint="Drag the thumbs" />
            </Section>
            <Section title="Input" description="Text input with label, error, and hint affordances." code={inputCode}>
                <div class={styles.column}>
                    <Input label="Answer" placeholder="Enter your answer…" value={inputValue()} onInput={e => setInputValue(e.currentTarget.value)} hint="Units required" />
                    <Input label="With error" placeholder="…" error="This field is required" />
                </div>
            </Section>
            <Section title="Select" description="Select with design-token variants and custom chevron." code={selectCode}>
                <div class={styles.column}>
                    <Select
                        label="Topic"
                        variant="default"
                        options={[
                            {value: "kinematics", label: "Kinematics"},
                            {value: "dynamics", label: "Dynamics"},
                            {value: "energy", label: "Energy"},
                        ]}
                        value={selectValue()}
                        onChange={e => setSelectValue(e.currentTarget.value)}
                    />
                    <Select
                        label="Difficulty"
                        variant="difficulty"
                        options={[
                            {value: "1", label: "Easy"},
                            {value: "2", label: "Medium"},
                            {value: "3", label: "Hard"},
                        ]}
                    />
                </div>
            </Section>
            <Section title="EmptyState" description="Placeholder for empty lists and zero-data views." code={emptyStateCode}>
                <EmptyState
                    title="No questions yet"
                    description="Generate one to begin your practice session."
                    action={
                        <Button variant="primary" size="sm">
                            Generate
                        </Button>
                    }
                />
            </Section>
            <Section title="Tabs" description="Tablist with keyboard navigation and tabpanel content." code={tabsCode}>
                <Tabs defaultValue="overview" ariaLabel="Playground tabs">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="stats">Stats</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">Overview content panel.</TabsContent>
                    <TabsContent value="details">Details content panel.</TabsContent>
                    <TabsContent value="stats">Stats content panel.</TabsContent>
                </Tabs>
            </Section>
            <Section title="Accordion" description="Single-open accordion with animated chevron." code={accordionCode}>
                <Accordion defaultValue="first">
                    <AccordionItem value="first">
                        <AccordionTrigger>What is RandPhyQuGeA?</AccordionTrigger>
                        <AccordionContent>A pure-TypeScript physics question generator.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="second">
                        <AccordionTrigger>Which framework?</AccordionTrigger>
                        <AccordionContent>SolidJS with CSS Modules.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="third">
                        <AccordionTrigger>How to extend?</AccordionTrigger>
                        <AccordionContent>Register new handlers via the Strategy + Registry pattern.</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Section>
        </div>
    );
}
export default Playground;
