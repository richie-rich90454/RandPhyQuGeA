import {describe, it, expect, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {type ReactNode} from "react";
import {MainContent} from "../MainContent";
vi.mock("../../animations", () => ({
	ScrollReveal: ({children, className}: {children?: ReactNode; className?: string}) => <div data-testid="content-stack" className={className}>{children}</div>,
}));
vi.mock("../QuestionCard", () => ({
	QuestionCard: () => <div data-testid="question-card" />,
}));
vi.mock("../AnswerSection", () => ({
	AnswerSection: () => <div data-testid="answer-section" />,
}));
vi.mock("../../analytics/ProgressPanel", () => ({
	ProgressPanel: () => <div data-testid="progress-panel" />,
}));
describe("MainContent", () => {
	it("renders the content stack with responsive grid classes", () => {
		render(<MainContent />);
		const stack = screen.getByTestId("content-stack");
		expect(stack.className).toContain("content-stack");
		expect(stack.className).toContain("grid");
		expect(stack.className).toContain("grid-cols-1");
		expect(stack.className).toContain("gap-4");
	});
});
