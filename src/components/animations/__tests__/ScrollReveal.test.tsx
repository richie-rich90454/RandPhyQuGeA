import {describe, it, expect, vi, beforeEach} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {ScrollReveal} from "../ScrollReveal";
import {useReducedMotion} from "../../../hooks/useReducedMotion";
type GsapContextResult = {revert: () => void};
type GsapSetup = () => void;
type FromVars = Record<string, unknown>;
type ToVars = Record<string, unknown>;
const mockRevert = vi.hoisted(() => vi.fn<() => void>());
const mockFromTo = vi.hoisted(() => vi.fn<(target: unknown, fromVars: FromVars, toVars: ToVars) => void>());
const mockContext = vi.hoisted(() => vi.fn<(setup: GsapSetup, _scope: unknown) => GsapContextResult>((setup) => {
	setup();
	return {revert: mockRevert};
}));
vi.mock("gsap", () => ({
	default: {
		context: mockContext,
		fromTo: mockFromTo,
		registerPlugin: vi.fn<() => void>(),
	},
}));
vi.mock("gsap/ScrollTrigger", () => ({
	ScrollTrigger: {},
}));
vi.mock("../../../hooks/useReducedMotion", () => ({
	useReducedMotion: vi.fn<() => {reducedMotion: boolean}>(() => ({reducedMotion: false})),
}));
describe("ScrollReveal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useReducedMotion).mockReturnValue({reducedMotion: false});
	});
	it("renders children", () => {
		render(<ScrollReveal><p>Hello</p></ScrollReveal>);
		expect(screen.getByText("Hello")).toBeTruthy();
	});
	it("sets initial opacity to 0 when motion is allowed", () => {
		const {container} = render(<ScrollReveal><p>Hello</p></ScrollReveal>);
		const wrapper = container.firstChild;
		expect(wrapper).toBeInstanceOf(HTMLElement);
		expect((wrapper as HTMLElement).style.opacity).toBe("0");
	});
	it("skips animation and renders visible when reduced motion is enabled", () => {
		vi.mocked(useReducedMotion).mockReturnValue({reducedMotion: true});
		const {container} = render(<ScrollReveal><p>Hello</p></ScrollReveal>);
		const wrapper = container.firstChild;
		expect(wrapper).toBeInstanceOf(HTMLElement);
		expect((wrapper as HTMLElement).style.opacity).toBe("");
		expect(mockFromTo).not.toHaveBeenCalled();
	});
	it("registers GSAP plugins and creates a ScrollTrigger tween", async () => {
		render(<ScrollReveal direction="up" distance={16}><p>Hello</p></ScrollReveal>);
		await waitFor(() => {
			expect(mockContext).toHaveBeenCalled();
			expect(mockFromTo).toHaveBeenCalled();
		});
		const call = mockFromTo.mock.calls[0];
		expect(call).toBeDefined();
		expect(call?.[1]).toMatchObject({opacity: 0, y: 16});
		expect(call?.[2]).toMatchObject({opacity: 1, y: 0});
		expect(call?.[2].scrollTrigger).toMatchObject({start: "top 85%", once: true});
	});
	it("applies directional transforms", async () => {
		render(<ScrollReveal direction="left" distance={32}><p>Hello</p></ScrollReveal>);
		await waitFor(() => expect(mockFromTo).toHaveBeenCalled());
		const call = mockFromTo.mock.calls[0];
		expect(call?.[1]).toMatchObject({opacity: 0, x: 32});
	});
	it("reverts the GSAP context on unmount", async () => {
		const {unmount} = render(<ScrollReveal><p>Hello</p></ScrollReveal>);
		await waitFor(() => expect(mockContext).toHaveBeenCalled());
		unmount();
		expect(mockRevert).toHaveBeenCalled();
	});
	it("renders a custom element via the as prop", () => {
		const {container} = render(<ScrollReveal as="li"><p>Hello</p></ScrollReveal>);
		expect(container.querySelector("li")).toBeTruthy();
	});
});
