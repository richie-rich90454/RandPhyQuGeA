namespace Core.Interfaces;

public interface IExpressionEvaluator
{
    double Evaluate(string expression, IReadOnlyDictionary<string, object> variables);
}
