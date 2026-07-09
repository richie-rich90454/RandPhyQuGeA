/**
 * Worked-solution step renderer data model.
 *
 * A worked solution is an ordered list of steps that walk through solving a
 * question. Each step carries a human-readable description, an optional
 * LaTeX expression, an optional substituted form, and an optional result
 * string. The {@link WorkedSolutionBuilder} assembles steps fluently and
 * produces an immutable {@link WorkedSolution}. Pure-TS, no DOM dependencies.
 */
export interface WorkedSolutionStep {
	/** Human-readable description of what this step does. */
	description: string;
	/** Optional LaTeX expression for the step (e.g. "a = \\frac{v - v_0}{t}"). */
	latex?: string;
	/** Optional substituted form with numbers plugged in (e.g. "a = \\frac{20 - 0}{4}"). */
	substitution?: string;
	/** Optional result of the step (e.g. "a = 5"). */
	result?: string;
}
/** An immutable worked-solution document assembled by {@link WorkedSolutionBuilder}. */
export interface WorkedSolution {
	/** The question id this solution belongs to. */
	questionId: string;
	/** Display title for the solution. */
	title: string;
	/** Ordered list of solution steps. */
	steps: WorkedSolutionStep[];
	/** Optional final answer string. */
	finalAnswer?: string;
}
/** Fluent builder for constructing immutable {@link WorkedSolution} instances step by step. */
export class WorkedSolutionBuilder {
	private readonly questionId: string;
	private title: string;
	private readonly steps: WorkedSolutionStep[];
	private finalAnswer: string | undefined;
	/** Construct a builder for `questionId` with an optional title. */
	public constructor(questionId: string, title: string = "") {
		this.questionId = questionId;
		this.title = title;
		this.steps = [];
		this.finalAnswer = undefined;
	}
	/** Set the solution title. */
	public setTitle(title: string): this {
		this.title = title;
		return this;
	}
	/** Append a step. Returns this for chaining. */
	public addStep(step: WorkedSolutionStep): this {
		this.steps.push({...step});
		return this;
	}
	/** Append a step from raw fields. Returns this for chaining. */
	public step(description: string, latex?: string, substitution?: string, result?: string): this {
		this.steps.push({description, latex, substitution, result});
		return this;
	}
	/** Set the final answer string. Returns this for chaining. */
	public setFinalAnswer(answer: string): this {
		this.finalAnswer = answer;
		return this;
	}
	/** Return the number of steps added so far. */
	public stepCount(): number {
		return this.steps.length;
	}
	/** Build an immutable {@link WorkedSolution} from the current state. */
	public build(): WorkedSolution {
		return {
			questionId: this.questionId,
			title: this.title,
			steps: this.steps.map(s => ({...s})),
			finalAnswer: this.finalAnswer,
		};
	}
	/** Convenience factory building a solution directly from a steps list. */
	public static fromSteps(questionId: string, title: string, steps: WorkedSolutionStep[], finalAnswer?: string): WorkedSolution {
		const builder = new WorkedSolutionBuilder(questionId, title);
		for (const s of steps) {
			builder.addStep(s);
		}
		if (finalAnswer !== undefined) {
			builder.setFinalAnswer(finalAnswer);
		}
		return builder.build();
	}
}
