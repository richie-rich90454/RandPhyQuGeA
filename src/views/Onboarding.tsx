import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui';
import { cn } from '../lib/utils';
import { useSettingsStore } from '../stores/settingsStore';

/* ---------- icons (inline SVG, fill="currentColor") ---------- */

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-10 w-10', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 14l.9 2.7L8.6 18l-2.7.9L5 21.6l-.9-2.7L1.4 18l2.7-.9L5 14zm14 0l.9 2.7L22.6 18l-2.7.9L19 21.6l-.9-2.7L15.4 18l2.7-.9L19 14z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-10 w-10', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-10 w-10', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-10 w-10', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81l-.26-1.33zM9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15a3 3 0 013 3zm4-9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
    </svg>
  );
}

/* ---------- step config ---------- */

interface Step {
  title: string;
  description: string;
  Icon: (props: { className?: string }) => JSX.Element;
  iconBg: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Physics Question Generator',
    description:
      'Generate physics questions on demand, sharpen your problem-solving skills, and learn at your own pace. Let\u2019s get you started!',
    Icon: SparkleIcon,
    iconBg:
      'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
  },
  {
    title: 'Practice Modes',
    description:
      'Focused Practice lets you learn at your pace with no time pressure. Mental Practice is a timed challenge to build speed and accuracy under pressure.',
    Icon: TargetIcon,
    iconBg:
      'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300',
  },
  {
    title: 'Track Your Progress',
    description:
      'Monitor your accuracy, build streaks by practicing daily, and review detailed statistics to see how you improve over time.',
    Icon: ChartIcon,
    iconBg:
      'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300',
  },
  {
    title: 'Get Started',
    description:
      'You\u2019re all set! Click \u201cGot it!\u201d to start practicing and begin your physics journey.',
    Icon: RocketIcon,
    iconBg:
      'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
  },
];

/* ---------- main component ---------- */

export default function Onboarding() {
  const navigate = useNavigate();
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  const setOnboardingCompleted = useSettingsStore(
    (s) => s.setOnboardingCompleted,
  );
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.Icon;

  useEffect(() => {
    if (onboardingCompleted) {
      navigate('/', { replace: true });
    }
  }, [onboardingCompleted, navigate]);

  const finish = () => {
    setOnboardingCompleted(true);
    navigate('/', { replace: true });
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
          <div
            key={step}
            className="flex animate-fade-in flex-col items-center"
          >
            <div
              className={cn(
                'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                current.iconBg,
              )}
            >
              <Icon className="h-10 w-10" />
            </div>

            <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
              {current.title}
            </h2>
            <p className="mt-3 text-body text-neutral-500 dark:text-neutral-400">
              {current.description}
            </p>
          </div>

          {/* Step indicators */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-all duration-normal ease-standard',
                  i <= step
                    ? 'bg-primary-600'
                    : 'border border-neutral-300 dark:border-neutral-600',
                )}
                aria-label={`Step ${i + 1}${i === step ? ' (current)' : ''}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex w-full items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {isLast ? (
              <Button onClick={finish}>Got it!</Button>
            ) : (
              <Button
                onClick={() =>
                  setStep((s) => Math.min(STEPS.length - 1, s + 1))
                }
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
