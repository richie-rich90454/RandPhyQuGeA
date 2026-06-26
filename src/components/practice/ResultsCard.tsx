import {usePracticeStore} from '../../stores/practiceStore';
import {EmptyState} from '../ui';
import {MathText} from '../MathText';
import {MathRenderer} from '../MathRenderer';
/** Mail/results empty-state icon path. */
const RESULTS_EMPTY_ICON = 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z';
/** Checkmark icon path for correct answers. */
const CORRECT_ICON = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
/** Cross icon path for incorrect answers. */
const INCORRECT_ICON = 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';
/**
 * Results feedback card mapped to `.results-card`.
 *
 * Reads `showFeedback` and `lastResult` from the practice store. When no
 * feedback is available, renders the empty-state placeholder. When feedback is
 * shown, renders a correct (green) or incorrect (red) banner with the correct
 * answer and the solution (LaTeX-rendered when available).
 */
export function ResultsCard() {
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const lastResult = usePracticeStore(state => state.lastResult);
	const currentQuestion = usePracticeStore(state => state.questions[state.currentIndex] ?? null);
	if (!showFeedback || !lastResult || !currentQuestion) {
		return (
			<div className="results-card card">
				<div className="card-header">
					<h2 className="card-title">Results</h2>
				</div>
				<div className="card-content">
					<div id="answer-results" className="results-display" role="status" aria-live="polite">
						<EmptyState
							icon={
								<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d={RESULTS_EMPTY_ICON} />
								</svg>
							}
							title="Your results will appear here after checking"
						/>
					</div>
				</div>
			</div>
		);
	}
	const {isCorrect, correctAnswer} = lastResult;
	const displayClass = isCorrect ? 'results-display has-content correct' : 'results-display has-content incorrect';
	const bannerClass = isCorrect ? 'result-success' : 'result-error';
	const bannerIcon = isCorrect ? CORRECT_ICON : INCORRECT_ICON;
	const heading = isCorrect ? 'Correct!' : 'Incorrect';
	const solutionLatex = currentQuestion.solution_latex;
	return (
		<div className="results-card card">
			<div className="card-header">
				<h2 className="card-title">Results</h2>
			</div>
			<div className="card-content">
				<div id="answer-results" className={displayClass} role="status" aria-live="polite">
					<div className={bannerClass}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d={bannerIcon} />
						</svg>
						<div>
							<h3>{heading}</h3>
							<p>
								Correct answer: <MathText text={correctAnswer} />
							</p>
						</div>
					</div>
					{solutionLatex && solutionLatex.trim() !== '' && (
						<div className="solution-display">
							<h4>Solution</h4>
							<MathRenderer tex={solutionLatex} display />
						</div>
					)}
					{(!solutionLatex || solutionLatex.trim() === '') && currentQuestion.solution_text.trim() !== '' && (
						<div className="solution-display">
							<h4>Solution</h4>
							<MathText text={currentQuestion.solution_text} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
