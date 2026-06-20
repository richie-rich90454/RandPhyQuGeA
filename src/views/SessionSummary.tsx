/**
 * Session Summary view.
 *
 * Shown after a practice session ends. Displays the overall accuracy,
 * a stat row (correct/total, average time, mode), a per-question
 * breakdown, and actions to practice again or return home.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '../components/ui';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { cn } from '../lib/utils';
import { usePracticeStore } from '../stores/practiceStore';

/* ---------- icons (24x24, fill="currentColor") ---------- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

/* ---------- format helpers ---------- */

/** Format a duration in milliseconds as "Xs" (>=1s) or "Xms". */
function formatTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/** Tailwind text color class for an accuracy percentage. */
function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-success-600 dark:text-success-400';
  if (accuracy >= 50) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

/* ---------- main component ---------- */

export default function SessionSummary() {
  const navigate = useNavigate();
  const results = usePracticeStore((s) => s.results);
  const mode = usePracticeStore((s) => s.mode);
  const resetSession = usePracticeStore((s) => s.resetSession);

  const { correctCount, total, accuracy, avgTimeMs } = useMemo(() => {
    const total = results.length;
    const correctCount = results.filter((r) => r.is_correct).length;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
    const avgTimeMs =
      total > 0
        ? results.reduce((sum, r) => sum + r.time_taken_ms, 0) / total
        : 0;
    return { correctCount, total, accuracy, avgTimeMs };
  }, [results]);

  // Empty state: no session data (e.g., navigated here directly).
  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <Card className="animate-fade-in">
          <EmptyState
            icon={<LightbulbIcon className="h-12 w-12" />}
            title="No session data"
            description="Complete a practice session to see your summary here."
            action={<Button onClick={() => navigate('/')}>Back to Home</Button>}
          />
        </Card>
      </div>
    );
  }

  const isHighAccuracy = accuracy >= 80;
  const ModeIcon = mode === 'Mental' ? LightbulbIcon : TargetIcon;

  function handlePracticeAgain() {
    const nextPath = mode === 'Mental' ? '/mental-practice' : '/practice';
    resetSession();
    navigate(nextPath);
  }

  function handleBackHome() {
    resetSession();
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      {/* Accuracy display */}
      <Card className="animate-slide-up">
        <CardContent className="py-10 text-center">
          {isHighAccuracy && (
            <div className="mb-3 flex justify-center text-warning-500">
              <TrophyIcon className="h-12 w-12" />
            </div>
          )}
          <p
            className={cn(
              'text-6xl font-bold',
              accuracyColor(accuracy),
            )}
          >
            {Math.round(accuracy)}%
          </p>
          <p className="mt-2 text-small uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Accuracy
          </p>
          {isHighAccuracy && (
            <p className="mt-3 text-body text-neutral-700 dark:text-neutral-300">
              Great job! Keep up the excellent work.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stat row */}
      <section className="grid animate-fade-in grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-small text-neutral-500 dark:text-neutral-400">
              Correct / Total
            </p>
            <p className="mt-1 text-h2 text-neutral-900 dark:text-neutral-100">
              {correctCount} / {total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-small text-neutral-500 dark:text-neutral-400">
              Average Time
            </p>
            <p className="mt-1 text-h2 text-neutral-900 dark:text-neutral-100">
              {formatTime(avgTimeMs)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-small text-neutral-500 dark:text-neutral-400">
              Mode
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 text-h2 text-neutral-900 dark:text-neutral-100">
              <ModeIcon className="h-5 w-5" />
              {mode}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Results breakdown */}
      <section className="animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Results Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {results.map((r, index) => (
              <div
                key={r.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    r.is_correct
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                      : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
                  )}
                >
                  {r.is_correct ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <CrossIcon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-medium text-neutral-900 dark:text-neutral-100">
                      Question {index + 1}
                    </p>
                    <DifficultyBadge level={r.difficulty} size="sm" />
                    <Badge variant={r.is_correct ? 'success' : 'error'}>
                      {r.is_correct ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-small text-neutral-500 dark:text-neutral-400">
                    {formatTime(r.time_taken_ms)}
                    {r.user_answer && (
                      <>
                        {' · '}
                        <span className="text-neutral-700 dark:text-neutral-300">
                          Your answer: {r.user_answer}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          onClick={handlePracticeAgain}
          leftIcon={<RefreshIcon className="h-5 w-5" />}
        >
          Practice Again
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={handleBackHome}
          leftIcon={<HomeIcon className="h-5 w-5" />}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}