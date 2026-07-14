import type {JSX} from "solid-js";
import {For, Show, createMemo, createSignal} from "solid-js";
import {Card, CardHeader, CardTitle, CardContent} from "../ui/Card";
import {Button} from "../ui/Button";
import {MathText} from "../MathText";
import {HintGenerator} from "../../../lib/physics/hints/HintGenerator";
import type {HintContext, Hint} from "../../../lib/physics/hints/HintGenerator";
import styles from "./HintPanel.module.css";
/** Default maximum number of hints that can be revealed before the answer is exposed. */
const DEFAULT_MAX_LEVEL=3;
function LightbulbIcon(): JSX.Element {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path d="M9 18h6M10 21h4" stroke-linecap="round" />
			<path d="M12 3a6 6 0 00-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0012 3z" stroke-linejoin="round" />
		</svg>
	);
}
export interface HintPanelProps {
	/** Context used to generate the hint ladder. */
	context: HintContext;
	/** Optional override for the underlying generator (useful for tests). */
	generator?: HintGenerator;
	/** Maximum level that can be revealed before the answer is exposed (default 3). */
	maxLevel?: number;
}
/**
 * Partial-credit hint display mapped to a card with progressive disclosure.
 *
 * Renders a `<Card>` with a "Hints" header and a "Reveal next hint" button that
 * walks the user through the {@link HintGenerator}'s hint ladder one level at a
 * time. Each revealed hint is rendered as a list item with its level badge and
 * text (via {@link MathText} so embedded math renders). The button is disabled
 * when no further hints remain, and an `aria-live="polite"` region announces
 * newly revealed hints to assistive technology. The reveal state is local
 * (component-owned `createSignal`); reset the component to clear revealed
 * hints. Reduced-motion preference is handled via CSS media queries.
 */
export function HintPanel(props: HintPanelProps): JSX.Element {
	let generator=props.generator ?? new HintGenerator();
	let maxLevel=props.maxLevel ?? DEFAULT_MAX_LEVEL;
	let [revealedLevels, setRevealedLevels]=createSignal<number[]>([]);
	let allHints=createMemo<Hint[]>(() => generator.generate(props.context, maxLevel));
	let nextHint=createMemo<Hint | null>(() => {
		let hints=allHints();
		let maxRevealed=revealedLevels().length === 0 ? 0 : Math.max(...revealedLevels());
		for (let h of hints) {
			if (h.level > maxRevealed) return h;
		}
		return null;
	});
	let canRevealMore=createMemo<boolean>(() => nextHint() !== null);
	let handleReveal=() => {
		let hint=nextHint();
		if (hint === null) return;
		setRevealedLevels(prev => [...prev, hint.level]);
	};
	let handleReset=() => {
		setRevealedLevels([]);
	};
	return (
		<Card class={styles.hintPanel} variant="filled" padding="none">
			<CardHeader>
				<CardTitle class={styles.title}>
					<span class={styles.titleIcon} aria-hidden="true"><LightbulbIcon /></span>
					Hints
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Show when={allHints().length > 0} fallback={
					<p class={styles.empty}>No hints available for this question.</p>
				}>
					<ol class={styles.hintList} aria-label="Revealed hints">
						<For each={allHints().filter(h => revealedLevels().includes(h.level))}>{(hint) => (
							<li class={styles.hintItem}>
								<span class={styles.hintLevel} aria-label={`Hint level ${hint.level}`}>{hint.level}</span>
								<div class={styles.hintBody}>
									<span class={styles.hintKind}>{hint.kind}</span>
									<MathText text={hint.text} />
								</div>
							</li>
						)}</For>
					</ol>
					<div class={styles.actions}>
						<Show when={canRevealMore()} fallback={
							<Button variant="ghost" size="sm" onClick={handleReset}>Reset hints</Button>
						}>
							<Button variant="secondary" size="sm" onClick={handleReveal}>Reveal next hint</Button>
						</Show>
					</div>
					<div class={styles.srOnlyLive} role="status" aria-live="polite" aria-atomic="true">
						<Show when={revealedLevels().length > 0}>
							{revealedLevels().length} of {allHints().length} hints revealed.
						</Show>
					</div>
				</Show>
			</CardContent>
		</Card>
	);
}
