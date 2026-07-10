import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import type {Accessor} from "solid-js";
import {createMediaQuery} from "../createMediaQuery";
type MqlListener=(event: MediaQueryListEvent) => void;
interface MqlMock {
	matches: boolean;
	media: string;
	onchange: null;
	addEventListener: (type: string, listener: MqlListener) => void;
	removeEventListener: (type: string, listener: MqlListener) => void;
	addListener: () => void;
	removeListener: () => void;
	dispatchEvent: () => boolean;
}
interface MatchMediaMock {
	(query: string): MqlMock;
	setMatches: (query: string, value: boolean) => void;
}
function createMatchMediaMock(): MatchMediaMock {
	let byQuery=new Map<string, {matches: boolean, listeners: Set<MqlListener>}>();
	let ensure=(query: string) => {
		let entry=byQuery.get(query);
		if (!entry) {
			entry={matches: false, listeners: new Set()};
			byQuery.set(query, entry);
		}
		return entry;
	};
	let fn: MatchMediaMock=Object.assign(
		(query: string): MqlMock => {
			let entry=ensure(query);
			return {
				get matches() {
					return entry.matches;
				},
				media: query,
				onchange: null,
				addEventListener: (type, listener) => {
					if (type === "change") {
						entry.listeners.add(listener);
					}
				},
				removeEventListener: (type, listener) => {
					if (type === "change") {
						entry.listeners.delete(listener);
					}
				},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false,
			};
		},
		{
			setMatches: (query: string, value: boolean) => {
				let entry=ensure(query);
				entry.matches=value;
				entry.listeners.forEach(listener => listener({matches: value, media: query} as MediaQueryListEvent));
			},
		},
	);
	return fn;
}
let matchMediaMock: MatchMediaMock;
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
let result: Accessor<boolean> | null=null;
function makeRootStatic(query: string): () => JSX.Element {
	return () => {
		result=createMediaQuery(query);
		return <div>mq</div>;
	};
}
function makeRootReactive(querySignal: Accessor<string>): () => JSX.Element {
	return () => {
		result=createMediaQuery(querySignal);
		return <div>mq</div>;
	};
}
beforeEach(() => {
	matchMediaMock=createMatchMediaMock();
	Object.defineProperty(window, "matchMedia", {writable: true, value: matchMediaMock});
	result=null;
});
describe("createMediaQuery", () => {
	it("returns the initial match for a static query string", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", true);
		render(makeRootStatic("(min-width: 768px)"));
		await flush();
		expect(result!()).toBe(true);
	});
	it("returns false when the query does not match", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", false);
		render(makeRootStatic("(min-width: 768px)"));
		await flush();
		expect(result!()).toBe(false);
	});
	it("updates when the media query match changes", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", false);
		render(makeRootStatic("(min-width: 768px)"));
		await flush();
		expect(result!()).toBe(false);
		matchMediaMock.setMatches("(min-width: 768px)", true);
		expect(result!()).toBe(true);
		matchMediaMock.setMatches("(min-width: 768px)", false);
		expect(result!()).toBe(false);
	});
	it("re-subscribes when a reactive query changes", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", false);
		matchMediaMock.setMatches("(min-width: 1200px)", true);
		let [query, setQuery]=createSignal("(min-width: 768px)");
		render(makeRootReactive(query));
		await flush();
		expect(result!()).toBe(false);
		setQuery("(min-width: 1200px)");
		await flush();
		expect(result!()).toBe(true);
		matchMediaMock.setMatches("(min-width: 1200px)", false);
		expect(result!()).toBe(false);
	});
	it("does not react to the old query after re-subscribing", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", false);
		matchMediaMock.setMatches("(min-width: 1200px)", false);
		let [query, setQuery]=createSignal("(min-width: 768px)");
		render(makeRootReactive(query));
		await flush();
		expect(result!()).toBe(false);
		setQuery("(min-width: 1200px)");
		await flush();
		matchMediaMock.setMatches("(min-width: 768px)", true);
		expect(result!()).toBe(false);
	});
	it("stops updating after disposal", async () => {
		matchMediaMock.setMatches("(min-width: 768px)", false);
		let rendered=render(makeRootStatic("(min-width: 768px)"));
		await flush();
		expect(result!()).toBe(false);
		rendered.unmount();
		matchMediaMock.setMatches("(min-width: 768px)", true);
		expect(result!()).toBe(false);
	});
});
