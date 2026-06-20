import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Badge,
  Modal,
} from '../components/ui';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { useProgressStore } from '../stores/progressStore';
import { cn } from '../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { PracticeResult } from '../types/models';

/* ---------- format helpers ---------- */

/** Format a millisecond duration as "Xs" or "Xm Ys". */
function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

/** Format an ISO timestamp as a short, human-readable date/time string. */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Text color for an accuracy percentage: green >=80, orange >=50, red <50. */
function accuracyColor(acc: number): string {
  if (acc >= 80) return 'text-success-600 dark:text-success-400';
  if (acc >= 50) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
}

/** Bar fill color for a difficulty level: 1-3 green, 4-5 orange, 6-7 red. */
function difficultyBarColor(level: number): string {
  if (level <= 3) return '#4CAF50'; // success-500
  if (level <= 5) return '#FF9800'; // warning-500
  return '#F44336'; // error-500
}

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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
    </svg>
  );
}

/* ---------- main component ---------- */

export default function Progress() {
  const navigate = useNavigate();
  const results = useProgressStore((s) => s.results);
  const getStats = useProgressStore((s) => s.getStats);
  const clearResults = useProgressStore((s) => s.clearResults);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  );

  // Track dark-mode class changes on <html> so Recharts colors can follow.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const stats = getStats();
  const hasResults = results.length > 0;

  // Cumulative accuracy after each result, in chronological order.
  const accuracyData = useMemo(() => {
    let correct = 0;
    return results.map((r, i) => {
      if (r.is_correct) correct += 1;
      return {
        index: i + 1,
        accuracy: (correct / (i + 1)) * 100,
      };
    });
  }, [results]);

  // Count of questions at each difficulty level (1-7).
  const difficultyData = useMemo(() => {
    const counts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    };
    for (const r of results) {
      if (counts[r.difficulty] !== undefined) counts[r.difficulty] += 1;
    }
    return [1, 2, 3, 4, 5, 6, 7].map((level) => ({ level, count: counts[level] }));
  }, [results]);

  // Most recent results first.
  const history = useMemo(() => [...results].reverse(), [results]);

  const axisTickColor = isDark ? '#9E9E9E' : '#757575'; // neutral-500 / neutral-600
  const gridStroke = isDark ? '#424242' : '#EEEEEE'; // neutral-800 / neutral-200
  const tooltipContentStyle = {
    backgroundColor: isDark ? '#424242' : '#FFFFFF',
    border: `1px solid ${isDark ? '#616161' : '#E0E0E0'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#F5F5F5' : '#212121',
    fontSize: '12px',
  };

  /* ---------- empty state ---------- */

  if (!hasResults) {
    return (
      <div className="mx-auto max-w-5xl animate-fade-in p-6 md:p-8">
        <Card>
          <EmptyState
            icon={<ChartIcon className="h-12 w-12" />}
            title="No progress yet"
            description="Start practicing to see your progress."
            action={
              <Button onClick={() => navigate('/practice')}>
                Start Practicing
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  /* ---------- populated view ---------- */

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6 p-6 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
            Progress
          </h1>
          <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
            Track your physics practice over time.
          </p>
        </div>
        <Button
          variant="danger"
          leftIcon={<TrashIcon />}
          onClick={() => setShowClearConfirm(true)}
        >
          Clear Data
        </Button>
      </header>

      {/* Summary stat cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              <ListIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-small text-neutral-500 dark:text-neutral-400">
                Total Questions
              </p>
              <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                {stats.totalCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300">
              <TargetIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-small text-neutral-500 dark:text-neutral-400">
                Accuracy
              </p>
              <p
                className={cn(
                  'text-h2',
                  accuracyColor(stats.accuracy),
                )}
              >
                {Math.round(stats.accuracy)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-small text-neutral-500 dark:text-neutral-400">
                Total Time
              </p>
              <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                {formatDuration(stats.totalTimeMs)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              <LayersIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-small text-neutral-500 dark:text-neutral-400">
                Practice Mode
              </p>
              <p className="text-h2 text-neutral-900 dark:text-neutral-100">
                <span className="text-success-600 dark:text-success-400">
                  Focused: {stats.focusedCount}
                </span>
                <span className="mx-2 text-neutral-300 dark:text-neutral-600">
                  |
                </span>
                <span className="text-warning-600 dark:text-warning-400">
                  Mental: {stats.mentalCount}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Accuracy over time */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={accuracyData}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  stroke={axisTickColor}
                  label={{
                    value: 'Question #',
                    position: 'insideBottom',
                    offset: -2,
                    fill: axisTickColor,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  stroke={axisTickColor}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelFormatter={(label) => `Question #${label}`}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    'Accuracy',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#1E88E5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1E88E5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={difficultyData}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis
                  dataKey="level"
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  stroke={axisTickColor}
                  label={{
                    value: 'Difficulty',
                    position: 'insideBottom',
                    offset: -2,
                    fill: axisTickColor,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTickColor, fontSize: 12 }}
                  stroke={axisTickColor}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelFormatter={(label) => `Difficulty ${label}`}
                  formatter={(value: number) => [value, 'Questions']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {difficultyData.map((entry) => (
                    <Cell
                      key={entry.level}
                      fill={difficultyBarColor(entry.level)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Practice history */}
      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {history.map((r: PracticeResult) => (
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
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Badge variant={r.mode === 'Focused' ? 'info' : 'warning'}>
                      {r.mode}
                    </Badge>
                    <DifficultyBadge level={r.difficulty} size="sm" />
                    <span className="text-small text-neutral-500 dark:text-neutral-400">
                      {formatDuration(r.time_taken_ms)}
                    </span>
                  </div>
                  <span className="shrink-0 text-small text-neutral-500 dark:text-neutral-400">
                    {formatTimestamp(r.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear confirmation */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear all progress?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearResults();
                setShowClearConfirm(false);
              }}
            >
              Clear Data
            </Button>
          </>
        }
      >
        <p className="text-body text-neutral-600 dark:text-neutral-300">
          This will permanently delete all {stats.totalCount} practice{' '}
          {stats.totalCount === 1 ? 'result' : 'results'}. This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}