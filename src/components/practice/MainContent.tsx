import {ScrollReveal} from "../animations";
import {QuestionCard} from "./QuestionCard";
import {AnswerSection} from "./AnswerSection";
/**
 * Main content area mapped to `.main-content > .content-stack`.
 *
 * Composes the question card and the answer section (answer card + results
 * card). The surrounding `<main id="main-content">` landmark is rendered by
 * `AppShell`, so this component only provides the practice surface layout.
 */
export function MainContent() {
    return (
        <div className="main-content">
            <ScrollReveal className="content-stack" direction="up" distance={16} duration={0.5}>
                <QuestionCard />
                <AnswerSection />
            </ScrollReveal>
        </div>
    );
}
