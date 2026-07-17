import {SpecificationParser} from "./SpecificationParser";
import {ExpressionEvaluator} from "./ExpressionEvaluator";
import {QuestionGenerator} from "./generator/QuestionGenerator";
import {QuestionTypeRegistry} from "./generator/QuestionTypeRegistry";
import {McqAssembler} from "./generator/McqAssembler";
import {UniversalDistractorGenerator} from "./generator/UniversalDistractorGenerator";
import {ExporterRegistry} from "./exporters/ExporterRegistry";
import {FormulaLibrary} from "./FormulaLibrary";
import {UniformRandomGenerator, SeededRandomGenerator} from "./random";
import {VariableGenerator} from "./random/VariableGenerator";
import {AnswerGrader} from "./grader/AnswerGrader";
import type {AnswerGraderLike, McqAssemblerLike, RandomGenerator, UniversalDistractorGeneratorLike} from "./contracts";
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat, QuestionFilter} from "./types";
/**
 * Facade wiring the physics-core collaborators and exposing the public API.
 *
 * Stores the evaluator, exporters, formula library, parser, a default
 * RandomGenerator, the optional question-type/variable generators, the
 * McqAssembler (for response_mode='mcq' decoration), and the AnswerGrader.
 * A fresh QuestionGenerator is created per generate call so each
 * Specification's templates are handled independently. Pass custom
 * collaborators to extend question/variable handling, distractor generation,
 * MCQ assembly, or grading without subclassing.
 */
export class PhysicsCore {
    private readonly parser: SpecificationParser;
    private readonly evaluator: ExpressionEvaluator;
    private readonly exporters: ExporterRegistry;
    private readonly formulaLibrary: FormulaLibrary;
    private readonly random: RandomGenerator;
    private readonly questionTypeRegistry?: QuestionTypeRegistry;
    private readonly variableGenerator?: VariableGenerator;
    private readonly mcqAssembler: McqAssemblerLike;
    private readonly distractorGenerator: UniversalDistractorGeneratorLike;
    private readonly grader: AnswerGraderLike;
    /**
     * Construct a core with optional collaborators. Any unspecified collaborator
     * defaults to its standard implementation (`createDefault()` / `new ...`).
     * When `questionTypeRegistry`/`variableGenerator` are omitted, the
     * QuestionGenerator creates its own defaults per call.
     */
    public constructor(
        parser?: SpecificationParser,
        evaluator?: ExpressionEvaluator,
        exporters?: ExporterRegistry,
        formulaLibrary?: FormulaLibrary,
        random?: RandomGenerator,
        questionTypeRegistry?: QuestionTypeRegistry,
        variableGenerator?: VariableGenerator,
        mcqAssembler?: McqAssemblerLike,
        distractorGenerator?: UniversalDistractorGeneratorLike,
        grader?: AnswerGraderLike,
    ) {
        this.parser = parser ?? new SpecificationParser();
        this.evaluator = evaluator ?? new ExpressionEvaluator();
        this.exporters = exporters ?? ExporterRegistry.createDefault();
        this.formulaLibrary = formulaLibrary ?? new FormulaLibrary();
        this.random = random ?? new UniformRandomGenerator();
        this.questionTypeRegistry = questionTypeRegistry;
        this.variableGenerator = variableGenerator;
        this.distractorGenerator = distractorGenerator ?? UniversalDistractorGenerator.createDefault();
        this.mcqAssembler = mcqAssembler ?? new McqAssembler(this.distractorGenerator instanceof UniversalDistractorGenerator ? this.distractorGenerator : undefined);
        this.grader = grader ?? new AnswerGrader();
    }
    /** Parse a spec text file into a Specification. */
    public parseSpecification(input: string): Specification {
        return this.parser.parse(input);
    }
    /** Generate a single question; returns null when no template matches the filter. */
    public generateQuestion(spec: Specification, filter?: QuestionFilter): GeneratedQuestion | null {
        const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random, this.questionTypeRegistry, this.variableGenerator, this.mcqAssembler);
        return generator.generate(filter);
    }
    /** Generate a batch of questions (may contain duplicates). */
    public generateBatch(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
        const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random, this.questionTypeRegistry, this.variableGenerator, this.mcqAssembler);
        return generator.generateBatch(count, filter);
    }
    /** Generate unique questions (no duplicate template ids). */
    public generateUnique(spec: Specification, count: number, filter?: QuestionFilter): GeneratedQuestion[] {
        const generator = new QuestionGenerator(spec.templates, this.evaluator, this.random, this.questionTypeRegistry, this.variableGenerator, this.mcqAssembler);
        return generator.generateUnique(count, filter);
    }
    /** Evaluate a mathematical expression against the supplied variables. */
    public evaluate(expression: string, variables: Record<string, unknown>): number {
        return this.evaluator.evaluate(expression, variables);
    }
    /** Export questions to a format string. */
    public exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): string {
        return this.exporters.export(questions, format);
    }
    /** Return the formula library entries. */
    public getFormulaLibrary(): FormulaEntry[] {
        return this.formulaLibrary.getAll();
    }
    /** Return the injected AnswerGrader for use by the UI layer. */
    public getGrader(): AnswerGraderLike {
        return this.grader;
    }
    /** Return the injected McqAssembler. */
    public getMcqAssembler(): McqAssemblerLike {
        return this.mcqAssembler;
    }
    /** Return the injected UniversalDistractorGenerator. */
    public getDistractorGenerator(): UniversalDistractorGeneratorLike {
        return this.distractorGenerator;
    }
    /** Create a new core with a seeded RNG for reproducibility, sharing the other collaborators (including any injected registries). */
    public createSeeded(seed: number): PhysicsCore {
        return new PhysicsCore(
            this.parser,
            this.evaluator,
            this.exporters,
            this.formulaLibrary,
            new SeededRandomGenerator(seed),
            this.questionTypeRegistry,
            this.variableGenerator,
            this.mcqAssembler,
            this.distractorGenerator,
            this.grader,
        );
    }
    /** Default core with entropy RNG and standard collaborators. Accepts no arguments; use the constructor to inject custom collaborators. */
    public static default(): PhysicsCore {
        return new PhysicsCore();
    }
}
