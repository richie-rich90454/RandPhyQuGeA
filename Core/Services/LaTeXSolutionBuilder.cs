using System.Globalization;
using System.Text.RegularExpressions;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class LaTeXSolutionBuilder : ISolutionBuilder
{
    private static readonly Regex PlaceholderPattern = new(@"\{(\w+)\}", RegexOptions.Compiled);

    public string BuildPlainText(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        return SubstituteVariables(template.SolutionTemplate, variables);
    }

    public string BuildLaTeX(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        return SubstituteVariables(template.SolutionTemplate, variables, FormatLaTeXValue);
    }

    private static string SubstituteVariables(string template, IReadOnlyDictionary<string, object> variables, Func<object, string>? formatter = null)
    {
        formatter ??= PlainTextSolutionBuilder.FormatValue;
        return PlaceholderPattern.Replace(template, match =>
        {
            var varName = match.Groups[1].Value;
            return variables.TryGetValue(varName, out var value) ? formatter(value) : match.Value;
        });
    }

    private static string FormatLaTeXValue(object value)
    {
        var formatted = value switch
        {
            double d => FormatDoubleForLaTeX(d),
            float f => FormatDoubleForLaTeX(f),
            int i => i.ToString(CultureInfo.InvariantCulture),
            long l => l.ToString(CultureInfo.InvariantCulture),
            decimal dec => dec.ToString(CultureInfo.InvariantCulture),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty
        };

        // If the template already has $...$ delimiters around the placeholder,
        // don't add extra delimiters. Just return the formatted value.
        return formatted;
    }

    private static string FormatDoubleForLaTeX(double value)
    {
        // Format with up to 4 decimal places, trim trailing zeros
        var formatted = value.ToString("0.####", CultureInfo.InvariantCulture);
        return formatted;
    }
}
