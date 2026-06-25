import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button, Card, CardContent} from '../components/ui';
import {cn} from '../lib/utils';
import {useSettingsStore} from '../stores/settingsStore';
import {Sparkles, Target, BarChart3, Rocket, type LucideIcon} from 'lucide-react';

/* ---------- step config ---------- */

interface Step {
	title: string;
	description: string;
	Icon: LucideIcon;
	iconBg: string;
}

const STEPS: Step[] = [
	{
		title: 'Welcome to Physics Question Generator',
		description: 'Generate physics questions on demand, sharpen your problem-solving skills, and learn at your own pace. Let\u2019s get you started!',
		Icon: Sparkles,
		iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
	},
	{
		title: 'Practice Modes',
		description: 'Focused Practice lets you learn at your pace with no time pressure. Mental Practice is a timed challenge to build speed and accuracy under pressure.',
		Icon: Target,
		iconBg: 'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300'
	},
	{
		title: 'Track Your Progress',
		description: 'Monitor your accuracy, build streaks by practicing daily, and review detailed statistics to see how you improve over time.',
		Icon: BarChart3,
		iconBg: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300'
	},
	{
		title: 'Get Started',
		description: 'You\u2019re all set! Click \u201cGot it!\u201d to start practicing and begin your physics journey.',
		Icon: Rocket,
		iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
	}
];

/* ---------- main component ---------- */

export default function Onboarding() {
	const navigate = useNavigate();
	const onboardingCompleted = useSettingsStore(s => s.onboardingCompleted);
	const setOnboardingCompleted = useSettingsStore(s => s.setOnboardingCompleted);
	const [step, setStep] = useState(0);

	const isLast = step === STEPS.length - 1;
	const current = STEPS[step];

	useEffect(() => {
		if (onboardingCompleted) {
			navigate('/', {replace: true});
		}
	}, [onboardingCompleted, navigate]);

	if (!current) {
		return null;
	}
	const Icon = current.Icon;

	const finish = () => {
		setOnboardingCompleted(true);
		navigate('/', {replace: true});
	};

	return (
		<div className="relative flex min-h-[80vh] items-center justify-center p-4">
			{/* Skip */}
			<button
				type="button"
				onClick={finish}
				className="absolute right-4 top-0 rounded-md px-3 py-1.5 text-small font-medium text-neutral-500 transition-colors duration-fast ease-standard hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				Skip
			</button>

			<Card className="w-full max-w-lg p-8">
				<CardContent className="flex flex-col items-center text-center">
					{/* Step content (keyed to re-trigger fade-in on step change) */}
					<div key={step} className="flex animate-fade-in flex-col items-center">
						<div className={cn('mb-6 flex h-20 w-20 items-center justify-center rounded-full', current.iconBg)}>
							<Icon className="h-10 w-10" />
						</div>

						<h2 className="text-h2 text-neutral-900 dark:text-neutral-100">{current.title}</h2>
						<p className="mt-3 text-body text-neutral-500 dark:text-neutral-400">{current.description}</p>
					</div>

					{/* Step indicators */}
					<div className="mt-8 flex items-center justify-center gap-2">
						{STEPS.map((s, i) => (
							<span
								key={s.title}
								className={cn('h-2.5 w-2.5 rounded-full transition-all duration-normal ease-standard', i <= step ? 'bg-primary-600' : 'border border-neutral-300 dark:border-neutral-600')}
								aria-label={`Step ${i + 1}${i === step ? ' (current)' : ''}`}
							/>
						))}
					</div>

					{/* Navigation */}
					<div className="mt-8 flex w-full items-center justify-between gap-3">
						<Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
							Back
						</Button>
						{isLast ? <Button onClick={finish}>Got it!</Button> : <Button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>Next</Button>}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
