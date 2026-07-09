import type {RandomGenerator, VariableTypeHandler} from "../contracts";
import type {VariableDefinition} from "../types";
/** Generates a string value for 'set' variables by picking from `enum_values` without numeric coercion. Unlike {@link EnumVariableHandler} (which parses the picked value to a number and falls back to 0 for non-numeric input), the 'set' handler returns the raw string, supporting non-numeric categorical values such as unit symbols ("N", "J", "W"), directions, or labels. Returns an empty string when `enum_values` is absent or empty. */
export class SetVariableHandler implements VariableTypeHandler {
	public readonly type = "set";
	/** Pick a value from `def.enum_values` and return it verbatim as a string; return "" when no values are defined. */
	public generate(def: VariableDefinition, random: RandomGenerator): unknown {
		const values = def.enum_values;
		if (values === undefined || values.length === 0) {
			return "";
		}
		return random.pick(values);
	}
}
