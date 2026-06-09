namespace Core.Domain;

public sealed record Skill(
    string Id,
    string Name,
    string TopicId,
    string Description
);
