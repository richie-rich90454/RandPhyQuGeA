/**
 * Performance budget monitor.
 *
 * Pure-TypeScript (no JSX, no `solid-js` imports) class that declares byte
 * budgets for resource categories (script, style, font, image, other) and
 * checks a list of measured resource sizes against those budgets. Used by the
 * `/dx` dashboard to surface budget overruns in dev and to gate CI on bundle
 * size. The checker is deterministic and side-effect free so it can be unit
 * tested without a browser.
 */
export type BudgetCategory="script" | "style" | "font" | "image" | "other";
export interface BudgetEntry {
	/** Resource category the budget applies to. */
	category: BudgetCategory;
	/** Maximum total bytes allowed for the category. */
	limitBytes: number;
}
export interface ResourceMeasurement {
	/** Resource category of the measured asset. */
	category: BudgetCategory;
	/** Measured transfer size in bytes. */
	bytes: number;
	/** Optional asset URL or label for diagnostics. */
	label?: string;
}
export interface BudgetResult {
	/** Category the result applies to. */
	category: BudgetCategory;
	/** Sum of measured bytes for the category. */
	actualBytes: number;
	/** Budget limit for the category. */
	limitBytes: number;
	/** Whether actualBytes is within limitBytes. */
	passed: boolean;
	/** actualBytes / limitBytes * 100, clamped to 0 when limit is 0. */
	percent: number;
	/** Number of measured resources contributing to actualBytes. */
	count: number;
}
export class PerfBudget {
	private entries: BudgetEntry[];
	/**
	 * @param entries Budget entries; one per category. Categories not listed
	 * are treated as unlimited (omitted from results).
	 */
	constructor(entries: BudgetEntry[]) {
		this.entries=entries.map(e => ({category: e.category, limitBytes: e.limitBytes}));
	}
	/** Returns a defensive copy of the budget entries. */
	getEntries(): BudgetEntry[] {
		return this.entries.map(e => ({category: e.category, limitBytes: e.limitBytes}));
	}
	/** Returns the budget limit for a category, or 0 when unbounded. */
	getLimit(category: BudgetCategory): number {
		for (let entry of this.entries) {
			if (entry.category===category) return entry.limitBytes;
		}
		return 0;
	}
	/**
	 * Check a list of resource measurements against the budget. Measurements
	 * for categories not in the budget are ignored. Returns one result per
	 * budget entry, sorted by category name for stable display.
	 */
	check(measurements: ResourceMeasurement[]): BudgetResult[] {
		let sums=new Map<BudgetCategory, {bytes: number, count: number}>();
		for (let m of measurements) {
			let entry=sums.get(m.category);
			if (entry) {
				entry.bytes+=m.bytes;
				entry.count+=1;
			} else {
				sums.set(m.category, {bytes: m.bytes, count: 1});
			}
		}
		let results: BudgetResult[]=[];
		for (let budget of this.entries) {
			let sum=sums.get(budget.category) ?? {bytes: 0, count: 0};
			let percent=budget.limitBytes>0 ? (sum.bytes/budget.limitBytes)*100 : 0;
			results.push({
				category: budget.category,
				actualBytes: sum.bytes,
				limitBytes: budget.limitBytes,
				passed: sum.bytes<=budget.limitBytes,
				percent,
				count: sum.count,
			});
		}
		results.sort((a, b) => a.category.localeCompare(b.category));
		return results;
	}
	/** True when every checked category is within its budget. */
	allPassed(measurements: ResourceMeasurement[]): boolean {
		return this.check(measurements).every(r => r.passed);
	}
	/** Format a byte count as a human-readable string (KB or MB). */
	static formatBytes(bytes: number): string {
		if (bytes<1024) return `${bytes} B`;
		if (bytes<1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
		return `${(bytes/(1024*1024)).toFixed(2)} MB`;
	}
	/** Default budget for the SolidJS surface. */
	static defaultBudget(): BudgetEntry[] {
		return [
			{category: "script", limitBytes: 600*1024},
			{category: "style", limitBytes: 120*1024},
			{category: "font", limitBytes: 200*1024},
			{category: "image", limitBytes: 400*1024},
			{category: "other", limitBytes: 150*1024},
		];
	}
	/**
	 * Classify a resource URL into a budget category based on its file
	 * extension. Unknown extensions fall back to "other".
	 */
	static classifyUrl(url: string): BudgetCategory {
		let cleaned=url.split("?")[0] ?? url;
		let lower=cleaned.toLowerCase();
		if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "script";
		if (lower.endsWith(".css")) return "style";
		if (lower.endsWith(".woff") || lower.endsWith(".woff2") || lower.endsWith(".ttf") || lower.endsWith(".otf") || lower.endsWith(".eot")) return "font";
		if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".svg") || lower.endsWith(".webp") || lower.endsWith(".avif")) return "image";
		return "other";
	}
}
