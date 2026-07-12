import {describe, it, expect, afterEach} from "vitest";
import {configureCore, generateQuestion, parseSpecification, exportQuestions} from "../physicsCore";
import {QuestionTypeRegistry, ExporterRegistry, SeededRandomGenerator} from "../../lib/physics";
import type {QuestionTypeHandler, QuestionTemplate, GeneratedQuestion, Exporter, ExportFormat} from "../../lib/physics";
class CustomHandler implements QuestionTypeHandler {
    public readonly type = "CustomType";
    public handle(template: QuestionTemplate, variables: Record<string, unknown>): GeneratedQuestion {
        return {
            id: "custom-1",
            topic_id: template.topic_id,
            skill_id: template.skill_id,
            question_type: template.question_type,
            difficulty: template.difficulty,
            text: "custom question dispatched via configureCore",
            answer: "42",
            response_mode: "frq",
            solution_text: "",
            solution_latex: "",
            variables,
        };
    };
}
class CustomFacadeExporter implements Exporter {
    public readonly format: ExportFormat = "html";
    public export(): string {
        return "CUSTOM FACADE EXPORT";
    }
}
const SPEC = [
    "[UNIT]",
    "Id: U1",
    "Name: Test",
    "[TOPIC]",
    "Id: T1",
    "Name: Test",
    "UnitId: U1",
    "[SKILL]",
    "Id: S1",
    "Name: Test",
    "TopicId: T1",
    "[TEMPLATE]",
    "Id: Q1",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: CustomType",
    "Difficulty: 1",
    "TextTemplate: custom",
    "AnswerExpression: 1",
].join("\n");
describe("configureCore", () => {
    afterEach(() => {
        configureCore({});
    });
    it("routes generateQuestion through an injected custom question-type registry", async () => {
        const registry = QuestionTypeRegistry.createDefault();
        registry.register(new CustomHandler());
        configureCore({questionTypes: registry});
        const spec = await parseSpecification(SPEC);
        const q = await generateQuestion(spec);
        expect(q.question_type).toBe("CustomType");
        expect(q.answer).toBe("42");
        expect(q.text).toBe("custom question dispatched via configureCore");
    });
    it("configureCore({}) resets the singleton so the default handler is used again", async () => {
        const registry = QuestionTypeRegistry.createDefault();
        registry.register(new CustomHandler());
        configureCore({questionTypes: registry});
        configureCore({});
        const spec = await parseSpecification(SPEC);
        const q = await generateQuestion(spec);
        expect(q.question_type).toBe("CustomType");
        expect(q.answer).toBe("1");
        expect(q.text).not.toContain("configureCore");
    });
    it("routes exportQuestions through an injected custom exporter registry via configureCore (OCP via facade) (task 5.40)", async () => {
        const registry = new ExporterRegistry();
        registry.register(new CustomFacadeExporter());
        configureCore({exporters: registry});
        const result = await exportQuestions([], "html");
        expect(result).toBe("CUSTOM FACADE EXPORT");
    });
    it("configureCore accepts all standard collaborator types (preventive fix) (task 5.40)", () => {
        const exporters = new ExporterRegistry();
        const questionTypes = QuestionTypeRegistry.createDefault();
        const random = new SeededRandomGenerator(42);
        configureCore({
            exporters,
            questionTypes,
            random,
        });
        configureCore({});
    });
});
