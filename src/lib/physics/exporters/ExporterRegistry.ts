import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion} from '../types';
import {HtmlExporter} from './HtmlExporter';
import {MarkdownExporter} from './MarkdownExporter';
import {TextExporter} from './TextExporter';
import {PdfExporter} from './PdfExporter';
import {JsonExporter} from './JsonExporter';
import {CsvExporter} from './CsvExporter';
import {LatexExporter} from './LatexExporter';
/** Open-closed registry of exporters keyed by format. */
export class ExporterRegistry {
	private readonly exporters: Map<ExportFormat, Exporter>;
	public constructor() {
		this.exporters = new Map();
	}
	/** Register an exporter under its format key. */
	public register(exporter: Exporter): void {
		this.exporters.set(exporter.format, exporter);
	}
	/** Look up an exporter by format. */
	public get(format: ExportFormat): Exporter | undefined {
		return this.exporters.get(format);
	}
	/** Render questions in the given format; throws if no exporter is registered. */
	public export(questions: GeneratedQuestion[], format: ExportFormat): string {
		const exporter = this.exporters.get(format);
		if (exporter === undefined) {
			throw new Error(`No exporter registered for format: ${format}`);
		}
		return exporter.export(questions);
	}
	/** Build a registry pre-populated with all standard exporters. */
	public static createDefault(): ExporterRegistry {
		const registry = new ExporterRegistry();
		registry.register(new HtmlExporter());
		registry.register(new MarkdownExporter());
		registry.register(new TextExporter());
		registry.register(new PdfExporter());
		registry.register(new JsonExporter());
		registry.register(new CsvExporter());
		registry.register(new LatexExporter());
		return registry;
	}
}
