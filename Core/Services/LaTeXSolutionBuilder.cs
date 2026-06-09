using System.Globalization;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class LaTeXSolutionBuilder : ISolutionBuilder
{
    public string BuildPlainText(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        return SubstituteVariables(template.SolutionTemplate, variables);
    }

    public string BuildLaTeX(QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        var result = template.SolutionTemplate;

        foreach (var kvp in variables)
        {
            var placeholder = $"{{{kvp.Key}}}";
            var value = FormatLaTeXValue(kvp.Value);
            result = result.Replace(placeholder, value, StringComparison.Ordinal);
        }

        return result;
    }

    private static string SubstituteVariables(string template, IReadOnlyDictionary<string, object> variables)
    {
        var result = template;
        foreach (var kvp in variables)
        {
            var placeholder = $"{{{kvp.Key}}}";
            var value = PlainTextSolutionBuilder.FormatValue(kvp.Value);
            result = result.Replace(placeholder, value, StringComparison.Ordinal);
        }
        return result;
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
