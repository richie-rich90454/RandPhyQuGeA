import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import type {JSX} from "solid-js";
import {
	Button,
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Modal,
	Input,
	Select,
	Slider,
	Switch,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	Badge,
	Pill,
	ProgressBar,
	Spinner,
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
	EmptyState,
	ConfirmDialog,
	Toolbar,
	ToolbarGroup,
	ToolbarItem,
	ToolbarSeparator,
} from "../../components/ui";
import {ToastProvider, useToast} from "../../components/ui/ToastProvider";
function ToastCaller(props: {message: string}): JSX.Element {
	let {toast} = useToast();
	return (
		<button type="button" onClick={() => toast({variant: "info", message: props.message, duration: 0})}>
			Fire
		</button>
	);
}
describe("ui primitives smoke", () => {
	it("Button renders and fires onClick", () => {
		let handler = vi.fn<() => void>();
		render(() => <Button onClick={handler}>Click</Button>);
		fireEvent.click(screen.getByRole("button", {name: /click/i}));
		expect(handler).toHaveBeenCalledTimes(1);
	});
	it("Card renders children with header and content", () => {
		render(() => (
			<Card>
				<CardHeader>
					<CardTitle>Title</CardTitle>
				</CardHeader>
				<CardContent>Body</CardContent>
			</Card>
		));
		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Body")).toBeInTheDocument();
	});
	it("Modal renders into a portal when open and closes on Escape", () => {
		let onClose = vi.fn<() => void>();
		render(() => (
			<Modal open={true} onClose={onClose} title="My Dialog">
				<p>Modal body</p>
			</Modal>
		));
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Modal body")).toBeInTheDocument();
		fireEvent.keyDown(document, {key: "Escape"});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("Input renders a label and accepts text entry", () => {
		render(() => <Input label="Name" placeholder="Enter name" />);
		expect(screen.getByLabelText("Name")).toBeInTheDocument();
	});
	it("Select renders options and fires onChange", () => {
		let handler = vi.fn<() => void>();
		render(() => (
			<Select
				label="Scope"
				options={[
					{value: "all", label: "All"},
					{value: "u1", label: "Unit 1"},
				]}
				onChange={handler}
			/>
		));
		let select = screen.getByLabelText("Scope") as HTMLSelectElement;
		expect(select.options.length).toBe(2);
		fireEvent.change(select, {target: {value: "u1"}});
		expect(handler).toHaveBeenCalledTimes(1);
	});
	it("Slider renders dual range thumbs and fires onChange", () => {
		let handler = vi.fn<(value: [number, number]) => void>();
		render(() => <Slider min={0} max={10} value={[2, 8]} onChange={handler} label="Range" />);
		let thumbs = screen.getAllByRole("slider");
		expect(thumbs).toHaveLength(2);
	});
	it("Switch toggles on click", () => {
		let handler = vi.fn<(checked: boolean) => void>();
		render(() => <Switch label="Auto" onCheckedChange={handler} />);
		let sw = screen.getByRole("switch");
		fireEvent.click(sw);
		expect(handler).toHaveBeenCalledWith(true);
	});
	it("Tabs renders tablist and switches panels on click", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Alpha</TabsContent>
				<TabsContent value="b">Beta</TabsContent>
			</Tabs>
		));
		expect(screen.getByText("Alpha")).toBeInTheDocument();
		expect(screen.queryByText("Beta")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("tab", {name: "B"}));
		expect(screen.getByText("Beta")).toBeInTheDocument();
	});
	it("Toast renders a toast via the provider API", () => {
		render(() => (
			<ToastProvider>
				<ToastCaller message="Hello toast" />
			</ToastProvider>
		));
		fireEvent.click(screen.getByRole("button", {name: "Fire"}));
		expect(screen.getByText("Hello toast")).toBeInTheDocument();
	});
	it("Tooltip renders content when the trigger is focused", () => {
		render(() => (
			<Tooltip defaultOpen={true}>
				<TooltipTrigger>
					<span>Hover me</span>
				</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		expect(screen.getByText("Hover me")).toBeInTheDocument();
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
	});
	it("Badge renders its children", () => {
		render(() => <Badge variant="success">New</Badge>);
		expect(screen.getByText("New")).toBeInTheDocument();
	});
	it("Pill renders and fires onClick", () => {
		let handler = vi.fn<() => void>();
		render(() => <Pill name="Mechanics" onClick={handler} />);
		fireEvent.click(screen.getByRole("button", {name: /mechanics/i}));
		expect(handler).toHaveBeenCalledTimes(1);
	});
	it("ProgressBar renders with an accessible role", () => {
		render(() => <ProgressBar value={50} ariaLabel="Completion" />);
		let bar = screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuenow", "50");
	});
	it("Spinner renders a loading indicator", () => {
		let {container} = render(() => <Spinner standalone={true} />);
		expect(container.querySelector("[role='status']")).toBeInTheDocument();
	});
	it("Accordion expands and collapses on trigger click", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Content A")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Section A"));
		expect(screen.queryByText("Content A")).not.toBeInTheDocument();
	});
	it("EmptyState renders title and description", () => {
		render(() => <EmptyState title="Nothing here" description="Try generating a question." />);
		expect(screen.getByText("Nothing here")).toBeInTheDocument();
		expect(screen.getByText("Try generating a question.")).toBeInTheDocument();
	});
	it("ConfirmDialog renders and fires onConfirm", () => {
		let onConfirm = vi.fn<() => void>();
		render(() => <ConfirmDialog open={true} title="Delete?" message="Are you sure?" onConfirm={onConfirm} onCancel={() => {}} />);
		expect(screen.getByText("Are you sure?")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", {name: /confirm/i}));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});
	it("Toolbar renders items with roving tabindex", () => {
		render(() => (
			<Toolbar label="Actions">
				<ToolbarGroup label="Group">
					<ToolbarItem onClick={() => {}}>A</ToolbarItem>
					<ToolbarItem onClick={() => {}}>B</ToolbarItem>
				</ToolbarGroup>
				<ToolbarSeparator />
			</Toolbar>
		));
		expect(screen.getByRole("toolbar")).toBeInTheDocument();
		expect(screen.getAllByRole("button")).toHaveLength(2);
	});
});
