namespace Core.Domain;

public sealed record Topic(
    string Id,
    string Name,
    string UnitId,
    string Description
);
