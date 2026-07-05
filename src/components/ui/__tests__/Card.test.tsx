import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter} from "../Card";
function getCard(): HTMLDivElement {
	return screen.getByTestId<HTMLDivElement>("card");
}
describe("Card", () => {
	it("renders default variant", () => {
		render(<Card data-testid="card">Content</Card>);
		const card=getCard();
		expect(card.tagName).toBe("DIV");
		expect(card.classList.contains("card")).toBe(true);
		expect(card.classList.contains("bg-surface")).toBe(true);
		expect(card.classList.contains("rounded-lg")).toBe(true);
		expect(card.classList.contains("p-3")).toBe(true);
	});
	it("applies default variant classes", () => {
		render(<Card variant="default" data-testid="card" />);
		const card=getCard();
		expect(card.classList.contains("bg-surface")).toBe(true);
		expect(card.classList.contains("border")).toBe(true);
		expect(card.classList.contains("border-border")).toBe(true);
		expect(card.classList.contains("shadow-rest")).toBe(true);
	});
	it("applies hover variant classes", () => {
		render(<Card variant="hover" data-testid="card" />);
		const card=getCard();
		expect(card.classList.contains("bg-surface")).toBe(true);
		expect(card.classList.contains("hover:-translate-y-0.5")).toBe(true);
		expect(card.classList.contains("hover:shadow-hover")).toBe(true);
	});
	it("applies filled variant classes", () => {
		render(<Card variant="filled" data-testid="card" />);
		const card=getCard();
		expect(card.classList.contains("bg-surface-elevated")).toBe(true);
		expect(card.classList.contains("shadow-rest")).toBe(true);
	});
	it("applies outline variant classes", () => {
		render(<Card variant="outline" data-testid="card" />);
		const card=getCard();
		expect(card.classList.contains("bg-transparent")).toBe(true);
		expect(card.classList.contains("border")).toBe(true);
		expect(card.classList.contains("border-border")).toBe(true);
	});
	it("applies layer-02 variant classes", () => {
		render(<Card variant="layer-02" data-testid="card" />);
		const card=getCard();
		expect(card.classList.contains("bg-[rgb(var(--layer-02))]")).toBe(true);
		expect(card.classList.contains("shadow-rest")).toBe(true);
	});
	it("applies none padding", () => {
		render(<Card padding="none" data-testid="card" />);
		expect(getCard().classList.contains("p-0")).toBe(true);
	});
	it("applies sm padding", () => {
		render(<Card padding="sm" data-testid="card" />);
		expect(getCard().classList.contains("p-2")).toBe(true);
	});
	it("applies md padding by default", () => {
		render(<Card data-testid="card" />);
		expect(getCard().classList.contains("p-3")).toBe(true);
	});
	it("applies lg padding", () => {
		render(<Card padding="lg" data-testid="card" />);
		expect(getCard().classList.contains("p-4")).toBe(true);
	});
	it("applies xl padding", () => {
		render(<Card padding="xl" data-testid="card" />);
		expect(getCard().classList.contains("p-5")).toBe(true);
	});
	it("renders as section via polymorphic as prop", () => {
		render(<Card as="section" data-testid="card" />);
		expect(getCard().tagName).toBe("SECTION");
	});
	it("renders as article via polymorphic as prop", () => {
		render(<Card as="article" data-testid="card" />);
		const card=screen.getByTestId("card");
		expect(card.tagName).toBe("ARTICLE");
	});
	it("renders as li via polymorphic as prop", () => {
		render(<Card as="li" data-testid="card" />);
		const card=screen.getByTestId("card");
		expect(card.tagName).toBe("LI");
	});
	it("forwards refs", () => {
		let element: HTMLDivElement | null=null;
		render(<Card ref={el => {element=el;}} data-testid="card" />);
		expect(element).toBe(getCard());
	});
	it("renders CardHeader with utility classes", () => {
		render(<CardHeader data-testid="header">Header</CardHeader>);
		const header=screen.getByTestId<HTMLDivElement>("header");
		expect(header.classList.contains("card-header")).toBe(true);
		expect(header.classList.contains("flex")).toBe(true);
		expect(header.classList.contains("justify-between")).toBe(true);
		expect(header.classList.contains("border-b")).toBe(true);
	});
	it("renders CardTitle with utility classes", () => {
		render(<CardTitle data-testid="title">Title</CardTitle>);
		const title=screen.getByTestId<HTMLHeadingElement>("title");
		expect(title.tagName).toBe("H2");
		expect(title.classList.contains("card-title")).toBe(true);
		expect(title.classList.contains("text-sm")).toBe(true);
		expect(title.classList.contains("font-semibold")).toBe(true);
	});
	it("renders CardSubtitle with utility classes", () => {
		render(<CardSubtitle data-testid="subtitle">Subtitle</CardSubtitle>);
		const subtitle=screen.getByTestId<HTMLDivElement>("subtitle");
		expect(subtitle.classList.contains("card-subtitle")).toBe(true);
		expect(subtitle.classList.contains("text-xs")).toBe(true);
		expect(subtitle.classList.contains("text-text-secondary")).toBe(true);
	});
	it("renders CardContent with utility classes", () => {
		render(<CardContent data-testid="content">Content</CardContent>);
		const content=screen.getByTestId<HTMLDivElement>("content");
		expect(content.classList.contains("card-content")).toBe(true);
		expect(content.classList.contains("w-full")).toBe(true);
		expect(content.classList.contains("p-3")).toBe(true);
	});
	it("renders CardFooter with utility classes", () => {
		render(<CardFooter data-testid="footer">Footer</CardFooter>);
		const footer=screen.getByTestId<HTMLDivElement>("footer");
		expect(footer.classList.contains("card-footer")).toBe(true);
		expect(footer.classList.contains("flex")).toBe(true);
		expect(footer.classList.contains("justify-end")).toBe(true);
		expect(footer.classList.contains("border-t")).toBe(true);
	});
});
