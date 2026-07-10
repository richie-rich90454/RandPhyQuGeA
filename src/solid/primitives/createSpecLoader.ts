import {createSignal, onMount} from "solid-js";
import type {Accessor} from "solid-js";
import {useSpecStore} from "../stores/specStore";
import type {SpecState, SpecError} from "../stores/specStore";
import type {SolidStore} from "../stores/createSolidStore";
import type {ISpecService} from "../../services/contracts";
import {SpecService} from "../../services/SpecService";
import {PhysicsService} from "../../services/PhysicsService";
import {loadDefaultSpec} from "../../services/physicsCore";
import {useServiceProvider} from "../providers/ServiceProvider";
import type {Specification} from "../../types/models";
export interface CreateSpecLoaderOptions {
	specStore?: SolidStore<SpecState>;
	specService?: ISpecService;
	loadDefaultSpec?: () => Promise<string>;
	autoLoad?: boolean;
}
export interface CreateSpecLoaderReturn {
	load: () => Promise<void>;
	loading: Accessor<boolean>;
	error: Accessor<SpecError | null>;
}
/**
 * Load the bundled default specification and parse it through the OOP
 * {@link SpecService}.
 *
 * Solid port of {@link ../../hooks/useSpecLoader}: exposes `loading`/`error`
 * signals (returned as accessors) and mirrors the same state into the shared
 * spec store so other components can subscribe. `load` fetches the default spec
 * text, parses it, and records network/parse errors with the same taxonomy as
 * the React hook. When `autoLoad` is enabled (default) the load is triggered on
 * mount via `onMount`. The spec service is injectable; when omitted it is built
 * lazily from the {@link useServiceProvider} core.
 */
export function createSpecLoader(options: CreateSpecLoaderOptions = {}): CreateSpecLoaderReturn {
	let store=options.specStore ?? useSpecStore;
	let loadDefault=options.loadDefaultSpec ?? loadDefaultSpec;
	let cachedSpecService: ISpecService | null=null;
	let resolveSpecService=(): ISpecService => {
		if (options.specService) {
			return options.specService;
		}
		if (!cachedSpecService) {
			let {core}=useServiceProvider();
			cachedSpecService=new SpecService(new PhysicsService(core));
		}
		return cachedSpecService;
	};
	let [loading, setLoading]=createSignal(false);
	let [error, setError]=createSignal<SpecError | null>(null);
	let load=async () => {
		setLoading(true);
		setError(null);
		store.getState().setLoading(true);
		store.getState().setError(null);
		store.getState().setEmpty(false);
		let text: string;
		try {
			text=await loadDefault();
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			let specError: SpecError={type: err instanceof Error ? "network" : "unknown", message};
			setError(specError);
			store.getState().setError(specError);
			store.getState().setLoading(false);
			setLoading(false);
			return;
		}
		try {
			let specService=resolveSpecService();
			let specification: Specification=await specService.loadSpec(text);
			store.getState().setSpecification(specification);
			store.getState().setLoading(false);
			store.getState().setEmpty(specification.topics.length===0 && specification.templates.length===0);
			setLoading(false);
		} catch (err) {
			let message=err instanceof Error ? err.message : String(err);
			let details=err instanceof Error ? err.stack : undefined;
			let specError: SpecError={type: err instanceof Error ? "parse" : "unknown", message, details};
			setError(specError);
			store.getState().setError(specError);
			store.getState().setLoading(false);
			setLoading(false);
		}
	};
	if (options.autoLoad !== false) {
		onMount(() => {
			void load();
		});
	}
	return {load, loading, error};
}
