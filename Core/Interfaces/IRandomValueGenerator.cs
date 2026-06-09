namespace Core.Interfaces;

public interface IRandomValueGenerator
{
    int NextInt(int min, int max);
    double NextDouble(double min, double max, double step);
    T NextEnum<T>() where T : struct, Enum;
    string NextFromSet(IReadOnlyList<string> values);
}
