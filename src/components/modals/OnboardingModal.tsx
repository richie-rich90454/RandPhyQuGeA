import {useCallback, useEffect, useState} from "react";
import {motion, AnimatePresence, useReducedMotion} from "framer-motion";
import {Atom, ClipboardText, Keyboard, Lightning, ArrowRight, ArrowLeft} from "@phosphor-icons/react";
import {Modal, Button} from "../ui";
import {useUiStore} from "../../stores/uiStore";
import {useSettingsStore} from "../../stores/settingsStore";
/** Single onboarding step with icon, headline, and body copy. */
interface OnboardingStep {
	id: string;
	icon: React.ReactNode;
	headline: string;
	body: string;
}
const STEPS: OnboardingStep[]=[
	{
		id: "welcome",
		icon: <Atom weight="duotone" className="onboarding-step-icon" aria-hidden="true" />,
		headline: "Physics practice, simplified",
		body: "A focused practice environment for physics problems. Pick a topic, generate questions, and track your progress over time.",
	},
	{
		id: "practice",
		icon: <ClipboardText weight="duotone" className="onboarding-step-icon" aria-hidden="true" />,
		headline: "Practice your way",
		body: "Choose single questions, full sessions, or mental math drills. Adjust difficulty and scope to match what you want to review.",
	},
	{
		id: "shortcuts",
		icon: <Keyboard weight="duotone" className="onboarding-step-icon" aria-hidden="true" />,
		headline: "Stay in flow",
		body: "Use number keys for multiple choice answers. Press Enter to check your work, then Enter again to move to the next question.",
	},
	{
		id: "progress",
		icon: <Lightning weight="duotone" className="onboarding-step-icon" aria-hidden="true" />,
		headline: "Build momentum",
		body: "Your results feed streaks, accuracy trends, and recommendations. Come back daily to reinforce weak spots.",
	},
];
const standardEase: [number, number, number, number]=[0.2, 0, 0, 1];
const stepVariants={
	enter: (direction: number) => ({
		x: direction>0 ? 24 : -24,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
		transition: {duration: 0.25, ease: standardEase},
	},
	exit: (direction: number) => ({
		x: direction>0 ? -24 : 24,
		opacity: 0,
		transition: {duration: 0.18, ease: standardEase},
	}),
};
/**
 * First-launch onboarding overlay mapped to `#onboarding-overlay`.
 *
 * Presents a short, multi-step introduction with motion transitions and
 * keyboard navigation. Finishing or dismissing the modal marks
 * `onboardingCompleted` true in the persisted settings store so it does not
 * reappear automatically.
 */
export function OnboardingModal() {
	const isOpen=useUiStore(state => state.activeModal==="onboarding");
	const closeModal=useUiStore(state => state.closeModal);
	const setOnboardingCompleted=useSettingsStore(state => state.setOnboardingCompleted);
	const shouldReduceMotion=useReducedMotion() ?? false;
	const [stepIndex, setStepIndex]=useState(0);
	const [direction, setDirection]=useState(0);
	const handleDismiss=useCallback(() => {
		setOnboardingCompleted(true);
		closeModal();
	}, [setOnboardingCompleted, closeModal]);
	const goToStep=useCallback((nextIndex: number) => {
		setDirection(nextIndex>stepIndex ? 1 : -1);
		setStepIndex(nextIndex);
	}, [stepIndex]);
	const handleNext=useCallback(() => {
		if (stepIndex<STEPS.length-1) {
			goToStep(stepIndex+1);
		} else {
			handleDismiss();
		}
	}, [stepIndex, goToStep, handleDismiss]);
	const handlePrevious=useCallback(() => {
		if (stepIndex>0) {
			goToStep(stepIndex-1);
		}
	}, [stepIndex, goToStep]);
	useEffect(() => {
		if (!isOpen) {
			setStepIndex(0);
			setDirection(0);
			return;
		}
		const handleKeyDown=(event: KeyboardEvent) => {
			if (event.key==="ArrowRight") {
				event.preventDefault();
				handleNext();
			} else if (event.key==="ArrowLeft") {
				event.preventDefault();
				handlePrevious();
			} else if (event.key==="Home") {
				event.preventDefault();
				goToStep(0);
			} else if (event.key==="End") {
				event.preventDefault();
				goToStep(STEPS.length-1);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleNext, handlePrevious, goToStep]);
	const currentStep=STEPS[stepIndex]!;
	const isLastStep=stepIndex===STEPS.length-1;
	const instantVariants={hidden: {opacity: 0, x: 0}, visible: {opacity: 1, x: 0}};
	const activeVariants=shouldReduceMotion ? instantVariants : stepVariants;
	return (
		<Modal
			open={isOpen}
			onClose={handleDismiss}
			modalId="onboarding-overlay"
			title="Welcome to RandPhyQuGeA"
			titleId="onboarding-title"
			ariaLabel="Onboarding"
			className="onboarding-modal"
			footer={
				<div className="onboarding-footer">
					<div className="onboarding-dots" role="tablist" aria-label="Onboarding steps">
						{STEPS.map((step, index) => (
							<button
								key={step.id}
								type="button"
								role="tab"
								aria-selected={index===stepIndex}
								aria-label={`Step ${index+1}: ${step.headline}`}
								className="onboarding-dot"
								data-active={index===stepIndex}
								onClick={() => goToStep(index)}
							/>
						))}
					</div>
					<div className="onboarding-actions">
						<Button
							variant="ghost"
							size="md"
							leftIcon={<ArrowLeft weight="bold" />}
							onClick={handlePrevious}
							disabled={stepIndex===0}
						>
							Back
						</Button>
						<Button
							variant="primary"
							size="md"
							rightIcon={isLastStep ? undefined : <ArrowRight weight="bold" />}
							onClick={handleNext}
						>
							{isLastStep ? "Get started" : "Next"}
						</Button>
					</div>
				</div>
			}
		>
			<div className="onboarding-step-viewport" aria-live="polite" aria-atomic="true">
				<AnimatePresence mode="wait" custom={direction} initial={false}>
					<motion.div
						key={currentStep.id}
						custom={direction}
						variants={activeVariants}
						initial="enter"
						animate="center"
						exit="exit"
						className="onboarding-step-content"
					>
						<div className="onboarding-step-icon-wrapper">{currentStep.icon}</div>
						<h3 className="onboarding-step-headline">{currentStep.headline}</h3>
						<p className="onboarding-step-body">{currentStep.body}</p>
					</motion.div>
				</AnimatePresence>
			</div>
			<div className="onboarding-progress" aria-hidden="true">
				<div
					className="onboarding-progress-bar"
					style={{width: `${((stepIndex+1)/STEPS.length)*100}%`}}
				/>
			</div>
		</Modal>
	);
}
