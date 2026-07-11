import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {ProgressPanel} from "../ProgressPanel";
import {useProgressStore} from "../../stores/progressStore";
import {useSpecStore} from "../../stores/specStore";
import type {IAnalyticsService, WeakTopic, SessionSummary} from "../../../services/contracts";
import type {StreakData} from "../../../services/streakService";
import type {PracticeResult, Specification} from "../../../types/models";
function makeResult(overrides: Partial<PracticeResult>={}): PracticeResult {
	return {
		id: "r1",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		is_correct: true,
		time_taken_ms: 1500,
		user_answer: "4",
		timestamp: "2026-07-06T10:00:00.000Z",
		mode: "Single",
		difficulty: 2,
		...overrides,
	};
}
function makeSpec(overrides: Partial<Specification>={}): Specification {
	return {
		units: [],
		topics: [{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""}],
		skills: [],
		templates: [],
		...overrides,
	};
}
class FakeAnalyticsService implements IAnalyticsService {
	public getStreak=vi.fn<(results: PracticeResult[]) => StreakData>(() => ({currentStreak: 3, bestStreak: 5, totalActiveDays: 4}));
	public getWeakTopics=vi.fn<(results: PracticeResult[], spec: Specification, threshold?: number) => WeakTopic[]>(() => []);
	public getAccuracy=vi.fn<(results: PracticeResult[]) => number>(() => 80);
	public getSessionSummary=vi.fn<(results: PracticeResult[]) => SessionSummary>(() => ({totalQuestions: 1, correctCount: 1, accuracy: 100, totalTimeMs: 1500, averageTimeMs: 1500, mode: "Single"}));
}
beforeEach(() => {
	useProgressStore.setState(useProgressStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("ProgressPanel", () => {
	it("shows an empty state when there are no results", () => {
		render(() => <ProgressPanel />);
		expect(screen.getByText("No progress yet")).toBeInTheDocument();
		expect(screen.queryByText("Accuracy")).not.toBeInTheDocument();
	});
	it("renders accuracy and streak stats when results exist", () => {
		useProgressStore.setState({results: [makeResult()]});
		let analytics=new FakeAnalyticsService();
		render(() => <ProgressPanel analytics={analytics} />);
		expect(screen.getByText("Accuracy")).toBeInTheDocument();
		expect(screen.getByText("Streak")).toBeInTheDocument();
		expect(screen.getByText("80%")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("5 best")).toBeInTheDocument();
		expect(screen.getByText("4 active")).toBeInTheDocument();
	});
	it("shows the correct count and total attempts", () => {
		useProgressStore.setState({results: [makeResult({is_correct: true}), makeResult({id: "r2", is_correct: false})]});
		render(() => <ProgressPanel analytics={new FakeAnalyticsService()} />);
		expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
	});
	it("renders weak topics when present", () => {
		useProgressStore.setState({results: [makeResult()]});
		useSpecStore.setState({specification: makeSpec(), empty: false});
		let analytics=new FakeAnalyticsService();
		analytics.getWeakTopics.mockReturnValue([{topicId: "t1", topicName: "Linear Equations", accuracy: 40, attempts: 3}]);
		render(() => <ProgressPanel analytics={analytics} />);
		expect(screen.getByText("Weak Topics")).toBeInTheDocument();
		expect(screen.getAllByText("Linear Equations").length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText("3 attempts")).toBeInTheDocument();
	});
	it("hides the weak topics section when none exist", () => {
		useProgressStore.setState({results: [makeResult()]});
		render(() => <ProgressPanel analytics={new FakeAnalyticsService()} />);
		expect(screen.queryByText("Weak Topics")).not.toBeInTheDocument();
	});
	it("renders recent history entries", () => {
		useProgressStore.setState({results: [makeResult({id: "r1", timestamp: "2026-07-06T10:00:00.000Z"})]});
		useSpecStore.setState({specification: makeSpec(), empty: false});
		render(() => <ProgressPanel analytics={new FakeAnalyticsService()} />);
		expect(screen.getByText("Recent History")).toBeInTheDocument();
		expect(screen.getAllByText("Linear Equations").length).toBeGreaterThan(0);
		expect(screen.getByText(/Single · D2 ·/)).toBeInTheDocument();
	});
	it("paginates history when more than page size results exist", () => {
		let results: PracticeResult[]=[];
		for (let i=0; i<7; i++) {
			results.push(makeResult({id: `r${i}`, timestamp: `2026-07-0${i+1}T10:00:00.000Z`}));
		}
		useProgressStore.setState({results});
		render(() => <ProgressPanel analytics={new FakeAnalyticsService()} />);
		expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", {name: /previous/i}));
		expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
	});
	it("disables Previous on the first page and Next on the last page", () => {
		let results: PracticeResult[]=[];
		for (let i=0; i<7; i++) {
			results.push(makeResult({id: `r${i}`, timestamp: `2026-07-0${i+1}T10:00:00.000Z`}));
		}
		useProgressStore.setState({results});
		render(() => <ProgressPanel analytics={new FakeAnalyticsService()} />);
		expect(screen.getByRole("button", {name: /previous/i})).toBeDisabled();
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		expect(screen.getByRole("button", {name: /next/i})).toBeDisabled();
	});
	it("uses the real AnalyticsService by default", () => {
		useProgressStore.setState({results: [makeResult({is_correct: true}), makeResult({id: "r2", is_correct: false})]});
		render(() => <ProgressPanel />);
		expect(screen.getByText("50%")).toBeInTheDocument();
		expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
	});
});
