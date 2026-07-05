/**
 * Parsed specification store.
 *
 * Holds only UI state for the parsed specification. Loading and parsing are
 * delegated to the OOP service layer via {@link useSpecLoader}.
 */
import {create} from "zustand";
import type {Specification} from "../types/models";
export interface SpecError {
	type: "parse" | "network" | "unknown";
	message: string;
	details?: string;
}
export interface SpecState {
	specification: Specification | null;
	loading: boolean;
	error: SpecError | null;
	empty: boolean;
	setSpecification: (specification: Specification | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: SpecError | null) => void;
	setEmpty: (empty: boolean) => void;
	reset: () => void;
}
const initialState={
	specification: null as Specification | null,
	loading: false,
	error: null as SpecError | null,
	empty: true,
};
export const useSpecStore=create<SpecState>()(set => ({
	...initialState,
	setSpecification: specification => set({specification}),
	setLoading: loading => set({loading}),
	setError: error => set({error}),
	setEmpty: empty => set({empty}),
	reset: () => set({...initialState}),
}));
