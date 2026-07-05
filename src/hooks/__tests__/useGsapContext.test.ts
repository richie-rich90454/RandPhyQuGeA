import {describe, it, expect, vi, beforeEach} from "vitest";
import {renderHook} from "@testing-library/react";
import {useRef} from "react";
import {useGsapContext} from "../useGsapContext";
import gsap from "gsap";
vi.mock("gsap", () => ({
	default: {
		context: vi.fn<() => gsap.Context>(),
	},
}));
describe("useGsapContext", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it("returns null when the ref has no current element", () => {
		const {result} = renderHook(() => {
			const ref = useRef<HTMLDivElement | null>(null);
			return useGsapContext(ref, () => {});
		});
		expect(result.current).toBeNull();
	});
	it("creates a gsap context and returns it", () => {
		const mockContext = {revert: vi.fn<() => void>()};
		vi.mocked(gsap.context).mockReturnValue(mockContext as unknown as gsap.Context);
		const {result} = renderHook(() => {
			const ref = useRef<HTMLDivElement | null>(document.createElement("div"));
			return useGsapContext(ref, () => {});
		});
		expect(gsap.context).toHaveBeenCalled();
		expect(result.current).toBe(mockContext);
	});
	it("reverts the context on unmount", () => {
		const mockContext = {revert: vi.fn<() => void>()};
		vi.mocked(gsap.context).mockReturnValue(mockContext as unknown as gsap.Context);
		const {unmount} = renderHook(() => {
			const ref = useRef<HTMLDivElement | null>(document.createElement("div"));
			return useGsapContext(ref, () => {});
		});
		unmount();
		expect(mockContext.revert).toHaveBeenCalled();
	});
});
