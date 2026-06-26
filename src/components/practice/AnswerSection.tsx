import {AnswerCard} from './AnswerCard';
import {ResultsCard} from './ResultsCard';
/**
 * Answer section grid mapped to `.answer-section`.
 *
 * Lays out the `AnswerCard` and `ResultsCard` side-by-side (1fr 1fr grid per
 * the reference CSS). Mirrors the reference markup where both cards live
 * inside a single `.answer-section` container within `.content-stack`.
 */
export function AnswerSection() {
	return (
		<div className="answer-section">
			<AnswerCard />
			<ResultsCard />
		</div>
	);
}
