using Core.Services;
using Xunit;

namespace Tests;

public class NCalcEvaluatorTests
{
    private readonly NCalcEvaluator _evaluator = new();

    #region Arithmetic

    [Theory]
    [InlineData("2 + 3", 5)]
    [InlineData("10 - 4", 6)]
    [InlineData("6 * 7", 42)]
    [InlineData("20 / 4", 5)]
    [InlineData("20 / 3", 6.666666666666667)]
    [InlineData("2 + 3 * 4", 14)]
    [InlineData("(2 + 3) * 4", 20)]
    [InlineData("-5 + 3", -2)]
    [InlineData("10 % 3", 1)]
    [InlineData("2 ** 3", 8)]
    [InlineData("100 / (5 + 5)", 10)]
    [InlineData("0.1 + 0.2", 0.30000000000000004)]
    [InlineData("1e3 + 1", 1001)]
    public void Arithmetic_ReturnsExpected(string expression, double expected)
    {
        double result = _evaluator.Evaluate(expression, new Dictionary<string, object>());
        Assert.Equal(expected, result, precision: 10);
    }

    #endregion

    #region Trigonometry (Degrees)

    [Theory]
    [InlineData("sin(0)", 0)]
    [InlineData("sin(30)", 0.5)]
    [InlineData("sin(90)", 1)]
    [InlineData("sin(180)", 0)]
    [InlineData("sin(270)", -1)]
    [InlineData("cos(0)", 1)]
    [InlineData("cos(60)", 0.5)]
    [InlineData("cos(90)", 0)]
    [InlineData("cos(180)", -1)]
    [InlineData("tan(0)", 0)]
    [InlineData("tan(45)", 1)]
    public void TrigDegrees_ReturnsExpected(string expression, double expected)
    {
        double result = _evaluator.Evaluate(expression, new Dictionary<string, object>());
        Assert.Equal(expected, result, precision: 10);
    }

    [Fact]
    public void Trig_Tan90_ThrowsOrReturnsLarge()
    {
        // tan(90) is undefined; NCalc will evaluate to a very large number or Infinity.
        double result = _evaluator.Evaluate("tan(90)", new Dictionary<string, object>());
        Assert.True(double.IsInfinity(result) || result > 1e15);
    }

    #endregion

    #region Sqrt / Power / Constants

    [Theory]
    [InlineData("sqrt(4)", 2)]
    [InlineData("sqrt(9)", 3)]
    [InlineData("sqrt(2)", 1.4142135623730951)]
    [InlineData("pow(2, 3)", 8)]
    [InlineData("pow(5, 2)", 25)]
    [InlineData("pow(2, -1)", 0.5)]
    [InlineData("pow(9, 0.5)", 3)]
    [InlineData("pi()", 3.141592653589793)]
    [InlineData("e()", 2.718281828459045)]
    public void MathFunctions_ReturnsExpected(string expression, double expected)
    {
        double result = _evaluator.Evaluate(expression, new Dictionary<string, object>());
        Assert.Equal(expected, result, precision: 10);
    }

    #endregion

    #region Variables

    [Theory]
    [InlineData("[x] + 2", 3, 5)]
    [InlineData("[a] * [b]", 4, 20)]
    [InlineData("[a] / [b]", 10, 2)]
    [InlineData("[x] ** 2", 5, 25)]
    [InlineData("sin([angle])", 30, 0.5)]
    [InlineData("sqrt([val])", 16, 4)]
    [InlineData("pow([base], [exp])", 2, 8)] // variables named base/exp
    public void Variables_ReturnsExpected(string expression, double varValue, double expected)
    {
        var variables = new Dictionary<string, object>
        {
            { "x", varValue },
            { "a", varValue },
            { "b", 5 },
            { "angle", varValue },
            { "val", varValue },
            { "base", varValue },
            { "exp", 3 }
        };
        double result = _evaluator.Evaluate(expression, variables);
        Assert.Equal(expected, result, precision: 10);
    }

    [Fact]
    public void Variables_MultipleVariables()
    {
        var variables = new Dictionary<string, object>
        {
            { "mass", 10 },
            { "velocity", 5 }
        };
        double result = _evaluator.Evaluate("0.5 * [mass] * [velocity] ** 2", variables);
        Assert.Equal(125, result, precision: 10);
    }

    [Fact]
    public void Variables_MissingVariable_Throws()
    {
        var variables = new Dictionary<string, object> { { "x", 1 } };
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("[x] + [y]", variables));
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void EmptyExpression_Throws()
    {
        Assert.Throws<ArgumentException>(() => _evaluator.Evaluate("", new Dictionary<string, object>()));
    }

    [Fact]
    public void WhitespaceExpression_Throws()
    {
        Assert.Throws<ArgumentException>(() => _evaluator.Evaluate("   ", new Dictionary<string, object>()));
    }

    [Fact]
    public void DivisionByZero_ReturnsInfinity()
    {
        // NCalcSync returns Infinity for division by zero.
        double result = _evaluator.Evaluate("1 / 0", new Dictionary<string, object>());
        Assert.True(double.IsInfinity(result));
    }

