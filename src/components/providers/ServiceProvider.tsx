"use client";
import {createContext, ReactNode} from "react";
import {ServiceContainer, defaultContainer} from "../../services/container";
export const ServiceContext=createContext<ServiceContainer|null>(null);
export interface ServiceProviderProps {
	children?: ReactNode;
	container?: ServiceContainer;
}
export function ServiceProvider({children, container=defaultContainer}: ServiceProviderProps) {
	return (
		<ServiceContext.Provider value={container}>
			{children}
		</ServiceContext.Provider>
	);
}
