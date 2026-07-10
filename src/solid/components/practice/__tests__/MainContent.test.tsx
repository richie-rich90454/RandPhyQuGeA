import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {MainContent} from "../MainContent";
describe("MainContent", () => {
	it("renders slotted children inside the content stack", () => {
		render(() => (
			<MainContent>
				<span data-testid="question">Question</span>
				<span data-testid="answer">Answer</span>
			</MainContent>
		));
		expect(screen.getByTestId("question")).toBeInTheDocument();
		expect(screen.getByTestId("answer")).toBeInTheDocument();
	});
	it("renders the analytics slot below the content stack", () => {
		render(() => (
			<MainContent analytics={<span data-testid="analytics">Analytics</span>}>
				<span data-testid="practice">Practice</span>
			</MainContent>
		));
		expect(screen.getByTestId("practice")).toBeInTheDocument();
		expect(screen.getByTestId("analytics")).toBeInTheDocument();
	});
	it("renders without children or analytics", () => {
		let {container}=render(() => <MainContent />);
		expect(container.firstChild).not.toBeNull();
	});
	it("applies an extra class", () => {
		let {container}=render(() => <MainContent class="extra">x</MainContent>);
		let wrapper=container.firstChild as HTMLElement;
		expect(wrapper.className).toContain("extra");
	});
});
