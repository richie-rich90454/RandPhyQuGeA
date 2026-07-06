import {useEffect} from "react";
import {Check, ArrowRight} from "@phosphor-icons/react";
import {usePracticeStore} from "../../stores/practiceStore";
import {useAnswerActions} from "../../hooks/useAnswerActions";
import {Button} from "../ui";
import {AnswerCard} from "./AnswerCard";
import {ResultsCard} from "./ResultsCard";
/**
 * Answer section grid mapped to `.answer-section`.
 *
 * Composes the answer input card, primary action buttons (Check / Next), and
 * the results feedback card. All submission and advance logic is wired through
 * {@link useAnswerActions}, which talks directly to the OOP service layer.
 * Global keyboard shortcuts (1-4 for MCQ choices, Enter/Shift+Enter to submit
 * or advance) are attached at this level so they apply to the whole practice
 * surface.
 */
export function AnswerSection() {
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const {canSubmit, canAdvance, isSubmitting, submit, advance, handleKeyDown} = useAnswerActions();
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);
	return (
		<div className="answer-section">
			<div className="answer-card-wrapper">
				<AnswerCard />
				<div className="answer-actions">
					{showFeedback ? (
						<Button
							variant="primary"
							size="md"
							rightIcon={<ArrowRight weight="bold" />}
							onClick={advance}
							disabled={!canAdvance || isSubmitting}
							loading={isSubmitting}
						>
							Next
						</Button>
					) : (
						<Button
							variant="primary"
							size="md"
							leftIcon={<Check weight="bold" />}
							onClick={submit}
							disabled={!canSubmit || isSubmitting}
							loading={isSubmitting}
						>
							Check
						</Button>
					)}
				</div>
			</div>
			<ResultsCard />
		</div>
	);
}
