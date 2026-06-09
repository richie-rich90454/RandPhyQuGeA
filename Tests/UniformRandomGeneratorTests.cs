using Core.Interfaces;
using Core.Services;
using Xunit;

namespace Tests;

public class UniformRandomGeneratorTests
{
    [Fact]
    public void NextInt_ReturnsValueWithinBounds()
    {
        var rng = new UniformRandomGenerator();
        for (int i = 0; i < 100; i++)
        {
            int value = rng.NextInt(1, 10);
            Assert.InRange(value, 1, 10);
        }
    }

    [Fact]
    public void NextInt_WithInjectedRandom_IsDeterministic()
    {
        var random = new Random(42);
        var rng = new UniformRandomGenerator(random);
        int value = rng.NextInt(0, 100);
        // Re-seed and verify same value
        var random2 = new Random(42);
        var rng2 = new UniformRandomGenerator(random2);
        int value2 = rng2.NextInt(0, 100);
        Assert.Equal(value, value2);
    }

    [Fact]
    public void NextInt_MinGreaterThanMax_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<ArgumentException>(() => rng.NextInt(10, 1));
    }

    [Fact]
    public void NextDouble_ReturnsValueWithinBoundsAndStep()
    {
        var rng = new UniformRandomGenerator(new Random(123));
        for (int i = 0; i < 100; i++)
        {
            double value = rng.NextDouble(0.0, 10.0, 0.5);
            Assert.InRange(value, 0.0, 10.0);
            double remainder = value % 0.5;
            Assert.True(remainder < 1e-9 || Math.Abs(remainder - 0.5) < 1e-9, "Value should align to step");
        }
    }

    [Fact]
    public void NextDouble_StepNotPositive_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<ArgumentException>(() => rng.NextDouble(0, 10, 0));
        Assert.Throws<ArgumentException>(() => rng.NextDouble(0, 10, -1));
    }

    [Fact]
    public void NextDouble_MinGreaterThanMax_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<ArgumentException>(() => rng.NextDouble(10, 0, 0.5));
    }

    [Fact]
    public void NextEnum_ReturnsValidEnumValue()
    {
        var rng = new UniformRandomGenerator();
        for (int i = 0; i < 50; i++)
        {
            var value = rng.NextEnum<DayOfWeek>();
            Assert.True(Enum.IsDefined(typeof(DayOfWeek), value));
        }
    }

    [Fact]
    public void NextEnum_EmptyEnum_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<InvalidOperationException>(() => rng.NextEnum<EmptyEnum>());
    }

    [Fact]
    public void NextFromSet_ReturnsValueFromSet()
    {
        var rng = new UniformRandomGenerator();
        var set = new[] { "apple", "banana", "cherry" };
        for (int i = 0; i < 50; i++)
        {
            var value = rng.NextFromSet(set);
            Assert.Contains(value, set);
        }
    }

    [Fact]
    public void NextFromSet_EmptySet_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<ArgumentException>(() => rng.NextFromSet(Array.Empty<string>()));
    }

    [Fact]
    public void NextFromSet_NullSet_Throws()
    {
        var rng = new UniformRandomGenerator();
        Assert.Throws<ArgumentNullException>(() => rng.NextFromSet(null!));
    }

    private enum EmptyEnum { }
}
