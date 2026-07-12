import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal, createEffect, onCleanup} from "solid-js";
import {ToolbarGroup} from "../ui/Toolbar";
import {Badge} from "../ui/Badge";
import {Button} from "../ui/Button";
import {Select} from "../ui/Select";
import {Switch} from "../ui/Switch";
import {ProgressBar} from "../ui/ProgressBar";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/Tooltip";
import {useSpecStore} from "../../stores/specStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {usePracticeStore, selectIsActive, selectIsFinished, selectMode, selectResults} from "../../stores/practiceStore";
import {createCountdownTimer} from "../../primitives/createCountdownTimer";
import {createPracticeActions} from "../../primitives/createPracticeActions";
import {useServiceProvider} from "../../providers/ServiceProvider";
import {PhysicsService} from "../../../services/PhysicsService";
import {SessionService} from "../../../services/SessionService";
import {AnalyticsService} from "../../../services/AnalyticsService";
import {resolveTopicId} from "../../../lib/utils";
import type {Specification} from "../../../types/models";
import type {Session} from "../../../services/contracts";
import type {IPhysicsService, ISessionService} from "../../../services/contracts";
import styles from "./MentalControls.module.css";
const DIFFICULTY_RANGES: Record<"easy" | "medium" | "hard", {minDifficulty: number; maxDifficulty: number}>={
	easy: {minDifficulty: 1, maxDifficulty: 2},
	medium: {minDifficulty: 3, maxDifficulty: 5},
	hard: {minDifficulty: 6, maxDifficulty: 7},
};
const AUTO_ADVANCE_DELAY_MS=1500;
const DIFFICULTY_OPTIONS=[
	{value: "easy", label: "Easy"},
	{value: "medium", label: "Medium"},
	{value: "hard", label: "Hard"},
];
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
	let options: {value: string; label: string}[]=[{value: "all", label: "All"}];
	if (specification) {
		for (let unit of specification.units) {
			options.push({value: unit.id, label: unit.name});
		}
	}
	return options;
}
function formatTime(seconds: number): string {
	let mins=Math.floor(seconds/60);
	let secs=seconds%60;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
function ClockIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function CheckIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
function PauseIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
			<rect x="6" y="5" width="4" height="14" rx="1" />
			<rect x="14" y="5" width="4" height="14" rx="1" />
		</svg>
	);
}
function PlayIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
			<path d="M7 5l12 7-12 7z" />
		</svg>
	);
}
function SkipIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path d="M5 5l9 7-9 7z" stroke-linejoin="round" />
			<line x1="18" y1="5" x2="18" y2="19" stroke-linecap="round" />
		</svg>
	);
}
/**
 * Mental-mode bottom-row controls.
 *
 * Solid port of {@link ../../../components/practice/MentalControls}. Manages the
 * full mental session lifecycle: difficulty/scope/shuffle/unlimited options
 * (persisted in the settings store), a countdown timer (via
 * `createCountdownTimer`), live score/accuracy/avg-time stats derived from the
 * session results, and Start/Pause/Resume/Skip actions. Services are resolved
 * lazily from the `ServiceProvider` context so the component renders its idle
 * state without a provider present. Framer Motion animations are replaced by
 * CSS; `@phosphor-icons/react` icons are replaced with inline SVG.
 */
