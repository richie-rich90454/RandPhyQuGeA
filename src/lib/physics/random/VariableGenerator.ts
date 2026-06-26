import type {RandomGenerator} from '../contracts';
import type {VariableDefinition} from '../types';
import {VariableTypeRegistry} from './VariableTypeRegistry';
/** Generates variable values from definitions using a type registry. */
export class VariableGenerator {
	private readonly registry: VariableTypeRegistry;
	public constructor(registry?: VariableTypeRegistry) {
		this.registry = registry ?? VariableTypeRegistry.createDefault();
	}
	/** Generate a value for each definition. Unknown types default to 0. */
	public generate(definitions: VariableDefinition[], random: RandomGenerator): Record<string, unknown> {
		const variables: Record<string, unknown> = {};
		for (const def of definitions) {
			const handler = this.registry.get(def.var_type);
			if (handler === undefined) {
				variables[def.name] = 0;
				continue;
			}
			variables[def.name] = handler.generate(def, random);
		}
		return variables;
	}
}
