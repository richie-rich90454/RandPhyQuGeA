import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions to Markdown with MathJax-style math delimiters. */
export class MarkdownExporter implements Exporter {
	public readonly format: ExportFormat = 'markdown';
	public export(questions: GeneratedQuestion[]): string {
		const parts: string[] = [];
		parts.push('# Physics Questions\n\n');
		for (const [i, q] of questions.entries()) {
			parts.push(`## Question ${i + 1}\n\n`);
			parts.push(`${q.text}\n\n`);
			if (q.choices !== undefined) {
				for (const choice of q.choices) {
					parts.push(`- ${choice}\n`);
				}
				parts.push('\n');
			}
			parts.push(`**Answer:** ${q.answer}\n\n`);
			parts.push(`**Solution:** \\( ${q.solution_text}\\)\n\n`);
		}
		return parts.join('');
	}
}
