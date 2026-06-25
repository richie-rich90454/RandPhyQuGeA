/**
 * Session Summary view.
 *
 * Shown after a practice session ends. Displays the overall accuracy,
 * a stat row (correct/total, average time, mode), a per-question
 * breakdown, and actions to practice again or return home.
 */
import {useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState} from '../components/ui';
import {Check, Close, Target, Lightbulb, Trophy, RefreshCw, Home} from 'lucide-react';
import {DifficultyBadge} from '../components/DifficultyBadge';
import {cn} from '../lib/utils';
import {usePracticeStore} from '../stores/practiceStore';

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
	const results = usePracticeStore(s => s.results);
	const mode = usePracticeStore(s => s.mode);
	const resetSession = usePracticeStore(s => s.resetSession);

	const {correctCount, total, accuracy, avgTimeMs} = useMemo(() => {
		const total = results.length;
		const correctCount = results.filter(r => r.is_correct).length;
		const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
		const avgTimeMs = total > 0 ? results.reduce((sum, r) => sum + r.time_taken_ms, 0) / total : 0;
		return {correctCount, total, accuracy, avgTimeMs};
	}, [results]);

	// Empty state: no session data (e.g., navigated here directly).
	if (total === 0) {
		return (
			<div className="mx-auto max-w-3xl p-6 md:p-8">
				<Card className="animate-fade-in">
					<EmptyState
						icon={<Lightbulb className="h-12 w-12" />}
						title="No session data"
						description="Complete a practice session to see your summary here."
						action={<Button onClick={() => navigate('/')}>Back to Home</Button>}
					/>
				</Card>
			</div>
		);
	}

	const isHighAccuracy = accuracy >= 80;
	const ModeIcon = mode === 'Mental' ? Lightbulb : Target;

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
							<Trophy className="h-12 w-12" />
						</div>
					)}
					<p className={cn('text-6xl font-bold', accuracyColor(accuracy))}>{Math.round(accuracy)}%</p>
					<p className="mt-2 text-small uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Accuracy</p>
					{isHighAccuracy && <p className="mt-3 text-body text-neutral-700 dark:text-neutral-300">Great job! Keep up the excellent work.</p>}
				</CardContent>
			</Card>

			{/* Stat row */}
			<section className="grid animate-fade-in grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="text-center">
						<p className="text-small text-neutral-500 dark:text-neutral-400">Correct / Total</p>
						<p className="mt-1 text-h2 text-neutral-900 dark:text-neutral-100">
							{correctCount} / {total}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="text-center">
						<p className="text-small text-neutral-500 dark:text-neutral-400">Average Time</p>
						<p className="mt-1 text-h2 text-neutral-900 dark:text-neutral-100">{formatTime(avgTimeMs)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="text-center">
						<p className="text-small text-neutral-500 dark:text-neutral-400">Mode</p>
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
							<div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<div
									className={cn(
										'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
										r.is_correct ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
									)}
								>
									{r.is_correct ? <Check className="h-4 w-4" /> : <Close className="h-4 w-4" />}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-body font-medium text-neutral-900 dark:text-neutral-100">Question {index + 1}</p>
										<DifficultyBadge level={r.difficulty} size="sm" />
										<Badge variant={r.is_correct ? 'success' : 'error'}>{r.is_correct ? 'Correct' : 'Incorrect'}</Badge>
									</div>
									<p className="mt-0.5 text-small text-neutral-500 dark:text-neutral-400">
										{formatTime(r.time_taken_ms)}
										{r.user_answer && (
											<>
												{' · '}
												<span className="text-neutral-700 dark:text-neutral-300">Your answer: {r.user_answer}</span>
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
				<Button size="lg" onClick={handlePracticeAgain} leftIcon={<RefreshCw className="h-5 w-5" />}>
					Practice Again
				</Button>
				<Button size="lg" variant="secondary" onClick={handleBackHome} leftIcon={<Home className="h-5 w-5" />}>
					Back to Home
				</Button>
			</div>
		</div>
	);
}
