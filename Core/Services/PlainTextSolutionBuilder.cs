using System.Globalization;
using System.Text.RegularExpressions;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class PlainTextSolutionBuilder : ISolutionBuilder
{
    private static readonly Regex PlaceholderPattern = new(@"\{(\w+)\}", RegexOptions.Compiled);

    public string BuildPlainText(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        return SubstituteVariables(template.SolutionTemplate, variables);
    }

    public string BuildLaTeX(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        return SubstituteVariables(template.SolutionTemplate, variables);
    }

    private static string SubstituteVariables(string template, IReadOnlyDictionary<string, object> variables)
    {
        return PlaceholderPattern.Replace(template, match =>
        {
            var varName = match.Groups[1].Value;
            return variables.TryGetValue(varName, out var value) ? FormatValue(value) : match.Value;
        });
    }

    internal static string FormatValue(object value)
    {
        return value switch
        {
            double d => FormatDouble(d),
            float f => FormatDouble(f),
            int i => i.ToString(CultureInfo.InvariantCulture),
            long l => l.ToString(CultureInfo.InvariantCulture),
            decimal dec => dec.ToString(CultureInfo.InvariantCulture),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty
        };
    }

    private static string FormatDouble(double value)
    {
        // Up to 4 decimal places, trim trailing zeros
        var formatted = value.ToString("0.####", CultureInfo.InvariantCulture);
        return formatted;
    }
}
