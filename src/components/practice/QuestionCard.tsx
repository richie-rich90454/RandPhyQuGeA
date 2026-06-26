import {useMemo} from 'react';
import {usePracticeStore} from '../../stores/practiceStore';
import {useSpecStore} from '../../stores/specStore';
import {CardHeader, CardTitle, CardSubtitle, CardContent, EmptyState} from '../ui';
import {MathText} from '../MathText';
import type {Specification, Topic} from '../../types/models';
/**
 * Look up the topic name for a given topic id from the parsed specification.
 * Returns `null` when the topic id is not found or no spec is loaded.
 */
function findTopicName(specification: Specification | null, topicId: string | undefined): string | null {
	if (!specification || !topicId) return null;
	const topic = specification.topics.find((t: Topic) => t.id === topicId);
	return topic?.name ?? null;
}
/**
 * Question display card mapped to `.question-card`.
 *
 * Reads the current question from the practice store and the parsed spec from
 * the spec store. When no question is loaded, renders the empty-state
 * placeholder; when a question is loaded, renders the topic name as the card
 * subtitle and the question text (with inline LaTeX support) in the
 * `.question-display` region.
 */
export function QuestionCard() {
	const currentQuestion = usePracticeStore(state => state.questions[state.currentIndex] ?? null);
	const specification = useSpecStore(state => state.specification);
	const topicName = useMemo(() => findTopicName(specification, currentQuestion?.topic_id), [specification, currentQuestion?.topic_id]);
	return (
		<div className="question-card card">
			<CardHeader>
				<CardTitle>Question</CardTitle>
				<CardSubtitle>{topicName ?? 'Select a topic'}</CardSubtitle>
			</CardHeader>
			<CardContent>
				<div className="question-display" aria-live="polite" role="region" aria-label="Question display">
					{currentQuestion ? (
						<MathText text={currentQuestion.text} />
					) : (
						<EmptyState
							icon={
								<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
									<path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
								</svg>
							}
							title="Pick a topic and click Generate to start"
						/>
					)}
				</div>
			</CardContent>
		</div>
	);
}
