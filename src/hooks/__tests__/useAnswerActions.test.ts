import {describe, it, expect, beforeEach, vi} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {ServiceProvider} from "../../components/providers/ServiceProvider";
import {ServiceContainer} from "../../services/container";
import {useAnswerActions} from "../useAnswerActions";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useUiStore} from "../../stores/uiStore";
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService, Session, SessionSnapshot, SessionConfig, WeakTopic, SessionSummary, SpecValidationResult} from "../../services/contracts";
import type {GeneratedQuestion, PracticeResult, QuestionType, Specification, ExportFormat, FormulaEntry} from "../../types/models";
import type {StreakData} from "../../services/streakService";
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		response_mode: "frq",
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
		if (!this.session) return false;
		const nextIndex=this.session.currentIndex+1;
		if (nextIndex>=this.session.questions.length) return false;
		this.session.currentIndex=nextIndex;
		this.session.questionStartTime=Date.now();
		return true;
	});
	public regenerateCurrentQuestionAs=vi.fn<(_questionType: QuestionType) => Promise<GeneratedQuestion>>(async () => makeQuestion());
	public finishSession=vi.fn<() => Promise<PracticeResult[]>>(async () => {
		if (!this.session) return [];
		this.session.isActive=false;
		this.session.isFinished=true;
		this.session.sessionEndTime=Date.now();
		return this.session.results;
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
function focusInput(tagName: "input" | "textarea"="input"): HTMLElement {
	const input=document.createElement(tagName);
	document.body.appendChild(input);
	input.focus();
	return input;
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
	useProgressStore.setState({results: []});
});
describe("useAnswerActions", () => {
	it("successful submission updates progress and practice stores", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession({mode: "Single"});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.submit();
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledWith("4", undefined);
		expect(useProgressStore.getState().results.length).toBe(1);
		expect(usePracticeStore.getState().showFeedback).toBe(true);
		expect(usePracticeStore.getState().lastResult).toEqual({isCorrect: true, correctAnswer: "4"});
	});
	it("submits with selected MCQ choice index", async () => {
		const sessionService=new FakeSessionService();
		const question=makeQuestion({question_type: "MC", choices: ["3", "4", "5"]});
		const session=makeSession({questions: [question]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().selectChoice(1);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.submit();
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledWith("", 1);
	});
	it("no submission when no session/question", async () => {
		const sessionService=new FakeSessionService();
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.submit();
		});
		expect(sessionService.submitAnswer).not.toHaveBeenCalled();
	});
	it("no submission when feedback already shown", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		usePracticeStore.getState().setShowFeedback(true);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.submit();
		});
		expect(sessionService.submitAnswer).not.toHaveBeenCalled();
	});
	it("advances to the next question and resets answer UI", async () => {
		const sessionService=new FakeSessionService();
		const q1=makeQuestion({id: "q1", answer: "4"});
		const q2=makeQuestion({id: "q2", answer: "5"});
		const session=makeSession({questions: [q1, q2], currentIndex: 0});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		usePracticeStore.getState().setShowFeedback(true);
		usePracticeStore.getState().setLastResult({isCorrect: true, correctAnswer: "4"});
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.advance();
		});
		expect(sessionService.advanceQuestion).toHaveBeenCalled();
		expect(usePracticeStore.getState().session?.currentIndex).toBe(1);
		expect(usePracticeStore.getState().showFeedback).toBe(false);
		expect(usePracticeStore.getState().userAnswer).toBe("");
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
	});
	it("finishes session when advance has no more questions", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setShowFeedback(true);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			await result.current.advance();
		});
		expect(sessionService.finishSession).toHaveBeenCalled();
		expect(usePracticeStore.getState().session?.isFinished).toBe(true);
	});
	it("selects MCQ choice with digit keys 1-4", () => {
		const sessionService=new FakeSessionService();
		const question=makeQuestion({question_type: "MC", choices: ["3", "4", "5"]});
		const session=makeSession({questions: [question]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		act(() => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "2", bubbles: true}));
		});
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
	});
	it("ignores digit keys above choice count", () => {
		const sessionService=new FakeSessionService();
		const question=makeQuestion({question_type: "MC", choices: ["3", "4"]});
		const session=makeSession({questions: [question]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		act(() => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "4", bubbles: true}));
		});
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
	});
	it("Enter submits the current answer", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));
			await Promise.resolve();
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledWith("4", undefined);
	});
	it("Shift+Enter submits the current answer", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		const input=focusInput("textarea");
		await act(async () => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "Enter", shiftKey: true, bubbles: true}));
			await Promise.resolve();
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledWith("4", undefined);
		document.body.removeChild(input);
	});
	it("Enter advances when feedback is shown and more questions exist", async () => {
		const sessionService=new FakeSessionService();
		const q1=makeQuestion({id: "q1"});
		const q2=makeQuestion({id: "q2"});
		const session=makeSession({questions: [q1, q2], currentIndex: 0});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setShowFeedback(true);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		await act(async () => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));
			await Promise.resolve();
		});
		expect(sessionService.advanceQuestion).toHaveBeenCalled();
	});
	it("ignores shortcuts when a modal is open", () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		useUiStore.getState().openModal("settings");
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		act(() => {
			result.current.handleKeyDown(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));
		});
		expect(sessionService.submitAnswer).not.toHaveBeenCalled();
	});
	it("double submission is prevented", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		let resolveFirst: ((value: PracticeResult) => void) | null=null;
		sessionService.submitAnswer.mockImplementationOnce(async () => {
			return new Promise<PracticeResult>((resolve) => {
				resolveFirst=resolve;
			});
		});
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		let first: Promise<void>;
		let second: Promise<void>;
		act(() => {
			first=result.current.submit();
			second=result.current.submit();
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledTimes(1);
		act(() => {
			resolveFirst?.(makeResult());
		});
		await act(async () => {
			await Promise.all([first, second]);
		});
		expect(sessionService.submitAnswer).toHaveBeenCalledTimes(1);
	});
	it("canSubmit reflects answer or choice state", () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		expect(result.current.canSubmit).toBe(false);
		act(() => {
			usePracticeStore.getState().setUserAnswer("4");
		});
		expect(result.current.canSubmit).toBe(true);
	});
	it("canAdvance reflects remaining questions", () => {
		const sessionService=new FakeSessionService();
		const q1=makeQuestion({id: "q1"});
		const q2=makeQuestion({id: "q2"});
		const session=makeSession({questions: [q1, q2]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setShowFeedback(true);
		const {result}=renderHook(() => useAnswerActions(), {wrapper: createWrapper(sessionService)});
		expect(result.current.canAdvance).toBe(true);
	});
});
