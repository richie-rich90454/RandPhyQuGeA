import type {JSX} from "solid-js";
import {For, Show, createMemo} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {Badge} from "../ui/Badge";
import {EmptyState} from "../ui/EmptyState";
import {ProgressBar} from "../ui/ProgressBar";
import {useUiStore} from "../../stores/uiStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {usePracticeStore} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {AnalyticsService} from "../../../services/AnalyticsService";
import type {IAnalyticsService, WeakTopic} from "../../../services/contracts";
import type {SpacedRepetitionQueue, SpacedRepetitionItem} from "../../../lib/physics/spaced/SpacedRepetitionQueue";
import styles from "./RecommendModal.module.css";
/** Maximum number of weak topics to display. */
const MAX_RECOMMENDATIONS = 8;
/** Weak-topic accuracy threshold passed to analytics. */
const WEAK_THRESHOLD = 70;
function TargetIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="5" />
			<circle cx="12" cy="12" r="1" />
		</svg>
	);
}
function TrendDownIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M3 7l6 6 4-4 8 8" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M21 17v-4h-4" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function CheckCircleIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M8 12l3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function LightbulbIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M9 18h6M10 21h4" stroke-linecap="round" />
			<path d="M12 3a6 6 0 00-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0012 3z" stroke-linejoin="round" />
		</svg>
	);
}
function ClockIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
export interface RecommendModalProps {
	/** Override the analytics service used for weak-topic computation. */
	analytics?: IAnalyticsService;
	/** Optional spaced-repetition queue whose due items are surfaced for review. */
	spacedRepetition?: SpacedRepetitionQueue;
}
/**
 * Recommend overlay mapped to `#weak-topics-modal`.
 *
 * Solid port of {@link ../../../components/modals/RecommendModal}. Delegates
 * weak-topic computation to the injected {@link IAnalyticsService}, renders a
 * ranked `<ul>` of recommended topics with accuracy progress bars, and lets the
 * user jump into targeted practice for one topic or all weak topics. The
 * analytics service defaults to a fresh {@link AnalyticsService}; pass
 * `analytics` to inject a test double. `@phosphor-icons/react` icons are
 * replaced with inline SVG.
 */
