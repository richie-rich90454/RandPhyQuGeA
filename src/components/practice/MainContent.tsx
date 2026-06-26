import {QuestionCard} from './QuestionCard';
import {AnswerSection} from './AnswerSection';
/**
 * Main content area mapped to `.main-content > .content-stack`.
 *
 * Composes the question card and the answer section (answer card + results
 * card). This replaces the placeholder markup in `App.tsx` so the practice
 * surface is fully populated per the reference design.
 */
export function MainContent() {
	return (
		<main className="main-content">
			<div className="content-stack">
				<QuestionCard />
				<AnswerSection />
			</div>
		</main>
	);
}
