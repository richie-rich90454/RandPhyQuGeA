import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {CommandPalette, createDefaultCommands} from "../CommandPalette";
import type {Command} from "../CommandPalette";
function sampleCommands(): Command[] {
	return [
		{id: "start", label: "Start Practice", section: "Actions", keywords: "practice begin", perform: () => {}},
		{id: "theme", label: "Toggle Theme", section: "Actions", keywords: "theme dark light", perform: () => {}},
		{id: "playground", label: "Go to Playground", section: "Navigation", keywords: "playground components", perform: () => {}},
	];
}
beforeEach(() => {
	window.location.hash="";
});
describe("CommandPalette", () => {
	it("renders nothing when closed", () => {
		render(() => <CommandPalette open={false} onOpenChange={() => {}} commands={sampleCommands()} />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});
	it("renders the dialog and command list when open", () => {
		render(() => <CommandPalette open={true} onOpenChange={() => {}} commands={sampleCommands()} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
		expect(screen.getByText("Start Practice")).toBeInTheDocument();
		expect(screen.getByText("Go to Playground")).toBeInTheDocument();
		expect(screen.getByText("Actions")).toBeInTheDocument();
		expect(screen.getByText("Navigation")).toBeInTheDocument();
	});
	it("filters commands by substring of the label", () => {
		render(() => <CommandPalette open={true} onOpenChange={() => {}} commands={sampleCommands()} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		fireEvent.input(input, {target: {value: "theme"}});
		expect(screen.getByText("Toggle Theme")).toBeInTheDocument();
		expect(screen.queryByText("Start Practice")).toBeNull();
		expect(screen.queryByText("Go to Playground")).toBeNull();
	});
	it("fuzzy matches by subsequence", () => {
		render(() => <CommandPalette open={true} onOpenChange={() => {}} commands={sampleCommands()} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		fireEvent.input(input, {target: {value: "gpg"}});
		expect(screen.getByText("Go to Playground")).toBeInTheDocument();
		expect(screen.queryByText("Start Practice")).toBeNull();
	});
	it("shows an empty state when no commands match", () => {
		render(() => <CommandPalette open={true} onOpenChange={() => {}} commands={sampleCommands()} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		fireEvent.input(input, {target: {value: "zzz"}});
		expect(screen.getByText(/no matching commands/i)).toBeInTheDocument();
	});
	it("ArrowDown moves selection and Enter executes the highlighted command", () => {
		let performed=vi.fn();
		let onOpenChange=vi.fn();
		let commands: Command[]=[
			{id: "a", label: "Alpha", section: "Actions", perform: () => {}},
			{id: "b", label: "Beta", section: "Actions", perform: performed},
		];
		render(() => <CommandPalette open={true} onOpenChange={onOpenChange} commands={commands} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		fireEvent.keyDown(input, {key: "ArrowDown"});
		fireEvent.keyDown(input, {key: "Enter"});
		expect(performed).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
	it("ArrowUp moves selection upward and clamps at zero", () => {
		let commands: Command[]=[
			{id: "a", label: "Alpha", section: "Actions", perform: () => {}},
			{id: "b", label: "Beta", section: "Actions", perform: () => {}},
		];
		render(() => <CommandPalette open={true} onOpenChange={() => {}} commands={commands} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		let options=screen.getAllByRole("option");
		expect(options[0]).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(input, {key: "ArrowDown"});
		expect(options[1]).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(input, {key: "ArrowUp"});
		expect(options[0]).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(input, {key: "ArrowUp"});
		expect(options[0]).toHaveAttribute("aria-selected", "true");
	});
	it("Escape closes the palette", () => {
		let onOpenChange=vi.fn();
		render(() => <CommandPalette open={true} onOpenChange={onOpenChange} commands={sampleCommands()} />);
		let input=screen.getByPlaceholderText(/type a command/i);
		fireEvent.keyDown(input, {key: "Escape"});
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
	it("backdrop click closes the palette", () => {
		let onOpenChange=vi.fn();
		render(() => <CommandPalette open={true} onOpenChange={onOpenChange} commands={sampleCommands()} />);
		let dialog=screen.getByRole("dialog");
		fireEvent.click(dialog);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
	it("Ctrl+K toggles open state from closed to open", () => {
		let onOpenChange=vi.fn();
		render(() => <CommandPalette open={false} onOpenChange={onOpenChange} commands={[]} />);
		fireEvent.keyDown(document, {key: "k", ctrlKey: true});
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});
	it("Ctrl+K toggles open state from open to closed", () => {
		let onOpenChange=vi.fn();
		render(() => <CommandPalette open={true} onOpenChange={onOpenChange} commands={[]} />);
		fireEvent.keyDown(document, {key: "k", ctrlKey: true});
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
	it("Cmd+K toggles open state (mac meta key)", () => {
		let onOpenChange=vi.fn();
		render(() => <CommandPalette open={false} onOpenChange={onOpenChange} commands={[]} />);
		fireEvent.keyDown(document, {key: "k", metaKey: true});
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});
	it("clicking a command executes it and closes", () => {
		let performed=vi.fn();
		let onOpenChange=vi.fn();
		let commands: Command[]=[
			{id: "a", label: "Alpha", section: "Actions", perform: performed},
		];
		render(() => <CommandPalette open={true} onOpenChange={onOpenChange} commands={commands} />);
		fireEvent.click(screen.getByText("Alpha"));
		expect(performed).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
	it("createDefaultCommands returns all expected command ids", () => {
		let commands=createDefaultCommands({});
		let ids=commands.map((c) => c.id);
		expect(ids).toContain("start-practice");
		expect(ids).toContain("open-settings");
		expect(ids).toContain("print-worksheet");
		expect(ids).toContain("view-progress");
		expect(ids).toContain("toggle-theme");
		expect(ids).toContain("open-shortcuts");
		expect(ids).toContain("resume-session");
		expect(ids).toContain("clear-data");
		expect(ids).toContain("export-data");
		expect(ids).toContain("go-playground");
		expect(ids).toContain("go-spec-editor");
		expect(ids).toContain("go-wizard");
		expect(ids).toContain("go-dx-dashboard");
	});
	it("createDefaultCommands navigation command sets window.location.hash", () => {
		let commands=createDefaultCommands({});
		let playground=commands.find((c) => c.id === "go-playground");
		expect(playground).toBeTruthy();
		playground!.perform();
		expect(window.location.hash).toBe("#/playground");
	});
	it("createDefaultCommands action command invokes the supplied callback", () => {
		let onOpenSettings=vi.fn();
		let commands=createDefaultCommands({onOpenSettings});
		let settings=commands.find((c) => c.id === "open-settings");
		settings!.perform();
		expect(onOpenSettings).toHaveBeenCalledOnce();
	});
	it("createDefaultCommands action command is a no-op when callback omitted", () => {
		let commands=createDefaultCommands({});
		let settings=commands.find((c) => c.id === "open-settings");
		expect(() => settings!.perform()).not.toThrow();
	});
	it("uses the default command registry when no commands prop is supplied", () => {
		render(() => <CommandPalette open={true} onOpenChange={() => {}} />);
		expect(screen.getByText("Start Practice")).toBeInTheDocument();
		expect(screen.getByText("Go to DX Dashboard")).toBeInTheDocument();
	});
});
