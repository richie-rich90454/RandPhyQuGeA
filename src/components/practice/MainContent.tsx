import {QuestionCard} from './QuestionCard';
import {AnswerSection} from './AnswerSection';
/**
 * Main content area mapped to `.main-content > .content-stack`.
 *
 * Composes the question card and the answer section (answer card + results
 * card). This replaces the placeholder markup in `App.tsx` so the practice
 * surface is fully populated per the reference design. The `<main>` carries
 * `id="main-content"` (the skip-link target) and `aria-label="Main content"`,
 * with `tabIndex={-1}` so the skip-link can move keyboard focus into it.
 */
export function MainContent() {
	return (
		<main id="main-content" className="main-content" tabIndex={-1} aria-label="Main content">
			<div className="content-stack">
				<QuestionCard />
				<AnswerSection />
			</div>
		</main>
	);
}
