import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {HintPanel} from "../HintPanel";
import {HintGenerator} from "../../../../lib/physics/hints/HintGenerator";
import type {HintContext, Hint} from "../../../../lib/physics/hints/HintGenerator";
function richContext(): HintContext {
	return {
		formulaName: "Newton's Second Law",
		formulaLatex: "F = m a",
		variables: {m: 5, a: 2},
		solutionSteps: ["Identify the knowns.", "Apply F = m a."],
		answerUnits: "N",
		correctAnswer: "10",
	};
}
beforeEach(() => {
	// Noop — HintPanel owns its own local reveal state.
});
describe("HintPanel rendering (task 5.75)", () => {
	it("renders a card with the Hints title", () => {
		render(() => <HintPanel context={richContext()} />);
		expect(screen.getByText("Hints")).toBeInTheDocument();
	});
	it("renders the Reveal next hint button when hints remain", () => {
		render(() => <HintPanel context={richContext()} />);
		expect(screen.getByRole("button", {name: /reveal next hint/i})).toBeInTheDocument();
	});
	it("renders the empty state when context yields no hints", () => {
		render(() => <HintPanel context={{}} />);
		expect(screen.getByText("No hints available for this question.")).toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /reveal next hint/i})).not.toBeInTheDocument();
	});
});
describe("HintPanel progressive disclosure (task 5.75)", () => {
	it("starts with no hints revealed", () => {
		render(() => <HintPanel context={richContext()} />);
		expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
	});
	it("reveals one hint at a time when Reveal next hint is clicked", () => {
		render(() => <HintPanel context={richContext()} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});
	it("revealed hint carries its level and kind", () => {
		render(() => <HintPanel context={richContext()} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("formula")).toBeInTheDocument();
		expect(screen.getByText(/Newton's Second Law/)).toBeInTheDocument();
	});
	it("switches to Reset hints button after all hints are revealed", () => {
		render(() => <HintPanel context={richContext()} />);
		// Default cap is 3 levels.
		for (let i=0; i<3; i++) {
			fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		}
		expect(screen.getByRole("button", {name: /reset hints/i})).toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /reveal next hint/i})).not.toBeInTheDocument();
	});
	it("Reset hints clears revealed hints and brings back Reveal next hint", () => {
		render(() => <HintPanel context={richContext()} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
		// Reveal the third to surface the Reset button.
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		fireEvent.click(screen.getByRole("button", {name: /reset hints/i}));
		expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
		expect(screen.getByRole("button", {name: /reveal next hint/i})).toBeInTheDocument();
	});
});
describe("HintPanel maxLevel cap (task 5.75)", () => {
	it("caps the hint ladder at maxLevel", () => {
		let gen=new HintGenerator();
		let ctx=richContext();
		// Sanity: the unbounded ladder would produce at least 5 hints.
		expect(gen.generate(ctx).length).toBeGreaterThanOrEqual(5);
		render(() => <HintPanel context={ctx} maxLevel={2} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getByRole("button", {name: /reset hints/i})).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});
});
describe("HintPanel a11y (task 5.75)", () => {
	it("exposes an aria-live region announcing revealed count", () => {
		let {container}=render(() => <HintPanel context={richContext()} />);
		let live=container.querySelector('[role="status"][aria-live="polite"]');
		expect(live).not.toBeNull();
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(live?.textContent).toContain("1 of");
	});
	it("marks the hint list with aria-label for screen readers", () => {
		render(() => <HintPanel context={richContext()} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getByLabelText("Revealed hints")).toBeInTheDocument();
	});
	it("hint level badge has an aria-label", () => {
		render(() => <HintPanel context={richContext()} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getByLabelText("Hint level 1")).toBeInTheDocument();
	});
});
describe("HintPanel generator injection (task 5.75)", () => {
	it("accepts a custom generator for testing", () => {
		class StubGenerator extends HintGenerator {
			public override generate(context: HintContext, maxLevel?: number): Hint[] {
				let base=super.generate(context, maxLevel);
				return base.slice(0, 1);
			}
		}
		let gen=new StubGenerator();
		render(() => <HintPanel context={richContext()} generator={gen} />);
		fireEvent.click(screen.getByRole("button", {name: /reveal next hint/i}));
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
		// Stubbed generator caps at one hint so the Reset button appears immediately.
		expect(screen.getByRole("button", {name: /reset hints/i})).toBeInTheDocument();
	});
});
