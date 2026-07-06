import {useCallback, useMemo} from "react";
import {ClockCounterClockwise, Trash, ArrowRight} from "@phosphor-icons/react";
import {Modal, Button, Card, CardContent} from "../ui";
import {useUiStore} from "../../stores/uiStore";
import type {SessionSnapshot} from "../../services/contracts";
/** Props for the {@link ResumeSessionModal} component. */
export interface ResumeSessionModalProps {
	/** The persisted session snapshot to resume or discard. */
	snapshot: SessionSnapshot | null;
	/** Called when the user chooses to resume the saved session. */
	onResume: () => void;
	/** Called when the user chooses to discard the saved session. */
	onDiscard: () => void;
}
/**
 * Resume/discard prompt for an unfinished session snapshot.
 *
 * Appears on app launch when a persisted session exists and has not finished.
 * It surfaces the session mode, progress, and start time so the user can make
 * an informed choice, then routes the resume/discard decision to the caller.
 */
export function ResumeSessionModal({snapshot, onResume, onDiscard}: ResumeSessionModalProps) {
	const isOpen=useUiStore(state => state.activeModal==="resume-session");
	const closeModal=useUiStore(state => state.closeModal);
	const handleDiscard=useCallback(() => {
		onDiscard();
		closeModal();
	}, [onDiscard, closeModal]);
	const handleResume=useCallback(() => {
		onResume();
		closeModal();
	}, [onResume, closeModal]);
	const progressText=useMemo(() => {
		if (!snapshot) return "";
		const session=snapshot.session;
		const total=session.questions.length;
		const current=Math.min(session.currentIndex+1, total);
		return total===0 ? "No questions generated" : `Question ${current} of ${total}`;
	}, [snapshot]);
	const startTimeText=useMemo(() => {
		if (!snapshot) return "";
		const date=new Date(snapshot.session.sessionStartTime);
		return date.toLocaleString();
	}, [snapshot]);
	if (!isOpen || !snapshot) return null;
	const session=snapshot.session;
	return (
		<Modal
			open={isOpen}
			onClose={handleDiscard}
			modalId="resume-session-modal"
			title="Resume previous session?"
			titleId="resume-session-title"
			ariaLabel="Resume previous session"
			footer={
				<div className="resume-session-actions">
					<Button variant="secondary" size="md" leftIcon={<Trash weight="bold" />} onClick={handleDiscard}>
						Discard
					</Button>
					<Button variant="primary" size="md" leftIcon={<ArrowRight weight="bold" />} onClick={handleResume}>
						Resume
					</Button>
				</div>
			}
		>
			<div className="resume-session-body">
				<p className="resume-session-intro">
					You have an unfinished practice session. Pick up where you left off or discard it and start fresh.
				</p>
				<Card variant="filled" className="resume-session-card">
					<CardContent className="resume-session-card-content">
						<div className="resume-session-detail">
							<span className="resume-session-label">Mode</span>
							<span className="resume-session-value">{session.mode}</span>
						</div>
						<div className="resume-session-detail">
							<span className="resume-session-label">Progress</span>
							<span className="resume-session-value">{progressText}</span>
						</div>
						<div className="resume-session-detail">
							<span className="resume-session-label">Started</span>
							<span className="resume-session-value resume-session-time">
								<ClockCounterClockwise weight="duotone" className="resume-session-time-icon" aria-hidden="true" />
								{startTimeText}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</Modal>
	);
}
