import {describe, it, expect} from "vitest";
import {QuestionTypeRegistry} from "../generator/QuestionTypeRegistry";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {ExporterRegistry} from "../exporters/ExporterRegistry";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SpecificationParser} from "../SpecificationParser";
import {PhysicsCore} from "../PhysicsCore";
import {SeededRandomGenerator} from "../random";
import type {QuestionTypeHandler} from "../contracts";
import type {Exporter} from "../contracts";
import type {DistractorContext, ResponseFormatStrategy} from "../contracts";
import type {ExportFormat, GeneratedQuestion, QuestionTemplate} from "../types";
class CustomHandler implements QuestionTypeHandler {
    public readonly type = "CustomType";
    public handle(template: QuestionTemplate, variables: Record<string, unknown>): GeneratedQuestion {
        const x = variables["x"];
        return {
            id: "custom-1",
            topic_id: template.topic_id,
            skill_id: template.skill_id,
            question_type: template.question_type,
            difficulty: template.difficulty,
            text: "custom: " + String(x ?? ""),
            answer: "42",
            response_mode: "frq",
            solution_text: "",
            solution_latex: "",
            variables,
        };
    }
}
class CustomExporter implements Exporter {
    public readonly format: ExportFormat = "html";
    public export(): string {
        return "CUSTOM EXPORT";
    }
}
class NumericCustomHandler implements QuestionTypeHandler {
    public readonly type = "CustomMcq";
    public handle(template: QuestionTemplate, variables: Record<string, unknown>): GeneratedQuestion {
        return {
            id: "custom-mcq-1",
            topic_id: template.topic_id,
            skill_id: template.skill_id,
            question_type: template.question_type,
            difficulty: template.difficulty,
            text: "custom mcq: " + String(variables["x"] ?? ""),
            answer: "10",
            response_mode: "frq",
            solution_text: "",
            solution_latex: "",
            variables,
        };
    }
}
class CustomDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = "CustomMcq";
    public generateDistractors(_context: DistractorContext, count: number): string[] {
        return ["7", "8", "9", "11", "12"].slice(0, count);
    }
}
const CUSTOM_SPEC = [
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
    "TextTemplate: custom {x}",
    "AnswerExpression: x",
    "Var.x: Type=int;Min=1;Max=10",
].join("\n");
const CUSTOM_MCQ_SPEC = [
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
    "QuestionType: CustomMcq",
    "Difficulty: 1",
    "TextTemplate: custom {x}",
    "AnswerExpression: x",
    "Var.x: Type=int;Min=1;Max=10",
].join("\n");
describe("Open-Closed Principle", () => {
    it("allows registering a custom question type handler that dispatches via the registry", () => {
        const registry = QuestionTypeRegistry.createDefault();
        const custom = new CustomHandler();
        registry.register(custom);
        expect(registry.get("CustomType")).toBe(custom);
        const handler = registry.getOrDefault("CustomType");
        expect(handler).toBe(custom);
        const spec = new SpecificationParser().parse(CUSTOM_SPEC);
        const template = spec.templates[0]!;
        const evaluator = new ExpressionEvaluator();
        const random = new SeededRandomGenerator(1);
        const q = handler.handle(template, {x: 7}, evaluator, random);
        expect(q.text).toContain("custom:");
        expect(q.text).toBe("custom: 7");
        expect(q.answer).toBe("42");
    });
    it("facade dispatches generateQuestion through an injected custom question type registry", () => {
        const registry = QuestionTypeRegistry.createDefault();
        registry.register(new CustomHandler());
        const core = new PhysicsCore(undefined, undefined, undefined, undefined, new SeededRandomGenerator(1), registry);
        const spec = core.parseSpecification(CUSTOM_SPEC);
        const q = core.generateQuestion(spec, {templateIds: ["Q1"]});
        expect(q).not.toBeNull();
        expect(q?.question_type).toBe("CustomType");
        expect(q?.text).toContain("custom:");
        expect(q?.answer).toBe("42");
    });
    it("falls back to the default handler for an unregistered type", () => {
        const registry = QuestionTypeRegistry.createDefault();
        expect(registry.get("MissingType")).toBeUndefined();
        const handler = registry.getOrDefault("MissingType");
        expect(handler.type).toBe("SA");
    });
    it("allows registering a custom exporter that overrides an existing format", () => {
        const registry = ExporterRegistry.createDefault();
        const custom = new CustomExporter();
        registry.register(custom);
        expect(registry.get("html")).toBe(custom);
        expect(registry.export([], "html")).toBe("CUSTOM EXPORT");
    });
    it("facade dispatches exportQuestions through an injected custom exporter registry", () => {
        const registry = new ExporterRegistry();
        registry.register(new CustomExporter());
        const core = new PhysicsCore(undefined, undefined, registry);
        expect(core.exportQuestions([], "html")).toBe("CUSTOM EXPORT");
    });
    it("facade uses the injected evaluator and parser collaborators", () => {
        const parser = new SpecificationParser();
        const evaluator = new ExpressionEvaluator();
        const core = new PhysicsCore(parser, evaluator);
        const spec = core.parseSpecification(CUSTOM_SPEC);
        expect(spec.templates[0]?.question_type).toBe("CustomType");
    });
    it("assembles MCQ choices end-to-end via an injected custom ResponseFormatStrategy", () => {
        const registry = QuestionTypeRegistry.createDefault();
        registry.register(new NumericCustomHandler());
        const distractorGenerator = UniversalDistractorGenerator.createDefault();
        distractorGenerator.register(new CustomDistractorStrategy());
        const core = new PhysicsCore(undefined, undefined, undefined, undefined, new SeededRandomGenerator(1), registry, undefined, undefined, distractorGenerator);
        const spec = core.parseSpecification(CUSTOM_MCQ_SPEC);
        const q = core.generateQuestion(spec, {templateIds: ["Q1"], responseMode: "mcq"});
        expect(q).not.toBeNull();
        expect(q?.question_type).toBe("CustomMcq");
        expect(q?.response_mode).toBe("mcq");
        expect(q?.choices).toBeDefined();
        expect(q?.choices?.length).toBe(4);
        expect(q?.choices).toContain("10");
        expect(q?.correct_choice_index).toBeDefined();
        expect(q?.choices?.[q?.correct_choice_index ?? -1]).toBe("10");
        for (const d of ["7", "8", "9"]) {
            expect(q?.choices).toContain(d);
        }
        const unique = new Set(q?.choices);
        expect(unique.size).toBe(q?.choices?.length);
    });
    it("returns a free-response question for the custom type when responseMode is 'frq'", () => {
        const registry = QuestionTypeRegistry.createDefault();
        registry.register(new NumericCustomHandler());
        const distractorGenerator = UniversalDistractorGenerator.createDefault();
        distractorGenerator.register(new CustomDistractorStrategy());
        const core = new PhysicsCore(undefined, undefined, undefined, undefined, new SeededRandomGenerator(1), registry, undefined, undefined, distractorGenerator);
        const spec = core.parseSpecification(CUSTOM_MCQ_SPEC);
        const q = core.generateQuestion(spec, {templateIds: ["Q1"], responseMode: "frq"});
        expect(q).not.toBeNull();
        expect(q?.response_mode).toBe("frq");
        expect(q?.choices).toBeUndefined();
        expect(q?.answer).toBe("10");
    });
    it("exposes the injected distractor generator and mcq assembler through the facade", () => {
        const distractorGenerator = UniversalDistractorGenerator.createDefault();
        const core = new PhysicsCore(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, distractorGenerator);
        expect(core.getDistractorGenerator()).toBe(distractorGenerator);
        expect(core.getMcqAssembler()).toBeDefined();
        expect(core.getGrader()).toBeDefined();
    });
});
