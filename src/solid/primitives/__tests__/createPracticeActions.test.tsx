import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import type {JSX} from "solid-js";
import {createPracticeActions} from "../createPracticeActions";
import type {CreatePracticeActionsOptions, CreatePracticeActionsReturn} from "../createPracticeActions";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useUiStore} from "../../stores/uiStore";
import type {ISessionService, Session} from "../../../services/contracts";
import type {GeneratedQuestion, PracticeResult, Specification} from "../../../types/models";
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
function makeResult(overrides: Partial<PracticeResult> = {}): PracticeResult {
	return {
		id: "r1",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "sk1",
		is_correct: true,
		time_taken_ms: 100,
		user_answer: "4",
		timestamp: "2024-01-01T00:00:00.000Z",
		mode: "Single",
		difficulty: 3,
		...overrides,
	};
}
interface MockSessionService extends ISessionService {
	submitAnswerCalls: {answer: string; choiceIndex?: number}[];
	readonly getSessionCalls: number;
}
function createMockSessionService(opts: {result?: PracticeResult; session?: Session; submitImpl?: (answer: string, choiceIndex?: number) => Promise<PracticeResult>}): MockSessionService {
	let submitAnswerCalls: {answer: string; choiceIndex?: number}[] = [];
	let getSessionCallCount = 0;
	let service: MockSessionService = {
		startSession: async () => {
			throw new Error("not implemented");
		},
		submitAnswer: async (answer: string, choiceIndex?: number) => {
			submitAnswerCalls.push({answer, choiceIndex});
			if (opts.submitImpl) {
				return opts.submitImpl(answer, choiceIndex);
			}
			return opts.result ?? makeResult();
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
		submitAnswerCalls,
		get getSessionCalls() {
			return getSessionCallCount;
		},
	};
	return service;
}
function deferred(): {promise: Promise<PracticeResult>; resolve: (v: PracticeResult) => void} {
	let resolve!: (v: PracticeResult) => void;
	let promise = new Promise<PracticeResult>(res => {
		resolve = res;
	});
	return {promise, resolve};
}
let result: CreatePracticeActionsReturn | null = null;
function makeRoot(opts: CreatePracticeActionsOptions): () => JSX.Element {
	return () => {
		result = createPracticeActions(opts);
		return <div>practice</div>;
	};
}
function keydownOnTarget(target: HTMLElement, key: string, opts: {shiftKey?: boolean} = {}): KeyboardEvent {
	let event = new KeyboardEvent("keydown", {
		key,
		shiftKey: opts.shiftKey ?? false,
		bubbles: true,
		cancelable: true,
	});
	target.dispatchEvent(event);
	return event;
}
let inputEl: HTMLInputElement | null = null;
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
	result = null;
	inputEl = document.createElement("input");
	document.body.appendChild(inputEl);
});
afterEach(() => {
	if (inputEl && inputEl.parentNode) {
		inputEl.parentNode.removeChild(inputEl);
	}
	inputEl = null;
});
describe("createPracticeActions", () => {
	it("check submits the answer and updates practice and progress stores", async () => {
		let updatedSession = makeSession({results: [makeResult()]});
		let mock = createMockSessionService({result: makeResult({is_correct: true}), session: updatedSession});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await result!.check();
		expect(mock.submitAnswerCalls.length).toBe(1);
		expect(mock.submitAnswerCalls[0]!.answer).toBe("4");
		expect(mock.getSessionCalls).toBe(1);
		expect(useProgressStore.getState().results.length).toBe(1);
		expect(usePracticeStore.getState().showFeedback).toBe(true);
		expect(usePracticeStore.getState().lastResult?.isCorrect).toBe(true);
		expect(usePracticeStore.getState().lastResult?.correctAnswer).toBe("4");
		expect(usePracticeStore.getState().session).toBe(updatedSession);
	});
	it("check forwards the selected choice index when it is non-negative", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession({questions: [makeQuestion({choices: ["2", "4"], correct_choice_index: 1})]}),
			userAnswer: "4",
			selectedChoiceIndex: 1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await result!.check();
		expect(mock.submitAnswerCalls[0]!.choiceIndex).toBe(1);
	});
	it("check does nothing when there is no session", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: null,
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await result!.check();
		expect(mock.submitAnswerCalls.length).toBe(0);
		expect(useProgressStore.getState().results.length).toBe(0);
	});
	it("check does nothing when feedback is already showing", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: true,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await result!.check();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("check respects the mode filter and rejects a mismatched mode", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession({mode: "Single"}),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				mode: "Mental",
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await result!.check();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("check guards against re-entrancy while a submission is in flight", async () => {
		let d = deferred();
		let mock = createMockSessionService({submitImpl: () => d.promise});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		let promise = result!.check();
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(1);
		result!.check();
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(1);
		d.resolve(makeResult());
		await promise;
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(1);
	});
	it("Shift+Enter on an input triggers check and prevents default", async () => {
		let updatedSession = makeSession({results: [makeResult()]});
		let mock = createMockSessionService({result: makeResult(), session: updatedSession});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
			}),
		);
		await flush();
		let event = keydownOnTarget(inputEl!, "Enter", {shiftKey: true});
		expect(event.defaultPrevented).toBe(true);
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(1);
	});
	it("Shift+Enter does nothing when a modal is open", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		useUiStore.getState().openModal("settings");
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
			}),
		);
		await flush();
		let event = keydownOnTarget(inputEl!, "Enter", {shiftKey: true});
		expect(event.defaultPrevented).toBe(false);
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("Shift+Enter does nothing when feedback is showing", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: true,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
			}),
		);
		await flush();
		let event = keydownOnTarget(inputEl!, "Enter", {shiftKey: true});
		expect(event.defaultPrevented).toBe(false);
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("shortcutEnabled=false does not attach the keydown listener", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await flush();
		let event = keydownOnTarget(inputEl!, "Enter", {shiftKey: true});
		expect(event.defaultPrevented).toBe(false);
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("removes the keydown listener on disposal", async () => {
		let mock = createMockSessionService({result: makeResult()});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		let rendered = render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
			}),
		);
		await flush();
		rendered.unmount();
		let event = keydownOnTarget(inputEl!, "Enter", {shiftKey: true});
		expect(event.defaultPrevented).toBe(false);
		await flush();
		expect(mock.submitAnswerCalls.length).toBe(0);
	});
	it("check routes submitAnswer errors through onError and resets the submitting guard (task 5.34)", async () => {
		let errors: string[] = [];
		let callCount = 0;
		let mock = createMockSessionService({
			submitImpl: () => {
				callCount++;
				if (callCount === 1) {
					throw new Error("network down");
				}
				return Promise.resolve(makeResult());
			},
		});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
				onError: message => errors.push(message),
			}),
		);
		await result!.check();
		expect(errors).toEqual(["network down"]);
		expect(usePracticeStore.getState().showFeedback).toBe(false);
		await result!.check();
		expect(callCount).toBe(2);
		expect(usePracticeStore.getState().showFeedback).toBe(true);
	});
	it("check re-throws submitAnswer errors when no onError is provided (task 5.34)", async () => {
		let mock = createMockSessionService({
			submitImpl: () => {
				throw new Error("boom");
			},
		});
		usePracticeStore.setState({
			session: makeSession(),
			userAnswer: "4",
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
		});
		render(
			makeRoot({
				practiceStore: usePracticeStore,
				progressStore: useProgressStore,
				uiStore: useUiStore,
				sessionService: mock,
				shortcutEnabled: false,
			}),
		);
		await expect(result!.check()).rejects.toThrow("boom");
		expect(mock.submitAnswerCalls.length).toBe(1);
		expect(usePracticeStore.getState().showFeedback).toBe(false);
	});
});
