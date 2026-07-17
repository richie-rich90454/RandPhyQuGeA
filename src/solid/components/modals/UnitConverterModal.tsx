import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {UnitConverter} from "../../../lib/physics/units/UnitConverter";
import {UnitRegistry} from "../../../lib/physics/units/UnitRegistry";
import {useUiStore} from "../../stores/uiStore";
import styles from "./UnitConverterModal.module.css";
/** Sentinel value representing "no source unit selected yet". */
const NONE = "";
/** Format a converted number with up to 8 significant digits, trimming trailing zeros. */
function formatResult(value: number): string {
    if (!Number.isFinite(value)) return "—";
    if (value === Math.trunc(value) && Math.abs(value) < 1e15) return String(Math.trunc(value));
    return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}
function SwapIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M7 4v13M7 17l-3-3M7 17l3-3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M17 20V7M17 7l3 3M17 7l-3 3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
export interface UnitConverterModalProps {
    /** Override the unit converter used (defaults to a standard registry instance). */
    converter?: UnitConverter;
    /** Override the unit registry used to source the unit list (defaults to standard). */
    registry?: UnitRegistry;
}
/**
 * Unit converter overlay mapped to `#unit-converter-modal`.
 *
 * Wraps the pure-TS {@link UnitConverter} in a small interactive dialog: the
 * user picks a source unit from a dropdown, types a numeric value, and picks
 * a target unit from a dimension-compatible dropdown. The converted value
 * renders live in a read-only result field. A swap button exchanges source
 * and target. Pure presentation — no mutations of any store besides the UI
 * store's `closeModal` action.
 */
export function UnitConverterModal(props: UnitConverterModalProps): JSX.Element {
    let isOpen = useUiStore(s => s.activeModal === "unit-converter");
    let close = () => useUiStore.getState().closeModal();
    let registry = () => props.registry ?? UnitConverterModal.defaultRegistry;
    let converter = () => props.converter ?? UnitConverterModal.defaultConverter;
    let [value, setValue] = createSignal<string>("");
    let [fromUnit, setFromUnit] = createSignal<string>(NONE);
    let [toUnit, setToUnit] = createSignal<string>(NONE);
    let allUnits = createMemo<string[]>(() =>
        registry()
            .symbols()
            .slice()
            .sort((a, b) => a.localeCompare(b)),
    );
    let convertibleTargets = createMemo<string[]>(() => {
        let from = fromUnit();
        if (from === NONE) return [];
        // Show every registered unit except the source; the converter reports
        // null for dimensionally-incompatible pairs and the result row surfaces
        // the incompatibility error. This keeps the UX simple (no hidden
        // filtering) and works with registries that do not pre-register SI
        // prefixes as separate symbols.
        return allUnits().filter(u => u !== from);
    });
    let result = createMemo<{ok: true; value: string; unit: string} | {ok: false; error: string}>(() => {
        let raw = value().trim();
        let from = fromUnit();
        let to = toUnit();
        if (raw === "" || from === NONE || to === NONE) {
            return {ok: false, error: "Enter a value and pick both units to convert."};
        }
        let parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            return {ok: false, error: "Value must be a finite number."};
        }
        let converted = converter().convert(parsed, from, to);
        if (converted === null) {
            return {ok: false, error: "Units are not dimensionally compatible."};
        }
        return {ok: true, value: formatResult(converted), unit: to};
    });
    let swap = () => {
        let from = fromUnit();
        let to = toUnit();
        if (from === NONE || to === NONE) return;
        setFromUnit(to);
        setToUnit(from);
    };
    let onPickFrom = (e: Event) => {
        let target = e.currentTarget as HTMLSelectElement;
        setFromUnit(target.value);
        setToUnit(NONE);
    };
    let onPickTo = (e: Event) => {
        let target = e.currentTarget as HTMLSelectElement;
        setToUnit(target.value);
    };
    return (
        <Modal
            open={isOpen()}
            onClose={close}
            modalId="unit-converter-modal"
            title="Unit Converter"
            titleId="unit-converter-title"
            ariaLabel="Unit converter"
            class={styles.unitConverter}
            footer={
                <Button variant="primary" size="md" onClick={close}>
                    Close
                </Button>
            }
        >
            <div class={styles.grid}>
                <label class={`${styles.field} ${styles.valueField}`}>
                    <span class={styles.label}>Value</span>
                    <input
                        type="number"
                        class={styles.input}
                        placeholder="Enter a number"
                        value={value()}
                        onInput={e => setValue(e.currentTarget.value)}
                        aria-label="Numeric value to convert"
                        step="any"
                    />
                </label>
                <label class={`${styles.field} ${styles.fromField}`}>
                    <span class={styles.label}>From unit</span>
                    <select class={styles.select} value={fromUnit()} onChange={onPickFrom} aria-label="Source unit">
                        <option value={NONE}>-- select unit --</option>
                        <For each={allUnits()}>{u => <option value={u}>{u}</option>}</For>
                    </select>
                </label>
                <div class={styles.swapCell}>
                    <Button variant="ghost" size="sm" type="button" onClick={swap} aria-label="Swap source and target units" disabled={fromUnit() === NONE || toUnit() === NONE}>
                        <SwapIcon />
                        <span>Swap</span>
                    </Button>
                </div>
                <label class={`${styles.field} ${styles.toField}`}>
                    <span class={styles.label}>To unit</span>
                    <select class={styles.select} value={toUnit()} onChange={onPickTo} aria-label="Target unit" disabled={convertibleTargets().length === 0}>
                        <option value={NONE}>{convertibleTargets().length === 0 ? "-- pick source first --" : "-- select unit --"}</option>
                        <For each={convertibleTargets()}>{u => <option value={u}>{u}</option>}</For>
                    </select>
                </label>
            </div>
            <div class={styles.resultRow} aria-live="polite">
                <Show
                    when={result().ok}
                    fallback={
                        <p class={styles.resultError} role="status">
                            {(result() as {ok: false; error: string}).error}
                        </p>
                    }
                >
                    <p class={styles.resultText}>
                        <span class={styles.resultValue}>{(result() as {ok: true; value: string}).value}</span>
                        <span class={styles.resultUnit}>{(result() as {ok: true; unit: string}).unit}</span>
                    </p>
                </Show>
            </div>
            <p class={styles.hint}>Units share the same physical dimension (length, mass, time, etc.). The target dropdown only shows units convertible from the source.</p>
        </Modal>
    );
}
export namespace UnitConverterModal {
    /** Default unit registry instance shared across renders. */
    export const defaultRegistry: UnitRegistry = UnitRegistry.createDefault();
    /** Default unit converter instance shared across renders. */
    export const defaultConverter: UnitConverter = new UnitConverter(defaultRegistry);
}
