import {useRef, useState, type KeyboardEvent} from 'react';
import {Modal, ConfirmDialog} from '../ui';
import {useUiStore} from '../../stores/uiStore';
import {useSettingsStore, type ThemeMode, type FontMode} from '../../stores/settingsStore';
import type {PracticeMode} from '../../types/models';
type SettingsTab = 'basic' | 'advanced';
/** Theme select options. */
const THEME_OPTIONS: {value: ThemeMode; label: string}[] = [
	{value: 'system', label: 'System'},
	{value: 'light', label: 'Light'},
	{value: 'dark', label: 'Dark'}
];
/** Font select options. */
const FONT_OPTIONS: {value: FontMode; label: string}[] = [
	{value: 'default', label: 'Default'},
	{value: 'opendyslexic', label: 'OpenDyslexic'}
];
/** Default mode select options. */
const MODE_OPTIONS: {value: PracticeMode; label: string}[] = [
	{value: 'Single', label: 'Single'},
	{value: 'Mental', label: 'Mental'}
];
/** Default scope select options. */
const SCOPE_OPTIONS: {value: string; label: string}[] = [
	{value: 'simple', label: 'Simple Math'},
	{value: 'algebra', label: 'Algebra'},
	{value: 'precalc', label: 'Precalculus'},
	{value: 'calc', label: 'Calculus'},
	{value: 'all', label: 'All'}
];
/** Mental difficulty select options. */
const DIFFICULTY_OPTIONS: {value: 'easy' | 'medium' | 'hard'; label: string}[] = [
	{value: 'easy', label: 'Easy'},
	{value: 'medium', label: 'Medium'},
	{value: 'hard', label: 'Hard'}
];
/** FPS cap select options. */
const FPS_OPTIONS: {value: number; label: string}[] = [
	{value: 30, label: '30'},
	{value: 60, label: '60'},
	{value: 90, label: '90'},
	{value: 120, label: '120'},
	{value: 0, label: 'Screen (no cap)'}
];
/**
 * Settings overlay mapped to `#settings-modal`.
 *
 * Renders two tabs (Basic and Advanced) with every setting from the
 * reference: Updates, Appearance (theme/font), General (default mode,
 * adaptive, auto-continue, shuffle, scope, notifications), Mental Mode
 * (difficulty, timer, max questions), Answer Options (auto-check delay,
 * decimal places, sound, vibration), Multiple Choice (choice count),
 * Performance (perf mode, wave, blur, preview, animations, FPS cap), and
 * Data (reset to defaults). The reset-to-defaults action is gated behind
 * an in-app {@link ConfirmDialog} so it cannot be triggered accidentally.
 * All values read from and write to the persisted settingsStore so changes
 * apply immediately and survive reload.
 */
