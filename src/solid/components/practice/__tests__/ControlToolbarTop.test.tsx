import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {ControlToolbarTop} from "../ControlToolbarTop";
describe("ControlToolbarTop", () => {
	it("renders slotted children inside the top toolbar row", () => {
		render(() => (
			<ControlToolbarTop>
				<span data-testid="mode">Mode</span>
				<span data-testid="topics">Topics</span>
			</ControlToolbarTop>
		));
		expect(screen.getByTestId("mode")).toBeInTheDocument();
		expect(screen.getByTestId("topics")).toBeInTheDocument();
	});
	it("renders without children", () => {
		let {container} = render(() => <ControlToolbarTop />);
		expect(container.firstChild).not.toBeNull();
	});
	it("applies an extra class", () => {
		let {container} = render(() => <ControlToolbarTop class="extra">x</ControlToolbarTop>);
		let row = container.firstChild as HTMLElement;
		expect(row.className).toContain("extra");
	});
});
