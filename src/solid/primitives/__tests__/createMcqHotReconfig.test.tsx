import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createMcqHotReconfig} from "../createMcqHotReconfig";
import type {CreateMcqHotReconfigOptions} from "../createMcqHotReconfig";
import {usePracticeStore} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import type {ISessionService, Session} from "../../../services/contracts";
import type {GeneratedQuestion, PracticeResult, QuestionType, Specification} from "../../../types/models";
import {QUESTION_TYPES} from "../../../types/models";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
function emptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "sk1",
		question_type: "SA",
		difficulty: 3,
		text: "What is 2+2?",
		answer: "4",
		response_mode: "frq",
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "s1",
		specification: emptySpec(),
		questions: [makeQuestion()],
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
interface MockSessionService extends ISessionService {
	regenerateCalls: QuestionType[];
	getSessionCalls: number;
}
function createMockSessionService(opts: {regeneratedQuestion?: GeneratedQuestion; session?: Session; regenerateImpl?: (type: QuestionType) => Promise<GeneratedQuestion>}): MockSessionService {
	let regenerateCalls: QuestionType[] = [];
	let getSessionCallCount = 0;
	let service: MockSessionService = {
		startSession: async () => {
			throw new Error("not implemented");
		},
		submitAnswer: async () => {
			throw new Error("not implemented");
		},
		advanceQuestion: async () => {
			throw new Error("not implemented");
		},
		regenerateCurrentQuestionAs: async (type: QuestionType) => {
			regenerateCalls.push(type);
			if (opts.regenerateImpl) {
				return opts.regenerateImpl(type);
			}
			return opts.regeneratedQuestion ?? makeQuestion();
		},
		finishSession: async () => {
			throw new Error("not implemented");
		},
		getSession: () => {
			getSessionCallCount++;
			return opts.session ?? null;
		},
		resumeSession: async () => {
			throw new Error("not implemented");
		},
		saveSessionSnapshot: async () => null,
		loadSessionSnapshot: async () => null,
		clearSessionSnapshot: () => {},
		regenerateCalls,
		get getSessionCalls() {
			return getSessionCallCount;
		},
	};
	return service;
}
function deferred(): {promise: Promise<GeneratedQuestion>; resolve: (v: GeneratedQuestion) => void} {
	let resolve!: (v: GeneratedQuestion) => void;
	let promise = new Promise<GeneratedQuestion>(res => {
		resolve = res;
	});
	return {promise, resolve};
}
function seedSession(session: Session): void {
	usePracticeStore.setState({
		session,
		userAnswer: "old",
		selectedChoiceIndex: 2,
		showFeedback: true,
		lastResult: {isCorrect: false, correctAnswer: "x"},
	});
}
function makeRoot(opts: CreateMcqHotReconfigOptions): () => JSX.Element {
	return () => {
		createMcqHotReconfig(opts);
		return <div>mcq</div>;
	};
}
beforeEach(() => {
	localStorage.clear();
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
});
describe("createMcqHotReconfig", () => {
	it("regenerates the current question as MC when mcqEnabled toggles on", async () => {
		let updatedSession = makeSession({questions: [makeQuestion({id: "q2", question_type: "MC", choices: ["2", "4"], correct_choice_index: 1})]});
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion({question_type: "MC"}), session: updatedSession});
		seedSession(makeSession({questions: [makeQuestion({question_type: "SA"})]}));
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		expect(mock.regenerateCalls).toEqual([QUESTION_TYPES.MC]);
		expect(mock.getSessionCalls).toBe(1);
		expect(usePracticeStore.getState().session).toBe(updatedSession);
		expect(usePracticeStore.getState().userAnswer).toBe("");
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
		expect(usePracticeStore.getState().showFeedback).toBe(false);
		expect(usePracticeStore.getState().lastResult).toBeNull();
	});
	it("regenerates the current question as SA when mcqEnabled toggles off", async () => {
		let updatedSession = makeSession({questions: [makeQuestion({id: "q2", question_type: "SA"})]});
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion({question_type: "SA"}), session: updatedSession});
		seedSession(makeSession({questions: [makeQuestion({question_type: "MC", choices: ["2", "4"], correct_choice_index: 1})]}));
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("frq");
		await flush();
		expect(mock.regenerateCalls).toEqual([QUESTION_TYPES.SA]);
		expect(mock.getSessionCalls).toBe(1);
		expect(usePracticeStore.getState().session).toBe(updatedSession);
	});
	it("does nothing when there is no session", async () => {
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion()});
		usePracticeStore.setState({session: null, userAnswer: "", selectedChoiceIndex: -1, showFeedback: false, lastResult: null});
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		expect(mock.regenerateCalls.length).toBe(0);
	});
	it("does nothing when the session is finished", async () => {
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion()});
		seedSession(makeSession({isFinished: true, isActive: false, questions: [makeQuestion({question_type: "SA"})]}));
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		expect(mock.regenerateCalls.length).toBe(0);
	});
	it("does nothing when the current question type already matches the target", async () => {
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion()});
		seedSession(makeSession({questions: [makeQuestion({question_type: "MC", choices: ["2", "4"], correct_choice_index: 1})]}));
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		expect(mock.regenerateCalls.length).toBe(0);
	});
	it("does not write to the store after disposal", async () => {
		let d = deferred();
		let updatedSession = makeSession({questions: [makeQuestion({id: "q2", question_type: "MC"})]});
		let mock = createMockSessionService({regenerateImpl: () => d.promise, session: updatedSession});
		seedSession(makeSession({questions: [makeQuestion({question_type: "TF"})]}));
		let rendered = render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		expect(mock.regenerateCalls).toEqual([QUESTION_TYPES.MC]);
		rendered.unmount();
		d.resolve(makeQuestion({question_type: "MC"}));
		await flush();
		expect(mock.getSessionCalls).toBe(0);
		expect(usePracticeStore.getState().session?.questions[0]?.question_type).toBe("TF");
	});
	it("a newer toggle supersedes an older in-flight regeneration", async () => {
		let d = deferred();
		let updatedSession = makeSession({questions: [makeQuestion({id: "q2", question_type: "SA"})]});
		let mock = createMockSessionService({regenerateImpl: () => d.promise, session: updatedSession});
		seedSession(makeSession({questions: [makeQuestion({question_type: "TF"})]}));
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("mcq");
		await flush();
		useSettingsStore.getState().setDefaultResponseMode("frq");
		await flush();
		expect(mock.regenerateCalls).toEqual([QUESTION_TYPES.MC, QUESTION_TYPES.SA]);
		d.resolve(makeQuestion());
		await flush();
		expect(mock.getSessionCalls).toBe(1);
		expect(usePracticeStore.getState().session).toBe(updatedSession);
	});
	it("ignores the initial mcqEnabled value on mount", async () => {
		let mock = createMockSessionService({regeneratedQuestion: makeQuestion()});
		seedSession(makeSession({questions: [makeQuestion({question_type: "SA"})]}));
		render(makeRoot({practiceStore: usePracticeStore, sessionService: mock}));
		await flush();
		expect(mock.regenerateCalls.length).toBe(0);
	});
});
