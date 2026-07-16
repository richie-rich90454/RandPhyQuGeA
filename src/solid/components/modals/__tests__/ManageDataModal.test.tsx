import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {ManageDataModal} from "../ManageDataModal";
import {ToastProvider} from "../../ui/Toast";
import {useUiStore} from "../../../stores/uiStore";
import {useProgressStore} from "../../../stores/progressStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
import type {IExportService, ExportMetadata} from "../../../../services/contracts";
import type {PracticeResult} from "../../../../types/models";
function makeResult(overrides: Partial<PracticeResult> = {}): PracticeResult {
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
class FakeExportService implements IExportService {
	public getExportMetadata(): ExportMetadata {
		return {format: "json", extension: ".json", mimeType: "application/json", label: "JSON"};
	}
	public downloadText = vi.fn<(filename: string, content: string, format?: "html" | "pdf" | "markdown" | "text" | "json" | "csv" | "latex") => void>();
	public downloadBlob(): void {}
	public buildWorksheetHtml(): string {
		return "";
	}
	public printWorksheet(): void {}
}
function renderWithServices(exportService?: IExportService) {
	return render(() => (
		<ToastProvider>
			<ManageDataModal exportService={exportService} />
		</ToastProvider>
	));
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("ManageDataModal", () => {
	it("renders when the manage-data modal is open", () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Manage Performance Data")).toBeInTheDocument();
	});
	it("does not render when closed", () => {
		renderWithServices();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("shows an empty state when there are no results", () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		expect(screen.getByText("No practice data")).toBeInTheDocument();
	});
	it("displays results and an accuracy badge", () => {
		useProgressStore.setState({results: [makeResult({id: "r1", topic_id: "t1", is_correct: true})]});
		useSpecStore.setState({specification: {units: [], topics: [{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""}], skills: [], templates: []}, empty: false});
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		expect(screen.getByText("Linear Equations")).toBeInTheDocument();
		expect(screen.getByText("100% accuracy")).toBeInTheDocument();
	});
	it("exports practice data through the export service", () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useUiStore.getState().openModal("manage-data");
		let exportService = new FakeExportService();
		renderWithServices(exportService);
		fireEvent.click(screen.getByRole("button", {name: /export json/i}));
		expect(exportService.downloadText).toHaveBeenCalledTimes(1);
		let call = exportService.downloadText.mock.calls[0];
		expect(call).toBeDefined();
		let content = call![1];
		let payload = JSON.parse(content);
		expect(payload.results).toHaveLength(1);
		expect(payload.results[0].id).toBe("r1");
		expect(payload.appVersion).toBe(useSettingsStore.getState().appVersion);
	});
	it("imports practice data from a JSON file after confirmation", async () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		let imported = [makeResult({id: "imported-1"}), makeResult({id: "imported-2"})];
		let file = new File([JSON.stringify({results: imported})], "data.json", {type: "application/json"});
		let input = screen.getByLabelText("Import practice data file");
		fireEvent.change(input, {target: {files: [file]}});
		await waitFor(() => expect(screen.getByText("Import practice data?")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: "Import"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(2));
		expect(useProgressStore.getState().results[0]?.id).toBe("imported-1");
	});
	it("shows an error and leaves data unchanged for an invalid import file", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		let file = new File(["not-json"], "bad.json", {type: "application/json"});
		let input = screen.getByLabelText("Import practice data file");
		fireEvent.change(input, {target: {files: [file]}});
		await waitFor(() => expect(screen.getByText("Failed to import data. File is not valid JSON.")).toBeInTheDocument());
		expect(useProgressStore.getState().results).toHaveLength(1);
	});
	it("deletes all results after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"}), makeResult({id: "r2"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		fireEvent.click(screen.getByRole("button", {name: /delete all/i}));
		await waitFor(() => expect(screen.getByText("Delete all data?")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: "Delete All"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(0));
	});
	it("deletes a single result after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1", timestamp: "2026-07-06T11:00:00.000Z"}), makeResult({id: "r2", timestamp: "2026-07-06T10:00:00.000Z"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		let buttons = screen.getAllByRole("button", {name: "Delete record"});
		fireEvent.click(buttons[0]!);
		await waitFor(() => expect(screen.getByText("Delete record?")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: "Delete"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(1));
		expect(useProgressStore.getState().results[0]?.id).toBe("r2");
	});
	it("resets app data, settings, and specification after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useSettingsStore.setState({themeMode: "dark"});
		useSpecStore.setState({specification: {units: [], topics: [], skills: [], templates: []}, empty: false});
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		fireEvent.click(screen.getByRole("button", {name: /reset everything/i}));
		await waitFor(() => expect(screen.getByText("Reset app?")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: "Reset"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(0));
		expect(useSettingsStore.getState().themeMode).toBe("system");
		expect(useSpecStore.getState().specification).toBeNull();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("closes the modal when Close is clicked", () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices();
		fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
		expect(useUiStore.getState().activeModal).toBeNull();
	});
});
