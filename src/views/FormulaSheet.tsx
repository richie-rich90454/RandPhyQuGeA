/**
 * Formula Sheet view.
 *
 * Presents the physics formula library as a searchable, topic-grouped
 * reference. Each formula renders its LaTeX via MathRenderer (display
 * mode) alongside a description and the variables it involves.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Spinner,
  EmptyState,
  Input,
} from '../components/ui';
import { MathRenderer } from '../components/MathRenderer';
import { cn } from '../lib/utils';
import { getFormulaLibrary } from '../services/physicsCore';
import type { FormulaEntry } from '../types/models';

/* ---------- icons ---------- */

type IconProps = { className?: string };

function BookIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-12 w-12', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-4 w-4', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function AlertIcon({ className }: IconProps) {
  return (
    <svg
      className={cn('h-12 w-12', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

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
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load formula library.',
          );
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
    return formulas.filter((f) => {
      const inName = f.name.toLowerCase().includes(trimmed);
      const inDescription = f.description.toLowerCase().includes(trimmed);
      const inVariables = f.variables.some((v) =>
        v.toLowerCase().includes(trimmed),
      );
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
        <EmptyState
          icon={<AlertIcon />}
          title="Could not load formulas"
          description={error}
        />
      </div>
    );
  }

  /* ---------- render: main ---------- */

  return (
    <div className="mx-auto max-w-7xl animate-fade-in p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-100">
          Formula Sheet
        </h1>
        <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
          A searchable reference of physics formulas, grouped by topic.
        </p>
      </header>

      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          type="search"
          placeholder="Search by name, description, or variable…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search formulas"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookIcon />}
          title={query ? 'No matching formulas' : 'No formulas available'}
          description={
            query
              ? 'Try a different search term.'
              : 'The formula library is empty.'
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map(([label, items]) => (
            <section key={label} className="animate-fade-in">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">
                  {label}
                </h2>
                <Badge variant="default">{items.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((formula) => (
                  <Card
                    key={formula.name}
                    className="transition-shadow duration-normal ease-standard hover:shadow-md"
                  >
                    <CardHeader className="mb-3">
                      <CardTitle className="text-h4">{formula.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <MathRenderer
                        tex={formula.latex}
                        display
                        className="overflow-x-auto rounded-md bg-neutral-50 p-3 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      {formula.description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          {formula.description}
                        </p>
                      )}
                      {formula.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {formula.variables.map((v) => (
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
