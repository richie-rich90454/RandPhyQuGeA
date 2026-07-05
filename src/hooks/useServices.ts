import {useContext} from "react";
import {ServiceContext} from "../components/providers/ServiceProvider";
import {ServiceContainer} from "../services/container";
export function useServices(): ServiceContainer {
	let container=useContext(ServiceContext);
	if (!container) {
		throw new Error("useServices must be used within a ServiceProvider.");
	}
	return container;
}
