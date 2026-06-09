using Core.Domain;

namespace Core.Interfaces;

public interface ISolutionBuilder
{
    string BuildPlainText(QuestionTemplate template, IReadOnlyDictionary<string, object> variables);
    string BuildLaTeX(QuestionTemplate template, IReadOnlyDictionary<string, object> variables);
}
