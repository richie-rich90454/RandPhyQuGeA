import {useMemo, useRef} from "react";
import {Target, TrendDown, CheckCircle, Lightbulb} from "@phosphor-icons/react";
import {Modal, Button, Card, CardContent, CardHeader, CardTitle, Badge, EmptyState, ProgressBar} from "../ui";
import {ScrollReveal} from "../animations";
import {useUiStore} from "../../stores/uiStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {usePracticeStore} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useServices} from "../../hooks/useServices";
import type {WeakTopic} from "../../services/contracts";
/** Maximum number of weak topics to display. */
const MAX_RECOMMENDATIONS = 8;
/** Weak-topic accuracy threshold passed to analytics. */
const WEAK_THRESHOLD = 70;
/**
 * Recommend overlay mapped to `#weak-topics-modal`.
 *
 * Delegates weak-topic computation to the injected {@link IAnalyticsService},
 * renders a ranked list with accuracy progress bars, and lets the user jump
 * into targeted practice for one topic or all weak topics.
 */
export function RecommendModal() {
	const isOpen=useUiStore(state => state.activeModal === "recommend");
	const closeModal=useUiStore(state => state.closeModal);
	const results=useProgressStore(state => state.results);
	const specification=useSpecStore(state => state.specification);
	const setSelectedTopicId=usePracticeStore(state => state.setSelectedTopicId);
	const setDefaultMode=useSettingsStore(state => state.setDefaultMode);
	const {analytics}=useServices();
	const scrollerRef=useRef<HTMLElement | null>(null);
	const weakTopics=useMemo<WeakTopic[]>(() => {
		if (!specification || results.length === 0) return [];
		return analytics.getWeakTopics(results, specification, WEAK_THRESHOLD).slice(0, MAX_RECOMMENDATIONS);
	}, [results, specification, analytics]);
	const totalAttempts=results.length;
	const handlePractice=(topicId: string) => {
		setSelectedTopicId(topicId);
		setDefaultMode("Single");
		closeModal();
	};
	const handlePracticeAll=() => {
		setSelectedTopicId(null);
		setDefaultMode("Single");
		closeModal();
	};
	return (
		<Modal
			open={isOpen}
			onClose={closeModal}
			modalId="weak-topics-modal"
			title="Recommended Practice"
			titleId="weak-topics-title"
			ariaLabel="Recommended practice topics"
			scrollerRef={scrollerRef}
			footer={
				<>
					<Button variant="secondary" size="md" onClick={closeModal}>
						Dismiss
					</Button>
					{weakTopics.length > 0 && (
						<Button variant="primary" size="md" onClick={handlePracticeAll}>
							Practice All
						</Button>
					)}
				</>
			}
		>
			{weakTopics.length === 0 ? (
				<EmptyState
					illustration={<Lightbulb className="h-12 w-12" aria-hidden="true" />}
					title="No recommendations yet"
					description={totalAttempts === 0 ? "Complete a few questions and we will highlight topics worth reviewing." : "Your accuracy is strong across every topic you have practiced. Keep it up."}
				/>
			) : (
				<>
					<Card variant="filled" className="recommend-summary-card">
						<CardContent className="recommend-summary-content">
							<div className="recommend-summary-item">
								<TrendDown className="h-5 w-5 text-danger" aria-hidden="true" />
								<span className="recommend-summary-value">{weakTopics.length}</span>
								<span className="recommend-summary-label">topic{weakTopics.length === 1 ? "" : "s"} below {WEAK_THRESHOLD}%</span>
							</div>
							<div className="recommend-summary-item">
								<CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
								<span className="recommend-summary-value">{totalAttempts}</span>
								<span className="recommend-summary-label">attempt{totalAttempts === 1 ? "" : "s"} recorded</span>
							</div>
						</CardContent>
					</Card>
					<ul className="recommend-topic-list">
						{weakTopics.map((topic, index) => (
							<ScrollReveal key={topic.topicId} as="li" direction="up" distance={12} duration={0.35} delay={index * 0.05} scrollerRef={scrollerRef}>
								<Card variant="hover" className="recommend-topic-card">
									<CardHeader className="recommend-topic-header">
										<div className="recommend-topic-title-row">
											<Target className="h-4 w-4 text-accent-600" aria-hidden="true" />
											<CardTitle className="recommend-topic-title">{topic.topicName}</CardTitle>
										</div>
										<Badge variant={topic.accuracy < 50 ? "error" : "warning"} size="sm">
											{Math.round(topic.accuracy)}%
										</Badge>
									</CardHeader>
									<CardContent className="recommend-topic-content">
										<ProgressBar value={topic.accuracy} ariaLabel={`${topic.topicName} accuracy`} />
										<span className="recommend-topic-meta">{topic.attempts} attempt{topic.attempts === 1 ? "" : "s"} &middot; {Math.round((topic.accuracy / 100) * topic.attempts)} correct</span>
										<Button variant="secondary" size="sm" className="recommend-topic-action" onClick={() => handlePractice(topic.topicId)}>
											Practice
										</Button>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
						</ul>
					</>
				)}
		</Modal>
	);
}
