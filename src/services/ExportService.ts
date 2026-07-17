/** Browser-safe export service with centralized format metadata. */
import katex from "katex";
import type {IExportService, ExportMetadata} from "./contracts";
import type {ExportFormat, GeneratedQuestion} from "../types/models";
const EXPORT_REGISTRY: Record<ExportFormat, ExportMetadata> = {
    html: {format: "html", extension: ".html", mimeType: "text/html", label: "HTML"},
    pdf: {format: "pdf", extension: ".pdf", mimeType: "text/html", label: "PDF"},
    markdown: {format: "markdown", extension: ".md", mimeType: "text/markdown", label: "Markdown"},
    text: {format: "text", extension: ".txt", mimeType: "text/plain", label: "Plain Text"},
    json: {format: "json", extension: ".json", mimeType: "application/json", label: "JSON"},
    csv: {format: "csv", extension: ".csv", mimeType: "text/csv", label: "CSV"},
    latex: {format: "latex", extension: ".tex", mimeType: "application/x-latex", label: "LaTeX"},
    anki: {format: "anki", extension: ".txt", mimeType: "text/tab-separated-values", label: "Anki"},
    quizlet: {format: "quizlet", extension: ".csv", mimeType: "text/csv", label: "Quizlet"},
};
export class ExportService implements IExportService {
    public getExportMetadata(format: ExportFormat): ExportMetadata {
        return EXPORT_REGISTRY[format];
    }
    public downloadText(filename: string, content: string, format?: ExportFormat): void {
        let metadata: ExportMetadata | undefined;
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
    public buildWorksheetHtml(questions: GeneratedQuestion[], includeAnswerKey: boolean): string {
        const parts: string[] = [];
        parts.push('<!DOCTYPE html>\n<html><head><meta charset="utf-8">');
        parts.push("<title>Physics Worksheet</title>");
        parts.push('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">');
        parts.push("<style>");
        parts.push('body{font-family:"Noto Sans",sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1e293b}');
        parts.push("h1{text-align:center;margin-bottom:8px}");
        parts.push(".worksheet-meta{text-align:center;color:#64748b;margin-bottom:24px;font-size:0.9rem}");
        parts.push(".question{margin:16px 0;padding:12px;border:1px solid #e2e8f0;border-radius:6px;page-break-inside:avoid}");
        parts.push(".question-number{font-weight:bold;margin-right:8px}");
        parts.push(".answer{color:#0DBC79;font-weight:bold;margin-top:8px}");
        parts.push(".solution{margin-top:6px;color:#64748b;font-size:0.9rem}");
        parts.push(".choices{margin-top:6px;margin-left:20px}");
        parts.push("@media print{body{padding:0}.question{border:none}}");
        parts.push("</style></head><body>");
        parts.push("<h1>Physics Worksheet</h1>");
        parts.push(`<div class="worksheet-meta">${questions.length} questions &middot; Generated ${new Date().toLocaleDateString()}</div>`);
        for (const [i, q] of questions.entries()) {
            parts.push('<div class="question">');
            parts.push(`<p><span class="question-number">${i + 1}.</span> ${this.renderMathInText(q.text)}</p>`);
            if (q.choices !== undefined) {
                parts.push('<div class="choices">');
                for (const [j, choice] of q.choices.entries()) {
                    parts.push(`<div>${String.fromCharCode(65 + j)}. ${this.renderMathInText(choice)}</div>`);
                }
                parts.push("</div>");
            }
            if (includeAnswerKey) {
                parts.push(`<div class="answer">Answer: ${this.renderMathInText(q.answer)}</div>`);
                if (q.solution_text) {
                    parts.push(`<div class="solution">Solution: ${this.renderMathInText(q.solution_text)}</div>`);
                }
            } else {
                parts.push('<div class="answer">&nbsp;</div>');
            }
            parts.push("</div>");
        }
        parts.push("</body></html>");
        return parts.join("");
    }
    public printWorksheet(questions: GeneratedQuestion[], includeAnswerKey: boolean): void {
        const html = this.buildWorksheetHtml(questions, includeAnswerKey);
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            throw new Error("Pop-up blocked. Please allow pop-ups to print the worksheet.");
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
    private escapeHtml(text: string): string {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    private renderMathInText(text: string): string {
        if (!text) return "";
        const pattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$]+?)\$|\\\$/g;
        let html = "";
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
            html += this.escapeHtml(text.slice(lastIndex, match.index));
            if (match[1] !== undefined) {
                html += katex.renderToString(match[1], {displayMode: true, throwOnError: false});
            } else if (match[2] !== undefined) {
                html += katex.renderToString(match[2], {displayMode: true, throwOnError: false});
            } else if (match[3] !== undefined) {
                html += katex.renderToString(match[3], {displayMode: false, throwOnError: false});
            } else if (match[4] !== undefined) {
                html += katex.renderToString(match[4], {displayMode: false, throwOnError: false});
            } else {
                html += "$";
            }
            lastIndex = pattern.lastIndex;
        }
        html += this.escapeHtml(text.slice(lastIndex));
        return html;
    }
}
