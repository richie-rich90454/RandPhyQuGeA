/* eslint-disable @typescript-eslint/no-unused-vars -- facade throw-stubs; parameters are wired when collaborators land in Task 8 */
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat, QuestionFilter} from './types';
// @ts-expect-error: collaborator module not yet created (lands in Task 2)
import type {SpecificationParser} from './SpecificationParser';
// @ts-expect-error: collaborator module not yet created (lands in Task 3)
import type {ExpressionEvaluator} from './ExpressionEvaluator';
// @ts-expect-error: collaborator module not yet created (lands in Task 5)
import type {QuestionGenerator} from './generator/QuestionGenerator';
// @ts-expect-error: collaborator module not yet created (lands in Task 6)
import type {ExporterRegistry} from './exporters/ExporterRegistry';
// @ts-expect-error: collaborator module not yet created (lands in Task 7)
import type {FormulaLibrary} from './FormulaLibrary';
/**
 * Facade wiring the physics-core collaborators and exposing the public API.
 *
 * Internal collaborators are never reached into from outside the core.
 * Wiring of the default collaborator implementations is deferred to Task 8;
 * method bodies throw until then.
 */
export class PhysicsCore {
	public constructor(
		private readonly parser: SpecificationParser,
		private readonly evaluator: ExpressionEvaluator,
		private readonly generator: QuestionGenerator,
		private readonly exporters: ExporterRegistry,
		private readonly formulaLibrary: FormulaLibrary
	) {}
	/** Parse a spec text file into a Specification. */
	public parseSpecification(input: string): Specification {
		throw new Error('PhysicsCore.parseSpecification not wired until Task 8');
	}
	/** Generate a single question. */
	public generateQuestion(spec: Specification, filter?: QuestionFilter): GeneratedQuestion | null {
		throw new Error('PhysicsCore.generateQuestion not wired until Task 8');
	}
	/** Generate a batch of questions. */
	public generateBatch(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		throw new Error('PhysicsCore.generateBatch not wired until Task 8');
	}
	/** Generate unique questions (no duplicate templates). */
	public generateUnique(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		throw new Error('PhysicsCore.generateUnique not wired until Task 8');
	}
	/** Export questions to a format string. */
	public exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): string {
		throw new Error('PhysicsCore.exportQuestions not wired until Task 8');
	}
	/** Return the formula library entries. */
	public getFormulaLibrary(): FormulaEntry[] {
		throw new Error('PhysicsCore.getFormulaLibrary not wired until Task 8');
	}
	/** Create a new core with a seeded RNG for reproducibility. */
	public createSeeded(seed: number): PhysicsCore {
		throw new Error('PhysicsCore.createSeeded not wired until Task 8');
	}
	/** Default core with entropy RNG and standard collaborators. */
	public static default(): PhysicsCore {
		throw new Error('PhysicsCore.default() not wired until Task 8');
	}
}
