using System.Text;
using Core.Domain;
using Core.Exporters;
using Xunit;

namespace Tests;

public class ExporterTests
{
    private static GeneratedQuestion CreateSampleQuestion(string type = "SA") => new(
        Id: "q1", TopicId: "t1", SkillId: "s1", QuestionType: type, Difficulty: 3,
        Text: "What is 2 + 2?", Answer: "4",
        Choices: type == "MC" ? new List<string> { "3", "4", "5", "6" } : null,
        SolutionText: "Add 2 and 2 to get 4.", SolutionLaTeX: "$2 + 2 = 4$",
        Variables: new Dictionary<string, object> { { "a", 2 }, { "b", 2 } }
    );

    private static string ExportToString(Action<Stream> exportAction)
    {
        using var ms = new MemoryStream();
        exportAction(ms);
        ms.Position = 0;
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    // === TextExporter tests ===

    [Fact]
    public void TextExporter_ExportsQuestionText()
    {
        var exporter = new TextExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("What is 2 + 2?", result);
    }

    [Fact]
    public void TextExporter_ExportsAnswer()
    {
        var exporter = new TextExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("Answer: 4", result);
    }

    [Fact]
    public void TextExporter_ExportsChoices_WhenMC()
    {
        var exporter = new TextExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion("MC") }, s));

        Assert.Contains("Choices: 3, 4, 5, 6", result);
    }

    [Fact]
    public void TextExporter_ExportsSolution()
    {
        var exporter = new TextExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("Solution: Add 2 and 2 to get 4.", result);
    }

    [Fact]
    public void TextExporter_ExportsMultipleQuestions()
    {
        var exporter = new TextExporter();
        var questions = new[] { CreateSampleQuestion(), CreateSampleQuestion() };
        var result = ExportToString(s => exporter.Export(questions, s));

        Assert.Contains("Question 1:", result);
        Assert.Contains("Question 2:", result);
    }

    // === PdfExporter tests ===

    [Fact]
    public void PdfExporter_ProducesNonEmptyPdf()
    {
        var exporter = new PdfExporter();
        using var ms = new MemoryStream();
        exporter.Export(new[] { CreateSampleQuestion() }, ms);

        Assert.True(ms.Length > 0);
        var bytes = ms.ToArray();
        var header = Encoding.ASCII.GetString(bytes, 0, Math.Min(5, bytes.Length));
        Assert.StartsWith("%PDF", header);
    }

    [Fact]
    public void PdfExporter_ExportsMultipleQuestions()
    {
        var exporter = new PdfExporter();
        using var ms = new MemoryStream();
        exporter.Export(new[] { CreateSampleQuestion(), CreateSampleQuestion() }, ms);

        Assert.True(ms.Length > 0);
    }

    // === HtmlExporter tests ===

    [Fact]
    public void HtmlExporter_ContainsHtmlStructure()
    {
        var exporter = new HtmlExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("<!DOCTYPE html>", result);
        Assert.Contains("<html>", result);
        Assert.Contains("<body>", result);
    }

    [Fact]
    public void HtmlExporter_ContainsMathJaxScript()
    {
        var exporter = new HtmlExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("mathjax", result);
    }

    [Fact]
    public void HtmlExporter_ContainsQuestionText()
    {
        var exporter = new HtmlExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("What is 2 + 2?", result);
    }

    [Fact]
    public void HtmlExporter_ContainsAnswer()
    {
        var exporter = new HtmlExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("Answer: 4", result);
    }

    [Fact]
    public void HtmlExporter_ContainsChoices_WhenMC()
    {
        var exporter = new HtmlExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion("MC") }, s));

        Assert.Contains("3", result);
        Assert.Contains("4", result);
        Assert.Contains("5", result);
        Assert.Contains("6", result);
    }

    // === MarkdownExporter tests ===

    [Fact]
    public void MarkdownExporter_ContainsMarkdownHeaders()
    {
        var exporter = new MarkdownExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("# Physics Questions", result);
    }

    [Fact]
    public void MarkdownExporter_ContainsQuestionText()
    {
        var exporter = new MarkdownExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("What is 2 + 2?", result);
    }

    [Fact]
    public void MarkdownExporter_ContainsAnswer()
    {
        var exporter = new MarkdownExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("**Answer:**", result);
    }

    [Fact]
    public void MarkdownExporter_ContainsLaTeX()
    {
        var exporter = new MarkdownExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion() }, s));

        Assert.Contains("$2 + 2 = 4$", result);
    }

    [Fact]
    public void MarkdownExporter_ContainsChoices_WhenMC()
    {
        var exporter = new MarkdownExporter();
        var result = ExportToString(s => exporter.Export(new[] { CreateSampleQuestion("MC") }, s));

        Assert.Contains("A)", result);
        Assert.Contains("B)", result);
        Assert.Contains("C)", result);
        Assert.Contains("D)", result);
    }
}
