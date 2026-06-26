import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions to plain text suitable for terminals or simple viewers. */
export class TextExporter implements Exporter {
	public readonly format: ExportFormat = 'text';
	public export(questions: GeneratedQuestion[]): string {
		const parts: string[] = [];
		parts.push('PHYSICS QUESTIONS\n');
		parts.push('=================\n\n');
		for (const [i, q] of questions.entries()) {
			parts.push(`Question ${i + 1}:\n`);
			parts.push(`${q.text}\n`);
			if (q.choices !== undefined) {
				for (const [j, choice] of q.choices.entries()) {
					const letter = String.fromCharCode('A'.charCodeAt(0) + j);
					parts.push(`  ${letter}) ${choice}\n`);
				}
			}
			parts.push(`Answer: ${q.answer}\n`);
			parts.push(`Solution: ${q.solution_text}\n\n`);
		}
		return parts.join('');
	}
}
