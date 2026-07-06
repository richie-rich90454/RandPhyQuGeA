/** Service-layer contracts for the OOP domain services. */
import type {ExportFormat, FormulaEntry, GeneratedQuestion, PracticeMode, PracticeResult, Specification} from "../types/models";
import type {ParseError} from "../lib/physics/types";
import type {StreakData} from "./streakService";
/** Filter options forwarded to question generation. */
export interface GenerateOptions {
	topicId?: string;
	skillId?: string;
	minDifficulty?: number;
	maxDifficulty?: number;
	questionType?: string;
	excludeIds?: string[];
	templateIds?: string[];
}
/** Configuration used when starting a new practice session. */
export interface SessionConfig {
	mode: PracticeMode;
	questionCount: number;
	options?: GenerateOptions;
	shuffle?: boolean;
}
/** In-flight practice session exposed by the session service. */
export interface Session {
	id: string;
	specification: Specification;
	questions: GeneratedQuestion[];
	mode: PracticeMode;
	currentIndex: number;
	results: PracticeResult[];
	isActive: boolean;
	isFinished: boolean;
	questionStartTime: number;
	sessionStartTime: number;
	sessionEndTime?: number;
}
/** Serializable snapshot of a session for persistence. */
export interface SessionSnapshot {
	session: Session;
	createdAt: string;
}
/** Metadata describing a single export format. */
export interface ExportMetadata {
	format: ExportFormat;
	extension: string;
	mimeType: string;
	label: string;
}
/** Topic that needs additional practice, ranked by accuracy. */
export interface WeakTopic {
	topicId: string;
	topicName: string;
	accuracy: number;
	attempts: number;
}
/** Aggregate summary for a completed session or result set. */
export interface SessionSummary {
	totalQuestions: number;
	correctCount: number;
	accuracy: number;
	totalTimeMs: number;
	averageTimeMs: number;
	mode: PracticeMode;
}
/** Result of validating a specification text. */
export interface SpecValidationResult {
	valid: boolean;
	errors: ParseError[];
}
/** Domain facade over the physics core: parsing, generation, evaluation, export, and formulas. */
export interface IPhysicsService {
	parseSpecification(input: string): Promise<Specification>;
	generateQuestion(spec: Specification, options?: GenerateOptions): Promise<GeneratedQuestion>;
	generateBatch(spec: Specification, count: number, options?: GenerateOptions): Promise<GeneratedQuestion[]>;
	generateUnique(spec: Specification, count: number, options?: GenerateOptions): Promise<GeneratedQuestion[]>;
	evaluate(expression: string, variables: Record<string, unknown>): Promise<number>;
	exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): Promise<string>;
	getFormulaLibrary(): Promise<FormulaEntry[]>;
}
/** Manages the lifecycle of a practice session and its persistence snapshots. */
export interface ISessionService {
	startSession(spec: Specification, config: SessionConfig): Promise<Session>;
	submitAnswer(answer: string, choiceIndex?: number): Promise<PracticeResult>;
	advanceQuestion(): Promise<boolean>;
	finishSession(): Promise<PracticeResult[]>;
	getSession(): Session | null;
	resumeSession(snapshot: SessionSnapshot): Promise<Session>;
	saveSessionSnapshot(key?: string): Promise<SessionSnapshot | null>;
	loadSessionSnapshot(key?: string): Promise<SessionSnapshot | null>;
}
/** Provides file export metadata and browser download helpers. */
export interface IExportService {
	getExportMetadata(format: ExportFormat): ExportMetadata;
	downloadText(filename: string, content: string, format?: ExportFormat): void;
	downloadBlob(filename: string, blob: Blob): void;
	buildWorksheetHtml(questions: GeneratedQuestion[], includeAnswerKey: boolean): string;
	printWorksheet(questions: GeneratedQuestion[], includeAnswerKey: boolean): void;
}
/** Computes streaks, weak topics, accuracy, and session summaries from practice results. */
export interface IAnalyticsService {
	getStreak(results: PracticeResult[]): StreakData;
	getWeakTopics(results: PracticeResult[], spec: Specification): WeakTopic[];
	getAccuracy(results: PracticeResult[]): number;
	getSessionSummary(results: PracticeResult[]): SessionSummary;
}
/** Loads, validates, and previews specification content. */
export interface ISpecService {
	loadSpec(input: string): Promise<Specification>;
	validateSpec(input: string): Promise<SpecValidationResult>;
	previewTemplate(spec: Specification, templateId: string, count: number): Promise<GeneratedQuestion[]>;
}
