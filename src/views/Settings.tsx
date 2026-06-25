import {useRef, useState, type ComponentType} from 'react';
import {Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, Modal} from '../components/ui';
import {cn} from '../lib/utils';
import {useSettingsStore} from '../stores/settingsStore';
import type {ThemeMode} from '../stores/settingsStore';
import {useProgressStore} from '../stores/progressStore';
import {parseSpecification} from '../services/physicsCore';
import {Sun, Moon, Monitor, Palette, SlidersHorizontal, Database, Info, type LucideIcon} from 'lucide-react';

/* ---------- config ---------- */

type IconComponent = ComponentType<{className?: string}>;

const THEME_OPTIONS: {mode: ThemeMode; label: string; Icon: LucideIcon}[] = [
	{mode: 'light', label: 'Light', Icon: Sun},
	{mode: 'dark', label: 'Dark', Icon: Moon},
	{mode: 'system', label: 'System', Icon: Monitor}
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
	7: 'bg-error-600 hover:bg-error-700 text-white'
};

const TECH_STACK = ['React', 'Vite', 'Tauri', 'Rust'];

type SpecStatus = {type: 'idle' | 'success' | 'error'; message: string};

/* ---------- section header ---------- */

function SectionHeader({Icon, iconClass, title, subtitle}: {Icon: IconComponent; iconClass: string; title: string; subtitle?: string}) {
	return (
		<CardHeader>
			<div className="flex items-center gap-3">
				<div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconClass)}>
					<Icon className="h-5 w-5" />
				</div>
				<div>
					<CardTitle>{title}</CardTitle>
					{subtitle && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
				</div>
			</div>
		</CardHeader>
	);
}

/* ---------- main component ---------- */

export default function Settings() {
	const themeMode = useSettingsStore(s => s.themeMode);
	const setThemeMode = useSettingsStore(s => s.setThemeMode);
	const specificationPath = useSettingsStore(s => s.specificationPath);
	const setSpecification = useSettingsStore(s => s.setSpecification);
	const clearSpecification = useSettingsStore(s => s.clearSpecification);
	const defaultDifficulties = useSettingsStore(s => s.defaultDifficulties);
	const setDefaultDifficulties = useSettingsStore(s => s.setDefaultDifficulties);
	const defaultQuestionCount = useSettingsStore(s => s.defaultQuestionCount);
	const setDefaultQuestionCount = useSettingsStore(s => s.setDefaultQuestionCount);
	const clearResults = useProgressStore(s => s.clearResults);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [specStatus, setSpecStatus] = useState<SpecStatus>({
		type: 'idle',
		message: ''
	});
	const [loadingSpec, setLoadingSpec] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);
	const [countInput, setCountInput] = useState(String(defaultQuestionCount));

	function toggleDifficulty(level: number) {
		if (defaultDifficulties.includes(level)) {
			setDefaultDifficulties(defaultDifficulties.filter(d => d !== level));
		} else {
			setDefaultDifficulties([...defaultDifficulties, level].sort((a, b) => a - b));
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
		setSpecStatus({type: 'idle', message: ''});

		const reader = new FileReader();
		reader.onload = async () => {
			const content = String(reader.result ?? '');
			try {
				await parseSpecification(content);
				setSpecification(file.name, content);
				setSpecStatus({
					type: 'success',
					message: `Loaded "${file.name}" successfully.`
				});
			} catch (err) {
				setSpecStatus({
					type: 'error',
					message: `Failed to parse specification: ${err instanceof Error ? err.message : 'Unknown error'}`
				});
			} finally {
				setLoadingSpec(false);
				if (fileInputRef.current) fileInputRef.current.value = '';
			}
		};
		reader.onerror = () => {
			setLoadingSpec(false);
			setSpecStatus({type: 'error', message: 'Could not read the file.'});
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
				<h1 className="text-h1 text-neutral-900 dark:text-neutral-100">Settings</h1>
				<p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">Customize your practice experience and manage your data.</p>
			</header>

			<div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
				{/* Appearance */}
				<Card>
					<SectionHeader Icon={Palette} iconClass="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300" title="Appearance" subtitle="Choose how the app looks." />
					<CardContent className="space-y-3">
						<p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Theme</p>
						<div className="grid grid-cols-3 gap-2">
							{THEME_OPTIONS.map(({mode, label, Icon}) => {
								const active = themeMode === mode;
								return (
									<Button key={mode} variant={active ? 'primary' : 'outline'} onClick={() => setThemeMode(mode)} className="flex-col gap-1 py-2" aria-pressed={active}>
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
						Icon={SlidersHorizontal}
						iconClass="bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300"
						title="Practice Defaults"
						subtitle="Defaults used when starting a session."
					/>
					<CardContent className="space-y-5">
						<div>
							<p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">Default difficulty range</p>
							<p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">Tap to toggle which levels are included.</p>
							<div className="flex flex-wrap gap-2">
								{DIFFICULTY_LEVELS.map(level => {
									const selected = defaultDifficulties.includes(level);
									return (
										<button
											key={level}
											type="button"
											onClick={() => toggleDifficulty(level)}
											aria-pressed={selected}
											className={cn(
												'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-fast ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800',
												selected ? difficultySelectedColors[level] : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600'
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
							onChange={e => setCountInput(e.target.value)}
							onBlur={commitCount}
							hint="Between 1 and 50 questions per session."
						/>
					</CardContent>
				</Card>

				{/* Data & Storage */}
				<Card>
					<SectionHeader
						Icon={Database}
						iconClass="bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300"
						title="Data & Storage"
						subtitle="Manage your specification and practice data."
					/>
					<CardContent className="space-y-4">
						<input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
						<div className="space-y-1">
							<p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Specification file</p>
							<p className="truncate text-sm text-neutral-500 dark:text-neutral-400">Current: {specificationPath ? specificationPath : <span className="italic">Default spec</span>}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button onClick={() => fileInputRef.current?.click()} isLoading={loadingSpec}>
								Load File
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									clearSpecification();
									setSpecStatus({type: 'idle', message: ''});
								}}
							>
								Reset to Default Spec
							</Button>
						</div>
						{specStatus.type !== 'idle' && (
							<p className={cn('text-sm', specStatus.type === 'success' ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300')}>{specStatus.message}</p>
						)}
						<div className="border-t border-neutral-100 pt-4 dark:border-neutral-700">
							<p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Practice data</p>
							<Button variant="danger" onClick={() => setConfirmClear(true)}>
								Clear Practice Data
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* About */}
				<Card>
					<SectionHeader Icon={Info} iconClass="bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" title="About" />
					<CardContent className="space-y-3">
						<div>
							<p className="text-h4 text-neutral-900 dark:text-neutral-100">Physics Question Generator</p>
							<p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Version 0.1.0</p>
						</div>
						<p className="text-sm text-neutral-600 dark:text-neutral-300">Generate physics questions from a specification file for focused and mental practice sessions.</p>
						<div>
							<p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Tech stack</p>
							<div className="flex flex-wrap gap-2">
								{TECH_STACK.map(tech => (
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
				<p className="text-body text-neutral-600 dark:text-neutral-300">This will permanently delete all of your practice results and statistics. This action cannot be undone.</p>
			</Modal>
		</div>
	);
}
