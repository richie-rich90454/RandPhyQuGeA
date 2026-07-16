import {describe, it, expect} from "vitest";
import {SpecificationParser} from "../SpecificationParser";
import {ParseException} from "../types";
const BASE_SPEC = [
	"[UNIT]",
	"Id: U1",
	"Name: Mechanics",
	"[TOPIC]",
	"Id: T1",
	"Name: Kinematics",
	"UnitId: U1",
	"[SKILL]",
	"Id: S1",
	"Name: Uniform Acceleration",
	"TopicId: T1",
	"[TEMPLATE]",
	"Id: Q1",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: ShortAnswer",
	"Difficulty: 1",
	"TextTemplate: What is {x}?",
	"AnswerExpression: x",
	"Var.x: Type=int;Min=1;Max=10",
].join("\n");
describe("SpecificationParser new sections", () => {
	it("parses [DIAGRAM], [HINT], and [UNIT_CONVERT] sections into the Specification collections", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(
			BASE_SPEC +
				"\n[DIAGRAM]\nId: D1\nTemplateId: Q1\nCaption: A diagram\nSvg: <svg></svg>\n[HINT]\nId: H1\nTemplateId: Q1\nText: Think about units\nDifficulty: 2\n[UNIT_CONVERT]\nId: C1\nFrom: m\nTo: cm\nFactor: 100\nOffset: 0\n",
		);
		expect(spec.diagrams?.length).toBe(1);
		const diagram = spec.diagrams?.[0];
		expect(diagram?.id).toBe("D1");
		expect(diagram?.template_id).toBe("Q1");
		expect(diagram?.caption).toBe("A diagram");
		expect(diagram?.svg).toBe("<svg></svg>");
		expect(spec.hints?.length).toBe(1);
		const hint = spec.hints?.[0];
		expect(hint?.id).toBe("H1");
		expect(hint?.template_id).toBe("Q1");
		expect(hint?.text).toBe("Think about units");
		expect(hint?.difficulty).toBe(2);
		expect(spec.unit_conversions?.length).toBe(1);
		const conversion = spec.unit_conversions?.[0];
		expect(conversion?.id).toBe("C1");
		expect(conversion?.from_unit).toBe("m");
		expect(conversion?.to_unit).toBe("cm");
		expect(conversion?.factor).toBe(100);
		expect(conversion?.offset).toBe(0);
	});
	it("parses multiple diagrams, hints, and conversions", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(
			BASE_SPEC +
				"\n[DIAGRAM]\nId: D1\nTemplateId: Q1\n[DIAGRAM]\nId: D2\nTemplateId: Q1\nSvg: <svg/>\n[HINT]\nId: H1\nTemplateId: Q1\n[HINT]\nId: H2\nTemplateId: Q1\n[UNIT_CONVERT]\nId: C1\nFrom: km\nTo: m\nFactor: 1000\n[UNIT_CONVERT]\nId: C2\nFrom: h\nTo: min\nFactor: 60\n",
		);
		expect(spec.diagrams?.length).toBe(2);
		expect(spec.hints?.length).toBe(2);
		expect(spec.unit_conversions?.length).toBe(2);
		expect(spec.diagrams?.[1]?.id).toBe("D2");
		expect(spec.unit_conversions?.[1]?.factor).toBe(60);
	});
	it("defaults diagram caption/svg, hint text/difficulty, and conversion offset when absent", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASE_SPEC + "\n[DIAGRAM]\nId: D1\nTemplateId: Q1\n[HINT]\nId: H1\nTemplateId: Q1\n[UNIT_CONVERT]\nId: C1\nFrom: m\nTo: cm\nFactor: 100\n");
		const diagram = spec.diagrams?.[0];
		expect(diagram?.caption).toBeUndefined();
		expect(diagram?.svg).toBe("");
		const hint = spec.hints?.[0];
		expect(hint?.text).toBe("");
		expect(hint?.difficulty).toBeUndefined();
		const conversion = spec.unit_conversions?.[0];
		expect(conversion?.offset).toBeUndefined();
	});
	it("returns empty arrays (not undefined) when no new sections are present", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASE_SPEC);
		expect(spec.diagrams).toEqual([]);
		expect(spec.hints).toEqual([]);
		expect(spec.unit_conversions).toEqual([]);
	});
	it("throws ParseException when a diagram references an unknown template", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[DIAGRAM]\nId: D1\nTemplateId: NOPE\n";
		expect(() => parser.parse(badSpec)).toThrow(ParseException);
		expect(() => parser.parse(badSpec)).toThrow("Diagram 'D1' references unknown Template 'NOPE'");
	});
	it("throws ParseException when a hint references an unknown template", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[HINT]\nId: H1\nTemplateId: NOPE\n";
		expect(() => parser.parse(badSpec)).toThrow(ParseException);
		expect(() => parser.parse(badSpec)).toThrow("Hint 'H1' references unknown Template 'NOPE'");
	});
	it("throws when a unit conversion is missing the From key", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[UNIT_CONVERT]\nId: C1\nTo: cm\nFactor: 100\n";
		expect(() => parser.parse(badSpec)).toThrow("missing required 'From' key");
	});
	it("throws when a unit conversion is missing the To key", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[UNIT_CONVERT]\nId: C1\nFrom: m\nFactor: 100\n";
		expect(() => parser.parse(badSpec)).toThrow("missing required 'To' key");
	});
	it("throws when a unit conversion is missing the Factor key", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[UNIT_CONVERT]\nId: C1\nFrom: m\nTo: cm\n";
		expect(() => parser.parse(badSpec)).toThrow("missing required 'Factor' key");
	});
	it("throws when a unit conversion has a non-numeric Factor", () => {
		const parser = new SpecificationParser();
		const badSpec = BASE_SPEC + "\n[UNIT_CONVERT]\nId: C1\nFrom: m\nTo: cm\nFactor: abc\n";
		expect(() => parser.parse(badSpec)).toThrow("non-numeric Factor 'abc'");
	});
	it("parses a conversion with a numeric Offset and skips a block missing Id", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASE_SPEC + "\n[UNIT_CONVERT]\nId: C1\nFrom: m\nTo: cm\nFactor: 100\nOffset: 5\n[UNIT_CONVERT]\nFrom: orphan\n");
		expect(spec.unit_conversions?.length).toBe(1);
		expect(spec.unit_conversions?.[0]?.offset).toBe(5);
	});
});
