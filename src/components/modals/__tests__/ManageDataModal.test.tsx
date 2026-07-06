import {describe, it, expect, beforeEach, vi} from "vitest";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {ManageDataModal} from "../ManageDataModal";
import {ServiceProvider} from "../../providers/ServiceProvider";
import {ToastProvider} from "../../ui";
import {ServiceContainer} from "../../../services/container";
import {useUiStore} from "../../../stores/uiStore";
import {useProgressStore} from "../../../stores/progressStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
import type {IExportService, ExportMetadata} from "../../../services/contracts";
import type {PracticeResult} from "../../../types/models";
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
	public buildWorksheetHtml(): string { return ""; }
	public printWorksheet(): void {}
}
function renderWithServices(children: ReactNode) {
	const exportService = new FakeExportService();
	const container = new ServiceContainer({} as never, {} as never, {} as never, exportService, {} as never);
	return {
		...render(createElement(ToastProvider, null, createElement(ServiceProvider, {container}, children))),
		exportService,
	};
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	window.matchMedia = createMatchMedia(false);
});
describe("ManageDataModal", () => {
	it("renders when the manage-data modal is open", () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByText("Manage Performance Data")).toBeTruthy();
	});
	it("shows an empty state when there are no results", () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		expect(screen.getByText("No practice data")).toBeTruthy();
	});
	it("displays results and an accuracy badge", () => {
		useProgressStore.setState({results: [makeResult({id: "r1", topic_id: "t1", is_correct: true})]});
		useSpecStore.setState({specification: {units: [], topics: [{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""}], skills: [], templates: []}});
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		expect(screen.getByText("Linear Equations")).toBeTruthy();
		expect(screen.getByText("100% accuracy")).toBeTruthy();
	});
	it("exports practice data through the export service", () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useUiStore.getState().openModal("manage-data");
		const {exportService} = renderWithServices(<ManageDataModal />);
		fireEvent.click(screen.getByRole("button", {name: /export json/i}));
		expect(exportService.downloadText).toHaveBeenCalledTimes(1);
		const call = exportService.downloadText.mock.calls[0];
		expect(call).toBeDefined();
		const content = call![1];
		const payload = JSON.parse(content);
		expect(payload.results).toHaveLength(1);
		expect(payload.results[0].id).toBe("r1");
		expect(payload.appVersion).toBe(useSettingsStore.getState().appVersion);
	});
	it("imports practice data from a JSON file after confirmation", async () => {
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		const imported = [makeResult({id: "imported-1"}), makeResult({id: "imported-2"})];
		const file = new File([JSON.stringify({results: imported})], "data.json", {type: "application/json"});
		const input = screen.getByLabelText("Import practice data file");
		fireEvent.change(input, {target: {files: [file]}});
		await waitFor(() => expect(screen.getByText("Import practice data?")).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: "Import"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(2));
		expect(useProgressStore.getState().results[0]?.id).toBe("imported-1");
	});
	it("shows an error and leaves data unchanged for an invalid import file", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		const file = new File(["not-json"], "bad.json", {type: "application/json"});
		const input = screen.getByLabelText("Import practice data file");
		fireEvent.change(input, {target: {files: [file]}});
		await waitFor(() => expect(screen.getByText("Failed to import data. File is not valid JSON.")).toBeTruthy());
		expect(useProgressStore.getState().results).toHaveLength(1);
	});
	it("deletes all results after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"}), makeResult({id: "r2"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		fireEvent.click(screen.getByRole("button", {name: /delete all/i}));
		await waitFor(() => expect(screen.getByText("Delete all data?")).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: "Delete All"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(0));
	});
	it("deletes a single result after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"}), makeResult({id: "r2"})]});
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		const buttons = screen.getAllByRole("button", {name: "Delete record"});
		const target = buttons[0];
		expect(target).toBeDefined();
		fireEvent.click(target!);
		await waitFor(() => expect(screen.getByText("Delete record?")).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: "Delete"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(1));
		expect(useProgressStore.getState().results[0]?.id).toBe("r2");
	});
	it("resets app data, settings, and specification after confirmation", async () => {
		useProgressStore.setState({results: [makeResult({id: "r1"})]});
		useSettingsStore.setState({themeMode: "dark"});
		useSpecStore.setState({specification: {units: [], topics: [], skills: [], templates: []}, empty: false});
		useUiStore.getState().openModal("manage-data");
		renderWithServices(<ManageDataModal />);
		fireEvent.click(screen.getByRole("button", {name: /reset everything/i}));
		await waitFor(() => expect(screen.getByText("Reset app?")).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: "Reset"}));
		await waitFor(() => expect(useProgressStore.getState().results).toHaveLength(0));
		expect(useSettingsStore.getState().themeMode).toBe("system");
		expect(useSpecStore.getState().specification).toBeNull();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
});
