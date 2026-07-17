import {createSignal, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import {QuestionHistory} from "../../lib/physics/history/QuestionHistory";
import type {QuestionAttempt, HistoryStats} from "../../lib/physics/history/QuestionHistory";
/** Options accepted by {@link createHistory}. */
export interface CreateHistoryOptions {
    /** Ring-buffer capacity (default 100). */
    capacity?: number;
    /** Pre-seed the buffer with these attempts (e.g. when restoring from persistence). */
    attempts?: QuestionAttempt[];
    /** Optional callback invoked when an attempt is recorded. */
    onRecord?: (attempt: QuestionAttempt) => void;
    /** Optional callback invoked when the consumer requests a re-attempt for a question. */
    onReattempt?: (questionId: string) => void;
}
/** Reactive state returned by {@link createHistory}. */
export interface HistoryState {
    /** All attempts in chronological order (fresh array on each mutation). */
    attempts: Accessor<QuestionAttempt[]>;
    /** The `n` most recent attempts (newest last). */
    recent: (n: number) => QuestionAttempt[];
    /** Number of attempts currently stored. */
    count: Accessor<number>;
    /** Aggregate accuracy stats over the current buffer. */
    stats: Accessor<HistoryStats>;
    /** Question ids whose most recent attempt was incorrect (the re-attempt queue). */
    reattemptQueue: Accessor<string[]>;
    /** Return all attempts for a given question id in chronological order. */
    getByQuestion: (questionId: string) => QuestionAttempt[];
    /** Return the most recent attempt for a question, or undefined. */
    lastAttempt: (questionId: string) => QuestionAttempt | undefined;
    /** Return true when the most recent attempt for `questionId` was incorrect. */
    needsReattempt: (questionId: string) => boolean;
    /** Record an attempt and return the stored record. */
    record: (input: Omit<QuestionAttempt, "id" | "timestamp"> & {timestamp?: number}) => QuestionAttempt;
    /** Request a re-attempt for `questionId`; fires `onReattempt` and returns true when the question needs another attempt. */
    reattempt: (questionId: string) => boolean;
    /** Remove all attempts. */
    clear: () => void;
    /** Return the ring-buffer capacity. */
    getCapacity: () => number;
    /** Return the underlying {@link QuestionHistory} instance (use sparingly; prefer the reactive accessors). */
    inner: () => QuestionHistory;
}
/**
 * Solid primitive wrapping the pure-TS {@link QuestionHistory} class.
 *
 * Exposes reactive `attempts`/`count`/`stats`/`reattemptQueue` accessors that
 * update whenever {@link HistoryState.record} or `clear` mutate the underlying
 * ring buffer, so any UI that subscribes to those accessors re-renders
 * automatically. The `reattempt` method fires the optional `onReattempt`
 * callback so a parent component can route the user back to a question whose
 * most recent attempt was incorrect. The underlying buffer is cleared on
 * disposal.
 */
export function createHistory(options: CreateHistoryOptions = {}): HistoryState {
    let capacity = options.capacity ?? 100;
    let instance = new QuestionHistory(capacity);
    for (let attempt of options.attempts ?? []) {
        instance.record({
            questionId: attempt.questionId,
            correct: attempt.correct,
            response: attempt.response,
            mode: attempt.mode,
            timestamp: attempt.timestamp,
            timeSpentMs: attempt.timeSpentMs,
        });
    }
    let onRecord = options.onRecord;
    let onReattempt = options.onReattempt;
    let [attempts, setAttempts] = createSignal<QuestionAttempt[]>(instance.all());
    let [count, setCount] = createSignal<number>(instance.count());
    let [stats, setStats] = createSignal<HistoryStats>(instance.stats());
    let [reattemptQueue, setReattemptQueue] = createSignal<string[]>(instance.reattemptQueue());
    let sync = () => {
        setAttempts(instance.all());
        setCount(instance.count());
        setStats(instance.stats());
        setReattemptQueue(instance.reattemptQueue());
    };
    let record = (input: Omit<QuestionAttempt, "id" | "timestamp"> & {timestamp?: number}): QuestionAttempt => {
        let attempt = instance.record(input);
        sync();
        onRecord?.(attempt);
        return attempt;
    };
    let reattempt = (questionId: string): boolean => {
        if (!instance.needsReattempt(questionId)) return false;
        onReattempt?.(questionId);
        return true;
    };
    let clear = () => {
        instance.clear();
        sync();
    };
    onCleanup(() => {
        instance.clear();
    });
    return {
        attempts,
        recent: n => instance.recent(n),
        count,
        stats,
        reattemptQueue,
        getByQuestion: id => instance.getByQuestion(id),
        lastAttempt: id => instance.lastAttempt(id),
        needsReattempt: id => instance.needsReattempt(id),
        record,
        reattempt,
        clear,
        getCapacity: () => instance.getCapacity(),
        inner: () => instance,
    };
}
