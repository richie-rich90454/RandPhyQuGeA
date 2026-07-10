import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createSessionSnapshot} from "../createSessionSnapshot";
import type {CreateSessionSnapshotOptions, CreateSessionSnapshotReturn} from "../createSessionSnapshot";
import {usePracticeStore} from "../../stores/practiceStore";
import {useUiStore} from "../../stores/uiStore";
import type {ISessionService, Session, SessionSnapshot} from "../../../services/contracts";
import type {Specification} from "../../../types/models";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
function emptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeSession(overrides: Partial<Session>={}): Session {
	return {
		id: "s1",
		specification: emptySpec(),
		questions: [],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: 0,
		sessionStartTime: 0,
		...overrides,
	};
}
function makeSnapshot(session: Session): SessionSnapshot {
	return {session, createdAt: "2024-01-01T00:00:00.000Z"};
}
interface MockSessionService extends ISessionService {
	calls: {clear: number, resume: number, load: number};
}
function createMockSessionService(opts: {snapshot?: SessionSnapshot | null, resumedSession?: Session}): MockSessionService {
	let calls={clear: 0, resume: 0, load: 0};
	let service: MockSessionService={
		startSession: async () => {
			throw new Error("not implemented");
		},
		submitAnswer: async () => {
			throw new Error("not implemented");
		},
		advanceQuestion: async () => {
			throw new Error("not implemented");
		},
		regenerateCurrentQuestionAs: async () => {
			throw new Error("not implemented");
		},
		finishSession: async () => {
			throw new Error("not implemented");
		},
		getSession: () => null,
		resumeSession: async snap => {
			calls.resume++;
			return opts.resumedSession ?? snap.session;
		},
		saveSessionSnapshot: async () => null,
		loadSessionSnapshot: async () => {
			calls.load++;
			return opts.snapshot ?? null;
		},
		clearSessionSnapshot: () => {
			calls.clear++;
		},
		calls,
	};
	return service;
}
let result: CreateSessionSnapshotReturn | null=null;
let mockService: MockSessionService | null=null;
function makeRoot(opts: CreateSessionSnapshotOptions): () => JSX.Element {
	return () => {
		result=createSessionSnapshot(opts);
		return <div>snapshot</div>;
	};
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
	result=null;
	mockService=null;
});
describe("createSessionSnapshot", () => {
	it("loads an unfinished snapshot on mount and opens the resume modal", async () => {
		mockService=createMockSessionService({snapshot: makeSnapshot(makeSession())});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		expect(mockService.calls.load).toBe(1);
		expect(result!.snapshot()).not.toBeNull();
		expect(useUiStore.getState().activeModal).toBe("resume-session");
	});
	it("does not open the modal when the snapshot is finished", async () => {
		mockService=createMockSessionService({snapshot: makeSnapshot(makeSession({isFinished: true}))});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		expect(result!.snapshot()).toBeNull();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("does not open the modal when there is no snapshot", async () => {
		mockService=createMockSessionService({snapshot: null});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		expect(result!.snapshot()).toBeNull();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("resume restores the session into the practice store", async () => {
		let resumed=makeSession({id: "resumed", isActive: true});
		mockService=createMockSessionService({snapshot: makeSnapshot(makeSession()), resumedSession: resumed});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		result!.resume();
		await flush();
		expect(mockService.calls.resume).toBe(1);
		expect(usePracticeStore.getState().session?.id).toBe("resumed");
	});
	it("resume does nothing when there is no snapshot", async () => {
		mockService=createMockSessionService({snapshot: null});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		result!.resume();
		await flush();
		expect(mockService.calls.resume).toBe(0);
	});
	it("discard clears the persisted snapshot and the local signal", async () => {
		mockService=createMockSessionService({snapshot: makeSnapshot(makeSession())});
		render(makeRoot({practiceStore: usePracticeStore, uiStore: useUiStore, sessionService: mockService}));
		await flush();
		expect(result!.snapshot()).not.toBeNull();
		result!.discard();
		expect(mockService.calls.clear).toBe(1);
		expect(result!.snapshot()).toBeNull();
	});
});
