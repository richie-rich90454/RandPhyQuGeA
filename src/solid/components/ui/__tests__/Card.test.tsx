import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter} from "../Card";
describe("Card", () => {
	it("renders children inside a div by default", () => {
		let {container}=render(() => <Card>Body</Card>);
		expect(container.firstChild).toHaveProperty("tagName", "DIV");
		expect(screen.getByText("Body")).toBeInTheDocument();
	});
	it("renders as a custom element via as prop", () => {
		let {container}=render(() => <Card as="section">Body</Card>);
		expect(container.firstChild).toHaveProperty("tagName", "SECTION");
	});
	it("renders header, title, subtitle, content, and footer", () => {
		render(() => (
			<Card>
				<CardHeader>
					<CardTitle>Title</CardTitle>
					<CardSubtitle>Subtitle</CardSubtitle>
				</CardHeader>
				<CardContent>Content</CardContent>
				<CardFooter>Footer</CardFooter>
			</Card>
		));
		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Subtitle")).toBeInTheDocument();
		expect(screen.getByText("Content")).toBeInTheDocument();
		expect(screen.getByText("Footer")).toBeInTheDocument();
	});
	it("title renders as a heading", () => {
		render(() => <Card><CardTitle>My Title</CardTitle></Card>);
		expect(screen.getByRole("heading", {name: /my title/i})).toBeInTheDocument();
	});
	it("forwards extra div attributes", () => {
		render(() => <Card data-testid="card">Body</Card>);
		expect(screen.getByTestId("card")).toBeInTheDocument();
	});
});
