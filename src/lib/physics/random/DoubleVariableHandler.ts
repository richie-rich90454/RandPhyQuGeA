import type {RandomGenerator, VariableTypeHandler} from '../contracts';
import type {VariableDefinition} from '../types';
/** Generates stepped double values for 'double' variables. */
export class DoubleVariableHandler implements VariableTypeHandler {
	public readonly type = 'double';
	public generate(def: VariableDefinition, random: RandomGenerator): unknown {
		const min = def.min ?? 0;
		const max = def.max ?? 100;
		const step = def.step ?? 1;
		if (!(step > 0)) {
			return min;
		}
		const steps = Math.floor((max - min) / step);
		if (steps <= 0) {
			return min;
		}
		const stepIdx = random.nextInt(0, steps);
		const value = min + stepIdx * step;
		if (value > max) {
			return max;
		}
		return value;
	}
}
