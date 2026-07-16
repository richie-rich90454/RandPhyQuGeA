import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let answerCardCss = readFileSync(join(process.cwd(), "src", "solid", "components", "practice", "AnswerCard.module.css"), "utf-8");
let topicsSectionCss = readFileSync(join(process.cwd(), "src", "solid", "components", "practice", "TopicsSection.module.css"), "utf-8");
let pillCss = readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Pill.module.css"), "utf-8");
describe("AnswerCard stacks answer input at narrow viewports", () => {
	it("answerInputWrapper switches to flex-direction column at 480px", () => {
		expect(answerCardCss).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.answerInputWrapper\s*\{[^}]*flex-direction:\s*column/);
	});
	it("clearAnswerBtn uses align-self center at 480px", () => {
		expect(answerCardCss).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.clearAnswerBtn\s*\{[^}]*align-self:\s*center/);
	});
});
describe("TopicsSection pills scroll horizontally at narrow viewports", () => {
	it("pills use flex-wrap nowrap at 768px", () => {
		expect(topicsSectionCss).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[^}]*\.pills\s*\{[^}]*flex-wrap:\s*nowrap/);
	});
	it("pills use overflow-x auto at 768px", () => {
		expect(topicsSectionCss).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[^}]*\.pills\s*\{[^}]*overflow-x:\s*auto/);
	});
	it("pills use thin scrollbar at 768px", () => {
		expect(topicsSectionCss).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[^}]*\.pills\s*\{[^}]*scrollbar-width:\s*thin/);
	});
});
describe("Pill does not shrink and adapts at narrow viewports", () => {
	it("pill has flex-shrink 0", () => {
		expect(pillCss).toMatch(/\.pill\s*\{[^}]*flex-shrink:\s*0/);
	});
	it("lg pill reduces padding at 480px", () => {
		expect(pillCss).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[^}]*\.lg\s*\{[^}]*padding:\s*var\(--space-1\)\s*var\(--space-2\)/);
	});
});
