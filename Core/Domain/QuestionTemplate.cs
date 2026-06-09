namespace Core.Domain;

public sealed record QuestionTemplate(
    string Id,
    string TopicId,
    string SkillId,
    string QuestionType,
    int Difficulty,
    string TextTemplate,
    string AnswerExpression,
    string SolutionTemplate,
    IReadOnlyList<VariableDefinition> VariableDefinitions,
    IReadOnlyList<string> DistractorExpressions
);
