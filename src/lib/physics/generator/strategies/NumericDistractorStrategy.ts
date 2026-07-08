import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
/** Numeric distractor strategy for NE and MC question types: evaluates template distractor expressions first, then falls back to numeric perturbation (off-by-one, scaling, sign flip, rounding drift). */
export class NumericDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = "NE";
    public generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[] {
        const {answer, answerValue, template, variables, evaluator} = context;
        const seen: Set<string> = new Set([answer]);
        const distractors: string[] = [];
        for (const expr of template.distractor_expressions) {
            if (distractors.length >= count) {
                break;
            }
            let val: number;
            try {
                val = evaluator.evaluate(expr, variables);
            } catch {
                continue;
            }
            if (!Number.isFinite(val)) {
                continue;
            }
            const formatted = evaluator.formatNumeric(val);
            if (seen.has(formatted)) {
                continue;
            }
            seen.add(formatted);
            distractors.push(formatted);
        }
        if (distractors.length < count && Number.isFinite(answerValue)) {
            const perturbations = this.buildPerturbations(answerValue);
            random.shuffle(perturbations);
            for (const val of perturbations) {
                if (distractors.length >= count) {
                    break;
                }
                const formatted = evaluator.formatNumeric(val);
                if (seen.has(formatted)) {
                    continue;
                }
                seen.add(formatted);
                distractors.push(formatted);
            }
        }
        return distractors;
    }
    private buildPerturbations(value: number): number[] {
        const abs = Math.abs(value);
        const magnitude = abs >= 1 ? Math.pow(10, Math.floor(Math.log10(abs))) : 1;
        return [
            value + 1,
            value - 1,
            value + 2,
            value - 2,
            value * 2,
            value / 2,
            value + magnitude,
            value - magnitude,
            value + magnitude * 0.1,
            value - magnitude * 0.1,
            -value,
            value + 10,
            value - 10,
        ];
    }
}
