using Core.Domain;

namespace Core.Interfaces;

public interface IDistractorGenerator
{
    IEnumerable<string> Generate(string correctAnswer, QuestionTemplate template, IReadOnlyDictionary<string, object> variables);
}