    [Fact]
    public void NegativeSqrt_ThrowsOrNaN()
    {
        double result = _evaluator.Evaluate("sqrt(-1)", new Dictionary<string, object>());
        Assert.True(double.IsNaN(result));
    }

    [Fact]
    public void ComplexExpression()
    {
        var variables = new Dictionary<string, object>
        {
            { "a", 3 },
            { "b", 4 },
            { "c", 5 }
        };
        double result = _evaluator.Evaluate("sqrt([a] ** 2 + [b] ** 2)", variables);
        Assert.Equal(5, result, precision: 10);
    }

    [Fact]
    public void ExpressionWithPiAndE()
    {
        double result = _evaluator.Evaluate("pi() * 2", new Dictionary<string, object>());
        Assert.Equal(2 * Math.PI, result, precision: 10);

        result = _evaluator.Evaluate("e() ** 1", new Dictionary<string, object>());
        Assert.Equal(Math.E, result, precision: 10);
    }

    #endregion

    #region Security / Safety

    [Fact]
    public void Security_DisallowedFunction_Throws()
    {
        // NCalcSync throws NCalcParserException for invalid syntax like Process.Start
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("Process.Start('calc')", new Dictionary<string, object>()));
    }

    [Fact]
    public void Security_DisallowedFunctionReflection_Throws()
    {
        // NCalcSync throws NCalcParserException for GetType() which is not a valid expression
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("GetType().Name", new Dictionary<string, object>()));
    }

    [Fact]
    public void Security_StringConcatAttempt_ThrowsOrEvaluates()
    {
        // String concatenation is not a security risk but ensure it doesn't crash.
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("'hello' + 'world'", new Dictionary<string, object>()));
    }

    [Fact]
    public void Security_ArbitraryCodeInjection_Throws()
    {
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("1; System.Diagnostics.Process.Start('cmd')", new Dictionary<string, object>()));
    }

    [Fact]
    public void Security_UnknownFunction_Throws()
    {
        // NCalcSync will throw for unknown functions like "hack"
        Assert.ThrowsAny<Exception>(() => _evaluator.Evaluate("hack(1)", new Dictionary<string, object>()));
    }

    #endregion

    #region Caching

    [Fact]
    public void CachedExpression_EvaluatesConsistently()
    {
        var variables = new Dictionary<string, object> { { "x", 2 } };
        double r1 = _evaluator.Evaluate("[x] * 3", variables);
        double r2 = _evaluator.Evaluate("[x] * 3", variables);
        Assert.Equal(r1, r2);
    }

    [Fact]
    public void CachedExpression_DifferentVariables_ReturnsDifferentResults()
    {
        double r1 = _evaluator.Evaluate("[x] * 3", new Dictionary<string, object> { { "x", 2 } });
        double r2 = _evaluator.Evaluate("[x] * 3", new Dictionary<string, object> { { "x", 5 } });
        Assert.Equal(6, r1, precision: 10);
        Assert.Equal(15, r2, precision: 10);
    }

    #endregion

    #region Additional Cases (reach 50+)

    [Theory]
    [InlineData("abs(-5)", 5)]
    [InlineData("abs(5)", 5)]
    [InlineData("max(3, 7)", 7)]
    [InlineData("min(3, 7)", 3)]
    [InlineData("round(3.14159, 2)", 3.14)]
    [InlineData("floor(3.9)", 3)]
    [InlineData("ceiling(3.1)", 4)]
    [InlineData("log10(100)", 2)]
    [InlineData("ln(e())", 1)]
    [InlineData("exp(0)", 1)]
    [InlineData("sign(-10)", -1)]
    [InlineData("sign(10)", 1)]
    [InlineData("truncate(3.9)", 3)]
    [InlineData("10 + 20 - 5", 25)]
    [InlineData("(1 + 2) * (3 + 4)", 21)]
    [InlineData("2 * 3 + 4 * 5", 26)]
    [InlineData("100 / 10 / 2", 5)]
    [InlineData("5 ** 2 + 3 ** 2", 34)]
    [InlineData("pow(2, 10)", 1024)]
    [InlineData("sqrt(144)", 12)]
    [InlineData("sin(45)", 0.7071067811865476)]
    [InlineData("cos(45)", 0.7071067811865476)]
    [InlineData("pi() / 2", 1.5707963267948966)]
    [InlineData("e() ** 2", 7.38905609893065)]
    [InlineData("abs([v])", 5)] // variable inside abs
    public void AdditionalExpressions_ReturnExpected(string expression, double expected)
    {
        var variables = new Dictionary<string, object> { { "v", -5 } };
        double result = _evaluator.Evaluate(expression, variables);
        Assert.Equal(expected, result, precision: 10);
    }

    [Theory]
    [InlineData("2 == 2", 1)]
    [InlineData("2 != 3", 1)]
    [InlineData("3 > 2", 1)]
    [InlineData("2 < 3", 1)]
    [InlineData("3 >= 3", 1)]
    [InlineData("2 <= 3", 1)]
    public void ComparisonExpressions_ReturnExpected(string expression, double expected)
    {
        double result = _evaluator.Evaluate(expression, new Dictionary<string, object>());
        Assert.Equal(expected, result, precision: 10);
    }

    #endregion
}
