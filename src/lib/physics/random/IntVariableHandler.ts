import type {RandomGenerator, VariableTypeHandler} from '../contracts';
import type {VariableDefinition} from '../types';
/** Generates integer values for 'int' variables. */
export class IntVariableHandler implements VariableTypeHandler {
	public readonly type = 'int';
	public generate(def: VariableDefinition, random: RandomGenerator): unknown {
		const min = Math.trunc(def.min ?? 0);
		const max = Math.trunc(def.max ?? 100);
		return random.nextInt(min, max);
	}
}
