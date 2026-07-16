import type {Exporter} from "../contracts";
import type {ExportFormat, GeneratedQuestion} from "../types";
/** Exports questions to a Quizlet-importable CSV with Term and Definition columns. Fields are RFC-4180-escaped: a field is wrapped in double quotes when it contains a comma, double quote, or newline, and embedded double quotes are doubled. */
export class QuizletExporter implements Exporter {
	public readonly format: ExportFormat = "quizlet";
	public export(questions: GeneratedQuestion[]): string {
		const lines: string[] = [];
		lines.push("Term,Definition");
		for (const q of questions) {
			const term = this.escape(this.renderTerm(q));
			const definition = this.escape(this.renderDefinition(q));
			lines.push(`${term},${definition}`);
		}
		return lines.join("\n") + "\n";
	}
	/** Build the Term (card front): the question text, followed by lettered choices when the question carries an MCQ choice list. */
	private renderTerm(q: GeneratedQuestion): string {
		if (q.choices !== undefined && q.choices.length > 0) {
			const listed = q.choices
				.map((choice, i) => {
					const letter = String.fromCharCode("A".charCodeAt(0) + i);
					return `${letter}) ${choice}`;
				})
				.join(" ");
			return `${q.text} ${listed}`;
		}
		return q.text;
	}
	/** Build the Definition (card back): the answer, optionally followed by the worked solution. */
	private renderDefinition(q: GeneratedQuestion): string {
		if (q.solution_text.length > 0) {
			return `Answer: ${q.answer}. Solution: ${q.solution_text}`;
		}
		return q.answer;
	}
	/** Escape a field per RFC-4180: quote fields that contain a comma, double quote, or newline, doubling any embedded quotes. */
	private escape(text: string): string {
		if (/[",\n\r]/.test(text)) {
			return `"${text.replace(/"/g, '""')}"`;
		}
		return text;
	}
}
