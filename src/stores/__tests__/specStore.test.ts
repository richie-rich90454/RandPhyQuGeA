import {describe, it, expect, beforeEach} from "vitest";
import {useSpecStore} from "../specStore";
import type {SpecError, SpecState} from "../specStore";
import type {Specification} from "../../types/models";
function makeSpec(): Specification {
	return {
		units: [{id: "u1", name: "Unit", description: ""}],
		topics: [{id: "t1", name: "Topic", unit_id: "u1", description: ""}],
		skills: [{id: "s1", name: "Skill", topic_id: "t1", description: ""}],
		templates: [{
			id: "tpl1",
			topic_id: "t1",
			skill_id: "s1",
			question_type: "SA",
			difficulty: 1,
			text_template: "Question",
			answer_expression: "1",
			solution_template: "",
			solution_latex_template: "",
			variable_definitions: [],
			distractor_expressions: [],
		}],
	};
}
describe("specStore", () => {
	beforeEach(() => {
		useSpecStore.setState(useSpecStore.getInitialState());
	});
	describe("initial state", () => {
		it("has null specification and defaults", () => {
			let state: SpecState=useSpecStore.getState();
			expect(state.specification).toBeNull();
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.empty).toBe(true);
		});
	});
	describe("setSpecification", () => {
		it("updates the specification", () => {
			let spec=makeSpec();
			useSpecStore.getState().setSpecification(spec);
			expect(useSpecStore.getState().specification).toBe(spec);
		});
	});
	describe("setLoading", () => {
		it("updates loading", () => {
			useSpecStore.getState().setLoading(true);
			expect(useSpecStore.getState().loading).toBe(true);
		});
	});
	describe("setError", () => {
		it("updates the typed error", () => {
			let error: SpecError={type: "parse", message: "bad spec", details: "line 1"};
			useSpecStore.getState().setError(error);
			expect(useSpecStore.getState().error).toBe(error);
		});
	});
	describe("setEmpty", () => {
		it("updates empty", () => {
			useSpecStore.getState().setEmpty(false);
			expect(useSpecStore.getState().empty).toBe(false);
		});
	});
	describe("reset", () => {
		it("restores the initial state", () => {
			let spec=makeSpec();
			useSpecStore.getState().setSpecification(spec);
			useSpecStore.getState().setLoading(true);
			useSpecStore.getState().setError({type: "network", message: "fail"});
			useSpecStore.getState().setEmpty(false);
			useSpecStore.getState().reset();
			let state=useSpecStore.getState();
			expect(state.specification).toBeNull();
			expect(state.loading).toBe(false);
			expect(state.error).toBeNull();
			expect(state.empty).toBe(true);
		});
	});
});
