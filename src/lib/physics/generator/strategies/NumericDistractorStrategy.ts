import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {QUESTION_TYPES} from "../../types";
/** Numeric distractor strategy for NE and MC question types: evaluates template distractor expressions first, then falls back to numeric perturbation (off-by-one, scaling, sign flip, rounding drift). Distractors are formatted to the canonical answer's significant-figure count where possible so trailing significant zeros are preserved (e.g. answer "1.20" yields "2.20" rather than "2.2"). */
export class NumericDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = QUESTION_TYPES.NE;
    /** Generate up to `count` numeric distractors: first evaluates `template.distractor_expressions`, then falls back to magnitude-aware perturbations (off-by-one, doubling, halving, sign flip, rounding drift), shuffled by `random`. Each distractor is formatted to the canonical answer's significant-figure count when the answer has a decimal point. Distractors equal to the correct answer or already collected are skipped. */
    public generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[] {
        const {answer, answerValue, template, variables, evaluator} = context;
        const seen: Set<string> = new Set([answer]);
        const distractors: string[] = [];
        const sigFigs: number | null = this.detectSigFigs(answer);
        const format = (val: number): string => (sigFigs !== null ? this.formatToSigFigs(val, sigFigs) : evaluator.formatNumeric(val));
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
            const formatted = format(val);
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
                const formatted = format(val);
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
    private detectSigFigs(answer: string): number | null {
        const trimmed = answer.trim();
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
            return null;
        }
        const mantissa = trimmed.split(/[eE]/)[0] ?? "";
        if (!mantissa.includes(".")) {
            return null;
        }
        const n = this.countSigFigs(trimmed);
        return n > 0 ? n : null;
    }
    private countSigFigs(s: string): number {
        let str = s.trim().replace(/^[+-]/, "");
        const eMatch = str.match(/[eE]/);
        if (eMatch !== null && eMatch.index !== undefined) {
            str = str.slice(0, eMatch.index);
        }
        str = str.replace(".", "");
        str = str.replace(/^0+/, "");
        return str.length === 0 ? 0 : str.length;
    }
    private formatToSigFigs(value: number, sigFigs: number): string {
        if (!Number.isFinite(value) || sigFigs <= 0) {
            return String(value);
        }
        return this.expandExponential(value.toPrecision(sigFigs));
    }
    private expandExponential(s: string): string {
        if (!/[eE]/.test(s)) {
            return s;
        }
        const parts = s.split(/[eE]/);
        const mantissa = parts[0] ?? "0";
        const exp = parseInt(parts[1] ?? "0", 10);
        const negative = mantissa.startsWith("-");
        const m = negative ? mantissa.slice(1) : mantissa;
        const dotIndex = m.indexOf(".");
        let intPart: string;
        let decPart: string;
        if (dotIndex >= 0) {
            intPart = m.slice(0, dotIndex);
            decPart = m.slice(dotIndex + 1);
        } else {
            intPart = m;
            decPart = "";
        }
        const digits = intPart + decPart;
        const pointPos = intPart.length + exp;
        let result: string;
        if (pointPos <= 0) {
            result = "0." + "0".repeat(-pointPos) + digits;
        } else if (pointPos >= digits.length) {
            result = digits + "0".repeat(pointPos - digits.length);
        } else {
            result = digits.slice(0, pointPos) + "." + digits.slice(pointPos);
        }
        return negative ? "-" + result : result;
    }
}
