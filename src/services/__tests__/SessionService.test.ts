import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {SessionService} from "../SessionService";
import type {IAnalyticsService, IPhysicsService, GenerateOptions, SessionConfig, SessionSnapshot} from "../contracts";
import type {SessionSummary, WeakTopic} from "../contracts";
import type {ExportFormat, FormulaEntry, GeneratedQuestion, PracticeResult, QuestionType, Specification} from "../../types/models";
import type {StreakData} from "../streakService";
class MockPhysicsService implements IPhysicsService {
	public parseSpecification=vi.fn<(input: string) => Promise<Specification>>();
	public generateQuestion=vi.fn<(spec: Specification, options?: GenerateOptions) => Promise<GeneratedQuestion>>();
	public generateBatch=vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>();
	public generateUnique=vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>();
	public evaluate=vi.fn<(expression: string, variables: Record<string, unknown>) => Promise<number>>();
	public exportQuestions=vi.fn<(questions: GeneratedQuestion[], format: ExportFormat) => Promise<string>>();
	public getFormulaLibrary=vi.fn<() => Promise<FormulaEntry[]>>();
}
class MockAnalyticsService implements IAnalyticsService {
	public getStreak=vi.fn<(results: PracticeResult[]) => StreakData>();
	public getWeakTopics=vi.fn<(results: PracticeResult[], spec: Specification) => WeakTopic[]>();
	public getAccuracy=vi.fn<(results: PracticeResult[]) => number>();
	public getSessionSummary=vi.fn<(results: PracticeResult[]) => SessionSummary>();
}
function emptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeQuestion(overrides: Partial<GeneratedQuestion>={}): GeneratedQuestion {
	return {id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "42", response_mode: "frq", solution_text: "", solution_latex: "", variables: {}, ...overrides};
}
function makeMcQuestion(overrides: Partial<GeneratedQuestion>={}): GeneratedQuestion {
	return makeQuestion({id: "mc1", question_type: "MC", answer: "B", choices: ["A", "B", "C"], response_mode: "mcq", correct_choice_index: 1, ...overrides});
}
function makeConfig(overrides: Partial<SessionConfig>={}): SessionConfig {
	return {mode: "Single", questionCount: 1, ...overrides};
}
describe("SessionService", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
		localStorage.clear();
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		localStorage.clear();
	});
	describe("startSession", () => {
		it("generates questions and returns an active session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let question=makeQuestion();
			physics.generateBatch.mockResolvedValue([question]);
			let session=await service.startSession(emptySpec(), makeConfig());
			expect(physics.generateBatch).toHaveBeenCalledWith(emptySpec(), 1, undefined);
			expect(session.questions).toEqual([question]);
			expect(session.mode).toBe("Single");
			expect(session.isActive).toBe(true);
			expect(session.isFinished).toBe(false);
			expect(session.currentIndex).toBe(0);
			expect(session.results).toEqual([]);
			expect(session.questionStartTime).toBe(Date.now());
			expect(session.sessionStartTime).toBe(Date.now());
		});
		it("creates an empty question list when count is zero", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let session=await service.startSession(emptySpec(), makeConfig({questionCount: 0}));
			expect(physics.generateBatch).not.toHaveBeenCalled();
			expect(session.questions).toEqual([]);
		});
		it("forwards options to the physics service", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let options: GenerateOptions={topicId: "t1", skillId: "s1", minDifficulty: 1, maxDifficulty: 3};
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig({questionCount: 5, options}));
			expect(physics.generateBatch).toHaveBeenCalledWith(emptySpec(), 5, options);
		});
		it("shuffles questions when configured", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let questions=[makeQuestion({id: "q1"}), makeQuestion({id: "q2"}), makeQuestion({id: "q3"})];
			physics.generateBatch.mockResolvedValue(questions);
			vi.spyOn(Math, "random").mockReturnValue(0.5);
			let session=await service.startSession(emptySpec(), makeConfig({questionCount: 3, shuffle: true}));
			expect(session.questions.map(q => q.id)).toEqual(["q1", "q3", "q2"]);
		});
	});
	describe("submitAnswer", () => {
		it("accepts a numerically equivalent answer within tolerance", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion({answer: "9.8"})]);
			await service.startSession(emptySpec(), makeConfig());
			let result=await service.submitAnswer("9.799");
			expect(result.is_correct).toBe(true);
		});
		it("rejects a numeric answer outside tolerance", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion({answer: "9.8"})]);
			await service.startSession(emptySpec(), makeConfig());
			let result=await service.submitAnswer("9.82");
			expect(result.is_correct).toBe(false);
		});
		it("compares text answers case-insensitively with trimming", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion({answer: "electron"})]);
			await service.startSession(emptySpec(), makeConfig());
			let result=await service.submitAnswer("  Electron ");
			expect(result.is_correct).toBe(true);
			expect(result.user_answer).toBe("  Electron ");
		});
		it("evaluates multiple-choice answers by choice index", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeMcQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			let correct=await service.submitAnswer("", 1);
			expect(correct.is_correct).toBe(true);
			expect(correct.user_answer).toBe("B");
			let wrong=await service.submitAnswer("", 0);
			expect(wrong.is_correct).toBe(false);
			expect(wrong.user_answer).toBe("A");
		});
		it("evaluates multiple-choice answers by matched text", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeMcQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			let result=await service.submitAnswer("b");
			expect(result.is_correct).toBe(true);
			expect(result.user_answer).toBe("b");
		});
		it("records elapsed time since the question started", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			vi.advanceTimersByTime(2500);
			let result=await service.submitAnswer("42");
			expect(result.time_taken_ms).toBe(2500);
		});
		it("throws when there is no session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			await expect(service.submitAnswer("x")).rejects.toThrow("No active session.");
		});
		it("throws when the session has finished", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			await service.finishSession();
			await expect(service.submitAnswer("x")).rejects.toThrow("Session is not active.");
		});
		it("throws when there is no current question", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			await service.startSession(emptySpec(), makeConfig({questionCount: 0}));
			await expect(service.submitAnswer("x")).rejects.toThrow("No current question.");
		});
	});
	describe("MCQ grading reachability across types and modes (task 5.7)", () => {
		function makeMcqForType(type: QuestionType, overrides: Partial<GeneratedQuestion>={}): GeneratedQuestion {
			return makeQuestion({id: "mcq-"+type, question_type: type, answer: "correct", choices: ["wrong1", "correct", "wrong2"], response_mode: "mcq", correct_choice_index: 1, ...overrides});
		}
		for (const type of ["MC", "SA", "TF", "FB", "NE"] as QuestionType[]) {
			it(`grades ${type} in Single mode by choice index when response_mode is mcq`, async () => {
				let physics=new MockPhysicsService();
				let analytics=new MockAnalyticsService();
				let service=new SessionService(physics, analytics);
				physics.generateBatch.mockResolvedValue([makeMcqForType(type)]);
				await service.startSession(emptySpec(), makeConfig({mode: "Single"}));
				let correct=await service.submitAnswer("", 1);
				expect(correct.is_correct).toBe(true);
				expect(correct.user_answer).toBe("correct");
				let wrong=await service.submitAnswer("", 0);
				expect(wrong.is_correct).toBe(false);
				expect(wrong.user_answer).toBe("wrong1");
			});
			it(`grades ${type} in Mental mode by choice index when response_mode is mcq`, async () => {
				let physics=new MockPhysicsService();
				let analytics=new MockAnalyticsService();
				let service=new SessionService(physics, analytics);
				physics.generateBatch.mockResolvedValue([makeMcqForType(type)]);
				await service.startSession(emptySpec(), makeConfig({mode: "Mental"}));
				let correct=await service.submitAnswer("", 1);
				expect(correct.is_correct).toBe(true);
				let wrong=await service.submitAnswer("", 0);
				expect(wrong.is_correct).toBe(false);
			});
		}
	});
	describe("advanceQuestion", () => {
		it("moves to the next question and resets the question timer", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion({id: "q1"}), makeQuestion({id: "q2"})]);
			let session=await service.startSession(emptySpec(), makeConfig({questionCount: 2}));
			await service.submitAnswer("42");
			vi.advanceTimersByTime(1000);
			let advanced=await service.advanceQuestion();
			expect(advanced).toBe(true);
			expect(session.currentIndex).toBe(1);
			expect(session.questionStartTime).toBe(Date.now());
		});
		it("returns false at the last question", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			expect(await service.advanceQuestion()).toBe(false);
		});
		it("returns false when there is no active session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			expect(await service.advanceQuestion()).toBe(false);
		});
	});
	describe("regenerateCurrentQuestionAs", () => {
		it("regenerates the current SA question as MC and preserves topic/skill/difficulty", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let original=makeQuestion({id: "q1", topic_id: "t1", skill_id: "s1", difficulty: 2});
			let regenerated=makeMcQuestion({id: "regen-mc", topic_id: "t1", skill_id: "s1", difficulty: 2});
			physics.generateBatch.mockResolvedValue([original]);
			physics.generateQuestion.mockResolvedValue(regenerated);
			let session=await service.startSession(emptySpec(), makeConfig());
			let result=await service.regenerateCurrentQuestionAs("MC");
			expect(physics.generateQuestion).toHaveBeenCalledWith(emptySpec(), {
				topicId: "t1",
				skillId: "s1",
				minDifficulty: 2,
				maxDifficulty: 2,
				questionType: "MC",
			});
			expect(result).toBe(regenerated);
			expect(session.questions[0]).toBe(regenerated);
			expect(session.currentIndex).toBe(0);
		});
		it("regenerates the current MC question as SA and preserves topic/skill/difficulty", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let original=makeMcQuestion({id: "mc1", topic_id: "t2", skill_id: "s2", difficulty: 3});
			let regenerated=makeQuestion({id: "regen-sa", topic_id: "t2", skill_id: "s2", difficulty: 3});
			physics.generateBatch.mockResolvedValue([original]);
			physics.generateQuestion.mockResolvedValue(regenerated);
			let session=await service.startSession(emptySpec(), makeConfig());
			let result=await service.regenerateCurrentQuestionAs("SA");
			expect(physics.generateQuestion).toHaveBeenCalledWith(emptySpec(), {
				topicId: "t2",
				skillId: "s2",
				minDifficulty: 3,
				maxDifficulty: 3,
				questionType: "SA",
			});
			expect(result).toBe(regenerated);
			expect(session.questions[0]).toBe(regenerated);
			expect(session.currentIndex).toBe(0);
		});
		it("throws when there is no active session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			await expect(service.regenerateCurrentQuestionAs("MC")).rejects.toThrow("No active session.");
		});
		it("throws when there is no current question", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([]);
			await service.startSession(emptySpec(), makeConfig({questionCount: 0}));
			await expect(service.regenerateCurrentQuestionAs("MC")).rejects.toThrow("No current question.");
		});
		it("resets questionStartTime after regeneration", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			physics.generateQuestion.mockResolvedValue(makeMcQuestion());
			let session=await service.startSession(emptySpec(), makeConfig());
			let startTime=session.questionStartTime;
			vi.advanceTimersByTime(1500);
			await service.regenerateCurrentQuestionAs("MC");
			expect(session.questionStartTime).toBeGreaterThan(startTime);
			expect(session.questionStartTime).toBe(Date.now());
		});
	});
	describe("finishSession", () => {
		it("marks the session finished and returns all results", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			let session=await service.startSession(emptySpec(), makeConfig());
			await service.submitAnswer("42");
			let results=await service.finishSession();
			expect(session.isActive).toBe(false);
			expect(session.isFinished).toBe(true);
			expect(session.sessionEndTime).toBe(Date.now());
			expect(results).toHaveLength(1);
		});
		it("returns an empty array when there is no session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let results=await service.finishSession();
			expect(results).toEqual([]);
		});
	});
	describe("resumeSession", () => {
		it("restores the session from a snapshot", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			let session=await service.startSession(emptySpec(), makeConfig());
			let snapshot: SessionSnapshot={session, createdAt: "2024-06-15T12:00:00.000Z"};
			let resumed=await service.resumeSession(snapshot);
			expect(resumed).toBe(session);
		});
	});
	describe("saveSessionSnapshot", () => {
		it("persists the current session to localStorage", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			let snapshot=await service.saveSessionSnapshot();
			expect(snapshot).not.toBeNull();
			expect(localStorage.getItem("physics-session-snapshot")).toBe(JSON.stringify(snapshot));
		});
		it("supports a custom storage key", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			let snapshot=await service.saveSessionSnapshot("custom-key");
			expect(localStorage.getItem("custom-key")).toBe(JSON.stringify(snapshot));
		});
		it("returns null when there is no session", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let snapshot=await service.saveSessionSnapshot();
			expect(snapshot).toBeNull();
		});
	});
	describe("clearSessionSnapshot", () => {
		it("removes a previously saved snapshot", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			await service.saveSessionSnapshot();
			expect(localStorage.getItem("physics-session-snapshot")).not.toBeNull();
			service.clearSessionSnapshot();
			expect(localStorage.getItem("physics-session-snapshot")).toBeNull();
		});
		it("supports a custom storage key", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			await service.saveSessionSnapshot("custom-key");
			service.clearSessionSnapshot("custom-key");
			expect(localStorage.getItem("custom-key")).toBeNull();
		});
	});
	describe("loadSessionSnapshot", () => {
		it("loads a previously saved snapshot", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			physics.generateBatch.mockResolvedValue([makeQuestion()]);
			await service.startSession(emptySpec(), makeConfig());
			let saved=await service.saveSessionSnapshot();
			let loaded=await new SessionService(physics, analytics).loadSessionSnapshot();
			expect(loaded).toEqual(saved);
		});
		it("returns null when no snapshot is stored", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			let loaded=await service.loadSessionSnapshot();
			expect(loaded).toBeNull();
		});
		it("returns null for invalid JSON", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			localStorage.setItem("physics-session-snapshot", "{bad");
			let loaded=await service.loadSessionSnapshot();
			expect(loaded).toBeNull();
		});
		it("returns null when the stored shape is invalid", async () => {
			let physics=new MockPhysicsService();
			let analytics=new MockAnalyticsService();
			let service=new SessionService(physics, analytics);
			localStorage.setItem("physics-session-snapshot", JSON.stringify({session: null, createdAt: "x"}));
			let loaded=await service.loadSessionSnapshot();
			expect(loaded).toBeNull();
		});
	});
});
