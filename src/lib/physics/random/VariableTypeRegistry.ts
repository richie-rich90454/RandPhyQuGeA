import type {VariableTypeHandler} from '../contracts';
import {DoubleVariableHandler} from './DoubleVariableHandler';
import {EnumVariableHandler} from './EnumVariableHandler';
import {IntVariableHandler} from './IntVariableHandler';
/** Open-closed registry for variable type handlers. */
export class VariableTypeRegistry {
	private readonly handlers: Map<string, VariableTypeHandler>;
	public constructor() {
		this.handlers = new Map();
	}
	/** Register a handler under its type key. */
	public register(handler: VariableTypeHandler): void {
		this.handlers.set(handler.type, handler);
	}
	/** Look up a handler by variable type. */
	public get(type: string): VariableTypeHandler | undefined {
		return this.handlers.get(type);
	}
	/** Build a registry pre-populated with the standard Int, Double, Enum handlers. */
	public static createDefault(): VariableTypeRegistry {
		const registry = new VariableTypeRegistry();
		registry.register(new IntVariableHandler());
		registry.register(new DoubleVariableHandler());
		registry.register(new EnumVariableHandler());
		return registry;
	}
}
