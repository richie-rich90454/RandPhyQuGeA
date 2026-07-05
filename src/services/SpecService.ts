/** Loads, validates, and previews specification content. */
import type {IPhysicsService, ISpecService, SpecValidationResult} from "./contracts";
import {ParseException} from "../lib/physics/types";
import type {GeneratedQuestion, Specification} from "../types/models";
export class SpecService implements ISpecService {
	private readonly physicsService: IPhysicsService;
	public constructor(physicsService: IPhysicsService) {
		this.physicsService=physicsService;
	}
	public async loadSpec(input: string): Promise<Specification> {
		return this.physicsService.parseSpecification(input);
	}
	public async validateSpec(input: string): Promise<SpecValidationResult> {
		try {
			await this.physicsService.parseSpecification(input);
			return {valid: true, errors: []};
		} catch (error) {
			if (error instanceof ParseException) {
				return {valid: false, errors: error.errors};
			}
			let message=error instanceof Error ? error.message : String(error);
			return {valid: false, errors: [{line: 0, message}]};
		}
	}
	public async previewTemplate(spec: Specification, templateId: string, count: number): Promise<GeneratedQuestion[]> {
		return this.physicsService.generateBatch(spec, count, {templateIds: [templateId]});
	}
}
