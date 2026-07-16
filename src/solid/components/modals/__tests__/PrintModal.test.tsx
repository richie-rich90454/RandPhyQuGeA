import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {PrintModal} from "../PrintModal";
import {ToastProvider} from "../../ui/Toast";
import {useUiStore} from "../../../stores/uiStore";
import {useSpecStore} from "../../../stores/specStore";
import type {IPhysicsService, IExportService, GenerateOptions, ExportMetadata} from "../../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../../types/models";
function makeSpecification(): Specification {
	return {
		units: [
			{id: "u1", name: "Algebra", description: ""},
			{id: "u2", name: "Simple Math", description: ""},
		],
		topics: [
			{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""},
			{id: "t2", unit_id: "u2", name: "Arithmetic", description: ""},
		],
		skills: [],
		templates: [],
	};
}
function makeQuestion(overrides?: Partial<GeneratedQuestion>): GeneratedQuestion {
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
	public generateBatch = vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>().mockResolvedValue([makeQuestion()]);
	public async parseSpecification(): Promise<Specification> {
		return makeSpecification();
	}
	public async generateQuestion(): Promise<GeneratedQuestion> {
		return makeQuestion();
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
	public async getFormulaLibrary(): Promise<import("../../../../types/models").FormulaEntry[]> {
		return [];
	}
}
class FakeExportService implements IExportService {
	public getExportMetadata(): ExportMetadata {
		return {format: "html", extension: ".html", mimeType: "text/html", label: "HTML"};
	}
	public downloadText(): void {}
	public downloadBlob(): void {}
	public buildWorksheetHtml(): string {
		return "";
	}
	public printWorksheet = vi.fn<(questions: GeneratedQuestion[], includeAnswerKey: boolean) => void>();
}
function renderWithServices(physics?: IPhysicsService, exportService?: IExportService) {
	return render(() => (
		<ToastProvider>
			<PrintModal physics={physics} exportService={exportService} />
		</ToastProvider>
	));
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("PrintModal", () => {
	it("renders when the print modal is open", () => {
		useUiStore.getState().openModal("print");
		renderWithServices();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Print Worksheet")).toBeInTheDocument();
	});
	it("does not render when closed", () => {
		renderWithServices();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("generates a worksheet through the physics service", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let physics = new FakePhysicsService();
		renderWithServices(physics);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(physics.generateBatch).toHaveBeenCalledTimes(1));
		expect(screen.getByText("Preview (1 questions)")).toBeInTheDocument();
	});
	it("passes topicId when exactly one topic is selected", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let physics = new FakePhysicsService();
		renderWithServices(physics);
		let topicPills = screen.getAllByRole("button", {name: /Algebra -|Simple Math -/});
		fireEvent.click(topicPills[0]!);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(physics.generateBatch).toHaveBeenCalledTimes(1));
		expect(physics.generateBatch).toHaveBeenCalledWith(expect.any(Object), 10, {minDifficulty: 3, maxDifficulty: 5, topicId: "t1"});
	});
	it("generates from each selected topic when multiple topics are selected", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let physics = new FakePhysicsService();
		physics.generateBatch = vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>().mockImplementation(async (_spec, count, options) => {
			let topicId = options?.topicId ?? "none";
			let questions: GeneratedQuestion[] = [];
			for (let i = 0; i < count; i++) {
				questions.push(makeQuestion({id: `${topicId}-q${i}`, topic_id: topicId}));
			}
			return questions;
		});
		renderWithServices(physics);
		let topicPills = screen.getAllByRole("button", {name: /Algebra -|Simple Math -/});
		fireEvent.click(topicPills[0]!);
		fireEvent.click(topicPills[1]!);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(physics.generateBatch).toHaveBeenCalledTimes(2));
		expect(physics.generateBatch).toHaveBeenNthCalledWith(1, expect.any(Object), 5, {minDifficulty: 3, maxDifficulty: 5, topicId: "t1"});
		expect(physics.generateBatch).toHaveBeenNthCalledWith(2, expect.any(Object), 5, {minDifficulty: 3, maxDifficulty: 5, topicId: "t2"});
		expect(screen.getByText("Preview (10 questions)")).toBeInTheDocument();
	});
	it("truncates combined batch to requested count when topics over-deliver", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let physics = new FakePhysicsService();
		physics.generateBatch = vi.fn<(spec: Specification, count: number, options?: GenerateOptions) => Promise<GeneratedQuestion[]>>().mockImplementation(async (_spec, count, options) => {
			let topicId = options?.topicId ?? "none";
			let questions: GeneratedQuestion[] = [];
			for (let i = 0; i < count; i++) {
				questions.push(makeQuestion({id: `${topicId}-q${i}`, topic_id: topicId}));
			}
			return questions;
		});
		renderWithServices(physics);
		let numberInput = screen.getByRole("spinbutton", {name: "Number of questions"}) as HTMLInputElement;
		fireEvent.input(numberInput, {target: {value: "5"}});
		let topicPills = screen.getAllByRole("button", {name: /Algebra -|Simple Math -/});
		fireEvent.click(topicPills[0]!);
		fireEvent.click(topicPills[1]!);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(physics.generateBatch).toHaveBeenCalledTimes(2));
		expect(physics.generateBatch).toHaveBeenNthCalledWith(1, expect.any(Object), 3, {minDifficulty: 3, maxDifficulty: 5, topicId: "t1"});
		expect(physics.generateBatch).toHaveBeenNthCalledWith(2, expect.any(Object), 3, {minDifficulty: 3, maxDifficulty: 5, topicId: "t2"});
		expect(screen.getByText("Preview (5 questions)")).toBeInTheDocument();
	});
	it("prints the worksheet through the export service", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let exportService = new FakeExportService();
		renderWithServices(new FakePhysicsService(), exportService);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(screen.getByRole("button", {name: /print worksheet/i})).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: /print worksheet/i}));
		await waitFor(() => expect(exportService.printWorksheet).toHaveBeenCalledTimes(1));
	});
	it("resets selected topics when scope changes", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		renderWithServices();
		let topicPills = screen.getAllByRole("button", {name: /Algebra -|Simple Math -/});
		fireEvent.click(topicPills[0]!);
		await waitFor(() => expect(topicPills[0]).toHaveAttribute("aria-pressed", "true"));
		let scopeSelect = screen.getByRole("combobox", {name: "Topic scope"}) as HTMLSelectElement;
		fireEvent.change(scopeSelect, {target: {value: "simple"}});
		let remainingPills = screen.getAllByRole("button", {name: /Algebra -|Simple Math -/});
		for (let pill of remainingPills) {
			expect(pill).toHaveAttribute("aria-pressed", "false");
		}
	});
	it("toggles the answer key switch", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		renderWithServices();
		let switchInput = screen.getByRole("switch", {name: /include answer key/i}) as HTMLInputElement;
		expect(switchInput.checked).toBe(true);
		fireEvent.click(switchInput);
		await waitFor(() => expect(switchInput.checked).toBe(false));
	});
	it("closes the modal when Close is clicked", async () => {
		useUiStore.getState().openModal("print");
		renderWithServices();
		fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
		await waitFor(() => expect(useUiStore.getState().activeModal).toBe(null));
	});
});
describe("PrintModal loading skeleton (task 5.32)", () => {
	it("shows a loading skeleton with aria-busy while generating and no questions exist", async () => {
		useSpecStore.setState({specification: makeSpecification()});
		useUiStore.getState().openModal("print");
		let physics = new FakePhysicsService();
		let resolveGeneration: (value: GeneratedQuestion[]) => void = () => {};
		physics.generateBatch = vi.fn<() => Promise<GeneratedQuestion[]>>(
			() =>
				new Promise<GeneratedQuestion[]>(resolve => {
					resolveGeneration = resolve;
				}),
		);
		renderWithServices(physics);
		fireEvent.click(screen.getByRole("button", {name: /generate worksheet/i}));
		await waitFor(() => expect(screen.getByText("Generating…")).toBeInTheDocument());
		expect(screen.getByText("Generating worksheet questions…")).toBeInTheDocument();
		let busyRegion = screen.getByText("Generating worksheet questions…").closest("[aria-busy='true']");
		expect(busyRegion).toBeInTheDocument();
		resolveGeneration([makeQuestion()]);
		await waitFor(() => expect(screen.getByText("Preview (1 questions)")).toBeInTheDocument());
	});
});
