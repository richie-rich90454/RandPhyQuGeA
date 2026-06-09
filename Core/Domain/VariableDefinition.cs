namespace Core.Domain;

public sealed record VariableDefinition(
    string Name,
    string Type,
    double? Min,
    double? Max,
    double? Step,
    IReadOnlyList<string>? EnumValues
);
