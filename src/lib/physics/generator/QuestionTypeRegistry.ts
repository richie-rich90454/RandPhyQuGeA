import type {QuestionTypeHandler} from '../contracts';
import {FillInBlankHandler} from './FillInBlankHandler';
import {MultipleChoiceHandler} from './MultipleChoiceHandler';
import {NumericEntryHandler} from './NumericEntryHandler';
import {ShortAnswerHandler} from './ShortAnswerHandler';
import {TrueFalseHandler} from './TrueFalseHandler';
/** Open-closed registry of question type handlers, keyed by their type identifier. Unknown types fall back to the ShortAnswerHandler. */
export class QuestionTypeRegistry {
	private readonly handlers: Map<string, QuestionTypeHandler>;
	private readonly defaultHandler: QuestionTypeHandler;
	public constructor() {
		this.handlers = new Map();
		this.defaultHandler = new ShortAnswerHandler();
	}
	public register(handler: QuestionTypeHandler): void {
		this.handlers.set(handler.type, handler);
	}
	public get(type: string): QuestionTypeHandler | undefined {
		return this.handlers.get(type);
	}
	public getOrDefault(type: string): QuestionTypeHandler {
		const handler = this.handlers.get(type);
		if (handler !== undefined) {
			return handler;
		}
		return this.defaultHandler;
	}
	public static createDefault(): QuestionTypeRegistry {
		const registry = new QuestionTypeRegistry();
		registry.register(new ShortAnswerHandler());
		registry.register(new MultipleChoiceHandler());
		registry.register(new TrueFalseHandler());
		registry.register(new FillInBlankHandler());
		registry.register(new NumericEntryHandler());
		return registry;
	}
}
