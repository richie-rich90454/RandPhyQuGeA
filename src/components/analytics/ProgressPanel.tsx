import {useMemo, useState} from "react";
import {TrendUp, Flame, Target, Clock, CheckCircle} from "@phosphor-icons/react";
import {Card, CardContent, CardHeader, CardTitle, Badge, EmptyState, ProgressBar, Button} from "../ui";
import {ScrollReveal} from "../animations";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {useServices} from "../../hooks/useServices";
import {useCountUp} from "../../hooks/useCountUp";
/** Number of weak topics surfaced in the panel. */
const MAX_WEAK_TOPICS = 5;
/** Number of recent results shown per page. */
const HISTORY_PAGE_SIZE = 5;
/**
 * Progress and analytics panel.
 *
 * Surfaces streak, accuracy, weak topics, and a paginated recent history
 * using the injected analytics service. Numeric values animate with a
 * count-up effect; the panel collapses to an empty state until data exists.
 */
export function ProgressPanel() {
	const results = useProgressStore(state => state.results);
	const specification = useSpecStore(state => state.specification);
	const {analytics} = useServices();
	const [page, setPage] = useState(0);
	const streak = useMemo(() => analytics.getStreak(results), [results, analytics]);
	const accuracy = useMemo(() => analytics.getAccuracy(results), [results, analytics]);
	const weakTopics = useMemo(() => {
		if (!specification || results.length === 0) {
			return [];
		}
		return analytics.getWeakTopics(results, specification).slice(0, MAX_WEAK_TOPICS);
	}, [results, specification, analytics]);
	const totalAttempts = results.length;
	const correctCount = results.filter(r => r.is_correct).length;
	const sortedResults = useMemo(() => [...results].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [results]);
	const totalPages = Math.max(1, Math.ceil(sortedResults.length / HISTORY_PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageResults = sortedResults.slice(currentPage * HISTORY_PAGE_SIZE, (currentPage + 1) * HISTORY_PAGE_SIZE);
	const animatedAccuracy = useCountUp(Math.round(accuracy));
	const animatedStreak = useCountUp(streak.currentStreak);
	const animatedBest = useCountUp(streak.bestStreak);
	const animatedActive = useCountUp(streak.totalActiveDays);
	const animatedAttempts = useCountUp(totalAttempts);
	const animatedCorrect = useCountUp(correctCount);
	const getTopicName = (topicId: string): string => {
		const topic = specification?.topics.find(t => t.id === topicId);
		return topic?.name ?? topicId;
	};
	if (results.length === 0) {
		return (
			<ScrollReveal direction="up" distance={12} duration={0.4}>
				<Card variant="filled" className="progress-empty-card">
					<CardContent className="progress-empty-content">
						<EmptyState
							illustration={<TrendUp className="h-12 w-12" aria-hidden="true" />}
							title="No progress yet"
							description="Complete a few questions to see your streak, accuracy, and weak topics."
						/>
					</CardContent>
				</Card>
			</ScrollReveal>
		);
	}
	return (
		<ScrollReveal className="progress-panel" direction="up" distance={12} duration={0.4}>
			<div className="progress-grid">
				<Card variant="filled" className="progress-stat-card">
					<CardHeader className="progress-stat-header">
						<Target className="h-5 w-5 text-accent-600" aria-hidden="true" />
						<CardTitle className="progress-stat-title">Accuracy</CardTitle>
					</CardHeader>
					<CardContent className="progress-stat-content">
						<span className="progress-stat-value">{animatedAccuracy}%</span>
						<ProgressBar value={accuracy} ariaLabel="Overall accuracy" />
						<span className="progress-stat-meta">{animatedCorrect} of {animatedAttempts} correct</span>
					</CardContent>
				</Card>
				<Card variant="filled" className="progress-stat-card">
					<CardHeader className="progress-stat-header">
						<Flame className="h-5 w-5 text-warning" aria-hidden="true" />
						<CardTitle className="progress-stat-title">Streak</CardTitle>
					</CardHeader>
					<CardContent className="progress-stat-content">
						<span className="progress-stat-value">{animatedStreak}</span>
						<span className="progress-stat-label">current day{streak.currentStreak === 1 ? "" : "s"}</span>
						<div className="progress-stat-subgrid">
							<span className="progress-stat-subvalue">{animatedBest} best</span>
							<span className="progress-stat-subvalue">{animatedActive} active</span>
						</div>
					</CardContent>
				</Card>
			</div>
			{weakTopics.length > 0 && (
				<Card variant="filled" className="progress-weak-card">
					<CardHeader className="progress-weak-header">
						<div className="progress-weak-titles">
							<CardTitle className="progress-section-title">Weak Topics</CardTitle>
							<span className="progress-section-subtitle">Focus here to improve your accuracy</span>
						</div>
						<Badge variant="warning" size="sm">{weakTopics.length}</Badge>
					</CardHeader>
					<CardContent className="progress-weak-content">
						<ul className="progress-weak-list">
							{weakTopics.map(topic => (
								<li key={topic.topicId} className="progress-weak-item">
									<div className="progress-weak-info">
										<span className="progress-weak-name">{topic.topicName}</span>
										<span className="progress-weak-meta">{topic.attempts} attempt{topic.attempts === 1 ? "" : "s"}</span>
									</div>
									<ProgressBar value={topic.accuracy} ariaLabel={`${topic.topicName} accuracy`} />
								</li>
							))}
							</ul>
						</CardContent>
					</Card>
				)}
			<Card variant="filled" className="progress-history-card">
				<CardHeader className="progress-history-header">
					<div className="progress-history-titles">
						<CardTitle className="progress-section-title">Recent History</CardTitle>
						<span className="progress-section-subtitle">Last {totalAttempts} attempt{totalAttempts === 1 ? "" : "s"}</span>
					</div>
					{totalAttempts > 0 && (
						<Badge variant={accuracy >= 70 ? "success" : accuracy >= 50 ? "warning" : "error"} size="sm">
							{Math.round(accuracy)}% accuracy
						</Badge>
						)}
				</CardHeader>
				<CardContent className="progress-history-content">
					<ul className="progress-history-list">
						{pageResults.map(result => (
							<li key={result.id} className="progress-history-item">
								<span className={`progress-history-result ${result.is_correct ? "correct" : "incorrect"}`}>
									{result.is_correct ? <CheckCircle weight="fill" /> : <Clock weight="fill" />}
								</span>
								<span className="progress-history-topic">{getTopicName(result.topic_id)}</span>
								<span className="progress-history-meta">
									{result.mode} &middot; D{result.difficulty} &middot; {(result.time_taken_ms / 1000).toFixed(1)}s
								</span>
								<span className="progress-history-time">{new Date(result.timestamp).toLocaleString()}</span>
							</li>
						))}
					</ul>
					{totalPages > 1 && (
						<div className="progress-pagination">
							<Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
								Previous
							</Button>
							<span className="pagination-info">
								Page {currentPage + 1} of {totalPages}
							</span>
							<Button variant="secondary" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</ScrollReveal>
	);
}
