import type {JSX} from "solid-js";
import {Show, createMemo} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {Card, CardContent} from "../ui/Card";
import {useUiStore} from "../../stores/uiStore";
import type {SessionSnapshot} from "../../../services/contracts";
import styles from "./ResumeSessionModal.module.css";
/** Props for the {@link ResumeSessionModal} component. */
export interface ResumeSessionModalProps {
    /** The persisted session snapshot to resume or discard. */
    snapshot: SessionSnapshot | null;
    /** Called when the user chooses to resume the saved session. */
    onResume: () => void;
    /** Called when the user chooses to discard the saved session. */
    onDiscard: () => void;
}
/** Format a duration in milliseconds as a human-readable string. */
function formatDuration(ms: number): string {
    let seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    let hours = Math.floor(minutes / 60);
    let remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}
/** Format a timestamp as a relative time string (e.g., "2 hours ago"). */
function formatRelativeTime(timestamp: string): string {
    let now = Date.now();
    let then = new Date(timestamp).getTime();
    let diff = now - then;
    let seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    let minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    let hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    let days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(timestamp).toLocaleDateString();
}
function TrashIcon(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
        </svg>
    );
}
function ArrowRightIcon(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}
function ClockIcon(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5M12 7v5l3 3" />
        </svg>
    );
}
function closeResumeSessionModal(): void {
    useUiStore.getState().closeModal();
}
/**
 * Resume/discard prompt for an unfinished session snapshot.
 *
 * Solid port of {@link ../../../components/modals/ResumeSessionModal}. Appears
 * on app launch when a persisted session exists and has not finished. It
 * surfaces the session mode, progress, stats grid (question count, correct
 * count, accuracy, time elapsed, last topic), and a relative timestamp so the
 * user can make an informed choice, then routes the resume/discard decision to
 * the caller. Dismissal via Escape or backdrop is treated as a discard.
 */
export function ResumeSessionModal(props: ResumeSessionModalProps): JSX.Element {
    let isOpen = useUiStore(s => s.activeModal === "resume-session");
    let activeSnapshot = createMemo<SessionSnapshot | null>(() => (isOpen() ? props.snapshot : null));
    let handleDiscard = () => {
        props.onDiscard();
        closeResumeSessionModal();
    };
    let handleResume = () => {
        props.onResume();
        closeResumeSessionModal();
    };
    return (
        <Show when={activeSnapshot()} keyed>
            {snap => {
                let session = snap.session;
                let total = session.questions.length;
                let current = Math.min(session.currentIndex + 1, total);
                let progressText = total === 0 ? "No questions generated" : `Question ${current} of ${total}`;
                let correctCount = session.results.filter(r => r.is_correct).length;
                let answeredCount = session.results.length;
                let accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
                let endTime = session.sessionEndTime ?? Date.now();
                let elapsedMs = Math.max(0, endTime - session.sessionStartTime);
                let lastQuestion = session.questions[session.currentIndex];
                let lastTopicId = lastQuestion?.topic_id ?? "";
                let lastTopicName = session.specification.topics.find(t => t.id === lastTopicId)?.name ?? (lastTopicId || "N/A");
                let relativeTime = formatRelativeTime(snap.createdAt);
                return (
                    <Modal
                        open={true}
                        onClose={handleDiscard}
                        modalId="resume-session-modal"
                        title="Resume previous session?"
                        titleId="resume-session-title"
                        ariaLabel="Resume previous session"
                        class={styles.resume}
                        footer={
                            <div class={styles.actions}>
                                <Button variant="danger" size="md" leftIcon={<TrashIcon />} onClick={handleDiscard}>
                                    Discard
                                </Button>
                                <Button variant="primary" size="md" leftIcon={<ArrowRightIcon />} onClick={handleResume}>
                                    Resume
                                </Button>
                            </div>
                        }
                    >
                        <div class={styles.body}>
                            <p class={styles.intro}>
                                You have an unfinished practice session from <strong>{relativeTime}</strong>. Pick up where you left off or discard it and start fresh.
                            </p>
                            <Card variant="filled" class={styles.card}>
                                <CardContent class={styles.cardContent}>
                                    <div class={styles.detail}>
                                        <span class={styles.label}>Mode</span>
                                        <span class={styles.value}>{session.mode}</span>
                                    </div>
                                    <div class={styles.detail}>
                                        <span class={styles.label}>Progress</span>
                                        <span class={styles.value}>{progressText}</span>
                                    </div>
                                    <div class={styles.detail}>
                                        <span class={styles.label}>Started</span>
                                        <span class={`${styles.value} ${styles.time}`}>
                                            <span class={styles.timeIcon}>
                                                <ClockIcon />
                                            </span>
                                            {relativeTime}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            <div class={styles.statsGrid}>
                                <div class={styles.stat}>
                                    <span class={styles.statLabel}>Questions</span>
                                    <span class={styles.statValue}>{total}</span>
                                </div>
                                <div class={styles.stat}>
                                    <span class={styles.statLabel}>Correct</span>
                                    <span class={styles.statValue}>{correctCount}</span>
                                </div>
                                <div class={styles.stat}>
                                    <span class={styles.statLabel}>Accuracy</span>
                                    <span class={styles.statValue}>{accuracy}%</span>
                                </div>
                                <div class={styles.stat}>
                                    <span class={styles.statLabel}>Time elapsed</span>
                                    <span class={styles.statValue}>{formatDuration(elapsedMs)}</span>
                                </div>
                                <div class={styles.stat}>
                                    <span class={styles.statLabel}>Last topic</span>
                                    <span class={styles.statValue}>{lastTopicName}</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                );
            }}
        </Show>
    );
}
