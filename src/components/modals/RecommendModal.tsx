import {useMemo, useRef} from "react";
import {Modal} from "../ui";
import {ScrollReveal} from "../animations";
import {useUiStore} from "../../stores/uiStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import {usePracticeStore} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
/** Minimum number of attempts before a topic is considered for recommendations. */
const MIN_ATTEMPTS = 1;
/** Accuracy threshold below which a topic is considered weak. */
const WEAK_THRESHOLD = 70;
/** Maximum number of weak topics to display. */
const MAX_RECOMMENDATIONS = 8;
interface TopicStats {
    topicId: string;
    topicName: string;
    total: number;
    correct: number;
    accuracy: number;
}
/**
 * Recommend overlay mapped to `#weak-topics-modal`.
 *
 * Computes per-topic accuracy from the persisted practice history, surfaces
 * topics below the weak threshold (sorted by lowest accuracy), and provides
 * per-topic Practice buttons that select the topic and drop into Single
 * mode. The "Practice All" button clears the topic filter so the next
 * generated question can come from any weak topic.
 */
export function RecommendModal() {
    const isOpen = useUiStore(state => state.activeModal === "recommend");
    const closeModal = useUiStore(state => state.closeModal);
    const results = useProgressStore(state => state.results);
    const specification = useSpecStore(state => state.specification);
    const setSelectedTopicId = usePracticeStore(state => state.setSelectedTopicId);
    const setDefaultMode = useSettingsStore(state => state.setDefaultMode);
    const scrollerRef = useRef<HTMLElement | null>(null);
    const weakTopics = useMemo<TopicStats[]>(() => {
        if (results.length === 0) return [];
        const byTopic = new Map<string, {total: number; correct: number}>();
        for (const result of results) {
            const entry = byTopic.get(result.topic_id) ?? {total: 0, correct: 0};
            entry.total += 1;
            if (result.is_correct) entry.correct += 1;
            byTopic.set(result.topic_id, entry);
        }
        const stats: TopicStats[] = [];
        for (const [topicId, {total, correct}] of byTopic) {
            if (total < MIN_ATTEMPTS) continue;
            const accuracy = (correct / total) * 100;
            if (accuracy >= WEAK_THRESHOLD) continue;
            const topic = specification?.topics.find(t => t.id === topicId);
            stats.push({topicId, topicName: topic?.name ?? topicId, total, correct, accuracy});
        }
        stats.sort((a, b) => a.accuracy - b.accuracy);
        return stats.slice(0, MAX_RECOMMENDATIONS);
    }, [results, specification]);
    const handlePractice = (topicId: string) => {
        setSelectedTopicId(topicId);
        setDefaultMode("Single");
        closeModal();
    };
    const handlePracticeAll = () => {
        setSelectedTopicId(null);
        setDefaultMode("Single");
        closeModal();
    };
    return (
        <Modal
            open={isOpen}
            onClose={closeModal}
            modalId="weak-topics-modal"
            title="Your Recommended Practice Topics"
            titleId="weak-topics-title"
            ariaLabel="Recommended topics"
            scrollerRef={scrollerRef}
            footer={
                <>
                    <button type="button" className="secondary-button" onClick={closeModal}>
                        Dismiss
                    </button>
                    {weakTopics.length > 0 && (
                        <button type="button" className="primary-button" onClick={handlePracticeAll}>
                            Practice All (5 questions each)
                        </button>
                    )}
                </>
            }
        >
            {weakTopics.length === 0 ? (
                <p className="empty-recommend">No weak topics found. Keep practicing to build your profile!</p>
            ) : (
                <>
                    <p>Based on your past performance, you should focus on these topics:</p>
                    <ul className="weak-topics-list">
                        {weakTopics.map((topic, index) => (
                            <ScrollReveal key={topic.topicId} className="weak-topic-item" as="li" direction="up" distance={12} duration={0.4} delay={index * 0.05} scrollerRef={scrollerRef}>
                                <div className="weak-topic-info">
                                    <span className="weak-topic-name">{topic.topicName}</span>
                                    <span className="weak-topic-stats">
                                        {topic.correct}/{topic.total} correct &middot; {Math.round(topic.accuracy)}% accuracy
                                    </span>
                                </div>
                                <button type="button" className="secondary-button" onClick={() => handlePractice(topic.topicId)}>
                                    Practice
                                </button>
                            </ScrollReveal>
                        ))}
                    </ul>
                    <p className="weak-topics-note">Click "Practice" to start a session on that topic.</p>
                </>
            )}
        </Modal>
    );
}
