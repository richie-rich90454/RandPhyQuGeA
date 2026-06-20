import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, EmptyState } from '../components/ui';
import { useProgressStore } from '../stores/progressStore';
import { cn } from '../lib/utils';
import type { PracticeResult } from '../types/models';

/* ---------- date / format helpers ---------- */

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

/* ---------- streak computation ---------- */

/** Consecutive days with practice results, counting back from today. */
function computeCurrentStreak(results: PracticeResult[]): number {
  if (results.length === 0) return 0;
  const days = new Set(results.map((r) => dateKey(new Date(r.timestamp))));
  let streak = 0;
  let cursor = new Date();
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive calendar days that contain practice results. */
function computeBestStreak(results: PracticeResult[]): number {
  if (results.length === 0) return 0;
  const keys = Array.from(
    new Set(results.map((r) => dateKey(new Date(r.timestamp)))),
  ).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    const cur = new Date(`${key}T00:00:00`);
    const consecutive =
      prev !== null &&
      Math.round((cur.getTime() - prev.getTime()) / 86_400_000) === 1;
    run = consecutive ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

/* ---------- icons (24x24, fill="currentColor") ---------- */

function FireIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
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

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
    </svg>
  );
}

/* ---------- accuracy ring ---------- */

function AccuracyRing({ value }: { value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-neutral-200 dark:stroke-neutral-700"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-primary-600 transition-all duration-normal ease-standard"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
}

/* ---------- quick actions config ---------- */

const QUICK_ACTIONS = [
  {
    id: 'focused',
    title: 'Focused Practice',
    subtitle: 'Deep-focus problem solving',
    path: '/practice',
    Icon: TargetIcon,
    iconBg:
      'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
  },
  {
    id: 'mental',
    title: 'Mental Practice',
    subtitle: 'Quick mental math drills',
    path: '/mental-practice',
    Icon: LightbulbIcon,
    iconBg:
      'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300',
  },
  {
    id: 'bank',
    title: 'Question Bank',
    subtitle: 'Browse all questions',
    path: '/question-bank',
    Icon: LibraryIcon,
    iconBg:
      'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300',
  },
] as const;

/* ---------- main component ---------- */

export default function Home() {
  const navigate = useNavigate();
  const results = useProgressStore((s) => s.results);
  const getStats = useProgressStore((s) => s.getStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  const currentStreak = useMemo(() => computeCurrentStreak(results), [results]);
  const bestStreak = useMemo(() => computeBestStreak(results), [results]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700"
            />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  const stats = getStats();
  const hasResults = results.length > 0;
  const recent = [...results].reverse().slice(0, 5);
  const lastResult = hasResults ? results[results.length - 1] : null;
  const avgDifficulty = hasResults
    ? results.reduce((sum, r) => sum + r.difficulty, 0) / results.length
    : 0;

  return (
    <div className="mx-auto max-w-5xl animate-slide-up space-y-6 p-6 md:p-8">
      {/* Greeting */}
      <header>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
          {getGreeting()}!
        </h1>
        <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
          Let&apos;s master some physics today!
        </p>
      </header>

      {/* Empty state */}
      {!hasResults && (
        <Card className="animate-fade-in">
          <EmptyState
            icon={<LightbulbIcon className="h-12 w-12" />}
            title="No practice yet"
            description="Start your first session to build your physics skills and track your progress."
            action={
              <Button onClick={() => navigate('/practice')}>
                Start Practicing
              </Button>
            }
          />
        </Card>
      )}

      {/* Hero stats */}
      {hasResults && (
        <section className="grid animate-fade-in grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-500 dark:bg-warning-900/30">
                <FireIcon />
              </div>
              <div className="min-w-0">
                <p className="text-small text-neutral-500 dark:text-neutral-400">
                  Current Streak
                </p>
                <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <AccuracyRing value={stats.accuracy} />
              <div className="min-w-0">
                <p className="text-small text-neutral-500 dark:text-neutral-400">
                  Accuracy
                </p>
                <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                  {stats.totalCount}{' '}
                  {stats.totalCount === 1 ? 'question' : 'questions'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-700 dark:bg-warning-900/30">
                <TrophyIcon />
              </div>
              <div className="min-w-0">
                <p className="text-small text-neutral-500 dark:text-neutral-400">
                  Best Streak
                </p>
                <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                  {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Continue learning */}
      {hasResults && lastResult && (
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-small text-neutral-500 dark:text-neutral-400">
                Continue Learning
              </p>
              <p className="mt-1 text-h3 text-neutral-900 dark:text-neutral-100">
                {lastResult.mode} Practice
              </p>
              <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
                Avg difficulty {avgDifficulty.toFixed(1)} · {stats.totalCount}{' '}
                total
              </p>
            </div>
            <Button onClick={() => navigate('/practice')}>Resume</Button>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-h3 text-neutral-900 dark:text-neutral-100">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.Icon;
            return (
              <div
                key={action.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(action.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(action.path);
                  }
                }}
                className="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
              >
                <Card className="h-full transition-all duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex h-full items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        action.iconBg,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-h4 text-neutral-900 dark:text-neutral-100">
                        {action.title}
                      </p>
                      <p className="truncate text-small text-neutral-500 dark:text-neutral-400">
                        {action.subtitle}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-neutral-400" />
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      {hasResults && (
        <section className="animate-fade-in">
          <h2 className="mb-3 text-h3 text-neutral-900 dark:text-neutral-100">
            Recent Activity
          </h2>
          <Card>
            <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {recent.map((r) => (
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
                    <p className="text-body text-neutral-900 dark:text-neutral-100">
                      {r.mode} · Difficulty {r.difficulty}
                    </p>
                    <p className="text-small text-neutral-500 dark:text-neutral-400">
                      {formatDuration(r.time_taken_ms)} ·{' '}
                      {formatRelative(r.timestamp)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-small font-medium',
                      r.is_correct
                        ? 'text-success-700 dark:text-success-300'
                        : 'text-error-700 dark:text-error-300',
                    )}
                  >
                    {r.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
