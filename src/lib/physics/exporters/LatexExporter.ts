import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions to a LaTeX document using the exam class. */
export class LatexExporter implements Exporter {
	public readonly format: ExportFormat = 'latex';
	public export(questions: GeneratedQuestion[]): string {
		const parts: string[] = [];
		parts.push('\\documentclass[12pt]{exam}\n');
		parts.push('\\usepackage{amsmath}\n');
		parts.push('\\usepackage[margin=1in]{geometry}\n');
		parts.push('\\begin{document}\n');
		parts.push('\\title{Physics Questions}\n');
		parts.push('\\maketitle\n\n');
		parts.push('\\begin{questions}\n');
		for (const q of questions) {
			parts.push(`\\question[${q.difficulty}] ${this.escapeLatex(q.text)}\n`);
			if (q.choices !== undefined) {
				parts.push('\\begin{choices}\n');
				for (const choice of q.choices) {
					parts.push(`\\choice ${this.escapeLatex(choice)}\n`);
				}
				parts.push('\\end{choices}\n');
			}
			const solutionBody = q.solution_latex.trim().length > 0 ? q.solution_latex : this.escapeLatex(q.solution_text);
			parts.push(`\\begin{solution}\n${solutionBody}\n\\end{solution}\n\n`);
		}
		parts.push('\\end{questions}\n');
		parts.push('\\end{document}\n');
		return parts.join('');
	}
	private escapeLatex(text: string): string {
		return text
			.replace(/\\/g, '\\textbackslash{}')
			.replace(/&/g, '\\&')
			.replace(/%/g, '\\%')
			.replace(/\$/g, '\\$')
			.replace(/#/g, '\\#')
			.replace(/_/g, '\\_')
			.replace(/{/g, '\\{')
			.replace(/}/g, '\\}')
			.replace(/~/g, '\\textasciitilde{}')
			.replace(/\^/g, '\\textasciicircum{}');
	}
}
