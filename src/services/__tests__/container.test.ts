import {describe, it, expect} from "vitest";
import {ServiceContainer, defaultContainer} from "../container";
import {PhysicsService} from "../PhysicsService";
import {AnalyticsService} from "../AnalyticsService";
import {ExportService} from "../ExportService";
import {SpecService} from "../SpecService";
import {SessionService} from "../SessionService";
import type {IPhysicsService, ISessionService, IAnalyticsService, IExportService, ISpecService} from "../contracts";
describe("ServiceContainer", () => {
    describe("createDefault", () => {
        it("wires all services", () => {
            let container = ServiceContainer.createDefault();
            expect(container.physics).toBeInstanceOf(PhysicsService);
            expect(container.analytics).toBeInstanceOf(AnalyticsService);
            expect(container.export).toBeInstanceOf(ExportService);
            expect(container.spec).toBeInstanceOf(SpecService);
            expect(container.session).toBeInstanceOf(SessionService);
        });
        it("exposes services that implement their interfaces", () => {
            let container = ServiceContainer.createDefault();
            let physics: IPhysicsService = container.physics;
            let session: ISessionService = container.session;
            let analytics: IAnalyticsService = container.analytics;
            let exportService: IExportService = container.export;
            let spec: ISpecService = container.spec;
            expect(typeof physics.parseSpecification).toBe("function");
            expect(typeof physics.generateQuestion).toBe("function");
            expect(typeof physics.evaluate).toBe("function");
            expect(typeof session.startSession).toBe("function");
            expect(typeof session.submitAnswer).toBe("function");
            expect(typeof analytics.getStreak).toBe("function");
            expect(typeof analytics.getAccuracy).toBe("function");
            expect(typeof exportService.downloadText).toBe("function");
            expect(typeof exportService.getExportMetadata).toBe("function");
            expect(typeof spec.loadSpec).toBe("function");
            expect(typeof spec.validateSpec).toBe("function");
        });
    });
    describe("defaultContainer", () => {
        it("is a singleton default container", () => {
            expect(defaultContainer).toBeInstanceOf(ServiceContainer);
            expect(defaultContainer.physics).toBeInstanceOf(PhysicsService);
        });
    });
});
