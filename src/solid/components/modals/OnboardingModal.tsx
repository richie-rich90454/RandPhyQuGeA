import type {JSX} from "solid-js";
import {For, Show, createEffect, createSignal, onCleanup} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {useUiStore} from "../../stores/uiStore";
import {useSettingsStore} from "../../stores/settingsStore";
import styles from "./OnboardingModal.module.css";
/** Single onboarding step with icon, headline, and body copy. */
interface OnboardingStep {
	id: string;
	icon: () => JSX.Element;
	headline: string;
	body: string;
}
function AtomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="2" />
			<ellipse cx="12" cy="12" rx="10" ry="4" />
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
		</svg>
	);
}
function ClipboardIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<rect x="6" y="4" width="12" height="16" rx="2" />
			<path d="M9 4h6v3H9z" />
			<path d="M9 11h6M9 15h4" stroke-linecap="round" />
		</svg>
	);
}
function KeyboardIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<rect x="2" y="6" width="20" height="12" rx="2" />
			<path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h0M10 14h0M14 14h0M18 14h0" stroke-linecap="round" />
		</svg>
	);
}
function LightningIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke-linejoin="round" />
		</svg>
	);
}
function ArrowLeftIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function ArrowRightIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
const STEPS: readonly OnboardingStep[]=[
	{id: "welcome", icon: AtomIcon, headline: "Physics practice, simplified", body: "A focused practice environment for physics problems. Pick a topic, generate questions, and track your progress over time."},
	{id: "practice", icon: ClipboardIcon, headline: "Practice your way", body: "Choose single questions, full sessions, or mental math drills. Adjust difficulty and scope to match what you want to review."},
	{id: "shortcuts", icon: KeyboardIcon, headline: "Stay in flow", body: "Use number keys for multiple choice answers. Press Enter to check your work, then Enter again to move to the next question."},
	{id: "progress", icon: LightningIcon, headline: "Build momentum", body: "Your results feed streaks, accuracy trends, and recommendations. Come back daily to reinforce weak spots."},
];
/**
 * First-launch onboarding overlay mapped to `#onboarding-overlay`.
 *
 * Solid port of {@link ../../../components/modals/OnboardingModal}. Presents a
 * short, multi-step introduction rendered as an `<ol>` of steps with Back,
 * Next, and Skip actions. ArrowRight/ArrowLeft/Home/End navigate steps;
 * Escape (handled by the underlying Modal) dismisses and marks onboarding
 * complete. Finishing or dismissing marks `onboardingCompleted` true in the
 * persisted settings store so it does not reappear. Framer Motion transitions
 * are replaced by CSS; `@phosphor-icons/react` icons are replaced with inline
 * SVG.
 */
export function OnboardingModal(): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal==="onboarding");
	let [stepIndex, setStepIndex]=createSignal(0);
	let handleDismiss=() => {
		useSettingsStore.getState().setOnboardingCompleted(true);
		useUiStore.getState().closeModal();
	};
	let goToStep=(nextIndex: number) => {
		let clamped=Math.max(0, Math.min(STEPS.length-1, nextIndex));
		setStepIndex(clamped);
	};
	let handleNext=() => {
		if (stepIndex()<STEPS.length-1) {
			goToStep(stepIndex()+1);
		} else {
			handleDismiss();
		}
	};
	let handlePrevious=() => {
		if (stepIndex()>0) {
			goToStep(stepIndex()-1);
		}
	};
	createEffect(() => {
		if (!isOpen()) {
			setStepIndex(0);
			return;
		}
		let handleKeyDown=(event: KeyboardEvent) => {
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
		onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
	});
	let isLastStep=() => stepIndex()===STEPS.length-1;
	let progressPercent=() => ((stepIndex()+1)/STEPS.length)*100;
	return (
		<Modal
			open={isOpen()}
			onClose={handleDismiss}
			modalId="onboarding-overlay"
			title="Welcome to RandPhyQuGeA"
			titleId="onboarding-title"
			ariaLabel="Onboarding"
			class={styles.onboarding}
			footer={
				<div class={styles.footer}>
					<div class={styles.dots} role="tablist" aria-label="Onboarding steps">
						<For each={STEPS}>{(step, index) => (
							<button
								type="button"
								role="tab"
								aria-selected={index()===stepIndex()}
								aria-label={`Step ${index()+1}: ${step.headline}`}
								class={`${styles.dot} ${index()===stepIndex() ? styles.dotActive : ""}`}
								onClick={() => goToStep(index())}
							/>
						)}</For>
					</div>
					<div class={styles.actions}>
						<Button variant="ghost" size="md" onClick={handleDismiss}>Skip</Button>
						<Button variant="ghost" size="md" leftIcon={<ArrowLeftIcon />} onClick={handlePrevious} disabled={stepIndex()===0}>Back</Button>
						<Show when={isLastStep()} fallback={
							<Button variant="primary" size="md" rightIcon={<ArrowRightIcon />} onClick={handleNext}>Next</Button>
						}>
							<Button variant="primary" size="md" onClick={handleNext}>Get started</Button>
						</Show>
					</div>
				</div>
			}
		>
			<div class={styles.viewport} aria-live="polite" aria-atomic="true">
				<ol class={styles.stepList}>
					<For each={STEPS}>{(step, index) => (
						<Show when={index()===stepIndex()}>
							<li class={styles.step}>
								<span class={styles.iconWrapper}>{step.icon()}</span>
								<h3 class={styles.headline}>{step.headline}</h3>
								<p class={styles.body}>{step.body}</p>
							</li>
						</Show>
					)}</For>
				</ol>
			</div>
			<div class={styles.progress} aria-hidden="true">
				<div class={styles.progressBar} style={`width: ${progressPercent()}%;`} />
			</div>
		</Modal>
	);
}
