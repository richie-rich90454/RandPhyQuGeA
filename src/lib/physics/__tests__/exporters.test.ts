import {describe, it, expect} from "vitest";
import {ExporterRegistry} from "../exporters/ExporterRegistry";
import {HtmlExporter} from "../exporters/HtmlExporter";
import {CsvExporter} from "../exporters/CsvExporter";
import {LatexExporter} from "../exporters/LatexExporter";
import {MarkdownExporter} from "../exporters/MarkdownExporter";
import {PdfExporter} from "../exporters/PdfExporter";
import {TextExporter} from "../exporters/TextExporter";
import type {GeneratedQuestion, ExportFormat} from "../types";
import type {Exporter} from "../contracts";
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
describe("ExporterRegistry and exporters", () => {
    it("exports HTML containing DOCTYPE, KaTeX, and Question 1", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "html");
        expect(out).toContain("<!DOCTYPE html>");
        expect(out).toContain("katex");
        expect(out).toContain("Question 1");
        expect(out.length).toBeGreaterThan(0);
    });
    it("exports Markdown containing the heading and Answer label", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "markdown");
        expect(out).toContain("# Physics Questions");
        expect(out).toContain("**Answer:**");
        expect(out.length).toBeGreaterThan(0);
    });
    it("exports Text containing the header and Answer label", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "text");
        expect(out).toContain("PHYSICS QUESTIONS");
        expect(out).toContain("Answer:");
        expect(out.length).toBeGreaterThan(0);
    });
    it("exports JSON as a parseable array with id, topic_id, text", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "json");
        expect(out.startsWith("[")).toBe(true);
        const parsed = JSON.parse(out);
        expect(parsed[0].id).toBe("q1");
        expect(parsed[0].topic_id).toBe("T1");
        expect(parsed[0].text).toBe("What is 2+2?");
    });
    it("exports CSV starting with the header row", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "csv");
        expect(out.startsWith("id,topic_id,skill_id,type,difficulty")).toBe(true);
        expect(out).toContain("What is 2+2?");
    });
    it("exports LaTeX containing documentclass and begin{questions}", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "latex");
        expect(out).toContain("\\documentclass");
        expect(out).toContain("\\begin{questions}");
    });
    it("exports PDF containing @page and page-break-inside", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([sample], "pdf");
        expect(out).toContain("@page");
        expect(out).toContain("page-break-inside");
    });
    it("returns non-empty strings for every format", () => {
        const registry = ExporterRegistry.createDefault();
        const formats: ExportFormat[] = ["html", "markdown", "text", "json", "csv", "latex", "pdf"];
        for (const f of formats) {
            expect(registry.export([sample], f).length).toBeGreaterThan(0);
        }
    });
    it("get returns undefined for an unregistered format", () => {
        const registry = new ExporterRegistry();
        expect(registry.get("html")).toBeUndefined();
    });
    it("throws when exporting an unregistered format", () => {
        const registry = new ExporterRegistry();
        expect(() => registry.export([], "html")).toThrow("No exporter registered for format: html");
    });
    it("HtmlExporter escapes HTML special characters", () => {
        const exporter = new HtmlExporter();
        const out = exporter.export([{...sample, text: "<b>x</b>"}]);
        expect(out).toContain("&lt;b&gt;x&lt;/b&gt;");
    });
    it("register overrides an existing exporter (open-closed)", () => {
        const registry = ExporterRegistry.createDefault();
        const custom: Exporter = {format: "html", export: () => "CUSTOM EXPORT"};
        registry.register(custom);
        expect(registry.get("html")).toBe(custom);
        expect(registry.export([], "html")).toBe("CUSTOM EXPORT");
    });
});
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
const specialChars: GeneratedQuestion = {
    id: "q3",
    topic_id: "T3",
    skill_id: "S3",
    question_type: "MC",
    difficulty: 3,
    text: "Quote \"comma, semicolon; newline\nbackslash\\ percent% dollar$ hash# underscore_ brace{tilde~ caret^'",
    answer: '<safe> & "ok"',
    choices: ['"a,b"', "<c>", "&d&", "100%"],
    response_mode: "frq",
    solution_text: 'see "docs" & <appendix>',
    solution_latex: "",
    variables: {},
};
describe("Exporter edge cases", () => {
    it("CsvExporter renders only the header for an empty list", () => {
        const exporter = new CsvExporter();
        expect(exporter.export([])).toBe("id,topic_id,skill_id,type,difficulty,text,answer,solution,solution_latex,choices,correct_choice_index,response_mode\n");
    });
    it("CsvExporter renders an empty choices column when choices are undefined", () => {
        const exporter = new CsvExporter();
        const out = exporter.export([noChoices]);
        expect(out).toContain('"What is the speed?"');
        expect(out).toContain(',"","","frq"\n');
        expect(out).not.toContain(" | ");
    });
    it("CsvExporter escapes embedded quotes and preserves commas in fields", () => {
        const exporter = new CsvExporter();
        const out = exporter.export([specialChars]);
        expect(out).toContain('""');
        expect(out).toContain("comma, semicolon");
        expect(out).toContain(" | ");
    });
    it("LatexExporter renders the preamble for an empty list", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([]);
        expect(out).toContain("\\documentclass");
        expect(out).toContain("\\begin{questions}");
        expect(out).toContain("\\end{document}");
    });
    it("LatexExporter skips the choices block when choices are undefined", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([noChoices]);
        expect(out).not.toContain("\\begin{choices}");
        expect(out).toContain("\\begin{solution}");
    });
    it("LatexExporter escapes special LaTeX characters", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([specialChars]);
        expect(out).toContain("textbackslash");
        expect(out).toContain("\\&");
        expect(out).toContain("\\%");
        expect(out).toContain("\\$");
        expect(out).toContain("\\#");
        expect(out).toContain("\\_");
        expect(out).toContain("\\textasciitilde{}");
        expect(out).toContain("\\textasciicircum{}");
    });
    it("MarkdownExporter renders only the title for an empty list", () => {
        const exporter = new MarkdownExporter();
        expect(exporter.export([])).toBe("# Physics Questions\n\n");
    });
    it("MarkdownExporter omits the bullet list when choices are undefined", () => {
        const exporter = new MarkdownExporter();
        const out = exporter.export([noChoices]);
        expect(out).toContain("## Question 1");
        expect(out).toContain("**Answer:** 5");
        expect(out).not.toContain("- ");
    });
    it("MarkdownExporter renders the bullet list for multiple choices", () => {
        const exporter = new MarkdownExporter();
        const out = exporter.export([sample, noChoices]);
        expect(out).toContain("- 3\n- 4\n- 5");
        expect(out).toContain("## Question 2");
    });
    it("PdfExporter renders the document shell for an empty list", () => {
        const exporter = new PdfExporter();
        const out = exporter.export([]);
        expect(out).toContain("<!DOCTYPE html>");
        expect(out).toContain("</body></html>");
        expect(out).not.toContain('class="question"');
    });
    it("PdfExporter skips the choices div when choices are undefined", () => {
        const exporter = new PdfExporter();
        const out = exporter.export([noChoices]);
        expect(out).not.toContain('class="choices"');
        expect(out).toContain("Answer: 5");
    });
    it("PdfExporter escapes HTML special characters", () => {
        const exporter = new PdfExporter();
        const out = exporter.export([specialChars]);
        expect(out).toContain("&lt;safe&gt;");
        expect(out).toContain("&amp;");
        expect(out).toContain("&quot;");
        expect(out).toContain("&#39;");
    });
    it("TextExporter renders only the header for an empty list", () => {
        const exporter = new TextExporter();
        expect(exporter.export([])).toBe("PHYSICS QUESTIONS\n=================\n\n");
    });
    it("TextExporter omits the lettered choices when choices are undefined", () => {
        const exporter = new TextExporter();
        const out = exporter.export([noChoices]);
        expect(out).toContain("Question 1:\n");
        expect(out).toContain("Answer: 5");
        expect(out).not.toContain("A)");
    });
    it("TextExporter renders lettered choices for multiple-choice questions", () => {
        const exporter = new TextExporter();
        const out = exporter.export([sample]);
        expect(out).toContain("A) 3\n");
        expect(out).toContain("B) 4\n");
        expect(out).toContain("C) 5\n");
    });
    it("every exporter handles a multi-question batch without choices", () => {
        const registry = ExporterRegistry.createDefault();
        const formats: ExportFormat[] = ["html", "markdown", "text", "pdf", "csv", "latex"];
        for (const f of formats) {
            const out = registry.export([noChoices, noChoices], f);
            expect(out.length).toBeGreaterThan(0);
        }
    });
    it("HtmlExporter does not wrap plain text solution in $$ when solution_latex is empty", () => {
        const exporter = new HtmlExporter();
        const out = exporter.export([{...noChoices, solution_latex: ""}]);
        expect(out).toContain('<div class="solution">Solution: v=d/t</div>');
        expect(out).not.toContain("$$v=d/t$$");
    });
    it("PdfExporter does not wrap plain text solution in $$ when solution_latex is empty", () => {
        const exporter = new PdfExporter();
        const out = exporter.export([{...noChoices, solution_latex: ""}]);
        expect(out).toContain('<div class="solution">Solution: v=d/t</div>');
        expect(out).not.toContain("$$v=d/t$$");
    });
    it("LatexExporter falls back to escaped solution_text when solution_latex is empty", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([{...noChoices, solution_latex: ""}]);
        expect(out).toContain("\\begin{solution}");
        expect(out).toContain("v=d/t");
        expect(out).not.toContain("$$v=d/t$$");
    });
    it("CsvExporter includes correct_choice_index column when present (task 5.16 bug 1)", () => {
        const exporter = new CsvExporter();
        const out = exporter.export([{...sample, correct_choice_index: 1, response_mode: "mcq"}]);
        expect(out).toContain("correct_choice_index");
        const lines = out.trim().split("\n");
        const headerCols = lines[0]!.split(",");
        const dataCols = lines[1]!.split(",");
        const cciHeaderIdx = headerCols.indexOf("correct_choice_index");
        expect(cciHeaderIdx).toBeGreaterThan(-1);
        expect(dataCols[cciHeaderIdx]).toBe('"1"');
        const rmIdx = headerCols.indexOf("response_mode");
        expect(dataCols[rmIdx]).toBe('"mcq"');
    });
    it("CsvExporter emits empty correct_choice_index when undefined (task 5.16 bug 1)", () => {
        const exporter = new CsvExporter();
        const out = exporter.export([noChoices]);
        const lines = out.trim().split("\n");
        const headerCols = lines[0]!.split(",");
        const dataCols = lines[1]!.split(",");
        const cciHeaderIdx = headerCols.indexOf("correct_choice_index");
        expect(dataCols[cciHeaderIdx]).toBe('""');
    });
    it("JsonExporter includes response_mode in output (task 5.16 bug 2, preventive fix)", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([{...sample, response_mode: "mcq"}], "json");
        const parsed = JSON.parse(out);
        expect(parsed[0].response_mode).toBe("mcq");
    });
    it("JsonExporter includes response_mode for frq questions (task 5.16 bug 2, preventive fix)", () => {
        const registry = ExporterRegistry.createDefault();
        const out = registry.export([noChoices], "json");
        const parsed = JSON.parse(out);
        expect(parsed[0].response_mode).toBe("frq");
    });
    it("LatexExporter escapes backslash without mangling textbackslash braces (task 5.16 bug 3)", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([{...sample, text: "a\\b", solution_text: "", solution_latex: ""}]);
        expect(out).toContain("\\textbackslash{}");
        expect(out).not.toContain("\\textbackslash\\{\\}");
    });
    it("LatexExporter single-pass escape does not double-escape added backslashes (task 5.16 bug 3)", () => {
        const exporter = new LatexExporter();
        const out = exporter.export([{...sample, text: "100% & x_1", solution_text: "", solution_latex: ""}]);
        expect(out).toContain("\\%");
        expect(out).toContain("\\&");
        expect(out).toContain("\\_");
        expect(out).not.toContain("\\textbackslash{}%");
    });
});
