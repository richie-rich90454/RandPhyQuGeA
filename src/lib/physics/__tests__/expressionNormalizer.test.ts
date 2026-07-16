import {describe, it, expect} from "vitest";
import {ExpressionNormalizer} from "../grader/ExpressionNormalizer";
describe("ExpressionNormalizer", () => {
	const normalizer = new ExpressionNormalizer();
	describe("normalize", () => {
		it("returns a trimmed, lowercased, whitespace-free canonical form", () => {
			expect(normalizer.normalize("  X + 1  ")).toBe("1+x");
		});
		it("strips trailing zeros from integer-valued decimals", () => {
			expect(normalizer.normalize("1.0")).toBe("1");
			expect(normalizer.normalize("2.50")).toBe("2.5");
		});
		it("leaves non-trailing zeros intact", () => {
			expect(normalizer.normalize("0.5")).toBe("0.5");
			expect(normalizer.normalize("10")).toBe("10");
		});
		it("inserts explicit multiplication between a digit and a variable", () => {
			expect(normalizer.normalize("2x")).toBe("2*x");
		});
		it("inserts explicit multiplication between a variable and a digit", () => {
			expect(normalizer.normalize("x2")).toBe("2*x");
		});
		it("converts numeric fractions to decimals", () => {
			expect(normalizer.normalize("1/2")).toBe("0.5");
			expect(normalizer.normalize("3/4")).toBe("0.75");
		});
		it("does not evaluate fractions with a zero denominator", () => {
			expect(normalizer.normalize("1/0")).toBe("1/0");
		});
		it("sorts commutative addition terms into a stable order", () => {
			expect(normalizer.normalize("b+a")).toBe("a+b");
		});
		it("sorts commutative multiplication factors into a stable order", () => {
			expect(normalizer.normalize("b*a")).toBe("a*b");
		});
	});
	describe("isEquivalent", () => {
		it("treats identical strings as equivalent", () => {
			expect(normalizer.isEquivalent("x+1", "x+1")).toBe(true);
		});
		it("treats expressions differing only in whitespace as equivalent", () => {
			expect(normalizer.isEquivalent("a + b", "a+b")).toBe(true);
			expect(normalizer.isEquivalent("  2 * x  ", "2*x")).toBe(true);
		});
		it("treats commutative additions as equivalent regardless of term order", () => {
			expect(normalizer.isEquivalent("a+b", "b+a")).toBe(true);
			expect(normalizer.isEquivalent("a + b", "b + a")).toBe(true);
		});
		it("treats commutative multiplications as equivalent regardless of factor order", () => {
			expect(normalizer.isEquivalent("a*b", "b*a")).toBe(true);
			expect(normalizer.isEquivalent("x*2", "2*x")).toBe(true);
		});
		it("treats implicit and explicit multiplication as equivalent", () => {
			expect(normalizer.isEquivalent("2x", "2*x")).toBe(true);
		});
		it("treats fractions and decimals as equivalent", () => {
			expect(normalizer.isEquivalent("1/2", "0.5")).toBe(true);
			expect(normalizer.isEquivalent("3/4", "0.75")).toBe(true);
		});
		it("treats trailing-zero and trimmed decimals as equivalent", () => {
			expect(normalizer.isEquivalent("1.0", "1")).toBe(true);
			expect(normalizer.isEquivalent("2.50", "2.5")).toBe(true);
		});
		it("treats LaTeX-delimited and plain expressions as equivalent", () => {
			expect(normalizer.isEquivalent("$$x+1$$", "x+1")).toBe(true);
			expect(normalizer.isEquivalent("$x+1$", "x+1")).toBe(true);
			expect(normalizer.isEquivalent("\\(x+1\\)", "x+1")).toBe(true);
			expect(normalizer.isEquivalent("\\[x+1\\]", "x+1")).toBe(true);
		});
		it("strips LaTeX \\frac delimiters and converts pure-number fractions to decimals", () => {
			expect(normalizer.normalize("\\frac{1}{2}")).toBe("0.5");
			expect(normalizer.isEquivalent("\\frac{1}{2}", "(1)/(2)")).toBe(true);
			expect(normalizer.isEquivalent("\\frac{1}{2}", "0.5")).toBe(true);
		});
		it("strips LaTeX \\left and \\right delimiters so \\left(x+1\\right) is equivalent to (x+1)", () => {
			expect(normalizer.normalize("\\left(x+1\\right)")).toBe(normalizer.normalize("(x+1)"));
			expect(normalizer.isEquivalent("\\left(x+1\\right)", "(x+1)")).toBe(true);
			expect(normalizer.isEquivalent("\\left( a + b \\right)", "(a+b)")).toBe(true);
			expect(normalizer.isEquivalent("\\left(2x\\right)", "(2*x)")).toBe(true);
		});
		it("treats parenthesized numeric fractions as equivalent to decimals (e.g. (1)/(2) ≡ 0.5)", () => {
			expect(normalizer.normalize("(1)/(2)")).toBe("0.5");
			expect(normalizer.isEquivalent("(1)/(2)", "0.5")).toBe(true);
			expect(normalizer.isEquivalent("(3)/(4)", "0.75")).toBe(true);
			expect(normalizer.isEquivalent("(2)/(4)", "0.5")).toBe(true);
		});
		it("treats LaTeX \\cdot and explicit multiplication as equivalent", () => {
			expect(normalizer.isEquivalent("a\\cdot b", "a*b")).toBe(true);
		});
		it("treats LaTeX \\times and explicit multiplication as equivalent", () => {
			expect(normalizer.isEquivalent("a\\times b", "a*b")).toBe(true);
		});
		it("treats a combined expression and its reordered form as equivalent", () => {
			expect(normalizer.isEquivalent("2x+3", "3+2*x")).toBe(true);
		});
		it("treats case-insensitively equal expressions as equivalent", () => {
			expect(normalizer.isEquivalent("A+B", "a+b")).toBe(true);
		});
		it("rejects non-equivalent expressions", () => {
			expect(normalizer.isEquivalent("x+1", "x+2")).toBe(false);
			expect(normalizer.isEquivalent("a*b", "a+b")).toBe(false);
		});
	});
});
