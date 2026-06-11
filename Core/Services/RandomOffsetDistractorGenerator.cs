using System.Globalization;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class RandomOffsetDistractorGenerator : IDistractorGenerator
{
    private readonly IRandomValueGenerator _random;

    public RandomOffsetDistractorGenerator(IRandomValueGenerator random)
    {
        _random = random;
    }

    public IEnumerable<string> Generate(string correctAnswer, QuestionTemplate template, IReadOnlyDictionary<string, object> variables)
    {
        var distractors = new List<string>();
        double correctValue;

        if (!double.TryParse(correctAnswer, CultureInfo.InvariantCulture, out correctValue))
        {
            return distractors;
        }

        double[] offsets = correctValue == 0
            ? [-3, -2, -1, 1, 2, 3]
            : [-0.3, -0.2, -0.1, 0.1, 0.2, 0.3];

        // Shuffle offsets by picking randomly
        var availableOffsets = offsets.ToList();
        var selectedOffsets = new List<double>();

        while (availableOffsets.Count > 0 && selectedOffsets.Count < 3)
        {
            int index = _random.NextInt(0, availableOffsets.Count - 1);
            double offset = availableOffsets[index];
            availableOffsets.RemoveAt(index);

            double distractorValue = correctValue == 0
                ? correctValue + offset
                : correctValue + offset * Math.Abs(correctValue);

            string formatted = FormatValue(distractorValue);

            if (formatted != correctAnswer && !distractors.Contains(formatted))
            {
                distractors.Add(formatted);
            }
        }

        return distractors;
    }

    private static string FormatValue(double value)
    {
        if (Math.Abs(value - Math.Round(value)) < 1e-9)
            return Math.Round(value).ToString(CultureInfo.InvariantCulture);
        return value.ToString("G", CultureInfo.InvariantCulture);
    }
}
