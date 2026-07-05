import {describe, it, expect, beforeEach} from "vitest";
import {useUiStore, type ModalId} from "../uiStore";
describe("uiStore", () => {
	beforeEach(() => {
		useUiStore.setState({searchQuery: "", activeModal: null});
	});
	describe("initial state", () => {
		it("has an empty searchQuery and no active modal", () => {
			const state=useUiStore.getState();
			expect(state.searchQuery).toBe("");
			expect(state.activeModal).toBeNull();
		});
	});
	describe("setSearchQuery", () => {
		it("updates the search query", () => {
			useUiStore.getState().setSearchQuery("kinematics");
			expect(useUiStore.getState().searchQuery).toBe("kinematics");
		});
	});
	describe("openModal", () => {
		it("sets the active modal", () => {
			useUiStore.getState().openModal("help");
			expect(useUiStore.getState().activeModal).toBe("help");
		});
		it("replaces any previously open modal", () => {
			const store=useUiStore.getState();
			store.openModal("onboarding");
			store.openModal("settings");
			expect(useUiStore.getState().activeModal).toBe("settings");
		});
	});
	describe("closeModal", () => {
		it("clears the active modal", () => {
			const store=useUiStore.getState();
			store.openModal("print");
			store.closeModal();
			expect(useUiStore.getState().activeModal).toBeNull();
		});
	});
	describe("replaceModal", () => {
		it("swaps to a new modal atomically", () => {
			const store=useUiStore.getState();
			store.openModal("onboarding");
			store.replaceModal("settings");
			const state=useUiStore.getState();
			expect(state.activeModal).toBe("settings");
			expect(state.searchQuery).toBe("");
		});
		it("opens a modal when none was open", () => {
			useUiStore.getState().replaceModal("recommend");
			expect(useUiStore.getState().activeModal).toBe("recommend");
		});
	});
	describe("type safety", () => {
		it("rejects invalid modal ids at compile time", () => {
			const assertType=(id: ModalId) => id;
			// @ts-expect-error "invalid" is not a valid ModalId
			assertType("invalid");
		});
	});
});
