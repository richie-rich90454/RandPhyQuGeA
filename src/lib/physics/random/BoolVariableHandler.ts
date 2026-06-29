import type {RandomGenerator, VariableTypeHandler} from '../contracts';
import type {VariableDefinition} from '../types';
/** Generates 0 or 1 for 'bool' variables, so templates can flip signs/directions without duplication. */
export class BoolVariableHandler implements VariableTypeHandler {
	public readonly type = 'bool';
	public generate(_def: VariableDefinition, random: RandomGenerator): unknown {
		return random.nextInt(0, 1);
	}
}
