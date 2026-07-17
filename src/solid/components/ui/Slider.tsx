import type {JSX, JSXElement} from "solid-js";
import {Show, createMemo, splitProps} from "solid-js";
import styles from "./Slider.module.css";
export interface SliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    label?: string;
    error?: string;
    hint?: JSXElement;
    class?: string;
}
let idCounter = 0;
function generateId(): string {
    idCounter = idCounter + 1;
    return `solid-slider-${idCounter}`;
}
/** Dual-thumb range slider with a filled track between the two thumbs. */
export function Slider(props: SliderProps): JSX.Element {
    let [local] = splitProps(props, ["min", "max", "value", "onChange", "label", "error", "hint", "class"]);
    let baseId = generateId();
    let labelId = () => `${baseId}-label`;
    let minInputId = () => `${baseId}-min`;
    let maxInputId = () => `${baseId}-max`;
    let errorId = () => `${baseId}-error`;
    let hintId = () => `${baseId}-hint`;
    let isCollapsed = createMemo(() => local.min === local.max);
    let minValue = createMemo(() => (isCollapsed() ? local.min : (local.value[0] ?? local.min)));
    let maxValue = createMemo(() => (isCollapsed() ? local.max : (local.value[1] ?? local.max)));
    let left = createMemo(() => {
        let range = local.max - local.min;
        if (range === 0) return 0;
        return ((minValue() - local.min) / range) * 100;
    });
    let width = createMemo(() => {
        let range = local.max - local.min;
        if (range === 0) return 0;
        return ((maxValue() - minValue()) / range) * 100;
    });
    let describedBy = () => [local.error ? errorId() : null, local.hint ? hintId() : null].filter(Boolean).join(" ") || undefined;
    let minText = () => (isCollapsed() ? `${local.min}` : `${minValue()}`);
    let maxText = () => (isCollapsed() ? `${local.max}` : `${maxValue()}`);
    let minAriaLabel = () => (local.label ? `Minimum ${local.label}` : "Minimum value");
    let maxAriaLabel = () => (local.label ? `Maximum ${local.label}` : "Maximum value");
    let handleMinChange = (event: Event) => {
        if (isCollapsed()) return;
        let target = event.target;
        if (!(target instanceof HTMLInputElement)) throw new Error("Slider min input is not an HTMLInputElement");
        let next = Math.min(Number(target.value), maxValue() - 1);
        local.onChange([next, maxValue()]);
    };
    let handleMaxChange = (event: Event) => {
        if (isCollapsed()) return;
        let target = event.target;
        if (!(target instanceof HTMLInputElement)) throw new Error("Slider max input is not an HTMLInputElement");
        let next = Math.max(Number(target.value), minValue() + 1);
        local.onChange([minValue(), next]);
    };
    return (
        <div class={`${styles.slider} ${local.class ?? ""}`}>
            <Show when={local.label}>
                <label id={labelId()} for={minInputId()} class={styles.label}>
                    {local.label}
                </label>
            </Show>
            <div class={styles.trackWrap}>
                <div class={styles.track} />
                <div class={styles.filled} data-testid="slider-filled-track" style={{left: `${left()}%`, width: `${width()}%`}} />
                <input
                    id={minInputId()}
                    type="range"
                    min={local.min}
                    max={local.max}
                    value={minValue()}
                    onInput={handleMinChange}
                    aria-label={minAriaLabel()}
                    aria-valuemin={local.min}
                    aria-valuemax={local.max}
                    aria-valuenow={minValue()}
                    aria-valuetext={`Minimum value ${minText()}`}
                    aria-invalid={Boolean(local.error)}
                    aria-describedby={describedBy()}
                    class={styles.thumb}
                />
                <input
                    id={maxInputId()}
                    type="range"
                    min={local.min}
                    max={local.max}
                    value={maxValue()}
                    onInput={handleMaxChange}
                    aria-label={maxAriaLabel()}
                    aria-valuemin={local.min}
                    aria-valuemax={local.max}
                    aria-valuenow={maxValue()}
                    aria-valuetext={`Maximum value ${maxText()}`}
                    aria-invalid={Boolean(local.error)}
                    aria-describedby={describedBy()}
                    class={styles.thumb}
                />
            </div>
            <Show when={local.error}>
                <p id={errorId()} class={styles.error}>
                    {local.error}
                </p>
            </Show>
            <Show when={local.hint}>
                <p id={hintId()} class={styles.hint}>
                    {local.hint}
                </p>
            </Show>
        </div>
    );
}
