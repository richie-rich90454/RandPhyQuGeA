/**
 * Formula Sheet view.
 *
 * Presents the physics formula library as a searchable, topic-grouped
 * reference. Each formula renders its LaTeX via MathRenderer (display
 * mode) alongside a description and the variables it involves.
 */
import {useEffect, useMemo, useState} from 'react';
import {Card, CardHeader, CardTitle, CardContent, Badge, Spinner, EmptyState, Input} from '../components/ui';
import {MathRenderer} from '../components/MathRenderer';
import {cn} from '../lib/utils';
import {getFormulaLibrary} from '../services/physicsCore';
import type {FormulaEntry} from '../types/models';
import {BookOpen, Search, AlertCircle} from 'lucide-react';

/* ---------- helpers ---------- */

/**
 * Convert a topic_id into a display label.
 * Missing / null topic_ids fall back to "General"; otherwise the first
 * character is capitalized (e.g. "kinematics" -> "Kinematics").
 */
function categoryLabel(topicId: string | null | undefined): string {
	if (!topicId) return 'General';
	return topicId.charAt(0).toUpperCase() + topicId.slice(1);
}

/* ---------- main component ---------- */

export default function FormulaSheet() {
	const [formulas, setFormulas] = useState<FormulaEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState('');

	// Load the formula library on mount.
	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				const library = await getFormulaLibrary();
				if (!cancelled) {
					setFormulas(library);
					setLoading(false);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Failed to load formula library.');
					setLoading(false);
				}
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, []);

	// Filter formulas by the search query (name, description, or variables).
	const filtered = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return formulas;
		return formulas.filter(f => {
			const inName = f.name.toLowerCase().includes(trimmed);
			const inDescription = f.description.toLowerCase().includes(trimmed);
			const inVariables = f.variables.some(v => v.toLowerCase().includes(trimmed));
			return inName || inDescription || inVariables;
		});
	}, [formulas, query]);

	// Group filtered formulas by topic_id, preserving first-appearance order.
	const groups = useMemo(() => {
		const map = new Map<string, FormulaEntry[]>();
		for (const formula of filtered) {
			const key = categoryLabel(formula.topic_id);
			const list = map.get(key);
			if (list) {
				list.push(formula);
			} else {
				map.set(key, [formula]);
			}
		}
		return Array.from(map.entries());
	}, [filtered]);

	/* ---------- render: loading ---------- */

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center p-12">
				<div className="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
					<Spinner size="lg" />
					<p className="text-sm">Loading formula library…</p>
				</div>
			</div>
		);
	}

	/* ---------- render: error ---------- */

	if (error) {
		return (
			<div className="mx-auto max-w-3xl p-6 md:p-8">
				<EmptyState icon={<AlertCircle className="h-12 w-12" />} title="Could not load formulas" description={error} />
			</div>
		);
	}

	/* ---------- render: main ---------- */

	return (
		<div className="mx-auto max-w-7xl animate-fade-in p-6 md:p-8">
			<header className="mb-6">
				<h1 className="text-h1 text-neutral-900 dark:text-neutral-100">Formula Sheet</h1>
				<p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">A searchable reference of physics formulas, grouped by topic.</p>
			</header>

			<div className="relative mb-6">
				<Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400')} />
				<Input type="search" placeholder="Search by name, description, or variable…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search formulas" className="pl-9" />
			</div>

			{filtered.length === 0 ? (
				<EmptyState
					icon={<BookOpen className="h-12 w-12" />}
					title={query ? 'No matching formulas' : 'No formulas available'}
					description={query ? 'Try a different search term.' : 'The formula library is empty.'}
				/>
			) : (
				<div className="space-y-8">
					{groups.map(([label, items]) => (
						<section key={label} className="animate-fade-in">
							<div className="mb-3 flex items-center gap-2">
								<h2 className="text-h2 text-neutral-900 dark:text-neutral-100">{label}</h2>
								<Badge variant="default">{items.length}</Badge>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{items.map(formula => (
									<Card key={formula.name} className="transition-shadow duration-normal ease-standard hover:shadow-md">
										<CardHeader className="mb-3">
											<CardTitle className="text-h4">{formula.name}</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<MathRenderer tex={formula.latex} display className="overflow-x-auto rounded-md bg-neutral-50 p-3 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100" />
											{formula.description && <p className="text-sm text-neutral-600 dark:text-neutral-300">{formula.description}</p>}
											{formula.variables.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{formula.variables.map(v => (
														<Badge key={v} variant="info">
															{v}
														</Badge>
													))}
												</div>
											)}
										</CardContent>
									</Card>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
