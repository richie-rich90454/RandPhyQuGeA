import type {JSX} from "solid-js";
import {For, Show, createEffect, createMemo, createSignal, onCleanup} from "solid-js";
import {Modal} from "../ui/Modal";
import {Button} from "../ui/Button";
import {useUiStore} from "../../stores/uiStore";
import {useSettingsStore} from "../../stores/settingsStore";
import type {ThemeMode} from "../../stores/settingsStore";
import type {PracticeMode} from "../../../types/models";
import styles from "./OnboardingModal.module.css";
interface FeatureCard {
	id: string;
	icon: () => JSX.Element;
	title: string;
	body: string;
}
interface ThemeOption {
	value: ThemeMode;
	label: string;
	icon: () => JSX.Element;
}
interface ModeOption {
	value: PracticeMode;
	label: string;
	hint: string;
}
function AtomIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<circle cx="12" cy="12" r="2" />
			<ellipse cx="12" cy="12" rx="10" ry="4" />
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
			<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
		</svg>
	);
}
function ClipboardIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<rect x="6" y="4" width="12" height="16" rx="2" />
			<path d="M9 4h6v3H9z" />
			<path d="M9 11h6M9 15h4" stroke-linecap="round" />
		</svg>
	);
}
function KeyboardIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<rect x="2" y="6" width="20" height="12" rx="2" />
			<path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h0M10 14h0M14 14h0M18 14h0" stroke-linecap="round" />
		</svg>
	);
}
function LightningIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke-linejoin="round" />
		</svg>
	);
}
function ChartIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M3 21h18M5 17V9M10 17V5M15 17v-7M20 17v-4" stroke-linecap="round" stroke-linejoin="round" />
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
function SunIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5L4 4M20 4l-1 1M5 19l-1 1M20 20l-1-1" stroke-linecap="round" />
		</svg>
	);
}
function MoonIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke-linejoin="round" />
		</svg>
	);
}
function AutoIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 3a9 9 0 000 18z" fill="currentColor" stroke="none" />
		</svg>
	);
}
const FEATURES: readonly FeatureCard[]=[
	{id: "practice", icon: ClipboardIcon, title: "Practice your way", body: "Single questions, full sessions, or timed mental drills with adjustable difficulty."},
	{id: "shortcuts", icon: KeyboardIcon, title: "Stay in flow", body: "Number keys for choices, Enter to check, then Enter again to advance."},
	{id: "progress", icon: LightningIcon, title: "Build momentum", body: "Streaks, accuracy trends, and weak-topic recommendations keep you improving."},
	{id: "insights", icon: ChartIcon, title: "Track insights", body: "Visualize accuracy per topic and export your history anytime."},
];
const THEME_OPTIONS: readonly ThemeOption[]=[
	{value: "light", label: "Light", icon: SunIcon},
	{value: "dark", label: "Dark", icon: MoonIcon},
	{value: "system", label: "System", icon: AutoIcon},
];
const MODE_OPTIONS: readonly ModeOption[]=[
	{value: "Single", label: "Single", hint: "Deep focus, one question at a time."},
	{value: "Mental", label: "Mental", hint: "Timed drill with countdown and score."},
];
/** Total number of onboarding steps. */
const TOTAL_STEPS=4;
/**
 * First-launch onboarding overlay mapped to `#onboarding-overlay`.
 *
 * Solid port of {@link ../../../components/modals/OnboardingModal}. Presents a
 * four-step wizard: welcome, feature highlights, quick setup (theme + mode),
 * and a final "Get started" step. Renders the steps as an `<ol>` with Back,
 * Next, Skip, and progress-dot navigation. ArrowRight/ArrowLeft/Home/End
 * navigate steps; Escape (handled by the underlying Modal) dismisses and marks
 * onboarding complete. Finishing or dismissing marks `onboardingCompleted`
 * true in the persisted settings store so it does not reappear. Step
 * transitions are CSS-driven with a `prefers-reduced-motion` guard.
 */
