using System.Text;
using Core.Domain;
using Core.Interfaces;

namespace Core.Exporters;

public sealed class HtmlExporter : IQuestionExporter
{
    public void Export(IEnumerable<GeneratedQuestion> questions, Stream output)
    {
        using var writer = new StreamWriter(output, Encoding.UTF8, leaveOpen: true);

        writer.WriteLine("<!DOCTYPE html>");
        writer.WriteLine("<html><head><meta charset=\"utf-8\"><title>Physics Questions</title>");
        writer.WriteLine("<script src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js\"></script>");
        writer.WriteLine("<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}");
        writer.WriteLine(".question{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:5px}");
        writer.WriteLine(".answer{color:green;font-weight:bold}.solution{margin-top:10px;color:#555}</style>");
        writer.WriteLine("</head><body><h1>Physics Questions</h1>");

        var index = 1;
        foreach (var q in questions)
        {
            writer.WriteLine("<div class=\"question\">");
            writer.WriteLine($"<p><strong>Question {index}:</strong> {EscapeHtml(q.Text)}</p>");
            writer.WriteLine($"<div class=\"answer\">Answer: {EscapeHtml(q.Answer)}</div>");

            if (q.Choices is { Count: > 0 })
            {
                writer.WriteLine("<div class=\"choices\">");
                foreach (var choice in q.Choices)
                {
                    writer.WriteLine($"<div>- {EscapeHtml(choice)}</div>");
                }
                writer.WriteLine("</div>");
            }

            writer.WriteLine($"<div class=\"solution\">Solution: \\( {q.SolutionLaTeX} \\)</div>");
            writer.WriteLine("</div>");

            index++;
        }

        writer.WriteLine("</body></html>");
    }

    private static string EscapeHtml(string text)
    {
        return text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
    }
}
