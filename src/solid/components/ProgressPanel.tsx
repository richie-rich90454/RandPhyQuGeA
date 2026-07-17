import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Card, CardHeader, CardTitle, CardContent} from "./ui/Card";
import {Badge} from "./ui/Badge";
import {EmptyState} from "./ui/EmptyState";
import {ProgressBar} from "./ui/ProgressBar";
import {Button} from "./ui/Button";
import {useProgressStore} from "../stores/progressStore";
import {useSpecStore} from "../stores/specStore";
import {AnalyticsService} from "../../services/AnalyticsService";
import type {IAnalyticsService} from "../../services/contracts";
import type {PracticeResult} from "../../types/models";
import styles from "./ProgressPanel.module.css";
/** Number of weak topics surfaced in the panel. */
const MAX_WEAK_TOPICS = 5;
/** Number of recent results shown per page. */
const HISTORY_PAGE_SIZE = 5;
function TrendUpIcon(): JSX.Element {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
        </svg>
    );
}
function TargetIcon(): JSX.Element {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" />
        </svg>
    );
}
function FlameIcon(): JSX.Element {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 1-9z" />
        </svg>
    );
}
function CheckCircleIcon(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.5l-4-4 1.4-1.4 2.6 2.6 5.2-5.2 1.4 1.4-6.6 6.6z" />
        </svg>
    );
}
function ClockIcon(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-2V6h2v7z" />
        </svg>
    );
}
export interface ProgressPanelProps {
    /** Analytics service for computing streaks, accuracy, and weak topics. */
    analytics?: IAnalyticsService;
}
/**
 * Progress and analytics panel.
 *
 * Solid port of {@link ../../components/analytics/ProgressPanel}. Surfaces
 * streak, accuracy, weak topics, and a paginated recent history using the
 * injected analytics service. The panel collapses to an empty state until
 * data exists. Framer Motion scroll-reveal and count-up hooks are replaced
 * by direct values and CSS.
 */
