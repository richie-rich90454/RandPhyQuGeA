using System.Text;
using Core.Domain;
using Core.Interfaces;

namespace Core.Exporters;

public sealed class MarkdownExporter : IQuestionExporter
{
    public void Export(IEnumerable<GeneratedQuestion> questions, Stream output)
    {
        ArgumentNullException.ThrowIfNull(questions);
        ArgumentNullException.ThrowIfNull(output);

        using var writer = new StreamWriter(output, Encoding.UTF8, leaveOpen: true);

        writer.WriteLine("# Physics Questions");
        writer.WriteLine();

        var index = 1;
        foreach (var q in questions)
        {
            writer.WriteLine($"## Question {index}");
            writer.WriteLine();
            writer.WriteLine(q.Text);
            writer.WriteLine();
            writer.WriteLine($"**Answer:** {q.Answer}");
            writer.WriteLine();

            if (q.Choices is { Count: > 0 })
            {
                writer.WriteLine("**Choices:**");
                var choiceIndex = 0;
                foreach (var choice in q.Choices)
                {
                    var label = choiceIndex < 26
                        ? ((char)('A' + choiceIndex)).ToString()
                        : $"A{choiceIndex - 25}";
                    writer.WriteLine($"- {label}) {choice}");
                    choiceIndex++;
                }
                writer.WriteLine();
            }

            writer.WriteLine($"**Solution:** ${q.SolutionLaTeX}$");
            writer.WriteLine();
            writer.WriteLine("---");
            writer.WriteLine();

            index++;
        }
    }
}
