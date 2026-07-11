import type {JSX, JSXElement} from "solid-js";
import {Show, createSignal} from "solid-js";
import {Modal} from "../ui/Modal";
import {ConfirmDialog} from "../ui/ConfirmDialog";
import {Button} from "../ui/Button";
import {Select} from "../ui/Select";
import {Switch} from "../ui/Switch";
import {Input} from "../ui/Input";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "../ui/Tabs";
import {useUiStore} from "../../stores/uiStore";
import {useSettingsStore} from "../../stores/settingsStore";
import type {ThemeMode, FontMode, FontSize} from "../../stores/settingsStore";
import type {PracticeMode, ResponseMode} from "../../../types/models";
import styles from "./SettingsModal.module.css";
const THEME_OPTIONS: {value: ThemeMode; label: string}[]=[
	{value: "system", label: "System"},
	{value: "light", label: "Light"},
	{value: "dark", label: "Dark"},
	{value: "dim", label: "Dim"},
];
const FONT_OPTIONS: {value: FontMode; label: string}[]=[
	{value: "default", label: "Default"},
	{value: "opendyslexic", label: "OpenDyslexic"},
];
const FONT_SIZE_OPTIONS: {value: FontSize; label: string}[]=[
	{value: "small", label: "Small"},
	{value: "medium", label: "Medium"},
	{value: "large", label: "Large"},
];
const RESPONSE_MODE_OPTIONS: {value: ResponseMode; label: string}[]=[
	{value: "frq", label: "Free Response"},
	{value: "mcq", label: "Multiple Choice"},
];
const MODE_OPTIONS: {value: PracticeMode; label: string}[]=[
	{value: "Single", label: "Single"},
	{value: "Mental", label: "Mental"},
];
const SCOPE_OPTIONS: {value: string; label: string}[]=[
	{value: "simple", label: "Simple Math"},
	{value: "algebra", label: "Algebra"},
	{value: "precalc", label: "Precalculus"},
	{value: "calc", label: "Calculus"},
	{value: "all", label: "All"},
];
const DIFFICULTY_OPTIONS: {value: "easy" | "medium" | "hard"; label: string}[]=[
	{value: "easy", label: "Easy"},
	{value: "medium", label: "Medium"},
	{value: "hard", label: "Hard"},
];
const FPS_OPTIONS: {value: number; label: string}[]=[
	{value: 30, label: "30"},
	{value: 60, label: "60"},
	{value: 90, label: "90"},
	{value: 120, label: "120"},
	{value: 0, label: "Screen (no cap)"},
];
interface SettingsSectionProps {
	title: string;
	children?: JSXElement;
}
function SettingsSection(props: SettingsSectionProps): JSX.Element {
	return (
		<Card variant="filled" class={styles.sectionCard}>
			<CardHeader>
				<CardTitle>{props.title}</CardTitle>
			</CardHeader>
			<CardContent class={styles.sectionContent}>
				{props.children}
			</CardContent>
		</Card>
	);
}
interface SettingsRowProps {
	label?: string;
	hint?: string;
	controlId?: string;
	children?: JSXElement;
}
function SettingsRow(props: SettingsRowProps): JSX.Element {
	return (
		<div class={styles.row}>
			<Show when={props.label}>
				<div class={styles.rowLabel}>
					<label for={props.controlId} class={styles.rowTitle}>{props.label}</label>
					<Show when={props.hint}>
						<span class={styles.rowHint}>{props.hint}</span>
					</Show>
				</div>
			</Show>
			<div class={styles.rowControl}>{props.children}</div>
		</div>
	);
}
/**
 * Settings overlay mapped to `#settings-modal`.
 *
 * Solid port of {@link ../../../components/modals/SettingsModal}. Organizes
 * preferences into Basic and Advanced tabs using the existing Solid
 * {@link Tabs} primitive (role="tablist", arrow-key navigation,
 * aria-selected/aria-controls). All values read from and write to the
 * persisted settingsStore so changes apply immediately and survive reload.
 * Reset to defaults is gated behind an in-app {@link ConfirmDialog}.
 * Framer Motion panel transitions are replaced by CSS.
 */
