import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
/** Exports questions as a pretty-printed JSON array. */
export class JsonExporter implements Exporter {
	public readonly format: ExportFormat = 'json';
	public export(questions: GeneratedQuestion[]): string {
		return JSON.stringify(questions, null, 2);
	}
}
