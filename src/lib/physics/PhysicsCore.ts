import {SpecificationParser} from './SpecificationParser';
import {ExpressionEvaluator} from './ExpressionEvaluator';
import {QuestionGenerator} from './generator/QuestionGenerator';
import {ExporterRegistry} from './exporters/ExporterRegistry';
import {FormulaLibrary} from './FormulaLibrary';
import {UniformRandomGenerator, SeededRandomGenerator} from './random';
import type {RandomGenerator} from './contracts';
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat, QuestionFilter} from './types';
/**
 * Facade wiring the physics-core collaborators and exposing the public API.
 *
 * Stores the evaluator, exporters, formula library, parser, and a default
 * RandomGenerator. A fresh QuestionGenerator is created per generate call so
 * each Specification's templates are handled independently.
 */
export class PhysicsCore {
	private readonly parser: SpecificationParser;
	private readonly evaluator: ExpressionEvaluator;
	private readonly exporters: ExporterRegistry;
	private readonly formulaLibrary: FormulaLibrary;
	private readonly random: RandomGenerator;
	public constructor(parser?: SpecificationParser, evaluator?: ExpressionEvaluator, exporters?: ExporterRegistry, formulaLibrary?: FormulaLibrary, random?: RandomGenerator) {
		this.parser = parser ?? new SpecificationParser();
		this.evaluator = evaluator ?? new ExpressionEvaluator();
		this.exporters = exporters ?? ExporterRegistry.createDefault();
		this.formulaLibrary = formulaLibrary ?? new FormulaLibrary();
		this.random = random ?? new UniformRandomGenerator();
	}
	/** Parse a spec text file into a Specification. */
	public parseSpecification(input: string): Specification {
		return this.parser.parse(input);
	}
	/** Generate a single question; returns null when no template matches the filter. */
	public generateQuestion(spec: Specification, filter?: QuestionFilter): GeneratedQuestion | null {
		const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random);
		return generator.generate(filter);
	}
	/** Generate a batch of questions (may contain duplicates). */
	public generateBatch(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random);
		return generator.generateBatch(count, filter);
	}
	/** Generate unique questions (no duplicate template ids). */
	public generateUnique(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random);
		return generator.generateUnique(count, filter);
	}
	/** Export questions to a format string. */
	public exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): string {
		return this.exporters.export(questions, format);
	}
	/** Return the formula library entries. */
	public getFormulaLibrary(): FormulaEntry[] {
		return this.formulaLibrary.getAll();
	}
	/** Create a new core with a seeded RNG for reproducibility, sharing the other collaborators. */
	public createSeeded(seed: number): PhysicsCore {
		return new PhysicsCore(this.parser, this.evaluator, this.exporters, this.formulaLibrary, new SeededRandomGenerator(seed));
	}
	/** Default core with entropy RNG and standard collaborators. */
	public static default(): PhysicsCore {
		return new PhysicsCore();
	}
}
