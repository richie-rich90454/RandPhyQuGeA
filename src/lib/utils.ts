import type {Specification, Topic} from "../types/models";
/**
 * Join truthy class names into a single string.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}
/**
 * Look up the topic name for a given topic id from the parsed specification.
 * Returns `null` when the topic id is not found or no spec is loaded.
 */
export function findTopicName(specification: Specification | null, topicId: string | undefined): string | null {
    if (!specification || !topicId) return null;
    const topic = specification.topics.find((t: Topic) => t.id === topicId);
    return topic?.name ?? null;
}
/**
 * Resolve the topic id used to scope question generation.
 *
 * Priority: an explicitly `selectedTopicId` (e.g. a clicked topic pill) wins.
 * Otherwise the scope narrows the candidate topics to a single unit (or all
 * topics when scope is `'all'`). When `pickRandomWhenScoped` is true (the
 * Single-mode default), a non-`'all'` scope picks a random topic from that
 * unit even without shuffle; when false (the Mental-mode default), a random
 * topic is only picked when `shuffle` is enabled. Returns `undefined` when no
 * topic should be pinned (the generator then draws from all topics).
 */
export function resolveTopicId(specification: Specification, scope: string, shuffle: boolean, selectedTopicId?: string | null, pickRandomWhenScoped = true): string | undefined {
    if (selectedTopicId) return selectedTopicId;
    const candidateTopics = scope === "all" ? specification.topics : specification.topics.filter(t => t.unit_id === scope);
    if (candidateTopics.length === 0) return undefined;
    const pickRandom = pickRandomWhenScoped ? shuffle || scope !== "all" : shuffle;
    if (pickRandom) {
        const index = Math.floor(Math.random() * candidateTopics.length);
        return candidateTopics[index]?.id;
    }
    return undefined;
}
