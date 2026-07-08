import {describe, it, expect, beforeEach, vi} from "vitest";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {PrintModal} from "../PrintModal";
import {ServiceProvider} from "../../providers/ServiceProvider";
import {ToastProvider} from "../../ui";
import {ServiceContainer} from "../../../services/container";
import {useUiStore} from "../../../stores/uiStore";
import {useSpecStore} from "../../../stores/specStore";
import type {IPhysicsService, IExportService, GenerateOptions} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function createMatchMedia(initialMatches: boolean): Window["matchMedia"] {
	return (query: string) => ({
		matches: initialMatches,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
}
function makeSpecification(): Specification {
	return {
		units: [{id: "u1", name: "Algebra", description: ""}, {id: "u2", name: "Simple Math", description: ""}],
		topics: [
			{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""},
			{id: "t2", unit_id: "u2", name: "Arithmetic", description: ""},
		],
		skills: [],
		templates: [],
	};
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
class FakePhysicsService implements IPhysicsService {
	public generateBatch=vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>().mockResolvedValue([makeQuestion()]);
	public async parseSpecification(): Promise<Specification> { return makeSpecification(); }
	public async generateQuestion(): Promise<GeneratedQuestion> { return makeQuestion(); }
	public async generateUnique(): Promise<GeneratedQuestion[]> { return []; }
	public async evaluate(): Promise<number> { return 0; }
	public async exportQuestions(): Promise<string> { return ""; }
	public async getFormulaLibrary(): Promise<import("../../../types/models").FormulaEntry[]> { return []; }
}
class FakeExportService implements IExportService {
	public getExportMetadata(): import("../../../services/contracts").ExportMetadata {
		return {format: "html", extension: ".html", mimeType: "text/html", label: "HTML"};
	}
	public downloadText(): void {}
	public downloadBlob(): void {}
	public buildWorksheetHtml(): string { return ""; }
	public printWorksheet=vi.fn<(questions: GeneratedQuestion[], includeAnswerKey: boolean) => void>();
}
function renderWithServices(children: ReactNode) {
	const physics=new FakePhysicsService();
	const exportService=new FakeExportService();
	const container=new ServiceContainer(physics, {} as never, {} as never, exportService, {} as never);
	return {
		...render(createElement(ToastProvider, null, createElement(ServiceProvider, {container}, children))),
		physics,
		exportService,
	};
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	window.matchMedia=createMatchMedia(false);
});
describe("PrintModal", () => {
	it("renders when the print modal is open", () => {
		useUiStore.getState().openModal("print");
		renderWithServices(<PrintModal />);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByText("Print Worksheet")).toBeTruthy();
	});
	it("does not render when closed", () => {
		renderWithServices(<PrintModal />);
		expect(screen.queryByRole("dialog")).not.toBeTruthy();
	});
	it("generates a worksheet through the physics service", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		const {physics}=renderWithServices(<PrintModal />);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(physics.generateBatch).toHaveBeenCalledTimes(1));
		expect(screen.getByText("Preview (1 questions)")).toBeTruthy();
	});
	it("prints the worksheet through the export service", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		const {exportService}=renderWithServices(<PrintModal />);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(screen.getByRole("button", {name: /print worksheet/i})).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: /print worksheet/i}));
		await waitFor(() => expect(exportService.printWorksheet).toHaveBeenCalledTimes(1));
	});
	it("resets topic to all when scope changes", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		renderWithServices(<PrintModal />);
		const topicSelect=screen.getByRole("combobox", {name: "Topic"});
		fireEvent.change(topicSelect, {target: {value: "t1"}});
		const scopeSelect=screen.getByRole("combobox", {name: "Topic scope"});
		fireEvent.change(scopeSelect, {target: {value: "simple"}});
		await waitFor(() => expect((topicSelect as HTMLSelectElement).value).toBe("all"));
	});
	it("toggles the answer key switch", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		renderWithServices(<PrintModal />);
		const switchInput=screen.getByRole("switch", {name: /include answer key/i});
		fireEvent.click(switchInput);
		await waitFor(() => expect((switchInput as HTMLInputElement).checked).toBe(false));
	});
	it("closes the modal when Close is clicked", async () => {
		useUiStore.getState().openModal("print");
		renderWithServices(<PrintModal />);
		fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
		await waitFor(() => expect(useUiStore.getState().activeModal).toBe(null));
	});
});
