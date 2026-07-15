/**
 * Application-level UI store (non-persisted), Solid port.
 *
 * Mirrors {@link ../../stores/uiStore}: holds ephemeral view state not tied to
 * a practice session — the topic search query and which modal (if any) is
 * currently open. Modal components read `activeModal` to decide whether to
 * render. Exposed as a Solid reactive primitive through {@link createSolidStore}.
 */
import {createStore} from "zustand/vanilla";
import {createSolidStore} from "./createSolidStore";
/** Identifiers for the modal overlays managed by the shell. */
export type ModalId = "onboarding" | "help" | "shortcuts" | "settings" | "print" | "recommend" | "manage-data" | "resume-session" | "formulas" | "unit-converter" | "glossary";
export interface UiState {
	searchQuery: string;
	activeModal: ModalId | null;
	setSearchQuery: (query: string) => void;
	openModal: (id: ModalId) => void;
	closeModal: () => void;
	replaceModal: (id: ModalId) => void;
}
const uiStore=createStore<UiState>()(set => ({
	searchQuery: "",
	activeModal: null,
	setSearchQuery: query => set({searchQuery: query}),
	openModal: id => set({activeModal: id}),
	closeModal: () => set({activeModal: null}),
	replaceModal: id => set({activeModal: id}),
}));
export const useUiStore=createSolidStore<UiState>(uiStore);
