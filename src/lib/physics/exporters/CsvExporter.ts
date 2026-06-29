import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions to CSV with one row per question. */
export class CsvExporter implements Exporter {
	public readonly format: ExportFormat = 'csv';
	public export(questions: GeneratedQuestion[]): string {
		const parts: string[] = [];
		parts.push('id,topic_id,skill_id,type,difficulty,text,answer,solution,solution_latex,choices\n');
		for (const q of questions) {
			const choices = q.choices !== undefined ? q.choices.join(' | ') : '';
			const row: string[] = [
				`"${q.id}"`,
				`"${q.topic_id}"`,
				`"${q.skill_id}"`,
				`"${q.question_type}"`,
				`${q.difficulty}`,
				`"${this.escapeCsvField(q.text)}"`,
				`"${this.escapeCsvField(q.answer)}"`,
				`"${this.escapeCsvField(q.solution_text)}"`,
				`"${this.escapeCsvField(q.solution_latex)}"`,
				`"${this.escapeCsvField(choices)}"`
			];
			parts.push(row.join(',') + '\n');
		}
		return parts.join('');
	}
	private escapeCsvField(text: string): string {
		return text.replace(/"/g, '""');
	}
}
