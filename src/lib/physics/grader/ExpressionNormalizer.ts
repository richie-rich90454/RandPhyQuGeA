import type {ExpressionNormalizerLike} from "../contracts";
/** Normalizes mathematical/string expressions for equivalence comparison without requiring math.js. Handles whitespace, case, implicit multiplication (2x → 2*x), fraction↔decimal (1/2 → 0.5), trailing zeros (1.0 → 1), LaTeX delimiter stripping, scientific-notation canonicalization (6.022e23 ≡ 6.022 \times 10^{23}), and commutative term reordering (b+a → a+b). */
export class ExpressionNormalizer implements ExpressionNormalizerLike {
    /** Return a canonical normalized form of `input`: strips LaTeX delimiters, lowercases, removes whitespace, canonicalizes scientific notation, inserts explicit multiplication, converts numeric fractions to decimals, strips trailing zeros, and reorders commutative `+`/`*` terms so equivalent expressions collapse to the same string. */
    public normalize(input: string): string {
        let s = input.trim();
        s = this.stripLatexDelimiters(s);
        s = s.toLowerCase();
        s = s.replace(/\s+/g, "");
        s = this.normalizeScientificNotation(s);
        s = this.insertExplicitMultiplication(s);
        s = this.normalizeNumericFractions(s);
        s = this.stripTrailingZeros(s);
        s = this.sortCommutativeTerms(s);
        return s;
    }
    /** True when `a` and `b` normalize to the same canonical string (equivalence check). */
    public isEquivalent(a: string, b: string): boolean {
        return this.normalize(a) === this.normalize(b);
    }
    /** Strip `$$`, `$`, `\(...)`, `\[...\]`, `\text{...}`, `\,`, `\left`/`\right`, and rewrite `\cdot`/`\times`→`*`, `\div`→`/`, `\frac{a}{b}`→`(a)/(b)`. */
    private stripLatexDelimiters(s: string): string {
        return s
            .replace(/\$\$/g, "")
            .replace(/\$/g, "")
            .replace(/\\\(/g, "")
            .replace(/\\\)/g, "")
            .replace(/\\\[/g, "")
            .replace(/\\\]/g, "")
            .replace(/\\text\{([^}]*)\}/g, "$1")
            .replace(/\\,/g, "")
            .replace(/\\left/g, "")
            .replace(/\\right/g, "")
            .replace(/\\cdot/g, "*")
            .replace(/\\times/g, "*")
            .replace(/\\div/g, "/")
            .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)");
    }
    /** Convert `mantissa * 10^{exponent}` (the form left after `\times` → `*` substitution) into canonical `mantissa e exponent` notation so that LaTeX and plain `e` forms collapse to the same string. Also handles the `*10^exp` variant without braces. */
    private normalizeScientificNotation(s: string): string {
        return s.replace(/([+-]?\d+(?:\.\d+)?)\*10\^\{?([+-]?\d+)\}?/g, (_match, mantissa: string, exponent: string) => {
            return mantissa + "e" + exponent;
        });
    }
    private insertExplicitMultiplication(s: string): string {
        let out = s;
        out = out.replace(/(\d)([a-z])/g, (match, digit: string, letter: string, offset: number, str: string) => {
            if (letter === "e") {
                const after = str.slice(offset + 2);
                if (/^[+-]?\d/.test(after)) {
                    return match;
                }
            }
            return digit + "*" + letter;
        });
        out = out.replace(/([a-z])(\d)/g, (match, letter: string, digit: string, offset: number, str: string) => {
            if (letter === "e" && offset > 0) {
                const before = str[offset - 1];
                if (before !== undefined && /\d/.test(before)) {
                    return match;
                }
            }
            return letter + "*" + digit;
        });
        out = out.replace(/(\))([a-z0-9(])/g, "$1*$2");
        out = out.replace(/([a-z0-9)])(\()/g, "$1*$2");
        return out;
    }
    private normalizeNumericFractions(s: string): string {
        return s.replace(/\(?(\d+(?:\.\d+)?)\)?\/\(?(\d+(?:\.\d+)?)\)?/g, (match, numStr, denStr) => {
            const num = Number(numStr);
            const den = Number(denStr);
            if (den === 0 || !Number.isFinite(num) || !Number.isFinite(den)) {
                return match;
            }
            const result = num / den;
            return this.formatNumber(result);
        });
    }
    private stripTrailingZeros(s: string): string {
        return s.replace(/(\d+)\.0+(?![0-9])/g, "$1").replace(/(\d+\.\d*?)0+(?![0-9])/g, "$1");
    }
    private sortCommutativeTerms(s: string): string {
        const byPlus = this.splitTopLevel(s, "+");
        const sortedPlus = byPlus.map(term => this.sortTerm(term)).sort();
        return sortedPlus.join("+");
    }
    private sortTerm(term: string): string {
        const byStar = this.splitTopLevel(term, "*");
        return byStar.sort().join("*");
    }
    private splitTopLevel(s: string, sep: string): string[] {
        const parts: string[] = [];
        let depth = 0;
        let current = "";
        for (const ch of s) {
            if (ch === "(") {
                depth++;
                current += ch;
            } else if (ch === ")") {
                depth--;
                current += ch;
            } else if (ch === sep && depth === 0) {
                parts.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
        if (current.length > 0) {
            parts.push(current);
        }
        return parts;
    }
    private formatNumber(value: number): string {
        const rounded = Math.round(value * 1e10) / 1e10;
        return String(rounded);
    }
}
