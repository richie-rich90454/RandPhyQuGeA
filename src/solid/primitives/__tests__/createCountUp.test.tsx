import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import type {Accessor} from "solid-js";
import {createCountUp} from "../createCountUp";
import type {CreateCountUpOptions} from "../createCountUp";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
let pending: Map<number, (timestamp: number) => void>=new Map();
let nextRafId=1;
let rafSpy: ReturnType<typeof vi.spyOn>;
let cancelSpy: ReturnType<typeof vi.spyOn>;
let result: Accessor<number> | null=null;
function makeRoot(opts: CreateCountUpOptions): () => JSX.Element {
	return () => {
		result=createCountUp(opts);
		return <div>count</div>;
	};
}
function tick(timestamp: number): void {
	let first=pending.entries().next();
	if (first.done) {
		return;
	}
	let [id, cb]=first.value;
	pending.delete(id);
	cb(timestamp);
}
beforeEach(() => {
	pending=new Map();
	nextRafId=1;
	rafSpy=vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
		let id=nextRafId++;
		pending.set(id, callback);
		return id;
	});
	cancelSpy=vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
		pending.delete(id);
	});
	result=null;
});
afterEach(() => {
	rafSpy.mockRestore();
	cancelSpy.mockRestore();
});
describe("createCountUp", () => {
	it("returns the target immediately when reduced motion is preferred", async () => {
		render(makeRoot({target: 42, reducedMotion: () => true}));
		expect(result!()).toBe(42);
		await flush();
		expect(result!()).toBe(42);
	});
	it("animates from zero toward the target over the duration", async () => {
		render(makeRoot({target: 100, duration: 100, reducedMotion: () => false}));
		await flush();
		expect(result!()).toBe(0);
		tick(0);
		expect(result!()).toBe(0);
		tick(50);
		expect(result!()).toBe(50);
		tick(100);
		expect(result!()).toBe(100);
		expect(pending.size).toBe(0);
	});
	it("updates the animation when the target changes", async () => {
		let [target, setTarget]=createSignal(50);
		render(makeRoot({target, duration: 50, reducedMotion: () => false}));
		await flush();
		tick(0);
		tick(50);
		expect(result!()).toBe(50);
		setTarget(80);
		await flush();
		expect(result!()).toBe(0);
		tick(0);
		tick(50);
		expect(result!()).toBe(80);
	});
	it("snaps to the target when reduced motion turns on mid-animation", async () => {
		let [reducedMotion, setReducedMotion]=createSignal(false);
		render(makeRoot({target: 100, duration: 100, reducedMotion}));
		await flush();
		tick(0);
		expect(result!()).toBe(0);
		setReducedMotion(true);
		await flush();
		expect(result!()).toBe(100);
		expect(pending.size).toBe(0);
	});
	it("cancels the pending animation frame on disposal", async () => {
		let rendered=render(makeRoot({target: 100, duration: 100, reducedMotion: () => false}));
		await flush();
		tick(0);
		expect(cancelSpy).not.toHaveBeenCalled();
		rendered.unmount();
		expect(cancelSpy).toHaveBeenCalled();
	});
	it("uses a default duration of 800ms when none is provided", async () => {
		render(makeRoot({target: 1000, reducedMotion: () => false}));
		await flush();
		tick(0);
		expect(result!()).toBe(0);
		tick(400);
		expect(result!()).toBe(500);
		tick(800);
		expect(result!()).toBe(1000);
	});
});
