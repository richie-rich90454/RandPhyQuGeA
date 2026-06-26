import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions to a standalone HTML document with MathJax rendering. */
export class HtmlExporter implements Exporter {
	public readonly format: ExportFormat = 'html';
	public export(questions: GeneratedQuestion[]): string {
		const parts: string[] = [];
		parts.push('<!DOCTYPE html>\n');
		parts.push('<html><head><meta charset="utf-8"><title>Physics Questions</title>\n');
		parts.push('<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>\n');
		parts.push('<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}');
		parts.push('.question{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:5px}');
		parts.push('.answer{color:green;font-weight:bold}.solution{margin-top:10px;color:#555}</style>\n');
		parts.push('</head><body><h1>Physics Questions</h1>\n');
		for (const [i, q] of questions.entries()) {
			parts.push('<div class="question">\n');
			parts.push(`<p><strong>Question ${i + 1}:</strong> ${this.escapeHtml(q.text)}</p>\n`);
			parts.push(`<div class="answer">Answer: ${this.escapeHtml(q.answer)}</div>\n`);
			if (q.choices !== undefined) {
				parts.push('<div class="choices">\n');
				for (const choice of q.choices) {
					parts.push(`<div>- ${this.escapeHtml(choice)}</div>\n`);
				}
				parts.push('</div>\n');
			}
			parts.push(`<div class="solution">Solution: \\( ${this.escapeHtml(q.solution_text)} \\)</div>\n`);
			parts.push('</div>\n');
		}
		parts.push('</body></html>');
		return parts.join('');
	}
	private escapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}
}