export function SettingsModal(): JSX.Element {
	let isOpen=useUiStore(s => s.activeModal==="settings");
	let settings=useSettingsStore();
	let [confirmReset, setConfirmReset]=createSignal<boolean>(false);
	let handleSelect=(setter: (value: string) => void)=>
		(event: Event) => {
			let target=event.target as HTMLSelectElement;
			setter(target.value);
		};
	let handleNumber=(setter: (value: number) => void)=>
		(event: Event) => {
			let target=event.target as HTMLInputElement;
			setter(Number(target.value));
		};
	let handleConfirmReset=() => {
		useSettingsStore.getState().resetToDefaults();
		setConfirmReset(false);
	};
	let close=() => useUiStore.getState().closeModal();
	return (
		<>
			<Modal
				open={isOpen()}
				onClose={close}
				modalId="settings-modal"
				title="Settings"
				titleId="settings-title"
				ariaLabel="Settings"
				class={styles.settings}
				footer={<Button variant="primary" size="md" onClick={close}>Save &amp; Close</Button>}
			>
				<Tabs defaultValue="basic">
					<TabsList ariaLabel="Settings sections" class={styles.tabs}>
						<TabsTrigger value="basic" class={styles.tab}>Basic</TabsTrigger>
						<TabsTrigger value="advanced" class={styles.tab}>Advanced</TabsTrigger>
					</TabsList>
					<TabsContent value="basic">
						<div class={styles.panel}>
							<SettingsSection title="Appearance">
								<SettingsRow label="Theme" hint="Choose a light, dark, dim, or system look." controlId="settings-theme">
									<Select id="settings-theme" variant="scope" options={THEME_OPTIONS} value={settings().themeMode} onChange={handleSelect(v => useSettingsStore.getState().setThemeMode(v as ThemeMode))} />
								</SettingsRow>
								<SettingsRow label="Font" hint="Use OpenDyslexic for improved readability." controlId="settings-font">
									<Select id="settings-font" variant="scope" options={FONT_OPTIONS} value={settings().fontMode} onChange={handleSelect(v => useSettingsStore.getState().setFontMode(v as FontMode))} />
								</SettingsRow>
								<SettingsRow label="Font size" hint="Scale the base text size for readability." controlId="settings-font-size">
									<Select id="settings-font-size" variant="scope" options={FONT_SIZE_OPTIONS} value={settings().fontSize} onChange={handleSelect(v => useSettingsStore.getState().setFontSize(v as FontSize))} />
								</SettingsRow>
							</SettingsSection>
							<SettingsSection title="Practice">
								<SettingsRow label="Default mode" hint="Start in single-question or mental math mode." controlId="settings-default-mode">
									<Select id="settings-default-mode" variant="scope" options={MODE_OPTIONS} value={settings().defaultMode} onChange={handleSelect(v => useSettingsStore.getState().setDefaultMode(v as PracticeMode))} />
								</SettingsRow>
								<SettingsRow label="Default scope" hint="Limit generated questions to a subject area." controlId="settings-scope">
									<Select id="settings-scope" variant="scope" options={SCOPE_OPTIONS} value={settings().defaultScope} onChange={handleSelect(useSettingsStore.getState().setDefaultScope)} />
								</SettingsRow>
								<SettingsRow label="Difficulty" hint="Base challenge level for timed drills." controlId="settings-difficulty">
									<Select id="settings-difficulty" variant="scope" options={DIFFICULTY_OPTIONS} value={settings().mentalDifficulty} onChange={handleSelect(v => useSettingsStore.getState().setMentalDifficulty(v as "easy" | "medium" | "hard"))} />
								</SettingsRow>
								<SettingsRow label="Timer" hint="Duration of each mental math drill in seconds." controlId="settings-timer">
									<Input id="settings-timer" type="number" min={10} max={120} value={settings().mentalDurationSec} onChange={handleNumber(useSettingsStore.getState().setMentalDurationSec)} />
								</SettingsRow>
								<SettingsRow label="Questions per session" hint="Maximum questions in a mental math round." controlId="settings-max-questions">
									<Input id="settings-max-questions" type="number" min={1} max={20} value={settings().mentalMaxQuestions} onChange={handleNumber(useSettingsStore.getState().setMentalMaxQuestions)} />
								</SettingsRow>
							</SettingsSection>
							<SettingsSection title="Answer Format">
								<SettingsRow label="Response mode" hint="Default format for generated questions." controlId="settings-response-mode">
									<Select id="settings-response-mode" variant="scope" options={RESPONSE_MODE_OPTIONS} value={settings().defaultResponseMode} onChange={handleSelect(v => useSettingsStore.getState().setDefaultResponseMode(v as ResponseMode))} />
								</SettingsRow>
								<Show when={settings().defaultResponseMode==="mcq"}>
									<SettingsRow label="MCQ choices" hint="Number of choices shown for multiple-choice questions." controlId="settings-mcq-choices">
										<Input id="settings-mcq-choices" type="number" min={2} max={6} value={settings().mcqChoices} onChange={handleNumber(useSettingsStore.getState().setMcqChoices)} />
									</SettingsRow>
								</Show>
								<SettingsRow label="Decimal tolerance" hint="Decimal places used when comparing numeric answers." controlId="settings-decimal-places">
									<Input id="settings-decimal-places" type="number" min={0} max={10} value={settings().decimalPlaces} onChange={handleNumber(useSettingsStore.getState().setDecimalPlaces)} />
								</SettingsRow>
								<SettingsRow label="Significant figures" hint="Number of sig figs used when formatting numeric answers." controlId="settings-sig-figs">
									<Input id="settings-sig-figs" type="number" min={1} max={10} value={settings().sigFigs} onChange={handleNumber(useSettingsStore.getState().setSigFigs)} />
								</SettingsRow>
							</SettingsSection>
							<SettingsSection title="Behavior">
								<SettingsRow>
									<Switch id="settings-adaptive" label="Adaptive Learning" hint="Adjust difficulty and recommend weak topics." checked={settings().adaptiveEnabled} onCheckedChange={useSettingsStore.getState().setAdaptiveEnabled} />
								</SettingsRow>
								<SettingsRow>
									<Switch id="settings-auto-continue" label="Auto-continue" hint="Advance to the next question automatically in single mode." checked={settings().autoContinueEnabled} onCheckedChange={useSettingsStore.getState().setAutoContinueEnabled} />
								</SettingsRow>
								<SettingsRow>
									<Switch id="settings-shuffle" label="Shuffle by default" hint="Randomize question order in each session." checked={settings().shuffleByDefault} onCheckedChange={useSettingsStore.getState().setShuffleByDefault} />
								</SettingsRow>
								<SettingsRow>
									<Switch id="settings-notifications" label="Show notifications" hint="Display brief status messages after actions." checked={settings().notificationsEnabled} onCheckedChange={useSettingsStore.getState().setNotificationsEnabled} />
								</SettingsRow>
							</SettingsSection>
						</div>
					</TabsContent>
					<TabsContent value="advanced">
						<div class={styles.panel}>
							<SettingsSection title="Updates">
								<SettingsRow label="Check for updates" hint="Verify you are running the latest version.">
									<Button variant="secondary" size="sm" onClick={() => {}}>Check Now</Button>
								</SettingsRow>
							</SettingsSection>
							<SettingsSection title="Answer Options">
							<SettingsRow label="Auto-check delay" hint="Milliseconds before an answer is evaluated automatically." controlId="settings-auto-check-delay">
								<Input id="settings-auto-check-delay" type="number" min={100} max={5000} step={50} value={settings().autoCheckDelay} onChange={handleNumber(useSettingsStore.getState().setAutoCheckDelay)} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-sound" label="Sound effects" hint="Play audio cues on correct and incorrect answers." checked={settings().soundEnabled} onCheckedChange={useSettingsStore.getState().setSoundEnabled} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-vibration" label="Vibration" hint="Haptic feedback on supported devices." checked={settings().hapticEnabled} onCheckedChange={useSettingsStore.getState().setHapticEnabled} />
							</SettingsRow>
						</SettingsSection>
						<SettingsSection title="Performance">
							<SettingsRow>
								<Switch id="settings-perf-master" label="Performance mode" hint="Disable decorative effects for smoother rendering." checked={settings().perfMode} onCheckedChange={useSettingsStore.getState().setPerfMode} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-perf-wave" label="Wave background" hint="Show the animated background layer." checked={settings().waveBackground} onCheckedChange={useSettingsStore.getState().setWaveBackground} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-perf-blur" label="Blur effects" hint="Enable backdrop blur on elevated surfaces." checked={settings().blurEffects} onCheckedChange={useSettingsStore.getState().setBlurEffects} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-perf-preview" label="Live preview" hint="Render KaTeX previews while editing." checked={settings().livePreview} onCheckedChange={useSettingsStore.getState().setLivePreview} />
							</SettingsRow>
							<SettingsRow>
								<Switch id="settings-perf-animations" label="Animations" hint="Enable motion transitions throughout the app." checked={settings().animations} onCheckedChange={useSettingsStore.getState().setAnimations} />
							</SettingsRow>
							<SettingsRow label="FPS cap" hint="Limit frame rate for JavaScript-driven animations." controlId="settings-fps-cap">
								<Select id="settings-fps-cap" variant="scope" options={FPS_OPTIONS.map(o => ({value: String(o.value), label: o.label}))} value={String(settings().fpsCap)} onChange={handleNumber(useSettingsStore.getState().setFpsCap)} />
							</SettingsRow>
						</SettingsSection>
							<SettingsSection title="Data">
								<SettingsRow label="Reset settings" hint="Restore all settings to their default values.">
									<Button variant="danger" size="sm" aria-label="Reset settings" onClick={() => setConfirmReset(true)}>Reset to defaults</Button>
								</SettingsRow>
							</SettingsSection>
						</div>
					</TabsContent>
				</Tabs>
			</Modal>
			<ConfirmDialog
				destructive
				title="Reset settings?"
				message="This will restore all settings to their defaults. This cannot be undone."
				confirmLabel="Reset"
				open={confirmReset()}
				onConfirm={handleConfirmReset}
				onCancel={() => setConfirmReset(false)}
			/>
		</>
	);
}
