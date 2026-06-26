/**
 * Application-level UI store (non-persisted).
 *
 * Holds ephemeral view state that is not tied to a practice session: the
 * topic search query and which modal (if any) is currently open. Modal
 * components read `activeModal` to decide whether to render.
 */
import {create} from 'zustand';
/** Identifiers for the modal overlays managed by the shell. */
export type ModalId = 'onboarding' | 'help' | 'shortcuts' | 'settings' | 'print' | 'recommend' | 'manage-data';
export interface UiState {
	/** Current topic filter text. */
	searchQuery: string;
	/** Currently open modal, or null when none. */
	activeModal: ModalId | null;
	/** Replace the topic search query. */
	setSearchQuery: (query: string) => void;
	/** Open a modal by id (closing any other). */
	openModal: (id: ModalId) => void;
	/** Close the currently open modal. */
	closeModal: () => void;
}
export const useUiStore = create<UiState>()(set => ({
	searchQuery: '',
	activeModal: null,
	setSearchQuery: query => set({searchQuery: query}),
	openModal: id => set({activeModal: id}),
	closeModal: () => set({activeModal: null})
}));
