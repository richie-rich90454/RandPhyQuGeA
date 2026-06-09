namespace Core.Domain;

public sealed record GeneratedQuestion(
    string Id,
    string TopicId,
    string SkillId,
    string QuestionType,
    int Difficulty,
    string Text,
    string Answer,
    IReadOnlyList<string>? Choices,
    string SolutionText,
    string SolutionLaTeX,
    IReadOnlyDictionary<string, object> Variables
);
