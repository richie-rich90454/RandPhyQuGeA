import {describe, it, expect, vi} from "vitest";
import {PhysicsService} from "../PhysicsService";
import {PhysicsCore} from "../../lib/physics";
import type {QuestionFilter} from "../../lib/physics";
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat} from "../../types/models";
class MockCore extends PhysicsCore {
	public parseSpecification = vi.fn<(input: string) => Specification>();
	public generateQuestion = vi.fn<(spec: Specification, filter?: QuestionFilter) => GeneratedQuestion | null>();
	public generateBatch = vi.fn<(spec: Specification, count: number, filter?: QuestionFilter) => GeneratedQuestion[]>();
	public generateUnique = vi.fn<(spec: Specification, count: number, filter?: QuestionFilter) => GeneratedQuestion[]>();
	public evaluate = vi.fn<(expression: string, variables: Record<string, unknown>) => number>();
	public exportQuestions = vi.fn<(questions: GeneratedQuestion[], format: ExportFormat) => string>();
	public getFormulaLibrary = vi.fn<() => FormulaEntry[]>();
}
const emptySpec = (): Specification => ({units: [], topics: [], skills: [], templates: []});
describe("PhysicsService", () => {
	describe("parseSpecification", () => {
		it("delegates to the injected core", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const spec = emptySpec();
			core.parseSpecification.mockReturnValue(spec);
			const result = await service.parseSpecification("[UNIT]");
			expect(core.parseSpecification).toHaveBeenCalledWith("[UNIT]");
			expect(result).toBe(spec);
		});
	});
	describe("generateQuestion", () => {
		it("returns the generated question", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const question: GeneratedQuestion = {
				id: "q1",
				topic_id: "t1",
				skill_id: "s1",
				question_type: "SA",
				difficulty: 1,
				text: "text",
				answer: "42",
				solution_text: "",
				solution_latex: "",
				variables: {},
				response_mode: "frq",
			};
			core.generateQuestion.mockReturnValue(question);
			const result = await service.generateQuestion(emptySpec());
			expect(core.generateQuestion).toHaveBeenCalledWith(emptySpec(), undefined);
			expect(result).toBe(question);
		});
		it("throws when no template matches", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			core.generateQuestion.mockReturnValue(null);
			await expect(service.generateQuestion(emptySpec())).rejects.toThrow("No question template matches the requested filter.");
		});
		it("forwards mapped filter options", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const question: GeneratedQuestion = {
				id: "q1",
				topic_id: "t1",
				skill_id: "s1",
				question_type: "MC",
				difficulty: 2,
				text: "text",
				answer: "A",
				choices: ["A", "B"],
				solution_text: "",
				solution_latex: "",
				variables: {x: 1},
				response_mode: "frq",
			};
			core.generateQuestion.mockReturnValue(question);
			const spec = emptySpec();
			const options = {topicId: "t1", skillId: "s1", minDifficulty: 1, maxDifficulty: 3, questionType: "MC", excludeIds: ["q0"], templateIds: ["q1"]};
			const result = await service.generateQuestion(spec, options);
			expect(core.generateQuestion).toHaveBeenCalledWith(spec, options);
			expect(result).toBe(question);
		});
	});
	describe("generateBatch", () => {
		it("delegates to the core with mapped options", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const questions: GeneratedQuestion[] = [
				{id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "1", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			core.generateBatch.mockReturnValue(questions);
			const spec = emptySpec();
			const options = {topicId: "t1", excludeIds: ["q0"], templateIds: ["q1"]};
			const result = await service.generateBatch(spec, 5, options);
			expect(core.generateBatch).toHaveBeenCalledWith(spec, 5, options);
			expect(result).toBe(questions);
		});
		it("works without options", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			core.generateBatch.mockReturnValue([]);
			const spec = emptySpec();
			const result = await service.generateBatch(spec, 3);
			expect(core.generateBatch).toHaveBeenCalledWith(spec, 3, undefined);
			expect(result).toEqual([]);
		});
	});
	describe("generateUnique", () => {
		it("delegates to the core with mapped options", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const questions: GeneratedQuestion[] = [
				{id: "q2", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 2, text: "text", answer: "2", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			core.generateUnique.mockReturnValue(questions);
			const spec = emptySpec();
			const options = {skillId: "s1", minDifficulty: 1, maxDifficulty: 5, questionType: "SA"};
			const result = await service.generateUnique(spec, 4, options);
			expect(core.generateUnique).toHaveBeenCalledWith(spec, 4, options);
			expect(result).toBe(questions);
		});
		it("works without options", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			core.generateUnique.mockReturnValue([]);
			const spec = emptySpec();
			const result = await service.generateUnique(spec, 2);
			expect(core.generateUnique).toHaveBeenCalledWith(spec, 2, undefined);
			expect(result).toEqual([]);
		});
	});
	describe("evaluate", () => {
		it("delegates to the core evaluator", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			core.evaluate.mockReturnValue(42);
			const result = await service.evaluate("a + b", {a: 20, b: 22});
			expect(core.evaluate).toHaveBeenCalledWith("a + b", {a: 20, b: 22});
			expect(result).toBe(42);
		});
	});
	describe("exportQuestions", () => {
		it("delegates to the core exporter", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			core.exportQuestions.mockReturnValue("exported");
			const questions: GeneratedQuestion[] = [];
			const result = await service.exportQuestions(questions, "json");
			expect(core.exportQuestions).toHaveBeenCalledWith(questions, "json");
			expect(result).toBe("exported");
		});
	});
	describe("getFormulaLibrary", () => {
		it("delegates to the core formula library", async () => {
			const core = new MockCore();
			const service = new PhysicsService(core);
			const formulas: FormulaEntry[] = [{name: "F=ma", latex: "F=ma", description: "Newton's second law", variables: ["F", "m", "a"]}];
			core.getFormulaLibrary.mockReturnValue(formulas);
			const result = await service.getFormulaLibrary();
			expect(core.getFormulaLibrary).toHaveBeenCalled();
			expect(result).toBe(formulas);
		});
	});
});
