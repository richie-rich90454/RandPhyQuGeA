using System.Globalization;
using System.Text.RegularExpressions;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class CommonMistakeDistractorGenerator : IDistractorGenerator
{
    private readonly IExpressionEvaluator _evaluator;

    public CommonMistakeDistractorGenerator(IExpressionEvaluator evaluator)
    {
        _evaluator = evaluator;
    }

    public IEnumerable<string> Generate(string correctAnswer, QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        var distractors = new List<string>();
        double correctValue;

        try
        {
            correctValue = _evaluator.Evaluate(template.AnswerExpression, variables);
        }
        catch
        {
            return distractors;
        }

        bool correctIsPositive = correctValue > 0;
        bool correctIsNegative = correctValue < 0;
        var expression = template.AnswerExpression;

        // Strategy 1: Swap sin/cos
        string? swapped = TrySwapTrig(expression);
        if (swapped != null)
        {
            AddIfValid(distractors, swapped, variables, correctAnswer, correctIsPositive, correctIsNegative);
        }

        // Strategy 2: Forget to square (if expression contains sqrt, square the result)
        if (expression.Contains("sqrt", StringComparison.OrdinalIgnoreCase))
        {
            double squared = correctValue * correctValue;
            var formatted = FormatValue(squared);
            AddIfValid(distractors, formatted, correctAnswer, squared, correctIsPositive, correctIsNegative);
        }

        // Strategy 3: Wrong sign
        double negated = -correctValue;
        AddIfValid(distractors, FormatValue(negated), correctAnswer, negated, correctIsPositive, correctIsNegative);

        // Strategy 4: Off by factor of 2
        AddIfValid(distractors, FormatValue(correctValue * 2), correctAnswer, correctValue * 2, correctIsPositive, correctIsNegative);
        AddIfValid(distractors, FormatValue(correctValue / 2), correctAnswer, correctValue / 2, correctIsPositive, correctIsNegative);

        // Strategy 5: Off by factor of 10
        AddIfValid(distractors, FormatValue(correctValue * 10), correctAnswer, correctValue * 10, correctIsPositive, correctIsNegative);
        AddIfValid(distractors, FormatValue(correctValue / 10), correctAnswer, correctValue / 10, correctIsPositive, correctIsNegative);

        return distractors.Distinct().Take(3);
    }

    private string? TrySwapTrig(string expression)
    {
        bool hasSin = Regex.IsMatch(expression, @"\bsin\b", RegexOptions.IgnoreCase);
        bool hasCos = Regex.IsMatch(expression, @"\bcos\b", RegexOptions.IgnoreCase);

        if (hasSin && hasCos)
        {
            // Swap both: sin→cos, cos→sin using placeholders
            var swapped = Regex.Replace(expression, @"\bsin\b", "___SIN_PLACEHOLDER___", RegexOptions.IgnoreCase);
            swapped = Regex.Replace(swapped, @"\bcos\b", "sin", RegexOptions.IgnoreCase);
            swapped = Regex.Replace(swapped, @"___SIN_PLACEHOLDER___", "cos", RegexOptions.IgnoreCase);
            return swapped;
        }
        else if (hasSin)
        {
            return Regex.Replace(expression, @"\bsin\b", "cos", RegexOptions.IgnoreCase);
        }
        else if (hasCos)
        {
            return Regex.Replace(expression, @"\bcos\b", "sin", RegexOptions.IgnoreCase);
        }

        return null;
    }

    private void AddIfValid(List<string> distractors, string modifiedExpression, IReadOnlyDictionary<string, object> variables,
        string correctAnswer, bool correctIsPositive, bool correctIsNegative)
    {
        try
        {
            double value = _evaluator.Evaluate(modifiedExpression, variables);
            string formatted = FormatValue(value);
            if (formatted != correctAnswer && !distractors.Contains(formatted))
            {
                distractors.Add(formatted);
            }
        }
        catch
        {
            // Skip if evaluation fails
        }
    }

    private void AddIfValid(List<string> distractors, string formatted, string correctAnswer,
        double value, bool correctIsPositive, bool correctIsNegative)
    {
        if (formatted == correctAnswer) return;
        if (distractors.Contains(formatted)) return;
        distractors.Add(formatted);
    }

    private static string FormatValue(double value)
    {
        if (Math.Abs(value - Math.Round(value)) < 1e-9)
            return Math.Round(value).ToString(CultureInfo.InvariantCulture);
        return value.ToString("G", CultureInfo.InvariantCulture);
    }
}
