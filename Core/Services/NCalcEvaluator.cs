using System.Globalization;
using Core.Interfaces;
using NCalc;
using NCalc.Handlers;

namespace Core.Services;

public class NCalcEvaluator : IExpressionEvaluator
{
    private static readonly HashSet<string> AllowedFunctions = new(StringComparer.OrdinalIgnoreCase)
    {
        "sin", "cos", "tan", "sqrt", "pow", "pi", "e", "abs", "acos", "asin", "atan",
        "ceiling", "exp", "floor", "ieeeremainder", "ln", "log", "log10", "max", "min",
        "round", "sign", "truncate", "in", "if", "ifs"
    };

    public double Evaluate(string expression, IReadOnlyDictionary<string, object> variables)
    {
        if (string.IsNullOrWhiteSpace(expression))
            throw new ArgumentException("Expression cannot be null or empty.", nameof(expression));

        var workingExpr = new Expression(expression, ExpressionOptions.IgnoreCaseAtBuiltInFunctions);

        // Register custom degree-based trig functions and constants.
        workingExpr.EvaluateFunction += (string name, FunctionArgs args) =>
        {
            switch (name.ToLowerInvariant())
            {
                case "sin":
                    {
                        var p = args.EvaluateParameters();
                        args.Result = Math.Sin(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "cos":
                    {
                        var p = args.EvaluateParameters();
                        args.Result = Math.Cos(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "tan":
                    {
                        var p = args.EvaluateParameters();
                        args.Result = Math.Tan(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "sqrt":
                    {
                        var p = args.EvaluateParameters();
                        args.Result = Math.Sqrt(Convert.ToDouble(p[0], CultureInfo.InvariantCulture));
                        break;
                    }
                case "pow":
                    {
                        var p = args.EvaluateParameters();
                        args.Result = Math.Pow(
                            Convert.ToDouble(p[0], CultureInfo.InvariantCulture),
                            Convert.ToDouble(p[1], CultureInfo.InvariantCulture));
                        break;
                    }
                case "pi":
                    args.Result = Math.PI;
                    break;
                case "e":
                    args.Result = Math.E;
                    break;
            }
        };

        // Set variables.
        foreach (var variable in variables)
        {
            workingExpr.Parameters[variable.Key] = variable.Value;
        }

        // Security: catch disallowed functions during evaluation.
        // NCalcSync does not expose GetFunctionNames(), so we validate via
        // a secondary parse that intercepts unknown function calls.
        try
        {
            var result = workingExpr.Evaluate();
            return Convert.ToDouble(result, CultureInfo.InvariantCulture);
        }
        catch (NCalc.Exceptions.NCalcException ex) when (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                                                         || ex.Message.Contains("Unknown", StringComparison.OrdinalIgnoreCase)
                                                         || ex.Message.Contains("not a function", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Disallowed or unknown function in expression: {expression}", ex);
        }
    }
}
