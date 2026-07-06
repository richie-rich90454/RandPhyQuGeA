import {useRef, useState, useId, Children, cloneElement, isValidElement, type KeyboardEvent, type ReactNode} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Modal, ConfirmDialog, Button, Select, Switch, Input, Card, CardContent, CardHeader, CardTitle} from "../ui";
import {ScrollReveal} from "../animations";
import {useUiStore} from "../../stores/uiStore";
import {useSettingsStore, type ThemeMode, type FontMode} from "../../stores/settingsStore";
import type {PracticeMode} from "../../types/models";
type SettingsTab="basic" | "advanced";
const TABS:{id: SettingsTab; label: string}[]=[
	{id: "basic", label: "Basic"},
	{id: "advanced", label: "Advanced"},
];
const THEME_OPTIONS:{value: ThemeMode; label: string}[]=[
	{value: "system", label: "System"},
	{value: "light", label: "Light"},
	{value: "dark", label: "Dark"},
];
const FONT_OPTIONS:{value: FontMode; label: string}[]=[
	{value: "default", label: "Default"},
	{value: "opendyslexic", label: "OpenDyslexic"},
];
const MODE_OPTIONS:{value: PracticeMode; label: string}[]=[
	{value: "Single", label: "Single"},
	{value: "Mental", label: "Mental"},
];
const SCOPE_OPTIONS:{value: string; label: string}[]=[
	{value: "simple", label: "Simple Math"},
	{value: "algebra", label: "Algebra"},
	{value: "precalc", label: "Precalculus"},
	{value: "calc", label: "Calculus"},
	{value: "all", label: "All"},
];
const DIFFICULTY_OPTIONS:{value: "easy" | "medium" | "hard"; label: string}[]=[
	{value: "easy", label: "Easy"},
	{value: "medium", label: "Medium"},
	{value: "hard", label: "Hard"},
];
const FPS_OPTIONS:{value: number; label: string}[]=[
	{value: 30, label: "30"},
	{value: 60, label: "60"},
	{value: 90, label: "90"},
	{value: 120, label: "120"},
	{value: 0, label: "Screen (no cap)"},
];
interface SettingsSectionProps {
	title: string;
	children?: ReactNode;
}
function SettingsSection({title, children}: SettingsSectionProps) {
	return (
		<Card variant="filled" className="settings-section-card">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="settings-section-content">
				{children}
			</CardContent>
		</Card>
	);
}
interface SettingsRowProps {
	label?: string;
	hint?: string;
	children?: ReactNode;
}
function SettingsRow({label, hint, children}: SettingsRowProps) {
	const titleId=useId();
	const child=Children.only(children);
	const labelledChild=isValidElement<{ "aria-labelledby"?: string }>(child) && label && !child.props["aria-labelledby"]
		? cloneElement(child, {"aria-labelledby": titleId})
		: child;
	return (
		<div className="settings-row">
			<div className="settings-row-label">
				{label && <span className="settings-row-title" id={titleId}>{label}</span>}
				{hint && <span className="settings-row-hint">{hint}</span>}
			</div>
			<div className="settings-row-control">
				{labelledChild}
			</div>
		</div>
	);
}
const panelEase: [number, number, number, number]=[0.2, 0, 0, 1];
const handleCheckUpdates=() => {};
const panelVariants={
	hidden: {opacity: 0, y: 8},
	visible: {opacity: 1, y: 0, transition: {duration: 0.2, ease: panelEase}},
	exit: {opacity: 0, y: -4, transition: {duration: 0.12}},
};
/**
 * Settings overlay mapped to `#settings-modal`.
 *
 * Organizes preferences into Basic and Advanced tabs using card sections and
 * design-system controls. All values read from and write to the persisted
 * settingsStore so changes apply immediately and survive reload. Reset to
 * defaults is gated behind an in-app {@link ConfirmDialog}.
 */
