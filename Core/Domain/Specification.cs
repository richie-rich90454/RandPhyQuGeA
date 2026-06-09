namespace Core.Domain;

public sealed record Specification(
    IReadOnlyList<Unit> Units,
    IReadOnlyList<Topic> Topics,
    IReadOnlyList<Skill> Skills,
    IReadOnlyList<QuestionTemplate> Templates
);
