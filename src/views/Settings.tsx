import { useRef, useState, type ComponentType } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Badge,
  Modal,
} from '../components/ui';
import { cn } from '../lib/utils';
import { useSettingsStore } from '../stores/settingsStore';
import type { ThemeMode } from '../stores/settingsStore';
import { useProgressStore } from '../stores/progressStore';
import { parseSpecification } from '../services/physicsCore';

/* ---------- icons ---------- */

type IconProps = { className?: string };
type IconComponent = ComponentType<IconProps>;

function SunIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  );
}

function MonitorIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z" />
    </svg>
  );
}

function PaletteIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function SlidersIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
    </svg>
  );
}

function DatabaseIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z" />
    </svg>
  );
}

function InfoIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

/* ---------- config ---------- */

const THEME_OPTIONS: { mode: ThemeMode; label: string; Icon: IconComponent }[] = [
  { mode: 'light', label: 'Light', Icon: SunIcon },
  { mode: 'dark', label: 'Dark', Icon: MoonIcon },
  { mode: 'system', label: 'System', Icon: MonitorIcon },
];

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7];

/** Solid color for a selected difficulty pill, scaled by difficulty. */
const difficultySelectedColors: Record<number, string> = {
  1: 'bg-success-600 hover:bg-success-700 text-white',
  2: 'bg-success-600 hover:bg-success-700 text-white',
  3: 'bg-success-600 hover:bg-success-700 text-white',
  4: 'bg-warning-500 hover:bg-warning-600 text-white',
  5: 'bg-warning-500 hover:bg-warning-600 text-white',
  6: 'bg-error-600 hover:bg-error-700 text-white',
  7: 'bg-error-600 hover:bg-error-700 text-white',
};

const TECH_STACK = ['React', 'Vite', 'Tauri', 'Rust'];

type SpecStatus = { type: 'idle' | 'success' | 'error'; message: string };

/* ---------- section header ---------- */

function SectionHeader({
  Icon,
  iconClass,
  title,
  subtitle,
}: {
  Icon: IconComponent;
  iconClass: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            iconClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </CardHeader>
  );
}

/* ---------- main component ---------- */

export default function Settings() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const specificationPath = useSettingsStore((s) => s.specificationPath);
  const setSpecification = useSettingsStore((s) => s.setSpecification);
  const clearSpecification = useSettingsStore((s) => s.clearSpecification);
  const defaultDifficulties = useSettingsStore((s) => s.defaultDifficulties);
  const setDefaultDifficulties = useSettingsStore(
    (s) => s.setDefaultDifficulties,
  );
  const defaultQuestionCount = useSettingsStore((s) => s.defaultQuestionCount);
  const setDefaultQuestionCount = useSettingsStore(
    (s) => s.setDefaultQuestionCount,
  );
  const clearResults = useProgressStore((s) => s.clearResults);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [specStatus, setSpecStatus] = useState<SpecStatus>({
    type: 'idle',
    message: '',
  });
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [countInput, setCountInput] = useState(String(defaultQuestionCount));

  function toggleDifficulty(level: number) {
    if (defaultDifficulties.includes(level)) {
      setDefaultDifficulties(defaultDifficulties.filter((d) => d !== level));
    } else {
      setDefaultDifficulties(
        [...defaultDifficulties, level].sort((a, b) => a - b),
      );
    }
  }

  function commitCount() {
    const parsed = parseInt(countInput, 10);
    if (Number.isNaN(parsed)) {
      setCountInput(String(defaultQuestionCount));
      return;
    }
    const clamped = Math.max(1, Math.min(50, parsed));
    setDefaultQuestionCount(clamped);
    setCountInput(String(clamped));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingSpec(true);
    setSpecStatus({ type: 'idle', message: '' });

    const reader = new FileReader();
    reader.onload = async () => {
      const content = String(reader.result ?? '');
      try {
        await parseSpecification(content);
        setSpecification(file.name, content);
        setSpecStatus({
          type: 'success',
          message: `Loaded "${file.name}" successfully.`,
        });
      } catch (err) {
        setSpecStatus({
          type: 'error',
          message: `Failed to parse specification: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        });
      } finally {
        setLoadingSpec(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setLoadingSpec(false);
      setSpecStatus({ type: 'error', message: 'Could not read the file.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  function handleClearResults() {
    clearResults();
    setConfirmClear(false);
  }

  return (
    <div className="mx-auto max-w-5xl animate-slide-up space-y-6 p-6 md:p-8">
      <header>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
          Customize your practice experience and manage your data.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        {/* Appearance */}
        <Card>
          <SectionHeader
            Icon={PaletteIcon}
            iconClass="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
            title="Appearance"
            subtitle="Choose how the app looks."
          />
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ mode, label, Icon }) => {
                const active = themeMode === mode;
                return (
                  <Button
                    key={mode}
                    variant={active ? 'primary' : 'outline'}
                    onClick={() => setThemeMode(mode)}
                    className="flex-col gap-1 py-2"
                    aria-pressed={active}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Practice Defaults */}
        <Card>
          <SectionHeader
            Icon={SlidersIcon}
            iconClass="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300"
            title="Practice Defaults"
            subtitle="Defaults used when starting a session."
          />
          <CardContent className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Default difficulty range
              </p>
              <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                Tap to toggle which levels are included.
              </p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_LEVELS.map((level) => {
                  const selected = defaultDifficulties.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleDifficulty(level)}
                      aria-pressed={selected}
                      className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-fast ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800',
                        selected
                          ? difficultySelectedColors[level]
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600',
                      )}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
            <Input
              type="number"
              min={1}
              max={50}
              label="Default question count"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              onBlur={commitCount}
              hint="Between 1 and 50 questions per session."
            />
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <SectionHeader
            Icon={DatabaseIcon}
            iconClass="bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300"
            title="Data & Storage"
            subtitle="Manage your specification and practice data."
          />
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Specification file
              </p>
              <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                Current:{' '}
                {specificationPath ? (
                  specificationPath
                ) : (
                  <span className="italic">Default spec</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                isLoading={loadingSpec}
              >
                Load File
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearSpecification();
                  setSpecStatus({ type: 'idle', message: '' });
                }}
              >
                Reset to Default Spec
              </Button>
            </div>
            {specStatus.type !== 'idle' && (
              <p
                className={cn(
                  'text-sm',
                  specStatus.type === 'success'
                    ? 'text-success-700 dark:text-success-300'
                    : 'text-error-700 dark:text-error-300',
                )}
              >
                {specStatus.message}
              </p>
            )}
            <div className="border-t border-neutral-100 pt-4 dark:border-neutral-700">
              <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Practice data
              </p>
              <Button
                variant="danger"
                onClick={() => setConfirmClear(true)}
              >
                Clear Practice Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <SectionHeader
            Icon={InfoIcon}
            iconClass="bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
            title="About"
          />
          <CardContent className="space-y-3">
            <div>
              <p className="text-h4 text-neutral-900 dark:text-neutral-100">
                Physics Question Generator
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Version 0.1.0
              </p>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Generate physics questions from a specification file for focused
              and mental practice sessions.
            </p>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Tech stack
              </p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((tech) => (
                  <Badge key={tech} variant="default">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear data confirmation */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear Practice Data?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearResults}>
              Clear All
            </Button>
          </>
        }
      >
        <p className="text-body text-neutral-600 dark:text-neutral-300">
          This will permanently delete all of your practice results and
          statistics. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