export function SettingsModal() {
	const isOpen=useUiStore(state => state.activeModal==="settings");
	const closeModal=useUiStore(state => state.closeModal);
	const [activeTab, setActiveTab]=useState<SettingsTab>("basic");
	const [confirmReset, setConfirmReset]=useState(false);
	const settings=useSettingsStore();
	const tablistRef=useRef<HTMLDivElement>(null);
	const scrollerRef=useRef<HTMLElement | null>(null);
	const handleTabKeyDown=(event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key!=="ArrowRight" && event.key!=="ArrowLeft") return;
		event.preventDefault();
		const next=activeTab==="basic" ? "advanced" : "basic";
		setActiveTab(next);
		const tablist=tablistRef.current;
		if (tablist) {
			requestAnimationFrame(() => {
				const target=tablist.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`);
				target?.focus();
			});
		}
	};
	const handleConfirmReset=() => {
		settings.resetToDefaults();
		setConfirmReset(false);
	};
	return (
		<>
			<Modal
				open={isOpen}
				onClose={closeModal}
				modalId="settings-modal"
				title="Settings"
				titleId="settings-title"
				ariaLabel="Settings"
				scrollerRef={scrollerRef}
				footer={
					<Button variant="primary" size="md" onClick={closeModal}>
						Save &amp; Close
					</Button>
				}
			>
				<div ref={tablistRef} className="settings-tabs" role="tablist" aria-label="Settings sections" onKeyDown={handleTabKeyDown}>
					{TABS.map(tab => (
						<button
							key={tab.id}
							type="button"
							role="tab"
							id={`settings-tab-${tab.id}`}
							data-tab={tab.id}
							aria-selected={activeTab===tab.id}
							aria-controls={`settings-${tab.id}`}
							tabIndex={activeTab===tab.id ? 0 : -1}
							className={`settings-tab ${activeTab===tab.id ? "active" : ""}`}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>
				<AnimatePresence mode="wait" initial={false}>
					{activeTab==="basic" && (
						<motion.div
							key="basic"
							id="settings-basic"
							role="tabpanel"
							aria-labelledby="settings-tab-basic"
							className="settings-panel"
							variants={panelVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<ScrollReveal className="settings-scroll" direction="up" distance={12} duration={0.35} scrollerRef={scrollerRef}>
								<SettingsSection title="Appearance">
									<SettingsRow label="Theme" hint="Choose a light, dark, or system look.">
										<Select
											id="settings-theme"
											variant="scope"
											options={THEME_OPTIONS.map(o => ({value: o.value, label: o.label}))}
											value={settings.themeMode}
											onChange={event => settings.setThemeMode(event.target.value as ThemeMode)}
										/>
									</SettingsRow>
									<SettingsRow label="Font" hint="Use OpenDyslexic for improved readability.">
										<Select
											id="settings-font"
											variant="scope"
											options={FONT_OPTIONS.map(o => ({value: o.value, label: o.label}))}
											value={settings.fontMode}
											onChange={event => settings.setFontMode(event.target.value as FontMode)}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Practice">
									<SettingsRow label="Default mode" hint="Start in single-question or mental math mode.">
										<Select
											id="settings-default-mode"
											variant="scope"
											options={MODE_OPTIONS.map(o => ({value: o.value, label: o.label}))}
											value={settings.defaultMode}
											onChange={event => settings.setDefaultMode(event.target.value as PracticeMode)}
										/>
									</SettingsRow>
									<SettingsRow label="Default scope" hint="Limit generated questions to a subject area.">
										<Select
											id="settings-scope"
											variant="scope"
											options={SCOPE_OPTIONS.map(o => ({value: o.value, label: o.label}))}
											value={settings.defaultScope}
											onChange={event => settings.setDefaultScope(event.target.value)}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Behavior">
									<SettingsRow>
										<Switch
											id="settings-adaptive"
											label="Adaptive Learning"
											hint="Adjust difficulty and recommend weak topics."
											checked={settings.adaptiveEnabled}
											onCheckedChange={settings.setAdaptiveEnabled}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-auto-continue"
											label="Auto-continue"
											hint="Advance to the next question automatically in single mode."
											checked={settings.autoContinueEnabled}
											onCheckedChange={settings.setAutoContinueEnabled}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-shuffle"
											label="Shuffle by default"
											hint="Randomize question order in each session."
											checked={settings.shuffleByDefault}
											onCheckedChange={settings.setShuffleByDefault}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-notifications"
											label="Show notifications"
											hint="Display brief status messages after actions."
											checked={settings.notificationsEnabled}
											onCheckedChange={settings.setNotificationsEnabled}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Mental Mode">
									<SettingsRow label="Difficulty" hint="Base challenge level for timed drills.">
										<Select
											id="settings-difficulty"
											variant="scope"
											options={DIFFICULTY_OPTIONS.map(o => ({value: o.value, label: o.label}))}
											value={settings.mentalDifficulty}
											onChange={event => settings.setMentalDifficulty(event.target.value as "easy" | "medium" | "hard")}
										/>
									</SettingsRow>
									<SettingsRow label="Timer" hint="Duration of each mental math drill in seconds.">
										<Input
											id="settings-timer"
											type="number"
											min={10}
											max={120}
											value={settings.mentalDurationSec}
											onChange={event => settings.setMentalDurationSec(Number(event.target.value))}
										/>
									</SettingsRow>
									<SettingsRow label="Questions per session" hint="Maximum questions in a mental math round.">
										<Input
											id="settings-max-questions"
											type="number"
											min={1}
											max={20}
											value={settings.mentalMaxQuestions}
											onChange={event => settings.setMentalMaxQuestions(Number(event.target.value))}
										/>
									</SettingsRow>
								</SettingsSection>
							</ScrollReveal>
						</motion.div>
					)}
					{activeTab==="advanced" && (
						<motion.div
							key="advanced"
							id="settings-advanced"
							role="tabpanel"
							aria-labelledby="settings-tab-advanced"
							className="settings-panel"
							variants={panelVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<ScrollReveal className="settings-scroll" direction="up" distance={12} duration={0.35} scrollerRef={scrollerRef}>
								<SettingsSection title="Updates">
									<SettingsRow label="Check for updates" hint="Verify you are running the latest version.">
										<Button variant="secondary" size="sm" id="check-updates" onClick={handleCheckUpdates}>
											Check Now
										</Button>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Answer Options">
									<SettingsRow label="Auto-check delay" hint="Milliseconds before an answer is evaluated automatically.">
										<Input
											id="settings-auto-check-delay"
											type="number"
											min={100}
											max={5000}
											step={50}
											value={settings.autoCheckDelay}
											onChange={event => settings.setAutoCheckDelay(Number(event.target.value))}
										/>
									</SettingsRow>
									<SettingsRow label="Decimal places" hint="Tolerance used when comparing numeric answers.">
										<Input
											id="settings-decimal-places"
											type="number"
											min={0}
											max={10}
											value={settings.decimalPlaces}
											onChange={event => settings.setDecimalPlaces(Number(event.target.value))}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-sound"
											label="Sound effects"
											hint="Play audio cues on correct and incorrect answers."
											checked={settings.soundEnabled}
											onCheckedChange={settings.setSoundEnabled}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-vibration"
											label="Vibration"
											hint="Haptic feedback on supported devices."
											checked={settings.hapticEnabled}
											onCheckedChange={settings.setHapticEnabled}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Multiple Choice">
									<SettingsRow label="Number of choices" hint="Choices shown for multiple-choice questions.">
										<Input
											id="settings-mcq-choices"
											type="number"
											min={2}
											max={6}
											value={settings.mcqChoices}
											onChange={event => settings.setMcqChoices(Number(event.target.value))}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Performance">
									<SettingsRow>
										<Switch
											id="settings-perf-master"
											label="Performance mode"
											hint="Disable decorative effects for smoother rendering."
											checked={settings.perfMode}
											onCheckedChange={settings.setPerfMode}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-perf-wave"
											label="Wave background"
											hint="Show the animated background layer."
											checked={settings.waveBackground}
											onCheckedChange={settings.setWaveBackground}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-perf-blur"
											label="Blur effects"
											hint="Enable backdrop blur on elevated surfaces."
											checked={settings.blurEffects}
											onCheckedChange={settings.setBlurEffects}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-perf-preview"
											label="Live preview"
											hint="Render KaTeX previews while editing."
											checked={settings.livePreview}
											onCheckedChange={settings.setLivePreview}
										/>
									</SettingsRow>
									<SettingsRow>
										<Switch
											id="settings-perf-animations"
											label="Animations"
											hint="Enable motion transitions throughout the app."
											checked={settings.animations}
											onCheckedChange={settings.setAnimations}
										/>
									</SettingsRow>
									<SettingsRow label="FPS cap" hint="Limit frame rate for JavaScript-driven animations.">
										<Select
											id="settings-fps-cap"
											variant="scope"
											options={FPS_OPTIONS.map(o => ({value: String(o.value), label: o.label}))}
											value={String(settings.fpsCap)}
											onChange={event => settings.setFpsCap(Number(event.target.value))}
										/>
									</SettingsRow>
								</SettingsSection>
								<SettingsSection title="Data">
									<SettingsRow label="Reset settings" hint="Restore all settings to their default values.">
										<Button variant="danger" size="sm" id="settings-reset" onClick={() => setConfirmReset(true)}>
											Reset to defaults
										</Button>
									</SettingsRow>
								</SettingsSection>
							</ScrollReveal>
						</motion.div>
					)}
				</AnimatePresence>
			</Modal>
			<ConfirmDialog
				destructive
				title="Reset settings?"
				message="This will restore all settings to their defaults. This cannot be undone."
				confirmLabel="Reset"
				open={confirmReset}
				onConfirm={handleConfirmReset}
				onCancel={() => setConfirmReset(false)}
			/>
		</>
	);
}
