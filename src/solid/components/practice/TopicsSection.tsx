import type {JSX} from "solid-js";
import {For, Show, createMemo} from "solid-js";
import {ToolbarSection, ToolbarTitle} from "../ui/Toolbar";
import {Pill} from "../ui/Pill";
import {useSpecStore} from "../../stores/specStore";
import {usePracticeStore} from "../../stores/practiceStore";
import {useUiStore} from "../../stores/uiStore";
import type {Specification, Topic, Unit} from "../../../types/models";
import styles from "./TopicsSection.module.css";
function handlePillClick(topicId: string): void {
    let current = usePracticeStore.getState().selectedTopicId;
    usePracticeStore.getState().setSelectedTopicId(current === topicId ? null : topicId);
}
function handleSearch(e: Event): void {
    let target = e.target;
    if (!(target instanceof HTMLInputElement)) throw new Error("Expected HTMLInputElement");
    useUiStore.getState().setSearchQuery(target.value);
}
/** Derive a short uppercase abbreviation from a unit name for the topic-pill icon. */
function getUnitAbbreviation(unitName: string): string {
    let trimmed = unitName.trim();
    if (trimmed.length === 0) return "?";
    let words = trimmed.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2) {
        return words
            .slice(0, 2)
            .map(word => word[0] ?? "")
            .join("")
            .toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
}
interface TopicPillEntry {
    topic: Topic;
    abbreviation: string;
    unitName: string;
}
/** Build a flat list of topic-pill entries from the specification, grouped by unit for the pill icon. */
function buildTopicEntries(specification: Specification): TopicPillEntry[] {
    let unitById = new Map<string, Unit>();
    for (let unit of specification.units) {
        unitById.set(unit.id, unit);
    }
    return specification.topics.map(topic => {
        let unit = unitById.get(topic.unit_id);
        let unitName = unit?.name ?? "";
        let abbreviation = unitName ? getUnitAbbreviation(unitName) : "?";
        return {topic, abbreviation, unitName};
    });
}
/**
 * Topics section with a search input and topic filter pills.
 *
 * Solid port of {@link ../../../components/practice/TopicsSection}. Pills are
 * rendered from the parsed specification (grouped by unit for the icon
 * abbreviation), filtered by the UI store's search query. Selecting a pill
 * writes the topic id to the practice store so question generation can scope to
 * that topic. A null selection (clicking the active pill again) clears the
 * filter. `useMemo` becomes `createMemo`; the search input uses `onInput`.
 */
export function TopicsSection(): JSX.Element {
    let specification = useSpecStore(s => s.specification);
    let loading = useSpecStore(s => s.loading);
    let error = useSpecStore(s => s.error);
    let selectedTopicId = usePracticeStore(s => s.selectedTopicId);
    let searchQuery = useUiStore(s => s.searchQuery);
    let entries = createMemo(() => (specification() ? buildTopicEntries(specification()!) : []));
    let filteredEntries = createMemo(() => {
        let query = searchQuery().trim().toLowerCase();
        if (query === "") return entries();
        return entries().filter(entry => {
            return entry.topic.name.toLowerCase().includes(query) || entry.unitName.toLowerCase().includes(query);
        });
    });
    return (
        <ToolbarSection class={styles.section}>
            <ToolbarTitle id="topics-heading">Topics</ToolbarTitle>
            <div class={styles.searchWrap}>
                <input type="text" id="topic-search" class={styles.search} placeholder="Search topics..." aria-label="Search topics" value={searchQuery()} onInput={handleSearch} />
            </div>
            <div class={styles.pills} id="topic-grid" role="group" aria-labelledby="topics-heading" aria-busy={loading()}>
                <Show when={loading()}>
                    <span class={styles.srOnly}>Loading topics…</span>
                    <div class={styles.skeleton} aria-hidden="true">
                        <span class={styles.skeletonPill} />
                        <span class={styles.skeletonPill} />
                        <span class={styles.skeletonPill} />
                    </div>
                </Show>
                <Show when={error()}>
                    <span class={styles.name}>Error: {error()?.message}</span>
                </Show>
                <Show when={!loading() && !error() && filteredEntries().length === 0}>
                    <span class={styles.name}>No topics found.</span>
                </Show>
                <For each={filteredEntries()}>
                    {entry => {
                        return (
                            <Pill
                                name={entry.topic.name}
                                icon={entry.abbreviation}
                                active={selectedTopicId() === entry.topic.id}
                                onClick={() => handlePillClick(entry.topic.id)}
                                ariaLabel={`${entry.topic.name} (${entry.abbreviation})`}
                            />
                        );
                    }}
                </For>
            </div>
        </ToolbarSection>
    );
}
