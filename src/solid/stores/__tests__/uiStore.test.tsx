import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {useUiStore} from "../uiStore";
import type {UiState} from "../uiStore";
function ModalView(): JSX.Element {
    const modal = useUiStore(s => s.activeModal);
    return <div data-testid="modal">{modal() ?? "none"}</div>;
}
describe("solid uiStore", () => {
    beforeEach(() => {
        useUiStore.setState(useUiStore.getInitialState());
    });
    describe("initial state", () => {
        it("has an empty search query and no active modal", () => {
            const state: UiState = useUiStore.getState();
            expect(state.searchQuery).toBe("");
            expect(state.activeModal).toBeNull();
        });
    });
    describe("setSearchQuery", () => {
        it("updates the search query", () => {
            useUiStore.getState().setSearchQuery("forces");
            expect(useUiStore.getState().searchQuery).toBe("forces");
        });
    });
    describe("openModal", () => {
        it("sets the active modal", () => {
            useUiStore.getState().openModal("settings");
            expect(useUiStore.getState().activeModal).toBe("settings");
        });
    });
    describe("closeModal", () => {
        it("clears the active modal", () => {
            useUiStore.getState().openModal("settings");
            useUiStore.getState().closeModal();
            expect(useUiStore.getState().activeModal).toBeNull();
        });
    });
    describe("replaceModal", () => {
        it("atomically swaps the active modal", () => {
            useUiStore.getState().openModal("settings");
            useUiStore.getState().replaceModal("print");
            expect(useUiStore.getState().activeModal).toBe("print");
        });
    });
    describe("reactive subscription", () => {
        it("updates a rendered accessor when openModal fires", () => {
            render(() => <ModalView />);
            expect(screen.getByTestId("modal").textContent).toBe("none");
            useUiStore.getState().openModal("settings");
            expect(screen.getByTestId("modal").textContent).toBe("settings");
        });
    });
});
