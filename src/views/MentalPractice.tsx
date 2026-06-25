/**
 * Mental Practice view.
 *
 * A timed variant of Focused Practice: the user configures a question count,
 * time limit, and difficulty band, then races against a countdown timer to
 * answer as many questions as possible. When the timer hits zero (or every
 * question has been answered) the session finishes, results are persisted to
 * the progress store, and the user is routed to the session summary.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Input,
  ProgressBar,
  Select,
  Spinner,
  type SelectOption,
} from '../components/ui';
import { MathRenderer } from '../components/MathRenderer';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { cn } from '../lib/utils';
import { usePracticeStore } from '../stores/practiceStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useProgressStore } from '../stores/progressStore';
import {
  generateBatch,
  loadDefaultSpec,
  parseSpecification,
} from '../services/physicsCore';
import type { Specification } from '../types/models';

const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: 'easy', label: 'Easy (1-3)' },
  { value: 'medium', label: 'Medium (3-5)' },
  { value: 'hard', label: 'Hard (5-7)' },
];

const DIFFICULTY_RANGE: Record<string, [number, number]> = {
  easy: [1, 3],
  medium: [3, 5],
  hard: [5, 7],
};

const DEFAULT_TIME_LIMIT = 300;
const MIN_TIME_LIMIT = 30;
const MAX_TIME_LIMIT = 600;
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 30;

/** Format a number of seconds as MM:SS. */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Split a string on `$...$` delimiters and render the math segments with
 * KaTeX. Plain text segments are returned as-is.
 */