export function RecommendModal(props: RecommendModalProps): JSX.Element {
	let isOpen = useUiStore(s => s.activeModal === "recommend");
	let results = useProgressStore(s => s.results);
	let specification = useSpecStore(s => s.specification);
	let analytics: IAnalyticsService = props.analytics ?? new AnalyticsService();
	let weakTopics = createMemo<WeakTopic[]>(() => {
		let spec = specification();
		if (!spec) return [];
		let r = results();
		if (r.length === 0) return [];
		return analytics.getWeakTopics(r, spec, WEAK_THRESHOLD).slice(0, MAX_RECOMMENDATIONS);
	});
	let dueItems = createMemo<SpacedRepetitionItem[]>(() => {
		if (!props.spacedRepetition) return [];
		return props.spacedRepetition.getDue();
	});
	let totalAttempts = () => results().length;
	let handlePractice = (topicId: string) => {
		usePracticeStore.getState().setSelectedTopicId(topicId);
		useSettingsStore.getState().setDefaultMode("Single");
		useUiStore.getState().closeModal();
	};
	let handlePracticeAll = () => {
		usePracticeStore.getState().setSelectedTopicId(null);
		useSettingsStore.getState().setDefaultMode("Single");
		useUiStore.getState().closeModal();
	};
	let close = () => useUiStore.getState().closeModal();
	return (
		<Modal
			open={isOpen()}
			onClose={close}
			modalId="weak-topics-modal"
			title="Recommended Practice"
			titleId="weak-topics-title"
			ariaLabel="Recommended practice topics"
			class={styles.recommend}
			footer={
				<>
					<Button variant="secondary" size="md" onClick={close}>
						Dismiss
					</Button>
					<Show when={weakTopics().length > 0}>
						<Button variant="primary" size="md" onClick={handlePracticeAll}>
							Practice All
						</Button>
					</Show>
				</>
			}
		>
			<Show when={dueItems().length > 0}>
				<section class={styles.reviewSection} aria-label="Spaced repetition reviews due">
					<div class={styles.reviewHeader}>
						<span class={styles.reviewIcon}>
							<ClockIcon />
						</span>
						<span class={styles.reviewTitle}>Due for Review</span>
						<span class={styles.reviewCount}>{dueItems().length}</span>
					</div>
					<ul class={styles.reviewList}>
						<For each={dueItems()}>
							{item => {
								return (
									<li class={styles.reviewItem}>
										<span class={styles.reviewKey}>{item.key}</span>
										<span class={styles.reviewMeta}>
											{item.interval}d interval · {item.repetitions} rep{item.repetitions === 1 ? "" : "s"}
										</span>
										<Button variant="secondary" size="sm" class={styles.reviewAction} onClick={() => handlePractice(item.key)}>
											Review
										</Button>
									</li>
								);
							}}
						</For>
					</ul>
				</section>
			</Show>
			<Show
				when={weakTopics().length === 0 && dueItems().length === 0}
				fallback={
					<>
						<Card variant="filled" class={styles.summaryCard}>
							<CardContent class={styles.summaryContent}>
								<div class={styles.summaryItem}>
									<span class={`${styles.summaryIcon} ${styles.danger}`}>
										<TrendDownIcon />
									</span>
									<span class={styles.summaryValue}>{weakTopics().length}</span>
									<span class={styles.summaryLabel}>
										topic{weakTopics().length === 1 ? "" : "s"} below {WEAK_THRESHOLD}%
									</span>
								</div>
								<div class={styles.summaryItem}>
									<span class={`${styles.summaryIcon} ${styles.success}`}>
										<CheckCircleIcon />
									</span>
									<span class={styles.summaryValue}>{totalAttempts()}</span>
									<span class={styles.summaryLabel}>attempt{totalAttempts() === 1 ? "" : "s"} recorded</span>
								</div>
							</CardContent>
						</Card>
						<ul class={styles.topicList}>
							<For each={weakTopics()}>
								{topic => {
									let badgeVariant = () => (topic.accuracy < 50 ? "error" : "warning");
									let correctCount = () => Math.round((topic.accuracy / 100) * topic.attempts);
									return (
										<li class={styles.topicItem}>
											<Card variant="hover" class={styles.topicCard}>
												<CardHeader class={styles.topicHeader}>
													<div class={styles.topicTitleRow}>
														<span class={styles.topicIcon}>
															<TargetIcon />
														</span>
														<CardTitle class={styles.topicTitle}>{topic.topicName}</CardTitle>
													</div>
													<Badge variant={badgeVariant()} size="sm">
														{Math.round(topic.accuracy)}%
													</Badge>
												</CardHeader>
												<CardContent class={styles.topicContent}>
													<ProgressBar value={topic.accuracy} ariaLabel={`${topic.topicName} accuracy`} />
													<span class={styles.topicMeta}>
														{topic.attempts} attempt{topic.attempts === 1 ? "" : "s"} · {correctCount()} correct
													</span>
													<Button variant="secondary" size="sm" class={styles.topicAction} onClick={() => handlePractice(topic.topicId)}>
														Practice this topic
													</Button>
												</CardContent>
											</Card>
										</li>
									);
								}}
							</For>
						</ul>
					</>
				}
			>
				<EmptyState
					illustration={<LightbulbIcon />}
					title={totalAttempts() === 0 ? "No recommendations yet" : "Great job! No weak topics found."}
					description={
						totalAttempts() === 0 ? "Complete a few questions and we will highlight topics worth reviewing." : "Your accuracy is strong across every topic you have practiced. Keep it up."
					}
				/>
			</Show>
		</Modal>
	);
}
