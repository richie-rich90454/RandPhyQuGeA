import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import type {JSX} from "solid-js";
import {ServiceProvider, useServiceProvider} from "../ServiceProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import {PhysicsCore} from "../../../lib/physics";
import {AnswerGrader} from "../../../lib/physics";
function Consumer(): JSX.Element {
	let ctx = useServiceProvider();
	return (
		<div>
			<span data-testid="core">{ctx.core instanceof PhysicsCore ? "core" : "no"}</span>
			<span data-testid="grader">{ctx.grader instanceof AnswerGrader ? "grader" : "no"}</span>
			<span data-testid="practice">{ctx.practiceStore === usePracticeStore ? "yes" : "no"}</span>
			<span data-testid="progress">{ctx.progressStore === useProgressStore ? "yes" : "no"}</span>
			<span data-testid="settings">{ctx.settingsStore === useSettingsStore ? "yes" : "no"}</span>
			<span data-testid="spec">{ctx.specStore === useSpecStore ? "yes" : "no"}</span>
			<span data-testid="ui">{ctx.uiStore === useUiStore ? "yes" : "no"}</span>
		</div>
	);
}
describe("ServiceProvider", () => {
	it("provides the core, grader, and five stores via context", () => {
		render(() => (
			<ServiceProvider>
				<Consumer />
			</ServiceProvider>
		));
		expect(screen.getByTestId("core").textContent).toBe("core");
		expect(screen.getByTestId("grader").textContent).toBe("grader");
		expect(screen.getByTestId("practice").textContent).toBe("yes");
		expect(screen.getByTestId("progress").textContent).toBe("yes");
		expect(screen.getByTestId("settings").textContent).toBe("yes");
		expect(screen.getByTestId("spec").textContent).toBe("yes");
		expect(screen.getByTestId("ui").textContent).toBe("yes");
	});
	it("accepts injected core and grader overrides", () => {
		let core = PhysicsCore.default();
		let grader = new AnswerGrader();
		render(() => (
			<ServiceProvider core={core} grader={grader}>
				<Consumer />
			</ServiceProvider>
		));
		expect(screen.getByTestId("core").textContent).toBe("core");
		expect(screen.getByTestId("grader").textContent).toBe("grader");
	});
	it("throws when useServiceProvider is called outside a provider", () => {
		let consoleError = console.error;
		console.error = () => {};
		try {
			expect(() => render(() => <Consumer />)).toThrow(/useServiceProvider must be used within a ServiceProvider/);
		} finally {
			console.error = consoleError;
		}
	});
});
