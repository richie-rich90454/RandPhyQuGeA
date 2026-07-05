/**
 * Orchestrates loading the bundled default specification and parsing it
 * through the OOP {@link SpecService}.
 */
import {useCallback} from "react";
import {useServices} from "./useServices";
import {useSpecStore} from "../stores/specStore";
import {loadDefaultSpec} from "../services/physicsCore";
import type {SpecError} from "../stores/specStore";
export function useSpecLoader(): {load: () => Promise<void>} {
	let specService=useServices().spec;
	let setSpecification=useSpecStore(state => state.setSpecification);
	let setLoading=useSpecStore(state => state.setLoading);
	let setError=useSpecStore(state => state.setError);
	let setEmpty=useSpecStore(state => state.setEmpty);
	let load=useCallback(async () => {
		setLoading(true);
		setError(null);
		setEmpty(false);
		let text: string;
		try {
			text=await loadDefaultSpec();
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			let error: SpecError={type: err instanceof Error ? "network" : "unknown", message};
			setError(error);
			setLoading(false);
			return;
		}
		try {
			let specification=await specService.loadSpec(text);
			setSpecification(specification);
			setLoading(false);
			setEmpty(specification.topics.length===0 && specification.templates.length===0);
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			let details=err instanceof Error ? err.stack : undefined;
			let error: SpecError={type: err instanceof Error ? "parse" : "unknown", message, details};
			setError(error);
			setLoading(false);
		}
	}, [specService, setSpecification, setLoading, setError, setEmpty]);
	return {load};
}
