import {ScrollReveal} from "../animations";
import {QuestionCard} from "./QuestionCard";
import {AnswerSection} from "./AnswerSection";
import {ProgressPanel} from "../analytics/ProgressPanel";
/**
 * Main content area mapped to `.main-content > .content-stack`.
 *
 * Composes the question card, the answer section (answer card + results
 * card), and the progress analytics panel. The surrounding
 * `<main id="main-content">` landmark is rendered by `AppShell`, so this
 * component only provides the practice surface layout.
 */
export function MainContent() {
    return (
        <div className="main-content">
            <ScrollReveal className="content-stack grid grid-cols-1 lg:grid-cols-2 gap-4" direction="up" distance={16} duration={0.5}>
                <QuestionCard />
                <AnswerSection />
            </ScrollReveal>
            <ProgressPanel />
        </div>
    );
}
