using Core.Interfaces;

namespace Core.Services;

public class UniformRandomGenerator : IRandomValueGenerator
{
    private readonly Random _random;

    public UniformRandomGenerator(Random? random = null)
    {
        _random = random ?? new Random();
    }

    public int NextInt(int min, int max)
    {
        if (min > max)
            throw new ArgumentException("min must be less than or equal to max", nameof(min));
        if (min == max)
            return min;
        return _random.Next(min, max + 1);
    }

    public double NextDouble(double min, double max, double step)
    {
        if (min > max)
            throw new ArgumentException("min must be less than or equal to max", nameof(min));
        if (step <= 0)
            throw new ArgumentException("step must be positive", nameof(step));

        double range = max - min;
        long steps = (long)Math.Round(range / step);
        long selectedStep = _random.NextInt64(0, steps + 1);
        double value = min + selectedStep * step;
        return Math.Clamp(value, min, max);
    }

    public T NextEnum<T>() where T : struct, Enum
    {
        var values = Enum.GetValues<T>();
        if (values.Length == 0)
            throw new InvalidOperationException("Enum has no values.");
        return values[_random.Next(values.Length)];
    }

    public string NextFromSet(IReadOnlyList<string> values)
    {
        if (values == null)
            throw new ArgumentNullException(nameof(values));
        if (values.Count == 0)
            throw new ArgumentException("Set must contain at least one value.", nameof(values));
        return values[_random.Next(values.Count)];
    }
}