export function ProgressPanel(props: ProgressPanelProps): JSX.Element {
    let analytics: IAnalyticsService = props.analytics ?? new AnalyticsService();
    let results = useProgressStore(s => s.results);
    let specification = useSpecStore(s => s.specification);
    let [page, setPage] = createSignal<number>(0);
    let streak = createMemo(() => analytics.getStreak(results()));
    let accuracy = createMemo(() => analytics.getAccuracy(results()));
    let weakTopics = createMemo(() => {
        let spec = specification();
        if (!spec) return [];
        let r = results();
        if (r.length === 0) return [];
        return analytics.getWeakTopics(r, spec).slice(0, MAX_WEAK_TOPICS);
    });
    let totalAttempts = () => results().length;
    let correctCount = () => results().filter(r => r.is_correct).length;
    let sortedResults = createMemo(() => [...results()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    let totalPages = () => Math.max(1, Math.ceil(sortedResults().length / HISTORY_PAGE_SIZE));
    let currentPage = () => Math.min(page(), totalPages() - 1);
    let pageResults = createMemo(() => {
        let start = currentPage() * HISTORY_PAGE_SIZE;
        return sortedResults().slice(start, start + HISTORY_PAGE_SIZE);
    });
    let getTopicName = (topicId: string): string => {
        let spec = specification();
        if (!spec) return topicId;
        let topic = spec.topics.find(t => t.id === topicId);
        return topic?.name ?? topicId;
    };
    let accuracyVariant = (): "success" | "warning" | "error" => {
        let a = accuracy();
        if (a >= 70) return "success";
        if (a >= 50) return "warning";
        return "error";
    };
    let formatTime = (ms: number): string => (ms / 1000).toFixed(1) + "s";
    let formatTimestamp = (timestamp: string): string => new Date(timestamp).toLocaleString();
    let handlePrev = () => setPage(p => Math.max(0, p - 1));
    let handleNext = () => setPage(p => Math.min(totalPages() - 1, p + 1));
    return (
        <Show
            when={totalAttempts() > 0}
            fallback={
                <Card variant="filled" class={styles.emptyCard}>
                    <CardContent class={styles.emptyContent}>
                        <EmptyState illustration={<TrendUpIcon />} title="No progress yet" description="Complete a few questions to see your streak, accuracy, and weak topics." />
                    </CardContent>
                </Card>
            }
        >
            <div class={styles.panel}>
                <div class={styles.statsGrid}>
                    <Card variant="filled" class={styles.statCard}>
                        <CardHeader class={styles.statHeader}>
                            <span class={styles.statIcon}>
                                <TargetIcon />
                            </span>
                            <CardTitle class={styles.statTitle}>Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent class={styles.statContent}>
                            <span class={styles.statValue}>{Math.round(accuracy())}%</span>
                            <ProgressBar value={accuracy()} ariaLabel="Overall accuracy" />
                            <span class={styles.statMeta}>
                                {correctCount()} of {totalAttempts()} correct
                            </span>
                        </CardContent>
                    </Card>
                    <Card variant="filled" class={styles.statCard}>
                        <CardHeader class={styles.statHeader}>
                            <span class={styles.statIcon}>
                                <FlameIcon />
                            </span>
                            <CardTitle class={styles.statTitle}>Streak</CardTitle>
                        </CardHeader>
                        <CardContent class={styles.statContent}>
                            <span class={styles.statValue}>{streak().currentStreak}</span>
                            <span class={styles.statLabel}>current day{streak().currentStreak === 1 ? "" : "s"}</span>
                            <div class={styles.statSubgrid}>
                                <span class={styles.statSubvalue}>{streak().bestStreak} best</span>
                                <span class={styles.statSubvalue}>{streak().totalActiveDays} active</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Show when={weakTopics().length > 0}>
                    <Card variant="filled" class={styles.weakCard}>
                        <CardHeader class={styles.weakHeader}>
                            <div class={styles.weakTitles}>
                                <CardTitle class={styles.sectionTitle}>Weak Topics</CardTitle>
                                <span class={styles.sectionSubtitle}>Focus here to improve your accuracy</span>
                            </div>
                            <Badge variant="warning" size="sm">
                                {weakTopics().length}
                            </Badge>
                        </CardHeader>
                        <CardContent class={styles.weakContent}>
                            <ul class={styles.weakList}>
                                <For each={weakTopics()}>
                                    {topic => (
                                        <li class={styles.weakItem}>
                                            <div class={styles.weakInfo}>
                                                <span class={styles.weakName}>{topic.topicName}</span>
                                                <span class={styles.weakMeta}>
                                                    {topic.attempts} attempt{topic.attempts === 1 ? "" : "s"}
                                                </span>
                                            </div>
                                            <ProgressBar value={topic.accuracy} ariaLabel={`${topic.topicName} accuracy`} />
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </CardContent>
                    </Card>
                </Show>
                <Card variant="filled" class={styles.historyCard}>
                    <CardHeader class={styles.historyHeader}>
                        <div class={styles.historyTitles}>
                            <CardTitle class={styles.sectionTitle}>Recent History</CardTitle>
                            <span class={styles.sectionSubtitle}>
                                Last {totalAttempts()} attempt{totalAttempts() === 1 ? "" : "s"}
                            </span>
                        </div>
                        <Badge variant={accuracyVariant()} size="sm">
                            {Math.round(accuracy())}% accuracy
                        </Badge>
                    </CardHeader>
                    <CardContent class={styles.historyContent}>
                        <ul class={styles.historyList}>
                            <For each={pageResults()}>
                                {(result: PracticeResult) => (
                                    <li class={styles.historyItem}>
                                        <span class={`${styles.historyResult} ${result.is_correct ? styles.correct : styles.incorrect}`}>
                                            {result.is_correct ? <CheckCircleIcon /> : <ClockIcon />}
                                        </span>
                                        <span class={styles.historyTopic}>{getTopicName(result.topic_id)}</span>
                                        <span class={styles.historyMeta}>
                                            {result.mode} · D{result.difficulty} · {formatTime(result.time_taken_ms)}
                                        </span>
                                        <span class={styles.historyTime}>{formatTimestamp(result.timestamp)}</span>
                                    </li>
                                )}
                            </For>
                        </ul>
                        <Show when={totalPages() > 1}>
                            <div class={styles.pagination}>
                                <Button variant="secondary" size="sm" onClick={handlePrev} disabled={currentPage() === 0}>
                                    Previous
                                </Button>
                                <span class={styles.paginationInfo}>
                                    Page {currentPage() + 1} of {totalPages()}
                                </span>
                                <Button variant="secondary" size="sm" onClick={handleNext} disabled={currentPage() >= totalPages() - 1}>
                                    Next
                                </Button>
                            </div>
                        </Show>
                    </CardContent>
                </Card>
            </div>
        </Show>
    );
}
