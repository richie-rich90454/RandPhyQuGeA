using System.Globalization;
using Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NCalc;
using NCalc.Handlers;

namespace Core.Services;

public class NCalcEvaluator : IExpressionEvaluator
{
    private readonly ILogger<NCalcEvaluator> _logger;
    private static readonly HashSet<string> AllowedFunctions = new(StringComparer.OrdinalIgnoreCase)
    {
        "sin", "cos", "tan", "sqrt", "pow", "pi", "e", "abs", "acos", "asin", "atan",
        "ceiling", "exp", "floor", "ieeeremainder", "ln", "log", "log10", "max", "min",
        "round", "sign", "truncate", "in", "if", "ifs"
    };

    public NCalcEvaluator()
        : this(NullLogger<NCalcEvaluator>.Instance)
    {
    }

    public NCalcEvaluator(ILogger<NCalcEvaluator> logger)
    {
        _logger = logger;
    }

    public double Evaluate(string expression, IReadOnlyDictionary<string, object> variables)
    {
        if (string.IsNullOrWhiteSpace(expression))
            throw new ArgumentException("Expression cannot be null or empty.", nameof(expression));

        var workingExpr = new Expression(expression, ExpressionOptions.IgnoreCaseAtBuiltInFunctions);

        // Register custom degree-based trig functions and constants.
        workingExpr.EvaluateFunction += (string name, FunctionArgs args) =>
        {
            if (!AllowedFunctions.Contains(name))
            {
                _logger.LogWarning("Function '{FunctionName}' is not allowed in expression", name);
                throw new FormatException($"Function '{name}' is not allowed.");
            }

            switch (name.ToLowerInvariant())
            {
                case "sin":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'sin' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Sin(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "cos":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'cos' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Cos(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "tan":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'tan' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Tan(Convert.ToDouble(p[0], CultureInfo.InvariantCulture) * Math.PI / 180.0);
                        break;
                    }
                case "asin":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'asin' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Asin(Convert.ToDouble(p[0], CultureInfo.InvariantCulture)) * 180.0 / Math.PI;
                        break;
                    }
                case "acos":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'acos' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Acos(Convert.ToDouble(p[0], CultureInfo.InvariantCulture)) * 180.0 / Math.PI;
                        break;
                    }
                case "atan":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'atan' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Atan(Convert.ToDouble(p[0], CultureInfo.InvariantCulture)) * 180.0 / Math.PI;
                        break;
                    }
                case "sqrt":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 1) throw new FormatException($"Function 'sqrt' expects 1 parameter, but got {p.Length}.");
                        args.Result = Math.Sqrt(Convert.ToDouble(p[0], CultureInfo.InvariantCulture));
                        break;
                    }
                case "pow":
                    {
                        var p = args.EvaluateParameters();
                        if (p.Length != 2) throw new FormatException($"Function 'pow' expects 2 parameters, but got {p.Length}.");
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

        try
        {
            return Convert.ToDouble(workingExpr.Evaluate(), CultureInfo.InvariantCulture);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to evaluate expression '{Expression}'", expression);
            throw;
        }
    }
}
