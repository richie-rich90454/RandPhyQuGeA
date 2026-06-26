import type {RandomGenerator, VariableTypeHandler} from '../contracts';
import type {VariableDefinition} from '../types';
/** Generates numeric values for 'enum' variables by parsing a picked enum value. */
export class EnumVariableHandler implements VariableTypeHandler {
	public readonly type = 'enum';
	public generate(def: VariableDefinition, random: RandomGenerator): unknown {
		const values = def.enum_values;
		if (values === undefined || values.length === 0) {
			return 0;
		}
		const picked = random.pick(values);
		const parsed = Number(picked);
		if (Number.isNaN(parsed)) {
			return 0;
		}
		return parsed;
	}
}
