import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {ExportService} from "../ExportService";
import type {ExportFormat} from "../../types/models";
let EXPECTED_FORMATS: Record<ExportFormat, {extension: string; mimeType: string; label: string}> = {
	html: {extension: ".html", mimeType: "text/html", label: "HTML"},
	pdf: {extension: ".pdf", mimeType: "text/html", label: "PDF"},
	markdown: {extension: ".md", mimeType: "text/markdown", label: "Markdown"},
	text: {extension: ".txt", mimeType: "text/plain", label: "Plain Text"},
	json: {extension: ".json", mimeType: "application/json", label: "JSON"},
	csv: {extension: ".csv", mimeType: "text/csv", label: "CSV"},
	latex: {extension: ".tex", mimeType: "application/x-latex", label: "LaTeX"},
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
});