export function MentalControls(): JSX.Element {
	let difficulty=useSettingsStore(s => s.mentalDifficulty);
	let scope=useSettingsStore(s => s.mentalScope);
	let shuffle=useSettingsStore(s => s.mentalShuffle);
	let unlimited=useSettingsStore(s => s.mentalUnlimited);
	let mentalDurationSec=useSettingsStore(s => s.mentalDurationSec);
	let defaultQuestionCount=useSettingsStore(s => s.defaultQuestionCount);
	let specification=useSpecStore(s => s.specification);
	let isActive=usePracticeStore(selectIsActive);
	let isFinished=usePracticeStore(selectIsFinished);
	let mode=usePracticeStore(selectMode);
	let results=usePracticeStore(selectResults);
	let showFeedback=usePracticeStore(s => s.showFeedback);
	let timer=createCountdownTimer();
	let [isStarting, setIsStarting]=createSignal(false);
	let isSessionActive=createMemo(() => isActive() && mode()==="Mental");
	let isPaused=createMemo(() => isSessionActive() && !timer.isRunning() && timer.timeRemaining()>0);
	let timeUrgent=createMemo(() => {
		let remaining=timer.timeRemaining();
		return isSessionActive() && remaining>0 && remaining<10;
	});
	let displayTime=createMemo(() => timer.timeRemaining() || mentalDurationSec());
	let stats=createMemo(() => {
		let list=results();
		let total=list.length;
		let correct=list.filter(r => r.is_correct).length;
		let accuracy=total===0 ? 0 : (correct/total)*100;
		let totalTimeMs=list.reduce((sum, r) => sum+r.time_taken_ms, 0);
		let avgTimeMs=total===0 ? 0 : totalTimeMs/total;
		let streak=0;
		for (let i=list.length-1; i>=0; i=i-1) {
			if (list[i]!.is_correct) {
				streak=streak+1;
			} else {
				break;
			}
		}
		return {score: correct, total, accuracy, avgTimeMs, streak};
	});
	let progressPercent=createMemo(() => mentalDurationSec()>0 ? ((mentalDurationSec()-timer.timeRemaining())/mentalDurationSec())*100 : 0);
	let scopeOptions=createMemo(() => buildScopeOptions(specification()));
	let cachedPhysics: IPhysicsService | null=null;
	let cachedSession: ISessionService | null=null;
	let resolveServices=(): {physics: IPhysicsService; session: ISessionService} => {
		if (!cachedSession) {
			let {core}=useServiceProvider();
			cachedPhysics=new PhysicsService(core);
			cachedSession=new SessionService(cachedPhysics, new AnalyticsService());
		}
		return {physics: cachedPhysics!, session: cachedSession!};
	};
	let buildOptions=() => {
		let range=DIFFICULTY_RANGES[difficulty()];
		let topicId=resolveTopicId(specification()!, scope(), shuffle(), undefined, false);
		return {topicId, ...range};
	};
	let startSession=async () => {
		if (isStarting()) return;
		if (!specification()) return;
		setIsStarting(true);
		try {
			let {physics, session}=resolveServices();
			if (unlimited()) {
				let question=await physics.generateQuestion(specification()!, buildOptions());
				let now=Date.now();
				let sessionObj: Session={
					id: crypto.randomUUID(),
					specification: specification()!,
					questions: [question],
					mode: "Mental",
					currentIndex: 0,
					results: [],
					isActive: true,
					isFinished: false,
					questionStartTime: now,
					sessionStartTime: now,
				};
				await session.resumeSession({session: sessionObj, createdAt: new Date().toISOString()});
				usePracticeStore.getState().setSession(sessionObj);
				usePracticeStore.getState().resetAnswerUi();
			} else {
				let started=await session.startSession(specification()!, {
					mode: "Mental",
					questionCount: defaultQuestionCount(),
					options: buildOptions(),
					shuffle: shuffle(),
				});
				usePracticeStore.getState().setSession(started);
				usePracticeStore.getState().resetAnswerUi();
			}
			timer.start(mentalDurationSec());
		} finally {
			setIsStarting(false);
		}
	};
	let advance=async () => {
		let store=usePracticeStore.getState();
		let session=store.session;
		if (!session || !session.isActive || session.isFinished) return;
		let {physics, session: sessionService}=resolveServices();
		if (unlimited()) {
			if (!specification()) return;
			try {
				let question=await physics.generateQuestion(specification()!, buildOptions());
				session.questions.push(question);
			} catch {
				return;
			}
		}
		let advanced=await sessionService.advanceQuestion();
		if (advanced) {
			usePracticeStore.getState().setSession(sessionService.getSession());
			usePracticeStore.getState().resetAnswerUi();
		} else {
			await sessionService.finishSession();
			usePracticeStore.getState().setSession(sessionService.getSession());
			timer.reset();
		}
	};
	let pauseSession=() => timer.pause();
	let resumeSession=() => timer.resume();
	let skipQuestion=async () => {
		let store=usePracticeStore.getState();
		if (!store.session || !store.session.isActive || store.session.mode!=="Mental") return;
		let {session}=resolveServices();
		try {
			await session.submitAnswer("", undefined);
		} catch {
			return;
		}
		usePracticeStore.getState().setSession(session.getSession());
		await advance();
	};
	createPracticeActions({mode: "Mental"});
	createEffect(() => {
		if (!isSessionActive() || isFinished()) return;
		if (timer.timeRemaining()===0 && !timer.isRunning() && mentalDurationSec()>0) {
			void (async () => {
				let {session}=resolveServices();
				await session.finishSession();
				usePracticeStore.getState().setSession(session.getSession());
				timer.reset();
			})();
		}
	});
	createEffect(() => {
		if (!showFeedback() || !isSessionActive()) return;
		let id=window.setTimeout(() => {
			void advance();
		}, AUTO_ADVANCE_DELAY_MS);
		onCleanup(() => window.clearTimeout(id));
	});
	let handleDifficulty=(value: "easy" | "medium" | "hard") => {
		useSettingsStore.getState().setMentalDifficulty(value);
	};
	let handleScope=(e: Event) => {
		let target=e.target as HTMLSelectElement;
		useSettingsStore.getState().setMentalScope(target.value);
	};
	return (
		<div id="mental-controls" class={styles.wrapper}>
			<ToolbarGroup label="Session stats" class={styles.stats}>
				<div id="difficulty-select" class={styles.difficultyPills} role="radiogroup" aria-label="Difficulty">
					<For each={DIFFICULTY_OPTIONS}>{(option) => (
						<button
							type="button"
							class={`${styles.difficultyPill} ${difficulty() === option.value ? styles.difficultyPillActive : ""}`}
							role="radio"
							aria-checked={difficulty() === option.value ? "true" : "false"}
							aria-label={option.label}
							data-difficulty={option.value}
							disabled={isSessionActive()}
							onClick={() => handleDifficulty(option.value as "easy" | "medium" | "hard")}
						>
							{option.label}
						</button>
					)}</For>
				</div>
				<Badge variant="default" size="sm" class={`${styles.gap} ${styles.timerBadge} ${timeUrgent() ? styles.timerUrgent : ""}`} aria-label="Time remaining" role="timer">
					<ClockIcon />
					{formatTime(displayTime())}
				</Badge>
				<Badge variant="default" size="sm" class={`${styles.gap} ${styles.scoreBadge} ${isSessionActive() ? styles.scoreLive : ""}`} aria-label="Current score" aria-live="polite" aria-atomic="true">
					<CheckIcon />
					{stats().score} / {stats().total}
				</Badge>
				<div class={styles.sessionControls}>
				<Show when={isSessionActive() && !isPaused()}>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Button variant="icon" size="sm" aria-label="Pause session" onClick={pauseSession}>
								<PauseIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Pause session</TooltipContent>
					</Tooltip>
				</Show>
				<Show when={isSessionActive() && isPaused()}>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Button variant="icon" size="sm" aria-label="Resume session" onClick={resumeSession}>
								<PlayIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Resume session</TooltipContent>
					</Tooltip>
				</Show>
				<Show when={isSessionActive()}>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Button variant="icon" size="sm" aria-label="Skip question" onClick={skipQuestion}>
								<SkipIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Skip this question (counts as incorrect)</TooltipContent>
					</Tooltip>
				</Show>
			</div>
		</ToolbarGroup>
			<ToolbarGroup label="Session options" class={styles.extra}>
				<div class={styles.optionControls}>
					<Select
						id="mental-scope-select"
						variant="scope"
						aria-label="Mental scope"
						options={scopeOptions()}
						value={scope()}
						onInput={handleScope}
					/>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Switch label="Shuffle" checked={shuffle()} onCheckedChange={(checked) => useSettingsStore.getState().setMentalShuffle(checked)} />
						</TooltipTrigger>
						<TooltipContent side="bottom">Randomly pick topics in mental mode</TooltipContent>
					</Tooltip>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Switch label="Unlimited" checked={unlimited()} onCheckedChange={(checked) => useSettingsStore.getState().setMentalUnlimited(checked)} />
						</TooltipTrigger>
						<TooltipContent side="bottom">Unlimited practice (no question limit)</TooltipContent>
					</Tooltip>
				</div>
				<Show when={isFinished()}>
				<div id="session-summary" class={styles.summary} role="status" aria-live="polite">
					<Badge variant="default" size="sm" class={styles.gap}>
						<CheckIcon />
						{stats().score} / {stats().total}
					</Badge>
					<Badge variant="default" size="sm">Accuracy: {Math.round(stats().accuracy)}%</Badge>
					<Badge variant="default" size="sm">Streak: {stats().streak}</Badge>
					<Badge variant="default" size="sm">Avg: {(stats().avgTimeMs/1000).toFixed(1)}s</Badge>
				</div>
			</Show>
			<Show when={isSessionActive()}>
				<div id="statistics-panel" class={styles.statsPanel} aria-live="polite">
					<Badge variant="default" size="sm">Accuracy: {Math.round(stats().accuracy)}%</Badge>
					<Badge variant="default" size="sm">Streak: {stats().streak}</Badge>
					<Badge variant="default" size="sm">Avg: {(stats().avgTimeMs/1000).toFixed(1)}s</Badge>
				</div>
			</Show>
				<div class={styles.startWrapper}>
					<Tooltip delay={300}>
						<TooltipTrigger>
							<Button variant="primary" size="md" class={styles.startBtn} onClick={startSession} disabled={isSessionActive() || isStarting()} loading={isStarting()}>
								{isStarting() ? "Starting…" : "Start Session"}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Start a mental math session</TooltipContent>
					</Tooltip>
				</div>
			</ToolbarGroup>
			<ProgressBar value={progressPercent()} ariaLabel="Mental session time remaining" />
		</div>
	);
}
