import {describe, it, expect} from "vitest";
import {AnkiExporter} from "../exporters/AnkiExporter";
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
describe("AnkiExporter", () => {
    it("renders only the header row for an empty list", () => {
        const exporter = new AnkiExporter();
        expect(exporter.export([])).toBe("Front\tBack\tTags\n");
    });
    it("exports a single question with Front, Back, and Tags columns", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([noChoices]);
        const lines = out.split("\n");
        expect(lines[0]).toBe("Front\tBack\tTags");
        expect(lines[1]).toBe("What is the speed?\tAnswer: 5<br>Solution: v=d/t\tT2 S2");
        expect(lines[2]).toBe("");
    });
    it("renders lettered choices in the Front when choices are present (MCQ)", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([sample]);
        const front = out.split("\n")[1]?.split("\t")[0];
        expect(front).toBe("What is 2+2?<br>A) 3<br>B) 4<br>C) 5");
    });
    it("renders only the answer in Back when solution_text is empty", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([{...sample, solution_text: "", choices: undefined}]);
        const back = out.split("\n")[1]?.split("\t")[1];
        expect(back).toBe("4");
    });
    it("escapes embedded tabs and newlines so each card stays on one line", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([{...noChoices, text: "line1\nline2\ttabbed", solution_text: "s1\ns2"}]);
        const lines = out.split("\n");
        expect(lines.length).toBe(3);
        const front = lines[1]?.split("\t")[0];
        expect(front).toBe("line1<br>line2 tabbed");
        const back = lines[1]?.split("\t")[1];
        expect(back).toBe("Answer: 5<br>Solution: s1<br>s2");
    });
    it("exports multiple questions as multiple TSV rows", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([sample, noChoices]);
        const lines = out.split("\n");
        expect(lines.length).toBe(4);
        expect(lines[1]).toContain("What is 2+2?");
        expect(lines[2]).toContain("What is the speed?");
    });
    it("collapses internal whitespace in the Tags field", () => {
        const exporter = new AnkiExporter();
        const out = exporter.export([{...noChoices, topic_id: "T 2", skill_id: "S  2"}]);
        const tags = out.split("\n")[1]?.split("\t")[2];
        expect(tags).toBe("T 2 S 2");
    });
    it("is registered under the 'anki' format in ExporterRegistry.createDefault", () => {
        const registry = ExporterRegistry.createDefault();
        expect(registry.get("anki")).toBeInstanceOf(AnkiExporter);
        const out = registry.export([noChoices], "anki");
        expect(out).toContain("Front\tBack\tTags");
        expect(out).toContain("What is the speed?");
    });
});
