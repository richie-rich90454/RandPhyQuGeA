import {describe, it, expect, vi, beforeEach} from "vitest";
import {renderHook} from "@testing-library/react";
import {createElement} from "react";
import {ServiceProvider} from "../../components/providers/ServiceProvider";
import {ServiceContainer, defaultContainer} from "../../services/container";
import {useSpecLoader} from "../useSpecLoader";
import {useSpecStore} from "../../stores/specStore";
import {loadDefaultSpec} from "../../services/physicsCore";
import type {ISpecService} from "../../services/contracts";
import type {Specification} from "../../types/models";
vi.mock("../../services/physicsCore", () => ({loadDefaultSpec: vi.fn<() => Promise<string>>()}));
function makeSpec(): Specification {
	return {
		units: [],
		topics: [{id: "t1", name: "Topic", unit_id: "u1", description: ""}],
		skills: [],
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
function makeEmptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeSpecService(loadSpec: ISpecService["loadSpec"]): ISpecService {
	return {
		loadSpec,
		validateSpec: async () => ({valid: true, errors: []}),
		previewTemplate: async () => [],
	};
}
function makeContainer(specService: ISpecService): ServiceContainer {
	return new ServiceContainer(defaultContainer.physics, defaultContainer.session, defaultContainer.analytics, defaultContainer.export, specService);
}
function renderWithProvider(specService: ISpecService) {
	let container=makeContainer(specService);
	return renderHook(() => useSpecLoader(), {wrapper: ({children}) => createElement(ServiceProvider, {container}, children)});
}
describe("useSpecLoader", () => {
	beforeEach(() => {
		useSpecStore.setState(useSpecStore.getInitialState());
		vi.clearAllMocks();
	});
	it("loads and parses the default spec", async () => {
		let spec=makeSpec();
		let loadSpec=vi.fn<(input: string) => Promise<Specification>>().mockResolvedValue(spec);
		vi.mocked(loadDefaultSpec).mockResolvedValue("spec text");
		let {result}=renderWithProvider(makeSpecService(loadSpec));
		await result.current.load();
		expect(loadDefaultSpec).toHaveBeenCalled();
		expect(loadSpec).toHaveBeenCalledWith("spec text");
		expect(useSpecStore.getState().specification).toBe(spec);
		expect(useSpecStore.getState().loading).toBe(false);
		expect(useSpecStore.getState().empty).toBe(false);
		expect(useSpecStore.getState().error).toBeNull();
	});
	it("sets a typed parse error when parsing fails", async () => {
		let loadSpec=vi.fn<(input: string) => Promise<Specification>>().mockRejectedValue(new Error("parse failed"));
		vi.mocked(loadDefaultSpec).mockResolvedValue("bad spec");
		let {result}=renderWithProvider(makeSpecService(loadSpec));
		await result.current.load();
		let error=useSpecStore.getState().error;
		expect(error).toEqual({type: "parse", message: "parse failed", details: expect.any(String)});
		expect(useSpecStore.getState().loading).toBe(false);
	});
	it("sets empty when the parsed spec has no topics or templates", async () => {
		let spec=makeEmptySpec();
		let loadSpec=vi.fn<(input: string) => Promise<Specification>>().mockResolvedValue(spec);
		vi.mocked(loadDefaultSpec).mockResolvedValue("empty spec");
		let {result}=renderWithProvider(makeSpecService(loadSpec));
		await result.current.load();
		expect(useSpecStore.getState().specification).toBe(spec);
		expect(useSpecStore.getState().empty).toBe(true);
		expect(useSpecStore.getState().loading).toBe(false);
		expect(useSpecStore.getState().error).toBeNull();
	});
});
