import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy, Check, Close, ChevronRight, Target, Lightbulb, Library } from 'lucide-react';
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
    Icon: Target,
    iconBg:
      'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
  },
  {
    id: 'mental',
    title: 'Mental Practice',
    subtitle: 'Quick mental math drills',
    path: '/mental-practice',
    Icon: Lightbulb,
    iconBg:
      'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300',
  },
  {
    id: 'bank',
    title: 'Question Bank',
    subtitle: 'Browse all questions',
    path: '/question-bank',
    Icon: Library,
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
            icon={<Lightbulb className="h-12 w-12" />}
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
                <Flame className="h-6 w-6" />
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
                <Trophy className="h-6 w-6" />
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
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
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
                      <Check className="h-4 w-4" />
                    ) : (
                      <Close className="h-4 w-4" />
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
