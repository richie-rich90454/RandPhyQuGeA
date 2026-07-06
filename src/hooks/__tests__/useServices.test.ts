import {describe, it, expect} from "vitest";
import {renderHook} from "@testing-library/react";
import {createElement} from "react";
import {ServiceProvider} from "../../components/providers/ServiceProvider";
import {ServiceContainer} from "../../services/container";
import {useServices} from "../useServices";
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService} from "../../services/contracts";
class FakePhysicsService implements IPhysicsService {
	public async parseSpecification(): Promise<import("../../types/models").Specification> {
		return {units: [], topics: [], skills: [], templates: []};
	}
	public async generateQuestion(): Promise<import("../../types/models").GeneratedQuestion> {
		return {id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "", answer: "", solution_text: "", solution_latex: "", variables: {}};
	}
	public async generateBatch(): Promise<import("../../types/models").GeneratedQuestion[]> {
		return [];
	}
	public async generateUnique(): Promise<import("../../types/models").GeneratedQuestion[]> {
		return [];
	}
	public async evaluate(): Promise<number> {
		return 0;
	}
	public async exportQuestions(): Promise<string> {
		return "";
	}
	public async getFormulaLibrary(): Promise<import("../../types/models").FormulaEntry[]> {
		return [];
	}
}
class FakeAnalyticsService implements IAnalyticsService {
	public getStreak(): import("../../services/streakService").StreakData {
		return {currentStreak: 0, bestStreak: 0, totalActiveDays: 0};
	}
	public getWeakTopics(): import("../../services/contracts").WeakTopic[] {
		return [];
	}
	public getAccuracy(): number {
		return 0;
	}
	public getSessionSummary(): import("../../services/contracts").SessionSummary {
		return {totalQuestions: 0, correctCount: 0, accuracy: 0, totalTimeMs: 0, averageTimeMs: 0, mode: "Single"};
	}
}
class FakeExportService implements IExportService {
	public getExportMetadata(): import("../../services/contracts").ExportMetadata {
		return {format: "text", extension: ".txt", mimeType: "text/plain", label: "Text"};
	}
	public downloadText(): void {}
	public downloadBlob(): void {}
	public buildWorksheetHtml(): string { return ""; }
	public printWorksheet(): void {}
}
class FakeSpecService implements ISpecService {
	public async loadSpec(): Promise<import("../../types/models").Specification> {
		return {units: [], topics: [], skills: [], templates: []};
	}
	public async validateSpec(): Promise<import("../../services/contracts").SpecValidationResult> {
		return {valid: true, errors: []};
	}
	public async previewTemplate(): Promise<import("../../types/models").GeneratedQuestion[]> {
		return [];
	}
}
class FakeSessionService implements ISessionService {
	public async startSession(): Promise<import("../../services/contracts").Session> {
		return {id: "s1", specification: {units: [], topics: [], skills: [], templates: []}, questions: [], mode: "Single", currentIndex: 0, results: [], isActive: true, isFinished: false, questionStartTime: 0, sessionStartTime: 0};
	}
	public async submitAnswer(): Promise<import("../../types/models").PracticeResult> {
		return {id: "r1", question_id: "q1", topic_id: "t1", skill_id: "s1", is_correct: true, time_taken_ms: 0, user_answer: "", timestamp: "", mode: "Single", difficulty: 1};
	}
	public async advanceQuestion(): Promise<boolean> {
		return false;
	}
	public async finishSession(): Promise<import("../../types/models").PracticeResult[]> {
		return [];
	}
	public getSession(): import("../../services/contracts").Session | null {
		return null;
	}
	public async resumeSession(): Promise<import("../../services/contracts").Session> {
		return {id: "s1", specification: {units: [], topics: [], skills: [], templates: []}, questions: [], mode: "Single", currentIndex: 0, results: [], isActive: true, isFinished: false, questionStartTime: 0, sessionStartTime: 0};
	}
	public async saveSessionSnapshot(): Promise<import("../../services/contracts").SessionSnapshot|null> {
		return null;
	}
	public async loadSessionSnapshot(): Promise<import("../../services/contracts").SessionSnapshot|null> {
		return null;
	}
	public clearSessionSnapshot(): void {}
}
function makeContainer(): ServiceContainer {
	return new ServiceContainer(new FakePhysicsService(), new FakeSessionService(), new FakeAnalyticsService(), new FakeExportService(), new FakeSpecService());
}
describe("useServices", () => {
	it("returns the container inside ServiceProvider", () => {
		let container=makeContainer();
		let {result}=renderHook(() => useServices(), {wrapper: ({children}) => createElement(ServiceProvider, {container}, children)});
		expect(result.current).toBe(container);
	});
	it("throws when used outside ServiceProvider", () => {
		expect(() => renderHook(() => useServices())).toThrow("useServices must be used within a ServiceProvider.");
	});
});
