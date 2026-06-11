using System.Text;
using Core.Domain;
using Core.Interfaces;

namespace Core.Exporters;

public sealed class TextExporter : IQuestionExporter
{
    public void Export(IEnumerable<GeneratedQuestion> questions, Stream output)
    {
        ArgumentNullException.ThrowIfNull(questions);
        ArgumentNullException.ThrowIfNull(output);

        using var writer = new StreamWriter(output, Encoding.UTF8, leaveOpen: true);

        var index = 1;
        foreach (var q in questions)
        {
            writer.WriteLine($"Question {index}: {q.Text}");
            writer.WriteLine($"Answer: {q.Answer}");

            if (q.Choices is { Count: > 0 })
            {
                writer.WriteLine($"Choices: {string.Join(", ", q.Choices)}");
            }

            writer.WriteLine($"Solution: {q.SolutionText}");
            writer.WriteLine();
            writer.WriteLine("---");
            writer.WriteLine();

            index++;
        }
    }
}