export function SettingsModal() {
	const isOpen = useUiStore(state => state.activeModal === 'settings');
	const closeModal = useUiStore(state => state.closeModal);
	const [activeTab, setActiveTab] = useState<SettingsTab>('basic');
	const [confirmReset, setConfirmReset] = useState(false);
	const settings = useSettingsStore();
	const tablistRef = useRef<HTMLDivElement>(null);
	const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		event.preventDefault();
		const next = activeTab === 'basic' ? 'advanced' : 'basic';
		setActiveTab(next);
		const tablist = tablistRef.current;
		if (tablist) {
			requestAnimationFrame(() => {
				const target = tablist.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`);
				target?.focus();
			});
		}
	};
	const handleConfirmReset = () => {
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
				footer={
					<button type="button" className="primary-button" onClick={closeModal}>
						Save &amp; Close
					</button>
				}
			>
				<div ref={tablistRef} className="settings-tabs" role="tablist" aria-label="Settings sections" onKeyDown={handleTabKeyDown}>
					<button
						type="button"
						role="tab"
						id="settings-tab-basic"
						data-tab="basic"
						aria-selected={activeTab === 'basic'}
						aria-controls="settings-basic"
						tabIndex={activeTab === 'basic' ? 0 : -1}
						className={`mode-button settings-tab ${activeTab === 'basic' ? 'active' : ''}`}
						onClick={() => setActiveTab('basic')}
					>
						Basic
					</button>
					<button
						type="button"
						role="tab"
						id="settings-tab-advanced"
						data-tab="advanced"
						aria-selected={activeTab === 'advanced'}
						aria-controls="settings-advanced"
						tabIndex={activeTab === 'advanced' ? 0 : -1}
						className={`mode-button settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
						onClick={() => setActiveTab('advanced')}
					>
						Advanced
					</button>
				</div>
				{activeTab === 'basic' && (
					<div id="settings-basic" role="tabpanel" aria-labelledby="settings-tab-basic" tabIndex={0} className="settings-panel">
						<div className="settings-section">
							<h3>Updates</h3>
							<div className="setting-item">
								<label htmlFor="check-updates">Check for updates</label>
								<button type="button" className="secondary-button" id="check-updates">
									Check Now
								</button>
							</div>
						</div>
						<div className="settings-section">
							<h3>Appearance</h3>
							<div className="setting-item">
								<label htmlFor="settings-theme">Theme</label>
								<select id="settings-theme" className="scope-select" value={settings.themeMode} onChange={event => settings.setThemeMode(event.target.value as ThemeMode)}>
									{THEME_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-font">Font</label>
								<select id="settings-font" className="scope-select" value={settings.fontMode} onChange={event => settings.setFontMode(event.target.value as FontMode)}>
									{FONT_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="settings-section">
							<h3>General</h3>
							<div className="setting-item">
								<label htmlFor="settings-default-mode">Default mode</label>
								<select id="settings-default-mode" className="scope-select" value={settings.defaultMode} onChange={event => settings.setDefaultMode(event.target.value as PracticeMode)}>
									{MODE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-adaptive">Adaptive Learning (adjusts difficulty &amp; recommends weak topics)</label>
								<input type="checkbox" id="settings-adaptive" className="settings-checkbox" checked={settings.adaptiveEnabled} onChange={event => settings.setAdaptiveEnabled(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-auto-continue">Auto-continue (Single mode)</label>
								<input
									type="checkbox"
									id="settings-auto-continue"
									className="settings-checkbox"
									checked={settings.autoContinueEnabled}
									onChange={event => settings.setAutoContinueEnabled(event.target.checked)}
								/>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-shuffle">Shuffle by default</label>
								<input type="checkbox" id="settings-shuffle" className="settings-checkbox" checked={settings.shuffleByDefault} onChange={event => settings.setShuffleByDefault(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-scope">Default scope</label>
								<select id="settings-scope" className="scope-select" value={settings.defaultScope} onChange={event => settings.setDefaultScope(event.target.value)}>
									{SCOPE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-notifications">Show notifications</label>
								<input
									type="checkbox"
									id="settings-notifications"
									className="settings-checkbox"
									checked={settings.notificationsEnabled}
									onChange={event => settings.setNotificationsEnabled(event.target.checked)}
								/>
							</div>
						</div>
						<div className="settings-section">
							<h3>Mental Mode</h3>
							<div className="setting-item">
								<label htmlFor="settings-difficulty">Difficulty</label>
								<select
									id="settings-difficulty"
									className="scope-select"
									value={settings.mentalDifficulty}
									onChange={event => settings.setMentalDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}
								>
									{DIFFICULTY_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-timer">Timer (seconds)</label>
								<input
									type="number"
									id="settings-timer"
									min={10}
									max={120}
									className="settings-number"
									value={settings.mentalDurationSec}
									onChange={event => settings.setMentalDurationSec(Number(event.target.value))}
								/>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-max-questions">Questions per session</label>
								<input
									type="number"
									id="settings-max-questions"
									min={1}
									max={20}
									className="settings-number"
									value={settings.mentalMaxQuestions}
									onChange={event => settings.setMentalMaxQuestions(Number(event.target.value))}
								/>
							</div>
						</div>
					</div>
				)}
				{activeTab === 'advanced' && (
					<div id="settings-advanced" role="tabpanel" aria-labelledby="settings-tab-advanced" tabIndex={0} className="settings-panel">
						<div className="settings-section">
							<h3>Answer Options</h3>
							<div className="setting-item">
								<label htmlFor="settings-auto-check-delay">Auto-check delay (ms)</label>
								<input
									type="number"
									id="settings-auto-check-delay"
									min={100}
									max={5000}
									step={50}
									className="settings-number"
									value={settings.autoCheckDelay}
									onChange={event => settings.setAutoCheckDelay(Number(event.target.value))}
								/>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-decimal-places">Decimal places (tolerance)</label>
								<input
									type="number"
									id="settings-decimal-places"
									min={0}
									max={10}
									className="settings-number"
									value={settings.decimalPlaces}
									onChange={event => settings.setDecimalPlaces(Number(event.target.value))}
								/>
							</div>
							<div className="setting-item">
								<label htmlFor="settings-sound">Sound effects</label>
								<input type="checkbox" id="settings-sound" className="settings-checkbox" checked={settings.soundEnabled} onChange={event => settings.setSoundEnabled(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-vibration">Vibration (mobile)</label>
								<input type="checkbox" id="settings-vibration" className="settings-checkbox" checked={settings.hapticEnabled} onChange={event => settings.setHapticEnabled(event.target.checked)} />
							</div>
						</div>
						<div className="settings-section">
							<h3>Multiple Choice</h3>
							<div className="setting-item">
								<label htmlFor="settings-mcq-choices">Number of choices</label>
								<input
									type="number"
									id="settings-mcq-choices"
									min={2}
									max={6}
									className="settings-number"
									value={settings.mcqChoices}
									onChange={event => settings.setMcqChoices(Number(event.target.value))}
								/>
							</div>
						</div>
						<div className="settings-section">
							<h3>Performance</h3>
							<div className="setting-item">
								<label htmlFor="settings-perf-master">Performance mode (disables eye candy)</label>
								<input type="checkbox" id="settings-perf-master" className="settings-checkbox" checked={settings.perfMode} onChange={event => settings.setPerfMode(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-perf-wave">Wave background</label>
								<input type="checkbox" id="settings-perf-wave" className="settings-checkbox" checked={settings.waveBackground} onChange={event => settings.setWaveBackground(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-perf-blur">Blur effects</label>
								<input type="checkbox" id="settings-perf-blur" className="settings-checkbox" checked={settings.blurEffects} onChange={event => settings.setBlurEffects(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-perf-preview">Live preview (KaTeX)</label>
								<input type="checkbox" id="settings-perf-preview" className="settings-checkbox" checked={settings.livePreview} onChange={event => settings.setLivePreview(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-perf-animations">Animations</label>
								<input type="checkbox" id="settings-perf-animations" className="settings-checkbox" checked={settings.animations} onChange={event => settings.setAnimations(event.target.checked)} />
							</div>
							<div className="setting-item">
								<label htmlFor="settings-fps-cap">FPS cap (for JS animations)</label>
								<select id="settings-fps-cap" className="scope-select" value={settings.fpsCap} onChange={event => settings.setFpsCap(Number(event.target.value))}>
									{FPS_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="settings-section">
							<h3>Data</h3>
							<div className="setting-item">
								<button type="button" className="secondary-button" id="settings-reset" onClick={() => setConfirmReset(true)}>
									Reset to defaults
								</button>
							</div>
						</div>
					</div>
				)}
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
