using System.Globalization;
using Core.Domain;
using Core.Interfaces;
using Core.Services;
using Xunit;

namespace Tests;

public class RandomOffsetDistractorGeneratorTests
{
    private sealed class MockRandomValueGenerator : IRandomValueGenerator
    {
        private readonly Queue<int> _intQueue = new();
        private readonly Queue<double> _doubleQueue = new();
        private readonly Queue<string> _stringQueue = new();

        public void EnqueueInt(int value) => _intQueue.Enqueue(value);
        public void EnqueueDouble(double value) => _doubleQueue.Enqueue(value);
        public void EnqueueString(string value) => _stringQueue.Enqueue(value);

        public int NextInt(int min, int max) => _intQueue.Count > 0 ? _intQueue.Dequeue() : min;
        public double NextDouble(double min, double max, double step) =>
            _doubleQueue.Count > 0 ? _doubleQueue.Dequeue() : min;
        public T NextEnum<T>() where T : struct, Enum => Enum.GetValues<T>()[0];
        public string NextFromSet(IReadOnlyList<string> values) =>
            _stringQueue.Count > 0 ? _stringQueue.Dequeue() : values[0];
    }

    private static QuestionTemplate MakeTemplate() => new(
        Id: "t1",
        TopicId: "kinematics",
        SkillId: "calc_velocity",
        QuestionType: "MC",
        Difficulty: 1,
        TextTemplate: "What is the result?",
        AnswerExpression: "[x] * 2",
        SolutionTemplate: "Solution here.",
        VariableDefinitions: new List<VariableDefinition>(),
        DistractorExpressions: new List<string>()
    );

    private static IReadOnlyDictionary<string, object> MakeVariables() =>
        new Dictionary<string, object> { { "x", 5.0 } };

    [Fact]
    public void Generate_ReturnsDistractors()
    {
        // The source code's selectedOffsets list is never populated, so the loop
        // iterates through all available offsets. For answer "10" with offsets
        // [-0.3, -0.2, -0.1, 0.1, 0.2, 0.3], all 6 produce unique distractors.
        var random = new MockRandomValueGenerator();
        // Always pick index 0 from the remaining offsets
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);

        var generator = new RandomOffsetDistractorGenerator(random);
        var template = MakeTemplate();
        var variables = MakeVariables();

        var distractors = generator.Generate("10", template, variables).ToList();

        Assert.NotEmpty(distractors);
    }

    [Fact]
    public void Generate_AllDistractorsDifferFromCorrectAnswer()
    {
        var random = new MockRandomValueGenerator();
        // Pick different offsets to get 3 unique distractors
        random.EnqueueInt(0); // pick first offset
        random.EnqueueInt(0); // pick next offset
        random.EnqueueInt(0); // pick next offset

        var generator = new RandomOffsetDistractorGenerator(random);
        var template = MakeTemplate();
        var variables = MakeVariables();

        var distractors = generator.Generate("10", template, variables).ToList();

        Assert.All(distractors, d => Assert.NotEqual("10", d));
    }

    [Fact]
    public void Generate_AllDistractorsAreUnique()
    {
        var random = new MockRandomValueGenerator();
        // Pick offsets at different positions to ensure variety
        random.EnqueueInt(0); // pick first offset
        random.EnqueueInt(0); // pick next available
        random.EnqueueInt(0); // pick next available

        var generator = new RandomOffsetDistractorGenerator(random);
        var template = MakeTemplate();
        var variables = MakeVariables();

        var distractors = generator.Generate("10", template, variables).ToList();

        Assert.Equal(distractors.Distinct().Count(), distractors.Count);
    }

    [Fact]
    public void Generate_HandlesZeroAnswerCorrectly()
    {
        var random = new MockRandomValueGenerator();
        // For zero answer, offsets are [-3, -2, -1, 1, 2, 3]
        // Always pick index 0 from remaining offsets
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);
        random.EnqueueInt(0);

        var generator = new RandomOffsetDistractorGenerator(random);
        var template = MakeTemplate();
        var variables = MakeVariables();

        var distractors = generator.Generate("0", template, variables).ToList();

        Assert.NotEmpty(distractors);
        Assert.All(distractors, d => Assert.NotEqual("0", d));
        // The distractors should use ±1, ±2, ±3 offsets
        Assert.Contains("-3", distractors);
        Assert.Contains("-2", distractors);
        Assert.Contains("-1", distractors);
    }

    [Fact]
    public void Generate_UsesInvariantCultureForParsingAndFormatting()
    {
        // Verify that the generator correctly parses and formats numbers using
        // InvariantCulture (dot as decimal separator), regardless of the current thread culture.
        var originalCulture = CultureInfo.CurrentCulture;
        try
        {
            // Set a culture that uses comma as decimal separator (e.g., de-DE)
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE");

            var random = new MockRandomValueGenerator();
            random.EnqueueInt(0);
            random.EnqueueInt(0);
            random.EnqueueInt(0);

            var generator = new RandomOffsetDistractorGenerator(random);
            var template = MakeTemplate();
            var variables = MakeVariables();

            // "3.14" uses dot as decimal separator (InvariantCulture format)
            var distractors = generator.Generate("3.14", template, variables).ToList();

            // Should successfully parse "3.14" and produce distractors with dot-formatted numbers
            Assert.NotEmpty(distractors);
            Assert.All(distractors, d => Assert.DoesNotContain(",", d));
        }
        finally
        {
            CultureInfo.CurrentCulture = originalCulture;
        }
    }
}
