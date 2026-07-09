/**
 * Parsed specification store, Solid port.
 *
 * Mirrors {@link ../../stores/specStore}: holds only UI state for the parsed
 * specification (the parsed spec, loading flag, error, and empty flag). Loading
 * and parsing are delegated to the OOP service layer via `useSpecLoader`. The
 * store is non-persisted and exposed as a Solid reactive primitive through
 * {@link createSolidStore}.
 */
import {createStore} from "zustand/vanilla";
import {createSolidStore} from "./createSolidStore";
import type {Specification} from "../../types/models";
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
const specStore=createStore<SpecState>()(set => ({
	...initialState,
	setSpecification: specification => set({specification}),
	setLoading: loading => set({loading}),
	setError: error => set({error}),
	setEmpty: empty => set({empty}),
	reset: () => set({...initialState}),
}));
export const useSpecStore=createSolidStore<SpecState>(specStore);
