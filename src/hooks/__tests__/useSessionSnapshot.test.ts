import {describe, it, expect, beforeEach, vi} from "vitest";
import {renderHook, act, waitFor} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {ServiceProvider} from "../../components/providers/ServiceProvider";
import {ServiceContainer} from "../../services/container";
import {useSessionSnapshot} from "../useSessionSnapshot";
import {usePracticeStore} from "../../stores/practiceStore";
import {useUiStore} from "../../stores/uiStore";
import type {ISessionService, Session, SessionSnapshot} from "../../services/contracts";
function makeSession(overrides: Partial<Session>={}): Session {
	return {
		id: "s1",
		specification: {units: [], topics: [], skills: [], templates: []},
		questions: [{id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "42", solution_text: "", solution_latex: "", variables: {}}],
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
function makeSnapshot(overrides: Partial<SessionSnapshot>={}): SessionSnapshot {
	return {session: makeSession(), createdAt: new Date().toISOString(), ...overrides};
}
class FakeSessionService implements ISessionService {
	public session: Session|null=null;
	public submitAnswer=vi.fn<(answer: string, _choiceIndex?: number) => Promise<import("../../types/models").PracticeResult>>(async () => {
		return {id: "r1", question_id: "q1", topic_id: "t1", skill_id: "s1", is_correct: true, time_taken_ms: 0, user_answer: "", timestamp: new Date().toISOString(), mode: "Single", difficulty: 1};
	});
	public startSession=vi.fn<() => Promise<Session>>(async () => makeSession());
	public advanceQuestion=vi.fn<() => Promise<boolean>>(async () => false);
	public regenerateCurrentQuestionAs=vi.fn<(_questionType: import("../../types/models").QuestionType) => Promise<import("../../types/models").GeneratedQuestion>>(async () => {
		return {id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "42", solution_text: "", solution_latex: "", variables: {}};
	});
	public finishSession=vi.fn<() => Promise<import("../../types/models").PracticeResult[]>>(async () => []);
	public getSession=vi.fn<() => Session|null>(() => this.session);
	public resumeSession=vi.fn<(snapshot: SessionSnapshot) => Promise<Session>>(async snapshot => {
		this.session=snapshot.session;
		return snapshot.session;
	});
	public saveSessionSnapshot=vi.fn<() => Promise<SessionSnapshot|null>>(async () => null);
	public loadSessionSnapshot=vi.fn<() => Promise<SessionSnapshot|null>>(async () => null);
	public clearSessionSnapshot=vi.fn<() => void>(() => {});
}
function createWrapper(sessionService: FakeSessionService) {
	let container=new ServiceContainer({} as import("../../services/contracts").IPhysicsService, sessionService, {} as import("../../services/contracts").IAnalyticsService, {} as import("../../services/contracts").IExportService, {} as import("../../services/contracts").ISpecService);
	return function Wrapper({children}: {children?: ReactNode}) {
		return createElement(ServiceProvider, {container}, children);
	};
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
});
describe("useSessionSnapshot", () => {
	it("opens the resume modal when an unfinished snapshot exists", async () => {
		let sessionService=new FakeSessionService();
		sessionService.loadSessionSnapshot.mockResolvedValue(makeSnapshot());
		renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(useUiStore.getState().activeModal).toBe("resume-session");
		});
		expect(sessionService.loadSessionSnapshot).toHaveBeenCalledTimes(1);
	});
	it("does nothing when no snapshot is found", async () => {
		let sessionService=new FakeSessionService();
		renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(sessionService.loadSessionSnapshot).toHaveBeenCalledTimes(1);
		});
		expect(useUiStore.getState().activeModal).toBeNull();
		expect(usePracticeStore.getState().session).toBeNull();
	});
	it("does nothing when the saved session is already finished", async () => {
		let sessionService=new FakeSessionService();
		sessionService.loadSessionSnapshot.mockResolvedValue(makeSnapshot({session: makeSession({isFinished: true, isActive: false})}));
		renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(sessionService.loadSessionSnapshot).toHaveBeenCalledTimes(1);
		});
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("resumes the session through the service and updates the practice store", async () => {
		let sessionService=new FakeSessionService();
		let snapshot=makeSnapshot();
		sessionService.loadSessionSnapshot.mockResolvedValue(snapshot);
		let {result}=renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(result.current.snapshot).toEqual(snapshot);
		});
		await act(async () => {
			result.current.resume();
		});
		expect(sessionService.resumeSession).toHaveBeenCalledWith(snapshot);
		expect(usePracticeStore.getState().session).toEqual(snapshot.session);
	});
	it("does not resume when no snapshot is loaded", async () => {
		let sessionService=new FakeSessionService();
		let {result}=renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(sessionService.loadSessionSnapshot).toHaveBeenCalledTimes(1);
		});
		act(() => {
			result.current.resume();
		});
		expect(sessionService.resumeSession).not.toHaveBeenCalled();
	});
	it("discards the snapshot and clears persisted storage", async () => {
		let sessionService=new FakeSessionService();
		sessionService.loadSessionSnapshot.mockResolvedValue(makeSnapshot());
		let {result}=renderHook(() => useSessionSnapshot(), {wrapper: createWrapper(sessionService)});
		await waitFor(() => {
			expect(result.current.snapshot).not.toBeNull();
		});
		act(() => {
			result.current.discard();
		});
		expect(sessionService.clearSessionSnapshot).toHaveBeenCalledTimes(1);
		expect(result.current.snapshot).toBeNull();
	});
});
