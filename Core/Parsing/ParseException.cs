namespace Core.Parsing;

public class ParseException : Exception
{
    public IReadOnlyList<ParseError> Errors { get; }

    public ParseException(IReadOnlyList<ParseError> errors)
        : base("Specification parse failed with " + errors.Count + " error(s).")
    {
        Errors = errors;
    }
}
