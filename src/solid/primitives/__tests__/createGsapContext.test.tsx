import {render} from "@solidjs/testing-library";
import {describe, it, expect, afterEach, vi} from "vitest";
import type {JSX, Accessor} from "solid-js";
import gsap from "gsap";
import {createGsapContext} from "../createGsapContext";
import type {GsapSetup} from "../createGsapContext";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
interface HostProps {
	scope?: Element | string;
	onReady: (ctx: Accessor<gsap.Context | null>) => void;
	setup: GsapSetup;
}
function Host(props: HostProps): JSX.Element {
	let ctx = createGsapContext({setup: props.setup, scope: props.scope});
	props.onReady(ctx);
	return <div>gsap</div>;
}
afterEach(() => {
	vi.restoreAllMocks();
});
describe("createGsapContext", () => {
	it("creates a gsap.Context on mount and invokes setup with it", async () => {
		let captured: {ctx: Accessor<gsap.Context | null>} | null = null;
		let setupContext: gsap.Context | null = null;
		render(() => (
			<Host
				onReady={ctx => {
					captured = {ctx};
				}}
				setup={ctx => {
					setupContext = ctx;
				}}
			/>
		));
		await flush();
		expect(captured).not.toBeNull();
		let context = captured!.ctx();
		expect(context).not.toBeNull();
		expect(context).toBe(setupContext);
	});
	it("reverts the context on unmount", async () => {
		let captured: {ctx: Accessor<gsap.Context | null>} | null = null;
		let result = render(() => (
			<Host
				onReady={ctx => {
					captured = {ctx};
				}}
				setup={() => {}}
			/>
		));
		await flush();
		let context = captured!.ctx();
		expect(context).not.toBeNull();
		expect(context!.isReverted).toBe(false);
		result.unmount();
		await flush();
		expect(context!.isReverted).toBe(true);
	});
	it("forwards the scope to gsap.context", async () => {
		let scope = document.createElement("div");
		document.body.appendChild(scope);
		let spy = vi.spyOn(gsap, "context");
		render(() => <Host scope={scope} onReady={() => {}} setup={() => {}} />);
		await flush();
		expect(spy).toHaveBeenCalled();
		expect(spy.mock.calls[0]?.[1]).toBe(scope);
		scope.remove();
	});
});
