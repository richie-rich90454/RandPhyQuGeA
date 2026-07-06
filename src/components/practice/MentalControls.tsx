import {useEffect, useMemo, useRef} from "react";
import {Check, Clock, Pause, Play, SkipForward} from "@phosphor-icons/react";
import {useMentalMode} from "../../hooks/useMentalMode";
import {useSpecStore} from "../../stores/specStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {Badge, Button, ProgressBar, Select, Switch, ToolbarGroup, Tooltip, TooltipContent, TooltipTrigger} from "../ui";
import type {Specification} from "../../types/models";

/**
 * Build scope-select options from the parsed specification's units, always
 * leading with an "All" option. Returns a single "All" option when no spec
 * is loaded yet.
 */
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
    const options = [{value: "all", label: "All"}];
    if (specification) {
        for (const unit of specification.units) {
            options.push({value: unit.id, label: unit.name});
        }
    }
    return options;
}

const DIFFICULTY_OPTIONS = [
    {value: "easy", label: "Easy"},
    {value: "medium", label: "Medium"},
    {value: "hard", label: "Hard"},
];

/**
 * Format a number of seconds as `MM:SS`.
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Mental-mode bottom-row controls mapped to `#mental-controls`.
 *
 * Renders session stats and options as Toolbar groups. Interactive icon
 * buttons and the start button carry tooltips. The progress bar shows elapsed
 * session time.
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
        isFinished,
        isStarting,
        score,
        total,
        accuracy,
        avgTimeMs,
        startSession,
        pauseSession,
        resumeSession,
        skipQuestion,
    } = useMentalMode();
    const specification = useSpecStore(state => state.specification);
    const mentalDurationSec = useSettingsStore(state => state.mentalDurationSec);
    const scopeOptions = useMemo(() => buildScopeOptions(specification), [specification]);
    const progressPercent = mentalDurationSec > 0 ? ((mentalDurationSec - timeRemaining) / mentalDurationSec) * 100 : 0;
    const pauseBtnRef = useRef<HTMLButtonElement>(null);
    const resumeBtnRef = useRef<HTMLButtonElement>(null);
    const prevPausedRef = useRef<boolean | null>(null);
    useEffect(() => {
        if (!isSessionActive) {
            prevPausedRef.current = null;
            return;
        }
        const prev = prevPausedRef.current;
        if (prev === null) {
            prevPausedRef.current = isPaused;
            return;
        }
        if (prev !== isPaused) {
            const target = isPaused ? resumeBtnRef.current : pauseBtnRef.current;
            target?.focus();
            prevPausedRef.current = isPaused;
        }
    }, [isPaused, isSessionActive]);
    return (
        <div id="mental-controls" className="mental-controls-wrapper">
            <ToolbarGroup label="Session stats" className="mental-stats">
                <Select
                    id="difficulty-select"
                    variant="difficulty"
                    aria-label="Difficulty"
                    options={DIFFICULTY_OPTIONS}
                    value={difficulty}
                    onChange={event => setDifficulty(event.target.value as "easy" | "medium" | "hard")}
                />
                <Badge variant="default" size="sm" className="gap-1">
                    <Clock weight="regular" aria-hidden="true" />
                    {formatTime(timeRemaining || mentalDurationSec)}
                </Badge>
                <Badge variant="default" size="sm" className="gap-1">
                    <Check weight="bold" aria-hidden="true" />
                    {score} / {total}
                </Badge>
                {isSessionActive && !isPaused && (
                    <Tooltip delay={300}>
                        <TooltipTrigger>
                            <Button ref={pauseBtnRef} variant="icon" size="sm" aria-label="Pause session" onClick={pauseSession}>
                                <Pause weight="fill" aria-hidden="true" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Pause session</TooltipContent>
                    </Tooltip>
                )}
                {isSessionActive && isPaused && (
                    <Tooltip delay={300}>
                        <TooltipTrigger>
                            <Button ref={resumeBtnRef} variant="icon" size="sm" aria-label="Resume session" onClick={resumeSession}>
                                <Play weight="fill" aria-hidden="true" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Resume session</TooltipContent>
                    </Tooltip>
                )}
                {isSessionActive && (
                    <Tooltip delay={300}>
                        <TooltipTrigger>
                            <Button variant="icon" size="sm" aria-label="Skip question" onClick={skipQuestion}>
                                <SkipForward weight="bold" aria-hidden="true" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Skip this question</TooltipContent>
                    </Tooltip>
                )}
            </ToolbarGroup>
            <ToolbarGroup label="Session options" className="mental-extra-controls">
                <Select
                    id="mental-scope-select"
                    variant="scope"
                    aria-label="Mental scope"
                    options={scopeOptions}
                    value={scope}
                    onChange={event => setScope(event.target.value)}
                />
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Shuffle" checked={shuffle} onCheckedChange={setShuffle} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Randomly pick topics in mental mode</TooltipContent>
                </Tooltip>
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Unlimited" checked={unlimited} onCheckedChange={setUnlimited} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Unlimited practice (no question limit)</TooltipContent>
                </Tooltip>
                {isFinished && (
                    <div id="session-summary" className="statistics-panel session-summary" role="status" aria-live="polite">
                        <Badge variant="default" size="sm" className="gap-1">
                            <Check weight="bold" aria-hidden="true" />
                            {score} / {total}
                        </Badge>
                        <Badge variant="default" size="sm">Accuracy: {Math.round(accuracy)}%</Badge>
                        <Badge variant="default" size="sm">Avg: {(avgTimeMs / 1000).toFixed(1)}s</Badge>
                    </div>
                )}
                {isSessionActive && (
                    <div id="statistics-panel" className="statistics-panel" aria-live="polite">
                        <Badge variant="default" size="sm">Accuracy: {Math.round(accuracy)}%</Badge>
                        <Badge variant="default" size="sm">Avg: {(avgTimeMs / 1000).toFixed(1)}s</Badge>
                    </div>
                )}
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Button variant="primary" size="sm" onClick={startSession} disabled={isSessionActive || isStarting} loading={isStarting}>
                            {isStarting ? "Starting…" : "Start Session"}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Start a mental math session</TooltipContent>
                </Tooltip>
            </ToolbarGroup>
            <ProgressBar value={progressPercent} />
        </div>
    );
}
