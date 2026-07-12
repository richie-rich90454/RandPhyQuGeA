import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {ExportService} from "../ExportService";
import type {ExportFormat, GeneratedQuestion} from "../../types/models";
let EXPECTED_FORMATS: Record<ExportFormat, {extension: string; mimeType: string; label: string}> = {
	html: {extension: ".html", mimeType: "text/html", label: "HTML"},
	pdf: {extension: ".pdf", mimeType: "text/html", label: "PDF"},
	markdown: {extension: ".md", mimeType: "text/markdown", label: "Markdown"},
	text: {extension: ".txt", mimeType: "text/plain", label: "Plain Text"},
	json: {extension: ".json", mimeType: "application/json", label: "JSON"},
	csv: {extension: ".csv", mimeType: "text/csv", label: "CSV"},
	latex: {extension: ".tex", mimeType: "application/x-latex", label: "LaTeX"},
	anki: {extension: ".txt", mimeType: "text/tab-separated-values", label: "Anki"},
	quizlet: {extension: ".csv", mimeType: "text/csv", label: "Quizlet"},
};
describe("ExportService", () => {
	let createObjectURL: ReturnType<typeof vi.fn<(_blob: Blob) => string>>;
	let revokeObjectURL: ReturnType<typeof vi.fn<(_url: string) => void>>;
	let createElementSpy: ReturnType<typeof vi.spyOn>;
	let appendChildSpy: ReturnType<typeof vi.spyOn>;
	let removeChildSpy: ReturnType<typeof vi.spyOn>;
	let clickSpy: ReturnType<typeof vi.spyOn>;
	let anchor: HTMLAnchorElement;
	beforeEach(() => {
		createObjectURL = vi.fn<(_blob: Blob) => string>().mockReturnValue("blob:mock-url");
		revokeObjectURL = vi.fn<(_url: string) => void>();
		vi.stubGlobal("URL", {createObjectURL, revokeObjectURL});
		anchor = document.createElement("a");
		clickSpy = vi.spyOn(anchor, "click");
		createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(anchor);
		appendChildSpy = vi.spyOn(document.body, "appendChild");
		removeChildSpy = vi.spyOn(document.body, "removeChild");
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});
	describe("getExportMetadata", () => {
		it("returns metadata for every supported format", () => {
			let service = new ExportService();
			let formats: ExportFormat[] = ["html", "pdf", "markdown", "text", "json", "csv", "latex"];
			for (let format of formats) {
				let metadata = service.getExportMetadata(format);
				let expected = EXPECTED_FORMATS[format];
				expect(metadata.format).toBe(format);
				expect(metadata.extension).toBe(expected.extension);
				expect(metadata.mimeType).toBe(expected.mimeType);
				expect(metadata.label).toBe(expected.label);
			}
		});
	});
	describe("downloadText", () => {
		it("creates a blob with the format MIME type and downloads it", () => {
			let service = new ExportService();
			service.downloadText("questions", "content", "json");
			expect(createObjectURL).toHaveBeenCalledTimes(1);
			let blob = createObjectURL.mock.calls[0]![0];
			expect(blob).toBeInstanceOf(Blob);
			expect(blob.type).toBe("application/json");
			expect(anchor.download).toBe("questions.json");
			expect(anchor.href).toBe("blob:mock-url");
			expect(clickSpy).toHaveBeenCalledTimes(1);
			expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
		});
		it("appends the extension when the filename does not include it", () => {
			let service = new ExportService();
			service.downloadText("report", "content", "csv");
			expect(anchor.download).toBe("report.csv");
		});
		it("preserves the filename when the extension is already present", () => {
			let service = new ExportService();
			service.downloadText("report.csv", "content", "csv");
			expect(anchor.download).toBe("report.csv");
		});
		it("matches extensions case-insensitively", () => {
			let service = new ExportService();
			service.downloadText("Report.CSV", "content", "csv");
			expect(anchor.download).toBe("Report.CSV");
		});
		it("defaults to text/plain when no format is supplied", () => {
			let service = new ExportService();
			service.downloadText("notes", "content");
			let blob = createObjectURL.mock.calls[0]![0];
			expect(blob).toBeInstanceOf(Blob);
			expect(blob.type).toBe("text/plain");
			expect(anchor.download).toBe("notes");
		});
	});
	describe("downloadBlob", () => {
		it("creates an anchor, triggers download, and revokes the object URL", () => {
			let service = new ExportService();
			let blob = new Blob(["data"], {type: "text/plain"});
			service.downloadBlob("file.txt", blob);
			expect(createObjectURL).toHaveBeenCalledWith(blob);
			expect(createElementSpy).toHaveBeenCalledWith("a");
			expect(anchor.href).toBe("blob:mock-url");
			expect(anchor.download).toBe("file.txt");
			expect(appendChildSpy).toHaveBeenCalledWith(anchor);
			expect(clickSpy).toHaveBeenCalledTimes(1);
			expect(removeChildSpy).toHaveBeenCalledWith(anchor);
			expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
		});
	});
	describe("buildWorksheetHtml", () => {
		it("includes questions and answer key when requested", () => {
			let service = new ExportService();
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "What is 2+2?", answer: "4", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, choices: ["3", "4", "5"], response_mode: "frq"},
			];
			let html = service.buildWorksheetHtml(questions, true);
			expect(html).toContain("Physics Worksheet");
			expect(html).toContain("What is 2+2?");
			expect(html).toContain("Answer: 4");
			expect(html).toContain("A. 3");
		});
		it("omits answers when answer key is disabled", () => {
			let service = new ExportService();
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "What is 2+2?", answer: "4", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			let html = service.buildWorksheetHtml(questions, false);
			expect(html).toContain("What is 2+2?");
			expect(html).not.toContain("Answer: 4");
		});
		it("escapes HTML in question text", () => {
			let service = new ExportService();
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "<script>alert(1)</script>", answer: "&", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			let html = service.buildWorksheetHtml(questions, true);
			expect(html).toContain("&lt;script&gt;");
			expect(html).toContain("Answer: &amp;");
		});
		it("escapes dollar signs in answer text to prevent KaTeX auto-render treating them as math delimiters", () => {
			let service = new ExportService();
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "What is the cost?", answer: "$5 and $10", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			let html = service.buildWorksheetHtml(questions, true);
			expect(html).toContain("Answer: \\$5 and \\$10");
			expect(html).not.toContain("Answer: $5 and $10");
		});
	});
	describe("printWorksheet", () => {
		it("opens a print window, writes worksheet HTML, and calls print", () => {
			let service = new ExportService();
			let write = vi.fn<(html: string) => void>();
			let print = vi.fn<() => void>();
			let mockWindow = {document: {open: vi.fn<() => void>(), write, close: vi.fn<() => void>()}, focus: vi.fn<() => void>(), print} as unknown as Window;
			vi.stubGlobal("open", vi.fn<() => Window | null>().mockReturnValue(mockWindow));
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "What is 2+2?", answer: "4", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			service.printWorksheet(questions, true);
			expect(window.open).toHaveBeenCalledWith("", "_blank");
			expect(write).toHaveBeenCalledTimes(1);
			expect(print).toHaveBeenCalledTimes(1);
			vi.unstubAllGlobals();
		});
		it("throws when pop-up is blocked", () => {
			let service = new ExportService();
			vi.stubGlobal("open", vi.fn().mockReturnValue(null));
			let questions: GeneratedQuestion[] = [
				{id: "q1", text: "What is 2+2?", answer: "4", topic_id: "t1", skill_id: "s1", difficulty: 1, question_type: "SA", solution_text: "", solution_latex: "", variables: {}, response_mode: "frq"},
			];
			expect(() => service.printWorksheet(questions, true)).toThrow("Pop-up blocked");
			vi.unstubAllGlobals();
		});
	});
});
