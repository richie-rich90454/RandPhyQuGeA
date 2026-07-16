/** Service container wiring the OOP domain services with default collaborators. */
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService} from "./contracts";
import {PhysicsCore} from "../lib/physics";
import {PhysicsService} from "./PhysicsService";
import {AnalyticsService} from "./AnalyticsService";
import {ExportService} from "./ExportService";
import {SpecService} from "./SpecService";
import {SessionService} from "./SessionService";
export class ServiceContainer {
	public readonly physics: IPhysicsService;
	public readonly session: ISessionService;
	public readonly analytics: IAnalyticsService;
	public readonly export: IExportService;
	public readonly spec: ISpecService;
	public constructor(physics: IPhysicsService, session: ISessionService, analytics: IAnalyticsService, exportService: IExportService, spec: ISpecService) {
		this.physics = physics;
		this.session = session;
		this.analytics = analytics;
		this.export = exportService;
		this.spec = spec;
	}
	public static createDefault(): ServiceContainer {
		let core = PhysicsCore.default();
		let physics = new PhysicsService(core);
		let analytics = new AnalyticsService();
		let exportService = new ExportService();
		let spec = new SpecService(physics);
		let session = new SessionService(physics, analytics);
		return new ServiceContainer(physics, session, analytics, exportService, spec);
	}
}
export const defaultContainer = ServiceContainer.createDefault();
