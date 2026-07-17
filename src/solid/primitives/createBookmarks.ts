import {createSignal, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import {Bookmarks} from "../../lib/physics/history/Bookmarks";
import type {BookmarkEntry} from "../../lib/physics/history/Bookmarks";
/** Options accepted by {@link createBookmarks}. */
export interface CreateBookmarksOptions {
    /** Pre-seed the store with these entries (e.g. when restoring from persistence). */
    entries?: BookmarkEntry[];
    /** Optional callback invoked whenever a bookmark is added (CRUD observability). */
    onAdd?: (entry: BookmarkEntry) => void;
    /** Optional callback invoked whenever a bookmark is removed. */
    onRemove?: (questionId: string) => void;
    /** Optional callback invoked when the consumer requests a re-attempt for a bookmarked question. */
    onReattempt?: (questionId: string) => void;
}
/** Reactive state returned by {@link createBookmarks}. */
export interface BookmarksState {
    /** All bookmarks in insertion order (fresh array on each mutation). */
    entries: Accessor<BookmarkEntry[]>;
    /** Number of bookmarks currently stored. */
    count: Accessor<number>;
    /** Return true when `questionId` is bookmarked. */
    has: (questionId: string) => boolean;
    /** Return the bookmark entry for `questionId`, or undefined. */
    get: (questionId: string) => BookmarkEntry | undefined;
    /** Add a bookmark for `questionId` with an optional note. Returns the stored entry. */
    add: (questionId: string, note?: string) => BookmarkEntry;
    /** Remove a bookmark. Returns true when a bookmark was removed. */
    remove: (questionId: string) => boolean;
    /** Update or clear the note on an existing bookmark. Returns true when the bookmark existed. */
    updateNote: (questionId: string, note?: string) => boolean;
    /** Toggle a bookmark on or off. Returns the new state (true = bookmarked). */
    toggle: (questionId: string, note?: string) => boolean;
    /** Remove all bookmarks. */
    clear: () => void;
    /** Request a re-attempt for the bookmarked question; fires `onReattempt` and returns true when the bookmark exists. */
    reattempt: (questionId: string) => boolean;
    /** Return the underlying {@link Bookmarks} instance (use sparingly; prefer the reactive accessors). */
    inner: () => Bookmarks;
}
/**
 * Solid primitive wrapping the pure-TS {@link Bookmarks} class.
 *
 * Exposes reactive `entries`/`count` accessors that update whenever
 * {@link BookmarksState.add}/`remove`/`updateNote`/`toggle`/`clear` mutate the
 * underlying store, so any UI that subscribes to those accessors re-renders
 * automatically. The `reattempt` method fires the optional `onReattempt`
 * callback so a parent component can route the user back to the bookmarked
 * question for another attempt. The underlying store is reset on disposal.
 */
export function createBookmarks(options: CreateBookmarksOptions = {}): BookmarksState {
    let instance = new Bookmarks();
    for (let entry of options.entries ?? []) {
        instance.add(entry.questionId, entry.note, entry.createdAt);
    }
    let onAdd = options.onAdd;
    let onRemove = options.onRemove;
    let onReattempt = options.onReattempt;
    let [entries, setEntries] = createSignal<BookmarkEntry[]>(instance.getAll());
    let [count, setCount] = createSignal<number>(instance.count());
    let sync = () => {
        setEntries(instance.getAll());
        setCount(instance.count());
    };
    let add = (questionId: string, note?: string): BookmarkEntry => {
        let entry = instance.add(questionId, note);
        sync();
        onAdd?.(entry);
        return entry;
    };
    let remove = (questionId: string): boolean => {
        let had = instance.remove(questionId);
        if (had) {
            sync();
            onRemove?.(questionId);
        }
        return had;
    };
    let updateNote = (questionId: string, note?: string): boolean => {
        let ok = instance.updateNote(questionId, note);
        if (ok) {
            sync();
        }
        return ok;
    };
    let toggle = (questionId: string, note?: string): boolean => {
        let nowBookmarked = instance.toggle(questionId, note);
        sync();
        if (nowBookmarked) {
            onAdd?.(instance.get(questionId)!);
        } else {
            onRemove?.(questionId);
        }
        return nowBookmarked;
    };
    let clear = () => {
        instance.clear();
        sync();
    };
    let reattempt = (questionId: string): boolean => {
        if (!instance.has(questionId)) return false;
        onReattempt?.(questionId);
        return true;
    };
    onCleanup(() => {
        instance.clear();
    });
    return {
        entries,
        count,
        has: id => instance.has(id),
        get: id => instance.get(id),
        add,
        remove,
        updateNote,
        toggle,
        clear,
        reattempt,
        inner: () => instance,
    };
}
