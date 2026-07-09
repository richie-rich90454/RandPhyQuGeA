import {describe, it, expect} from "vitest";
import {QuizletExporter} from "../exporters/QuizletExporter";
import {ExporterRegistry} from "../exporters/ExporterRegistry";
import type {GeneratedQuestion} from "../types";
const sample: GeneratedQuestion = {
	id: "q1",
	topic_id: "T1",
	skill_id: "S1",
	question_type: "MC",
	difficulty: 2,
	text: "What is 2+2?",
	answer: "4",
	choices: ["3", "4", "5"],
	response_mode: "frq",
	solution_text: "2+2=4",
	solution_latex: "2+2=4",
	variables: {},
};
const noChoices: GeneratedQuestion = {
	id: "q2",
	topic_id: "T2",
	skill_id: "S2",
	question_type: "SA",
	difficulty: 1,
	text: "What is the speed?",
	answer: "5",
	response_mode: "frq",
	solution_text: "v=d/t",
	solution_latex: "v=\\frac{d}{t}",
	variables: {},
};
describe("QuizletExporter", () => {
	it("renders only the header row for an empty list", () => {
		const exporter = new QuizletExporter();
		expect(exporter.export([])).toBe("Term,Definition\n");
	});
	it("exports a single question as Term,Definition", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([noChoices]);
		const lines = out.split("\n");
		expect(lines[0]).toBe("Term,Definition");
		expect(lines[1]).toBe("What is the speed?,Answer: 5. Solution: v=d/t");
		expect(lines[2]).toBe("");
	});
	it("renders lettered choices in the Term when choices are present (MCQ)", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([sample]);
		expect(out).toContain("What is 2+2? A) 3 B) 4 C) 5");
		expect(out).toContain("Answer: 4. Solution: 2+2=4");
	});
	it("renders only the answer in Definition when solution_text is empty", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([{...sample, solution_text: "", choices: undefined}]);
		const lines = out.split("\n");
		expect(lines[1]).toBe("What is 2+2?,4");
	});
	it("quotes fields containing commas and doubles embedded quotes", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([{...noChoices, text: "a,b", answer: 'c"d', solution_text: ""}]);
		const lines = out.split("\n");
		expect(lines[1]).toBe('"a,b","c""d"');
	});
	it("quotes fields containing newlines", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([{...noChoices, text: "line1\nline2", solution_text: ""}]);
		expect(out).toBe('Term,Definition\n"line1\nline2",5\n');
	});
	it("exports multiple questions as multiple CSV rows", () => {
		const exporter = new QuizletExporter();
		const out = exporter.export([sample, noChoices]);
		const lines = out.split("\n");
		expect(lines.length).toBe(4);
		expect(lines[1]).toContain("What is 2+2?");
		expect(lines[2]).toContain("What is the speed?");
	});
	it("is registered under the 'quizlet' format in ExporterRegistry.createDefault", () => {
		const registry = ExporterRegistry.createDefault();
		expect(registry.get("quizlet")).toBeInstanceOf(QuizletExporter);
		const out = registry.export([noChoices], "quizlet");
		expect(out).toContain("Term,Definition");
		expect(out).toContain("What is the speed?");
	});
});
