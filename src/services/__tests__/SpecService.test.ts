import {describe, it, expect, vi} from "vitest";
import {SpecService} from "../SpecService";
import {ParseException} from "../../lib/physics/types";
import type {IPhysicsService, GenerateOptions} from "../contracts";
import type {ExportFormat, FormulaEntry, GeneratedQuestion, Specification} from "../../types/models";
class MockPhysicsService implements IPhysicsService {
	public parseSpecification=vi.fn<(input: string) => Promise<Specification>>();
	public generateQuestion=vi.fn<(spec: Specification, options?: GenerateOptions) => Promise<GeneratedQuestion>>();
	public generateBatch=vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>();
	public generateUnique=vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>();
	public evaluate=vi.fn<(expression: string, variables: Record<string, unknown>) => Promise<number>>();
	public exportQuestions=vi.fn<(questions: GeneratedQuestion[], format: ExportFormat) => Promise<string>>();
	public getFormulaLibrary=vi.fn<() => Promise<FormulaEntry[]>>();
}
let emptySpec=(): Specification => ({units: [], topics: [], skills: [], templates: []});
describe("SpecService", () => {
	describe("loadSpec", () => {
		it("delegates parsing to the physics service", async () => {
			let physics=new MockPhysicsService();
			let service=new SpecService(physics);
			let spec=emptySpec();
			physics.parseSpecification.mockResolvedValue(spec);
			let result=await service.loadSpec("[UNIT]");
			expect(physics.parseSpecification).toHaveBeenCalledWith("[UNIT]");
			expect(result).toBe(spec);
		});
	});
	describe("validateSpec", () => {
		it("returns valid when parsing succeeds", async () => {
			let physics=new MockPhysicsService();
			let service=new SpecService(physics);
			physics.parseSpecification.mockResolvedValue(emptySpec());
			let result=await service.validateSpec("[UNIT]");
			expect(physics.parseSpecification).toHaveBeenCalledWith("[UNIT]");
			expect(result).toEqual({valid: true, errors: []});
		});
		it("returns typed errors from a ParseException", async () => {
			let physics=new MockPhysicsService();
			let service=new SpecService(physics);
			let errors=[{line: 2, message: "Expected [UNIT]"}];
			physics.parseSpecification.mockRejectedValue(new ParseException(errors));
			let result=await service.validateSpec("[UNIT]");
			expect(result).toEqual({valid: false, errors});
		});
		it("wraps non-parse errors with line zero", async () => {
			let physics=new MockPhysicsService();
			let service=new SpecService(physics);
			physics.parseSpecification.mockRejectedValue(new Error("boom"));
			let result=await service.validateSpec("[UNIT]");
			expect(result).toEqual({valid: false, errors: [{line: 0, message: "boom"}]});
		});
	});
	describe("previewTemplate", () => {
		it("generates sample questions from a specific template", async () => {
			let physics=new MockPhysicsService();
			let service=new SpecService(physics);
			let spec=emptySpec();
			let questions: GeneratedQuestion[]=[{id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "42", response_mode: "frq", solution_text: "", solution_latex: "", variables: {}}];
			physics.generateBatch.mockResolvedValue(questions);
			let result=await service.previewTemplate(spec, "tmpl-1", 3);
			expect(physics.generateBatch).toHaveBeenCalledWith(spec, 3, {templateIds: ["tmpl-1"]});
			expect(result).toBe(questions);
		});
	});
});
