namespace Core.Parsing;

public sealed record ParseError(
    int LineNumber,
    string Message
);
