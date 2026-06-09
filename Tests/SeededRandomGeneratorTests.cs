using Core.Services;
using Xunit;

namespace Tests;

public class SeededRandomGeneratorTests
{
    [Fact]
    public void SameSeed_ProducesSameIntSequence()
    {
        var rng1 = new SeededRandomGenerator(12345);
        var rng2 = new SeededRandomGenerator(12345);

        for (int i = 0; i < 20; i++)
        {
            Assert.Equal(rng1.NextInt(0, 100), rng2.NextInt(0, 100));
        }
    }

    [Fact]
    public void SameSeed_ProducesSameDoubleSequence()
    {
        var rng1 = new SeededRandomGenerator(99999);
        var rng2 = new SeededRandomGenerator(99999);

        for (int i = 0; i < 20; i++)
        {
            Assert.Equal(rng1.NextDouble(0.0, 50.0, 0.1), rng2.NextDouble(0.0, 50.0, 0.1));
        }
    }

    [Fact]
    public void SameSeed_ProducesSameEnumSequence()
    {
        var rng1 = new SeededRandomGenerator(777);
        var rng2 = new SeededRandomGenerator(777);

        for (int i = 0; i < 20; i++)
        {
            Assert.Equal(rng1.NextEnum<DayOfWeek>(), rng2.NextEnum<DayOfWeek>());
        }
    }

    [Fact]
    public void SameSeed_ProducesSameSetSequence()
    {
        var rng1 = new SeededRandomGenerator(555);
        var rng2 = new SeededRandomGenerator(555);
        var set = new[] { "a", "b", "c", "d", "e" };

        for (int i = 0; i < 20; i++)
        {
            Assert.Equal(rng1.NextFromSet(set), rng2.NextFromSet(set));
        }
    }

    [Fact]
    public void DifferentSeeds_ProduceDifferentSequences()
    {
        var rng1 = new SeededRandomGenerator(1);
        var rng2 = new SeededRandomGenerator(2);

        var values1 = Enumerable.Range(0, 10).Select(_ => rng1.NextInt(0, 1000)).ToList();
        var values2 = Enumerable.Range(0, 10).Select(_ => rng2.NextInt(0, 1000)).ToList();

        Assert.NotEqual(values1, values2);
    }

    [Fact]
    public void Reproducible_AcrossMultipleOperations()
    {
        var rng = new SeededRandomGenerator(42);
        var expected = new List<object>();
        expected.Add(rng.NextInt(10, 20));
        expected.Add(rng.NextDouble(0, 1, 0.01));
        expected.Add(rng.NextEnum<ConsoleColor>());
        expected.Add(rng.NextFromSet(new[] { "x", "y", "z" }));
        expected.Add(rng.NextInt(100, 200));

        var rng2 = new SeededRandomGenerator(42);
        var actual = new List<object>();
        actual.Add(rng2.NextInt(10, 20));
        actual.Add(rng2.NextDouble(0, 1, 0.01));
        actual.Add(rng2.NextEnum<ConsoleColor>());
        actual.Add(rng2.NextFromSet(new[] { "x", "y", "z" }));
        actual.Add(rng2.NextInt(100, 200));

        Assert.Equal(expected, actual);
    }
}