function renderTextWithMath(text: string): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      return <MathRenderer key={index} tex={part.slice(1, -1)} />;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function MentalPractice() {
  const navigate = useNavigate();

  const specificationContent = useSettingsStore((s) => s.specificationContent);
  const defaultQuestionCount = useSettingsStore((s) => s.defaultQuestionCount);
  const addResults = useProgressStore((s) => s.addResults);

  const {
    questions,
    currentIndex,
    results,
    isActive,
    isFinished,
    userAnswer,
    selectedChoiceIndex,
    showFeedback,
    lastResult,
    startSession,
    setUserAnswer,
    selectChoice,
    submitAnswer,
    advanceQuestion,
    finishSession,
    resetSession,
  } = usePracticeStore();

  const [spec, setSpec] = useState<Specification | null>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(true);
  const [specError, setSpecError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [questionCount, setQuestionCount] = useState<number>(
    Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, defaultQuestionCount)),
  );
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_TIME_LIMIT);

  // Guards against persisting the same session's results more than once.
  const hasPersistedRef = useRef(false);

  // Load (and parse) the specification once on mount, or when the user
  // changes the active spec in settings.
  useEffect(() => {
    let cancelled = false;
    async function loadSpec() {
      setIsLoadingSpec(true);
      setSpecError(null);
      try {
        const raw =
          specificationContent.trim().length > 0
            ? specificationContent
            : await loadDefaultSpec();
        const parsed = await parseSpecification(raw);
        if (!cancelled) {
          setSpec(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setSpecError(
            err instanceof Error
              ? err.message
              : 'Failed to load the specification.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSpec(false);
        }
      }
    }
    loadSpec();
    return () => {
      cancelled = true;
    };
  }, [specificationContent]);

  // Reset the persistence guard whenever a new session becomes active.
  useEffect(() => {
    if (isActive) {
      hasPersistedRef.current = false;
    }
  }, [isActive]);

  // Countdown timer: ticks every second while the session is active. The
  // interval is cleaned up on unmount or when the session ends.
  useEffect(() => {
    if (!isActive) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isActive]);

  // Auto-finish the session when the timer reaches zero.
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      finishSession();
    }
  }, [isActive, timeLeft, finishSession]);

  // On finish, persist results once and route to the session summary.
  useEffect(() => {
    if (isFinished && !hasPersistedRef.current) {
      hasPersistedRef.current = true;
      addResults(usePracticeStore.getState().results);
      navigate('/session-summary');
    }
  }, [isFinished, addResults, navigate]);

  function handleCountChange(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    setQuestionCount(
      Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, Math.floor(value))),
    );
  }

  function handleTimeChange(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    setTimeLimit(
      Math.min(MAX_TIME_LIMIT, Math.max(MIN_TIME_LIMIT, Math.floor(value))),
    );
  }

  async function handleStart() {
    if (!spec) return;
    setIsGenerating(true);
    setSpecError(null);
    try {
      const [minDifficulty, maxDifficulty] = DIFFICULTY_RANGE[difficulty];
      const generated = await generateBatch(spec, questionCount, {
        minDifficulty,
        maxDifficulty,
      });
      if (generated.length === 0) {
        setSpecError(
          'No questions could be generated with the current difficulty. Try another band.',
        );
        return;
      }
      setTimeLeft(timeLimit);
      startSession(spec, generated, 'Mental');
    } catch (err) {
      setSpecError(
        err instanceof Error ? err.message : 'Failed to generate questions.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleExit() {
    resetSession();
    navigate('/mental-practice');
  }

  // Phase: finished — brief spinner while we persist and navigate away.
  if (isFinished) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  // Phase: active timed question flow.
  if (isActive) {
    const question = questions[currentIndex];
    const answeredCount = results.length;
    const correctCount = results.filter((r) => r.is_correct).length;
    const progress =
      questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const choices = question?.choices ?? [];
    const isMultipleChoice =
      question?.question_type === 'MultipleChoice' && choices.length > 0;
    const correctChoiceIndex = isMultipleChoice
      ? choices.findIndex((c) => c === question.answer)
      : -1;
    const canSubmit = isMultipleChoice
      ? selectedChoiceIndex >= 0
      : userAnswer.trim().length > 0;
    const isLastQuestion = currentIndex + 1 >= questions.length;
    const timerColor =
      timeLeft < 10
        ? 'text-error-500'
        : timeLeft < 30
          ? 'text-warning-500'
          : 'text-neutral-900 dark:text-neutral-100';

    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Timer + score */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className={cn(
              'font-mono text-5xl font-bold tabular-nums transition-colors duration-normal',
              timerColor,
              timeLeft < 10 && 'animate-pulse',
            )}
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            role="timer"
          >
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-sm">
              Score: {correctCount} / {answeredCount}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              Exit
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
          </p>
          <ProgressBar value={progress} />
        </div>

        {question && (
          <Card key={currentIndex} className="animate-slide-up space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge level={question.difficulty} size="sm" />
              <Badge variant="info">
                {isMultipleChoice ? 'Multiple Choice' : 'Short Answer'}
              </Badge>
            </div>

            <div className="text-base leading-relaxed text-neutral-900 dark:text-neutral-100">
              {renderTextWithMath(question.text)}
            </div>

            {isMultipleChoice ? (
              <div className="space-y-2">
                {choices.map((choice, index) => {
                  const isSelected = index === selectedChoiceIndex;
                  const isCorrect = index === correctChoiceIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={showFeedback}
                      onClick={() => selectChoice(index)}
                      className={cn(
                        'w-full rounded-md border px-4 py-3 text-left text-sm transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        !showFeedback &&
                          isSelected &&
                          'border-primary-500 bg-primary-50 dark:bg-primary-900/30',
                        !showFeedback &&
                          !isSelected &&
                          'border-neutral-300 hover:border-primary-400 dark:border-neutral-600 dark:hover:border-primary-500',
                        showFeedback &&
                          isCorrect &&
                          'border-success-500 bg-success-50 dark:bg-success-900/30',
                        showFeedback &&
                          !isCorrect &&
                          isSelected &&
                          'border-error-500 bg-error-50 dark:bg-error-900/30',
                        showFeedback &&
                          !isCorrect &&
                          !isSelected &&
                          'border-neutral-300 opacity-60 dark:border-neutral-600',
                      )}
                    >
                      {renderTextWithMath(choice)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={showFeedback}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit && !showFeedback) {
                    submitAnswer();
                  }
                }}
              />
            )}

            {showFeedback && lastResult && (
              <div
                className={cn(
                  'space-y-2 rounded-md border p-4',
                  lastResult.isCorrect
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/30'
                    : 'border-error-500 bg-error-50 dark:bg-error-900/30',
                )}
              >
                <p
                  className={cn(
                    'font-semibold',
                    lastResult.isCorrect
                      ? 'text-success-700 dark:text-success-300'
                      : 'text-error-700 dark:text-error-300',
                  )}
                >
                  {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <div className="text-sm text-neutral-700 dark:text-neutral-200">
                  <span className="font-medium">Correct answer: </span>
                  {renderTextWithMath(lastResult.correctAnswer)}
                </div>
                {question.solution_latex ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Solution
                    </p>
                    <MathRenderer
                      tex={question.solution_latex}
                      display
                      className="text-sm"
                    />
                  </div>
                ) : question.solution_text ? (
                  <div className="text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="font-medium">Solution: </span>
                    {renderTextWithMath(question.solution_text)}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-end">
              {!showFeedback ? (
                <Button onClick={submitAnswer} disabled={!canSubmit}>
                  Check
                </Button>
              ) : (
                <Button onClick={advanceQuestion}>
                  {isLastQuestion ? 'Finish' : 'Next'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Phase: configuration.
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-h1 font-bold text-neutral-900 dark:text-neutral-100">
        Mental Practice
      </h1>

      <Card className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-100">
            Configure your timed session
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Pick a difficulty band, set how many questions you have and how
            long you get, then race against the clock.
          </p>
        </div>

        {specError && (
          <div className="rounded-md border border-error-500 bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-300">
            {specError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Number of Questions"
            type="number"
            min={MIN_QUESTION_COUNT}
            max={MAX_QUESTION_COUNT}
            value={questionCount}
            onChange={handleCountChange}
            hint="Between 1 and 30 questions."
            disabled={isGenerating || isLoadingSpec}
          />
          <Input
            label="Time Limit (seconds)"
            type="number"
            min={MIN_TIME_LIMIT}
            max={MAX_TIME_LIMIT}
            value={timeLimit}
            onChange={handleTimeChange}
            hint="Between 30 and 600 seconds (5 minutes by default)."
            disabled={isGenerating || isLoadingSpec}
          />
        </div>

        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={DIFFICULTY_OPTIONS}
          disabled={isGenerating || isLoadingSpec}
        />

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleStart}
            isLoading={isGenerating}
            disabled={!spec || isLoadingSpec}
          >
            Start Session
          </Button>
        </div>
      </Card>
    </div>
  );
}
