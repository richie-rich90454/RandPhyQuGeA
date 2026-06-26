import {useMemo} from 'react';
import {useMentalMode} from '../../hooks/useMentalMode';
import {useSpecStore} from '../../stores/specStore';
import {useSettingsStore} from '../../stores/settingsStore';
import {Select, ProgressBar} from '../ui';
import type {Specification} from '../../types/models';
/**
 * Build scope-select options from the parsed specification's units, always
 * leading with an "All" option. Returns a single "All" option when no spec
 * is loaded yet.
 */
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
	const options = [{value: 'all', label: 'All'}];
	if (specification) {
		for (const unit of specification.units) {
			options.push({value: unit.id, label: unit.name});
		}
	}
	return options;
}
/** Difficulty options for the mental-mode difficulty select. */
const DIFFICULTY_OPTIONS = [
	{value: 'easy', label: 'Easy'},
	{value: 'medium', label: 'Medium'},
	{value: 'hard', label: 'Hard'}
];
/** Timer icon path. */
const TIMER_ICON =
	'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z';
/** Checkmark icon path for the score display. */
const SCORE_ICON = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
/** Pause icon path. */
const PAUSE_ICON = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
/** Skip icon path. */
const SKIP_ICON = 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z';
/**
 * Format a number of seconds as `MM:SS`.
 */
function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
/**
 * Mental-mode bottom-row controls mapped to `#mental-controls`.
 *
 * Renders the difficulty select, timer display, score display, pause/skip
 * buttons (visible only during an active session), mental scope select,
 * shuffle and unlimited toggles, a live statistics panel, the Start Session
 * button, and a progress bar showing elapsed session time. The timer is
 * functional in Task 14; question generation and skip are wired in Task 18.
 */
export function MentalControls() {
	const {
		difficulty,
		setDifficulty,
		scope,
		setScope,
		shuffle,
		setShuffle,
		unlimited,
		setUnlimited,
		timeRemaining,
		isPaused,
		isSessionActive,
		score,
		total,
		accuracy,
		avgTimeMs,
		startSession,
		pauseSession,
		resumeSession,
		skipQuestion
	} = useMentalMode();
	const specification = useSpecStore(state => state.specification);
	const mentalDurationSec = useSettingsStore(state => state.mentalDurationSec);
	const scopeOptions = useMemo(() => buildScopeOptions(specification), [specification]);
	const progressPercent = mentalDurationSec > 0 ? ((mentalDurationSec - timeRemaining) / mentalDurationSec) * 100 : 0;
	const showPause = isSessionActive && !isPaused;
	const showResume = isSessionActive && isPaused;
	return (
		<div id="mental-controls" className="mental-controls-wrapper">
			<div className="mental-stats">
				<Select
					id="difficulty-select"
					variant="difficulty"
					aria-label="Difficulty"
					title="Select difficulty level"
					options={DIFFICULTY_OPTIONS}
					value={difficulty}
					onChange={event => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}
				/>
				<span id="timer-display" className="stat-with-icon" title="Time remaining">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d={TIMER_ICON} />
					</svg>
					{formatTime(timeRemaining || mentalDurationSec)}
				</span>
				<span id="score-display" className="stat-with-icon" title="Correct / Total">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d={SCORE_ICON} />
					</svg>
					{score} / {total}
				</span>
				{showPause && (
					<button type="button" className="icon-button mental-action-btn" id="pause-session" aria-label="Pause" title="Pause session" onClick={pauseSession}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d={PAUSE_ICON} />
						</svg>
					</button>
				)}
				{showResume && (
					<button type="button" className="icon-button mental-action-btn" id="resume-session" aria-label="Resume" title="Resume session" onClick={resumeSession}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M8 5v14l11-7z" />
						</svg>
					</button>
				)}
				{isSessionActive && (
					<button type="button" className="icon-button mental-action-btn" id="skip-question" aria-label="Skip" title="Skip this question" onClick={skipQuestion}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d={SKIP_ICON} />
						</svg>
					</button>
				)}
			</div>
			<div className="mental-extra-controls">
				<Select
					id="mental-scope-select"
					variant="scope"
					aria-label="Mental scope"
					title="Select scope for mental mode"
					options={scopeOptions}
					value={scope}
					onChange={event => setScope(event.target.value)}
				/>
				<label className="shuffle-toggle" id="mental-shuffle-label" title="Randomly pick topics in mental mode">
					<input type="checkbox" id="mental-shuffle-toggle" checked={shuffle} onChange={event => setShuffle(event.target.checked)} /> Shuffle
				</label>
				<label className="shuffle-toggle" id="unlimited-label" title="Unlimited practice (no question limit)">
					<input type="checkbox" id="unlimited-toggle" checked={unlimited} onChange={event => setUnlimited(event.target.checked)} /> Unlimited
				</label>
				{isSessionActive && (
					<div id="statistics-panel" className="statistics-panel">
						<span className="stat-with-icon" id="accuracy-stat" title="Accuracy">
							Accuracy: {Math.round(accuracy)}%
						</span>
						<span className="stat-with-icon" id="avg-time-stat" title="Average time per question">
							Avg: {(avgTimeMs / 1000).toFixed(1)}s
						</span>
					</div>
				)}
				<button type="button" id="start-session" className="primary-button" title="Start a mental math session" onClick={startSession} disabled={isSessionActive}>
					Start Session
				</button>
			</div>
			<ProgressBar value={progressPercent} />
		</div>
	);
}
