import {describe, it, expect, beforeEach, vi} from "vitest";
import {renderHook, act, waitFor} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {ServiceProvider} from "../../components/providers/ServiceProvider";
import {ServiceContainer} from "../../services/container";
import {useMcqHotReconfig} from "../useMcqHotReconfig";
import {usePracticeStore} from "../../stores/practiceStore";
import {QUESTION_TYPES} from "../../types/models";
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService, Session, SessionSnapshot, SessionConfig, WeakTopic, SessionSummary, SpecValidationResult} from "../../services/contracts";
import type {GeneratedQuestion, PracticeResult, QuestionType, Specification, ExportFormat, FormulaEntry} from "../../types/models";
import type {StreakData} from "../../services/streakService";
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		difficulty: 1,
		text: "What is 2+2?",
		answer: "4",
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(overrides: Partial<Session> = {}): Session {
	const spec: Specification={units: [], topics: [], skills: [], templates: []};
	const question=makeQuestion();
	return {
		id: "s1",
		specification: spec,
		questions: [question],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: Date.now(),
		sessionStartTime: Date.now(),
		...overrides,
	};
}
function makeResult(overrides: Partial<PracticeResult> = {}): PracticeResult {
	return {
		id: "r1",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		is_correct: true,
		time_taken_ms: 1000,
		user_answer: "4",
		timestamp: new Date().toISOString(),
		mode: "Single",
		difficulty: 1,
		...overrides,
	};
}
class FakePhysicsService implements IPhysicsService {
	public async parseSpecification(): Promise<Specification> {
		return {units: [], topics: [], skills: [], templates: []};
	}
	public async generateQuestion(): Promise<GeneratedQuestion> {
		return makeQuestion();
	}
	public async generateBatch(): Promise<GeneratedQuestion[]> {
		return [];
	}
	public async generateUnique(): Promise<GeneratedQuestion[]> {
		return [];
	}
	public async evaluate(): Promise<number> {
		return 0;
	}
	public async exportQuestions(): Promise<string> {
		return "";
	}
	public async getFormulaLibrary(): Promise<FormulaEntry[]> {
		return [];
	}
}
class FakeAnalyticsService implements IAnalyticsService {
	public getStreak(): StreakData {
		return {currentStreak: 0, bestStreak: 0, totalActiveDays: 0};
	}
	public getWeakTopics(): WeakTopic[] {
		return [];
	}
	public getAccuracy(): number {
		return 0;
	}
	public getSessionSummary(): SessionSummary {
		return {totalQuestions: 0, correctCount: 0, accuracy: 0, totalTimeMs: 0, averageTimeMs: 0, mode: "Single"};
	}
}
class FakeExportService implements IExportService {
	public getExportMetadata(): {format: ExportFormat; extension: string; mimeType: string; label: string} {
		return {format: "text", extension: ".txt", mimeType: "text/plain", label: "Text"};
	}
	public downloadText(): void {}
	public downloadBlob(): void {}
	public buildWorksheetHtml(): string { return ""; }
	public printWorksheet(): void {}
}
class FakeSpecService implements ISpecService {
	public async loadSpec(): Promise<Specification> {
		return {units: [], topics: [], skills: [], templates: []};
	}
	public async validateSpec(): Promise<SpecValidationResult> {
		return {valid: true, errors: []};
	}
	public async previewTemplate(): Promise<GeneratedQuestion[]> {
		return [];
	}
}
class FakeSessionService implements ISessionService {
	public session: Session|null=null;
	public submitAnswer=vi.fn<(answer: string, _choiceIndex?: number) => Promise<PracticeResult>>(async (answer, _choiceIndex) => {
		const question=this.session?.questions[this.session.currentIndex];
		return makeResult({
			user_answer: answer,
			mode: this.session?.mode ?? "Single",
			is_correct: answer===question?.answer,
		});
	});
	public advanceQuestion=vi.fn<() => Promise<boolean>>(async () => {
		return false;
	});
	public regenerateCurrentQuestionAs=vi.fn<(_questionType: QuestionType) => Promise<GeneratedQuestion>>(async () => makeQuestion());
	public finishSession=vi.fn<() => Promise<PracticeResult[]>>(async () => {
		return [];
	});
	public async startSession(_spec: Specification, _config: SessionConfig): Promise<Session> {
		return makeSession();
	}
	public getSession(): Session | null {
		return this.session;
	}
	public async resumeSession(snapshot: SessionSnapshot): Promise<Session> {
		this.session=snapshot.session;
		return snapshot.session;
	}
	public async saveSessionSnapshot(): Promise<SessionSnapshot|null> {
		return null;
	}
	public async loadSessionSnapshot(): Promise<SessionSnapshot|null> {
		return null;
	}
	public clearSessionSnapshot(): void {}
}
function makeContainer(session: FakeSessionService): ServiceContainer {
	return new ServiceContainer(new FakePhysicsService(), session, new FakeAnalyticsService(), new FakeExportService(), new FakeSpecService());
}
function createWrapper(session: FakeSessionService) {
	return function Wrapper({children}: {children?: ReactNode}) {
		return createElement(ServiceProvider, {container: makeContainer(session)}, children);
	};
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
});
describe("useMcqHotReconfig", () => {
	it("toggling mcqEnabled from false to true calls regenerateCurrentQuestionAs(MC) and resets the answer UI", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession({questions: [makeQuestion({question_type: "SA"})]});
		sessionService.session=session;
		usePracticeStore.setState({
			session,
			mcqEnabled: false,
			userAnswer: "answer",
			selectedChoiceIndex: 2,
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "4"},
		});
		renderHook(() => useMcqHotReconfig(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			usePracticeStore.setState({mcqEnabled: true});
		});
		await waitFor(() => {
			expect(sessionService.regenerateCurrentQuestionAs).toHaveBeenCalledWith(QUESTION_TYPES.MC);
			expect(usePracticeStore.getState().userAnswer).toBe("");
			expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
			expect(usePracticeStore.getState().showFeedback).toBe(false);
			expect(usePracticeStore.getState().lastResult).toBeNull();
		});
	});
	it("toggling mcqEnabled from true to false calls regenerateCurrentQuestionAs(SA)", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession({questions: [makeQuestion({question_type: "MC"})]});
		sessionService.session=session;
		usePracticeStore.setState({session, mcqEnabled: true});
		renderHook(() => useMcqHotReconfig(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			usePracticeStore.setState({mcqEnabled: false});
		});
		await waitFor(() => {
			expect(sessionService.regenerateCurrentQuestionAs).toHaveBeenCalledWith(QUESTION_TYPES.SA);
		});
	});
	it("does not regenerate when the current question is already the target type", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession({questions: [makeQuestion({question_type: "MC"})]});
		sessionService.session=session;
		usePracticeStore.setState({session, mcqEnabled: false});
		renderHook(() => useMcqHotReconfig(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			usePracticeStore.setState({mcqEnabled: true});
		});
		await waitFor(() => {
			expect(sessionService.regenerateCurrentQuestionAs).not.toHaveBeenCalled();
		});
	});
	it("does not regenerate when there is no active session", async () => {
		const sessionService=new FakeSessionService();
		usePracticeStore.setState({session: null, mcqEnabled: false});
		renderHook(() => useMcqHotReconfig(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			usePracticeStore.setState({mcqEnabled: true});
		});
		await waitFor(() => {
			expect(sessionService.regenerateCurrentQuestionAs).not.toHaveBeenCalled();
		});
	});
});