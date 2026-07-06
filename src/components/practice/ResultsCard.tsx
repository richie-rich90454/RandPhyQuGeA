import {useMemo} from "react";
import {Envelope, Check, X} from "@phosphor-icons/react";
import {usePracticeStore, selectCurrentQuestion} from "../../stores/practiceStore";
import {Card, CardHeader, CardTitle, CardContent, EmptyState} from "../ui";
import {MathText} from "../MathText";
import {MathRenderer} from "../MathRenderer";
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
    const currentQuestion = usePracticeStore(selectCurrentQuestion);
    const solutionRender = useMemo(() => {
        if (!currentQuestion) return null;
        const latex = currentQuestion.solution_latex;
        if (latex && latex.trim() !== "") {
            return {kind: "katex" as const, latex};
        }
        if (currentQuestion.solution_text.trim() !== "") {
            return {kind: "text" as const, text: currentQuestion.solution_text};
        }
        return null;
    }, [currentQuestion]);
    if (!showFeedback || !lastResult || !currentQuestion) {
        return (
            <Card className="results-card" variant="default" padding="none">
                <CardHeader>
                    <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div id="answer-results" className="results-display" role="status" aria-live="polite">
                        <EmptyState
                            icon={<Envelope weight="duotone" size={48} aria-hidden="true" />}
                            title="Your results will appear here after checking"
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }
    const {isCorrect, correctAnswer} = lastResult;
    const displayClass = isCorrect ? "results-display has-content correct" : "results-display has-content incorrect";
    const bannerClass = isCorrect ? "result-success" : "result-error";
    const BannerIcon = isCorrect ? Check : X;
    const heading = isCorrect ? "Correct!" : "Incorrect";
    return (
        <Card className="results-card" variant="default" padding="none">
            <CardHeader>
                <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
                <div id="answer-results" className={displayClass} role="status" aria-live="polite">
                    <div className={bannerClass}>
                        <BannerIcon weight="bold" size={20} aria-hidden="true" />
                        <div>
                            <h3>{heading}</h3>
                            <p>
                                Correct answer: <MathText text={correctAnswer} />
                            </p>
                        </div>
                    </div>
                    {solutionRender && (
                        <div className="solution-display">
                            <h4>Solution</h4>
                            {solutionRender.kind === "katex" ? <MathRenderer display tex={solutionRender.latex} /> : <MathText text={solutionRender.text} />}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
