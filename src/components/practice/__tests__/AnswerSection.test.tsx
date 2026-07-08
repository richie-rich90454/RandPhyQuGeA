import {describe, it, expect, beforeEach, vi} from "vitest";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {AnswerSection} from "../AnswerSection";
import {ServiceProvider} from "../../../components/providers/ServiceProvider";
import {ServiceContainer} from "../../../services/container";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useProgressStore} from "../../../stores/progressStore";
import {useUiStore} from "../../../stores/uiStore";
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService, Session, SessionSnapshot, SessionConfig, WeakTopic, SessionSummary, SpecValidationResult} from "../../../services/contracts";
import type {GeneratedQuestion, PracticeResult, QuestionType, Specification, ExportFormat, FormulaEntry} from "../../../types/models";
import type {StreakData} from "../../../services/streakService";
function createMatchMedia(initialMatches: boolean): () => {matches: boolean; addEventListener: () => void; removeEventListener: () => void} {
	return () => ({
		matches: initialMatches,
		addEventListener: () => {},
		removeEventListener: () => {},
	});
}
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
function resetStores(): void {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
	useProgressStore.setState({results: []});
}
describe("AnswerSection", () => {
	beforeEach(() => {
		resetStores();
		Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
	});
	it("renders empty results placeholder when no question is loaded", () => {
		const sessionService=new FakeSessionService();
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		expect(screen.getByText("Your results will appear here after checking")).toBeDefined();
	});
	it("renders answer input when a question is loaded", () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		expect(screen.getByLabelText("Answer")).toBeDefined();
	});
	it("disables Check button when no answer is entered", () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		const checkButton=screen.getByRole("button", {name: "Check"});
		expect(checkButton.hasAttribute("disabled")).toBe(true);
	});
	it("enables Check button when an answer is entered", () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		const checkButton=screen.getByRole("button", {name: "Check"});
		expect(checkButton.hasAttribute("disabled")).toBe(false);
	});
	it("submits answer when Check button is clicked", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		const checkButton=screen.getByRole("button", {name: "Check"});
		fireEvent.click(checkButton);
		await waitFor(() => {
			expect(sessionService.submitAnswer).toHaveBeenCalledWith("4", undefined);
		});
		expect(usePracticeStore.getState().showFeedback).toBe(true);
	});
	it("shows Next button after feedback and advances on click", async () => {
		const sessionService=new FakeSessionService();
		const q1=makeQuestion({id: "q1", answer: "4"});
		const q2=makeQuestion({id: "q2", answer: "5"});
		const session=makeSession({questions: [q1, q2]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setShowFeedback(true);
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		const nextButton=screen.getByRole("button", {name: "Next"});
		expect(nextButton).toBeDefined();
		fireEvent.click(nextButton);
		await waitFor(() => {
			expect(sessionService.advanceQuestion).toHaveBeenCalled();
		});
		expect(usePracticeStore.getState().session?.currentIndex).toBe(1);
	});
	it("selects MCQ choice with digit keyboard shortcuts", () => {
		const sessionService=new FakeSessionService();
		const question=makeQuestion({question_type: "MC", choices: ["3", "4", "5"]});
		const session=makeSession({questions: [question]});
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		fireEvent.keyDown(window, {key: "3"});
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(2);
	});
	it("submits answer with Enter keyboard shortcut", async () => {
		const sessionService=new FakeSessionService();
		const session=makeSession();
		sessionService.session=session;
		usePracticeStore.getState().setSession(session);
		usePracticeStore.getState().setUserAnswer("4");
		render(<AnswerSection />, {wrapper: createWrapper(sessionService)});
		fireEvent.keyDown(window, {key: "Enter"});
		await waitFor(() => {
			expect(sessionService.submitAnswer).toHaveBeenCalledWith("4", undefined);
		});
	});
});
