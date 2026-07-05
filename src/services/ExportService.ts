/** Browser-safe export service with centralized format metadata. */
import type {IExportService, ExportMetadata} from "./contracts";
import type {ExportFormat} from "../types/models";
let EXPORT_REGISTRY: Record<ExportFormat, ExportMetadata> = {
	html: {format: "html", extension: ".html", mimeType: "text/html", label: "HTML"},
	pdf: {format: "pdf", extension: ".pdf", mimeType: "text/html", label: "PDF"},
	markdown: {format: "markdown", extension: ".md", mimeType: "text/markdown", label: "Markdown"},
	text: {format: "text", extension: ".txt", mimeType: "text/plain", label: "Plain Text"},
	json: {format: "json", extension: ".json", mimeType: "application/json", label: "JSON"},
	csv: {format: "csv", extension: ".csv", mimeType: "text/csv", label: "CSV"},
	latex: {format: "latex", extension: ".tex", mimeType: "application/x-latex", label: "LaTeX"},
};
export class ExportService implements IExportService {
	public getExportMetadata(format: ExportFormat): ExportMetadata {
		return EXPORT_REGISTRY[format];
	}
	public downloadText(filename: string, content: string, format?: ExportFormat): void {
		let metadata: ExportMetadata|undefined;
		if (format) {
			metadata = this.getExportMetadata(format);
		}
		let mimeType = metadata?.mimeType ?? "text/plain";
		let blob = new Blob([content], {type: mimeType});
		let finalName = metadata ? this.ensureExtension(filename, metadata.extension) : filename;
		this.downloadBlob(finalName, blob);
	}
	public downloadBlob(filename: string, blob: Blob): void {
		let url = URL.createObjectURL(blob);
		let anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}
	private ensureExtension(filename: string, extension: string): string {
		if (filename.toLowerCase().endsWith(extension.toLowerCase())) {
			return filename;
		}
		return filename + extension;
	}
}
