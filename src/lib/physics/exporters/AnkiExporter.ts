import type {Exporter} from "../contracts";
import type {ExportFormat, GeneratedQuestion} from "../types";
/** Exports questions to an Anki-importable TSV (tab-separated) with Front, Back, and Tags columns. Field content is HTML-friendly (Anki renders HTML in card fields); embedded tabs and newlines are escaped so each card stays on a single line. */
export class AnkiExporter implements Exporter {
    public readonly format: ExportFormat = "anki";
    public export(questions: GeneratedQuestion[]): string {
        const lines: string[] = [];
        lines.push("Front\tBack\tTags");
        for (const q of questions) {
            const front = this.escape(this.renderFront(q));
            const back = this.escape(this.renderBack(q));
            const tags = this.escapeTags(`${q.topic_id} ${q.skill_id}`);
            lines.push(`${front}\t${back}\t${tags}`);
        }
        return lines.join("\n") + "\n";
    }
    /** Build the Front face: the question text, followed by lettered choices when the question carries an MCQ choice list. */
    private renderFront(q: GeneratedQuestion): string {
        let front = q.text;
        if (q.choices !== undefined && q.choices.length > 0) {
            const listed = q.choices
                .map((choice, i) => {
                    const letter = String.fromCharCode("A".charCodeAt(0) + i);
                    return `${letter}) ${choice}`;
                })
                .join("<br>");
            front = `${q.text}<br>${listed}`;
        }
        return front;
    }
    /** Build the Back face: the answer, optionally followed by the worked solution. */
    private renderBack(q: GeneratedQuestion): string {
        if (q.solution_text.length > 0) {
            return `Answer: ${q.answer}<br>Solution: ${q.solution_text}`;
        }
        return q.answer;
    }
    /** Escape a field value for a single TSV line: tabs become spaces and newlines become `<br>` (Anki renders HTML). */
    private escape(text: string): string {
        return text.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
    }
    /** Collapse internal whitespace in the Tags field so each tag remains a single token. */
    private escapeTags(text: string): string {
        return text.replace(/\s+/g, " ").trim();
    }
}
