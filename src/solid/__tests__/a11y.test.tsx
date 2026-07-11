import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {AppShell} from "../components/layout/AppShell";
import {A11yLiveRegion} from "../components/A11yLiveRegion";
import {Button, Modal, Tabs, TabsList, TabsTrigger, TabsContent, Switch, ProgressBar, Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator, Accordion, AccordionItem, AccordionTrigger, AccordionContent} from "../components/ui";
import {QuestionCard} from "../components/practice/QuestionCard";
import {usePracticeStore} from "../stores/practiceStore";
import {useProgressStore} from "../stores/progressStore";
import {useSettingsStore} from "../stores/settingsStore";
import {useSpecStore} from "../stores/specStore";
import {useUiStore} from "../stores/uiStore";
import type {Session} from "../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../types/models";
function makeSpec(): Specification {
	return {
		units: [{id: "u1", name: "Mechanics", description: ""}],
		topics: [{id: "t1", name: "Kinematics", unit_id: "u1", description: ""}],
		skills: [],
		templates: [],
	};
}
function makeMcqQuestion(): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "MC",
		difficulty: 2,
		text: "What is the force?",
		answer: "4 N",
		response_mode: "mcq",
		choices: ["2 N", "4 N", "6 N", "8 N"],
		correct_choice_index: 1,
		solution_text: "",
		solution_latex: "",
		variables: {},
	};
}
function makeSession(question: GeneratedQuestion): Session {
	let now=Date.now();
	return {
		id: "sess1",
		specification: makeSpec(),
		questions: [question],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: now,
		sessionStartTime: now,
	};
}
function resetStores() {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
}
beforeEach(() => {
	resetStores();
});
describe("accessibility", () => {
	it("AppShell provides a skip-link targeting the main landmark", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Content</div>
			</AppShell>
		));
		let skipLink=screen.getByRole("link", {name: /skip to main content/i});
		expect(skipLink.getAttribute("href")).toBe("#main-content");
	});
	it("AppShell exposes header, nav, main, and contentinfo landmarks", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Content</div>
			</AppShell>
		));
		expect(screen.getByRole("banner")).toBeInTheDocument();
		expect(screen.getByRole("main")).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
	});
	it("AppShell main landmark has tabindex=-1 for programmatic focus", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Content</div>
			</AppShell>
		));
		expect(screen.getByRole("main").getAttribute("tabindex")).toBe("-1");
	});
	it("A11yLiveRegion renders role=status with aria-live=polite by default", () => {
		render(() => <A11yLiveRegion message="Loaded" />);
		let region=screen.getByTestId("a11y-live-region");
		expect(region).toHaveAttribute("role", "status");
		expect(region).toHaveAttribute("aria-live", "polite");
	});
	it("A11yLiveRegion supports assertive politeness", () => {
		render(() => <A11yLiveRegion message="Error" politeness="assertive" />);
		expect(screen.getByTestId("a11y-live-region")).toHaveAttribute("aria-live", "assertive");
	});
	it("Modal exposes role=dialog with aria-modal=true", () => {
		render(() => <Modal open={true} onClose={() => {}} title="Dialog"><p>Body</p></Modal>);
		let dialog=screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
	});
	it("Modal close button has an accessible name", () => {
		render(() => <Modal open={true} onClose={() => {}} title="Dialog"><p>Body</p></Modal>);
		expect(screen.getByRole("button", {name: /close dialog/i})).toBeInTheDocument();
	});
	it("Button renders as a button element with accessible name", () => {
		render(() => <Button onClick={() => {}}>Submit</Button>);
		expect(screen.getByRole("button", {name: /submit/i})).toBeInTheDocument();
	});
	it("Tabs exposes tablist, tab, and tabpanel roles with aria-selected", () => {
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
		expect(screen.getByRole("tablist")).toBeInTheDocument();
		let tabs=screen.getAllByRole("tab");
		expect(tabs).toHaveLength(2);
		expect(tabs[0]).toHaveAttribute("aria-selected", "true");
		expect(tabs[1]).toHaveAttribute("aria-selected", "false");
		expect(screen.getByRole("tabpanel")).toBeInTheDocument();
	});
	it("Switch exposes role=switch with aria-checked reflecting state", () => {
		let handler=vi.fn();
		render(() => <Switch label="Auto" onCheckedChange={handler} />);
		let sw=screen.getByRole("switch");
		expect(sw).toHaveAttribute("aria-checked", "false");
		fireEvent.click(sw);
		expect(sw).toHaveAttribute("aria-checked", "true");
	});
	it("ProgressBar exposes role=progressbar with aria-valuenow/min/max", () => {
		render(() => <ProgressBar value={60} ariaLabel="Progress" />);
		let bar=screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuenow", "60");
		expect(bar).toHaveAttribute("aria-valuemin", "0");
		expect(bar).toHaveAttribute("aria-valuemax", "100");
	});
	it("Toolbar exposes role=toolbar with aria-label", () => {
		render(() => (
			<Toolbar label="Actions">
				<ToolbarGroup label="Group">
					<ToolbarItem onClick={() => {}}>A</ToolbarItem>
				</ToolbarGroup>
				<ToolbarSeparator />
			</Toolbar>
		));
		expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "Actions");
	});
	it("Accordion trigger is a button controlling expanded state", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		let trigger=screen.getByRole("button", {name: /section a/i});
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});
	it("QuestionCard MCQ renders radiogroup with radio buttons and aria-checked", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeMcqQuestion())});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		let radios=screen.getAllByRole("radio");
		expect(radios).toHaveLength(4);
		expect(radios[0]).toHaveAttribute("aria-checked", "false");
		fireEvent.click(radios[1]!);
		expect(radios[1]).toHaveAttribute("aria-checked", "true");
	});
});
