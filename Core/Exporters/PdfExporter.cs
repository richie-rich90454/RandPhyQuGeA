using Core.Domain;
using Core.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Core.Exporters;

public sealed class PdfExporter : IQuestionExporter
{
    static PdfExporter()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public void Export(IEnumerable<GeneratedQuestion> questions, Stream output)
    {
        var questionList = questions.ToList();

        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(12));

                page.Header().Text("Physics Questions").FontSize(20).Bold();

                page.Content().Column(column =>
                {
                    foreach (var q in questionList)
                    {
                        column.Item().Text(q.Text).FontSize(14);
                        column.Item().Text($"Answer: {q.Answer}").FontColor(Colors.Green.Darken2);

                        if (q.Choices is { Count: > 0 })
                        {
                            column.Item().Text($"Choices: {string.Join(", ", q.Choices)}");
                        }

                        column.Item().Text($"Solution: {q.SolutionText}").FontColor(Colors.Grey.Darken2);
                        column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    }
                });
            });
        }).GeneratePdf(output);
    }
}