export function OnboardingModal(): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal==="onboarding");
	let settings=useSettingsStore();
	let [stepIndex, setStepIndex]=createSignal(0);
	let [themeChoice, setThemeChoice]=createSignal<ThemeMode>(settings().themeMode === "dark" ? "dark" : settings().themeMode === "system" ? "system" : "light");
	let [modeChoice, setModeChoice]=createSignal<PracticeMode>(settings().defaultMode);
	let handleDismiss=() => {
		commitSetupIfNeeded();
		useSettingsStore.getState().setOnboardingCompleted(true);
		useUiStore.getState().closeModal();
	};
	let commitSetupIfNeeded=() => {
		if (stepIndex()>=2) {
			useSettingsStore.getState().setThemeMode(themeChoice());
			useSettingsStore.getState().setDefaultMode(modeChoice());
		}
	};
	let goToStep=(nextIndex: number) => {
		let clamped=Math.max(0, Math.min(TOTAL_STEPS-1, nextIndex));
		setStepIndex(clamped);
	};
	let handleNext=() => {
		if (stepIndex()<TOTAL_STEPS-1) {
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
	let handleFinish=() => {
		commitSetupIfNeeded();
		useSettingsStore.getState().setOnboardingCompleted(true);
		useUiStore.getState().closeModal();
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
				goToStep(TOTAL_STEPS-1);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
	});
	let isLastStep=() => stepIndex()===TOTAL_STEPS-1;
	let progressPercent=createMemo(() => ((stepIndex()+1)/TOTAL_STEPS)*100);
	let stepHeadline=createMemo<string>(() => {
		if (stepIndex()===0) return "Physics practice, simplified";
		if (stepIndex()===1) return "Everything you need to study";
		if (stepIndex()===2) return "Quick setup";
		return "You are ready to begin";
	});
	let stepBody=createMemo<string>(() => {
		if (stepIndex()===0) return "A focused practice environment for physics problems. Pick a topic, generate questions, and track your progress over time.";
		if (stepIndex()===1) return "A few highlights to help you get the most out of RandPhyQuGeA.";
		if (stepIndex()===2) return "Choose a starting theme and practice mode. You can change these later in Settings.";
		return "Pick up where you left off anytime. Your progress is saved locally on this device.";
	});
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
						<For each={Array.from({length: TOTAL_STEPS})}>{(_, index) => (
							<button
								type="button"
								role="tab"
								aria-selected={index()===stepIndex()}
								aria-label={`Step ${index()+1}`}
								class={`${styles.dot} ${index()===stepIndex() ? styles.dotActive : ""} ${index()<stepIndex() ? styles.dotCompleted : ""}`}
								onClick={() => goToStep(index())}
							/>
						)}</For>
					</div>
					<div class={styles.actions}>
						<Button variant="ghost" size="md" onClick={handleDismiss}>Skip</Button>
						<Show when={stepIndex()>0} fallback={<span class={styles.spacer} />}>
							<Button variant="ghost" size="md" leftIcon={<ArrowLeftIcon />} onClick={handlePrevious}>Back</Button>
						</Show>
						<Show when={isLastStep()} fallback={
							<Button variant="primary" size="md" rightIcon={<ArrowRightIcon />} onClick={handleNext}>Next</Button>
						}>
							<Button variant="primary" size="md" onClick={handleFinish}>Get started</Button>
						</Show>
					</div>
				</div>
			}
		>
			<div class={styles.viewport} aria-live="polite" aria-atomic="true">
				<ol class={styles.stepList}>
					<Show when={stepIndex()===0}>
						<li class={`${styles.step} ${styles.stepWelcome}`}>
							<span class={styles.heroIcon}><AtomIcon /></span>
							<h3 class={styles.headline}>{stepHeadline()}</h3>
							<p class={styles.body}>{stepBody()}</p>
						</li>
					</Show>
					<Show when={stepIndex()===1}>
						<li class={`${styles.step} ${styles.stepFeatures}`}>
							<h3 class={styles.headline}>{stepHeadline()}</h3>
							<p class={styles.body}>{stepBody()}</p>
							<ul class={styles.featureGrid}>
								<For each={FEATURES}>{(feature) => (
									<li class={styles.featureCard}>
										<span class={styles.featureIcon}>{feature.icon()}</span>
										<span class={styles.featureTitle}>{feature.title}</span>
										<span class={styles.featureBody}>{feature.body}</span>
									</li>
								)}</For>
							</ul>
						</li>
					</Show>
					<Show when={stepIndex()===2}>
						<li class={`${styles.step} ${styles.stepSetup}`}>
							<h3 class={styles.headline}>{stepHeadline()}</h3>
							<p class={styles.body}>{stepBody()}</p>
							<div class={styles.setupGroup}>
								<span class={styles.setupLabel}>Theme</span>
								<div class={styles.themeOptions} role="radiogroup" aria-label="Theme">
									<For each={THEME_OPTIONS}>{(option) => (
										<button
											type="button"
											role="radio"
											aria-checked={themeChoice()===option.value}
											class={`${styles.themeOption} ${themeChoice()===option.value ? styles.themeOptionActive : ""}`}
											onClick={() => setThemeChoice(option.value)}
										>
											<span class={styles.themeOptionIcon}>{option.icon()}</span>
											<span class={styles.themeOptionLabel}>{option.label}</span>
										</button>
									)}</For>
								</div>
							</div>
							<div class={styles.setupGroup}>
								<span class={styles.setupLabel}>Default mode</span>
								<div class={styles.modeOptions} role="radiogroup" aria-label="Default mode">
									<For each={MODE_OPTIONS}>{(option) => (
										<button
											type="button"
											role="radio"
											aria-checked={modeChoice()===option.value}
											class={`${styles.modeOption} ${modeChoice()===option.value ? styles.modeOptionActive : ""}`}
											onClick={() => setModeChoice(option.value)}
										>
											<span class={styles.modeOptionLabel}>{option.label}</span>
											<span class={styles.modeOptionHint}>{option.hint}</span>
										</button>
									)}</For>
								</div>
							</div>
						</li>
					</Show>
					<Show when={stepIndex()===3}>
						<li class={`${styles.step} ${styles.stepFinish}`}>
							<span class={styles.heroIcon}><AtomIcon /></span>
							<h3 class={styles.headline}>{stepHeadline()}</h3>
							<p class={styles.body}>{stepBody()}</p>
						</li>
					</Show>
				</ol>
			</div>
			<div class={styles.progress} aria-hidden="true">
				<div class={styles.progressBar} style={`width: ${progressPercent()}%;`} />
			</div>
		</Modal>
	);
}
