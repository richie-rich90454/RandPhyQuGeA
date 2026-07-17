import {createSignal, onCleanup, onMount} from "solid-js";
import type {Accessor} from "solid-js";
import {PerfBudget} from "../../lib/perf/PerfBudget";
import type {BudgetEntry, BudgetResult, ResourceMeasurement} from "../../lib/perf/PerfBudget";
export interface CreatePerfBudgetOptions {
    /** Budget entries; defaults to {@link PerfBudget.defaultBudget}. */
    budget?: BudgetEntry[];
    /**
     * Function used to read the current resource entries. Defaults to
     * `performance.getEntriesByType("resource")`. Override for tests.
     */
    getEntries?: () => PerformanceResourceTiming[];
    /** Whether to subscribe to new resource entries via PerformanceObserver. */
    observe?: boolean;
}
export interface CreatePerfBudgetReturn {
    /** Reactive list of budget check results. */
    results: Accessor<BudgetResult[]>;
    /** True when every checked category is within budget. */
    allPassed: Accessor<boolean>;
    /** Re-run the check immediately. */
    refresh: () => void;
    /** The underlying PerfBudget instance. */
    budget: PerfBudget;
}
/**
 * Subscribe to browser resource-timing entries and expose a reactive view of
 * the perf-budget status. The check runs synchronously on creation (against
 * whatever entries are already available), then again on `refresh()` and,
 * when `observe` is true, whenever the PerformanceObserver fires. The
 * observer is disconnected on owner disposal.
 */
export function createPerfBudget(options: CreatePerfBudgetOptions = {}): CreatePerfBudgetReturn {
    let budget = new PerfBudget(options.budget ?? PerfBudget.defaultBudget());
    let getEntries =
        options.getEntries ??
        (() => {
            if (typeof performance === "undefined") return [];
            return performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        });
    let [results, setResults] = createSignal<BudgetResult[]>(budget.check([]));
    let compute = (): BudgetResult[] => {
        let raw = getEntries();
        let measurements: ResourceMeasurement[] = raw.map(entry => ({
            category: PerfBudget.classifyUrl(entry.name),
            bytes: entry.transferSize || entry.encodedBodySize || 0,
            label: entry.name,
        }));
        return budget.check(measurements);
    };
    let refresh = () => {
        setResults(compute());
    };
    onMount(() => {
        refresh();
        if (options.observe && typeof PerformanceObserver !== "undefined") {
            let observer = new PerformanceObserver(() => {
                refresh();
            });
            observer.observe({type: "resource", buffered: false});
            onCleanup(() => {
                observer.disconnect();
            });
        }
    });
    let allPassed = () => results().every(r => r.passed);
    return {results, allPassed, refresh, budget};
}
