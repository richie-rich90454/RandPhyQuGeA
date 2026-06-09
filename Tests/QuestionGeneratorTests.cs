using Core.Domain;
using Core.Interfaces;
using Core.Services;
using Xunit;

namespace Tests;

public class QuestionGeneratorTests
{
    #region Mock / Stub Implementations

    private sealed class StubTemplateRepository : ITemplateRepository
    {
        private readonly List<QuestionTemplate> _templates;
        public StubTemplateRepository(List<QuestionTemplate> templates) => _templates = templates;
        public IReadOnlyList<QuestionTemplate> GetAll() => _templates;
        public IReadOnlyList<QuestionTemplate> GetByTopic(string topicId) =>
            _templates.Where(t => t.TopicId == topicId).ToList();
        public IReadOnlyList<QuestionTemplate> GetBySkill(string skillId) =>
            _templates.Where(t => t.SkillId == skillId).ToList();
        public IReadOnlyList<QuestionTemplate> GetByDifficulty(int difficulty) =>
            _templates.Where(t => t.Difficulty == difficulty).ToList();
        public QuestionTemplate? GetRandom(Random? random = null) =>
            _templates.Count == 0 ? null : _templates[0];
        public QuestionTemplate? GetRandomByTopic(string topicId, Random? random = null)
        {
            var m = GetByTopic(topicId);
            return m.Count == 0 ? null : m[0];
        }
        public QuestionTemplate? GetRandomBySkill(string skillId, Random? random = null)
        {
            var m = GetBySkill(skillId);
            return m.Count == 0 ? null : m[0];
        }
    }

    private sealed class StubRandomValueGenerator : IRandomValueGenerator
    {
        public int NextInt(int min, int max) => min;
        public double NextDouble(double min, double max, double step) => min;
        public T NextEnum<T>() where T : struct, Enum => Enum.GetValues<T>()[0];
        public string NextFromSet(IReadOnlyList<string> values) => values[0];
    }

    private sealed class StubExpressionEvaluator : IExpressionEvaluator
    {
        private readonly double _result;
        public StubExpressionEvaluator(double result) => _result = result;
        public double Evaluate(string expression, IReadOnlyDictionary<string, object> variables) => _result;
    }

    private sealed class StubDistractorGenerator : IDistractorGenerator
    {
        private readonly string[] _distractors;
        public StubDistractorGenerator(string[] distractors) => _distractors = distractors;
        public IEnumerable<string> Generate(string correctAnswer, QuestionTemplate template, IReadOnlyDictionary<string, object> variables) =>
            _distractors;
    }

    private sealed class StubSolutionBuilder : ISolutionBuilder
    {
        public string BuildPlainText(QuestionTemplate template, IReadOnlyDictionary<string, object> variables) =>
            SubstituteVariables(template.SolutionTemplate, variables);
        public string BuildLaTeX(QuestionTemplate template, IReadOnlyDictionary<string, object> variables) =>
            SubstituteVariables(template.SolutionTemplate, variables);
        private static string SubstituteVariables(string template, IReadOnlyDictionary<string, object> variables)
        {
            var result = template;
            foreach (var kvp in variables)
                result = result.Replace($"{{{kvp.Key}}}", kvp.Value.ToString() ?? string.Empty);
            return result;
        }
    }

    #endregion

    #region Helper Methods

    private static QuestionTemplate MakeTemplate(
        string id = "t1",
        string topicId = "kinematics",
        string skillId = "calc_velocity",
        string questionType = "MC",
        int difficulty = 1,
        string textTemplate = "What is {v}?",
        string answerExpression = "[v]",
        string solutionTemplate = "The answer is {v}.",
        IReadOnlyList<VariableDefinition>? varDefs = null,
        IReadOnlyList<string>? distractorExprs = null) => new(
        Id: id,
        TopicId: topicId,
        SkillId: skillId,
        QuestionType: questionType,
        Difficulty: difficulty,
        TextTemplate: textTemplate,
        AnswerExpression: answerExpression,
        SolutionTemplate: solutionTemplate,
        VariableDefinitions: varDefs ?? new List<VariableDefinition>(),
        DistractorExpressions: distractorExprs ?? new List<string>()
    );

    private static QuestionGenerator MakeGenerator(
        ITemplateRepository? repo = null,
        IRandomValueGenerator? random = null,
        IExpressionEvaluator? evaluator = null,
        IDistractorGenerator? distractor = null,
        ISolutionBuilder? solution = null)
    {
        return new QuestionGenerator(
            repo ?? new StubTemplateRepository(new List<QuestionTemplate>()),
            random ?? new StubRandomValueGenerator(),
            evaluator ?? new StubExpressionEvaluator(42.0),
            distractor ?? new StubDistractorGenerator(new[] { "10", "20", "30" }),
            solution ?? new StubSolutionBuilder()
        );
    }

    #endregion

    [Fact]
    public void Generate_ReturnsNull_WhenNoTemplatesMatch()
    {
        var repo = new StubTemplateRepository(new List<QuestionTemplate>());
        var generator = MakeGenerator(repo: repo);

        var result = generator.Generate();

        Assert.Null(result);
    }

    [Fact]
    public void Generate_ProducesGeneratedQuestionWithCorrectFields()
    {
        var template = MakeTemplate(
            id: "t1", topicId: "kinematics", skillId: "calc_velocity",
            questionType: "SA", difficulty: 2);
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(99.0));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Equal("kinematics", result!.TopicId);
        Assert.Equal("calc_velocity", result.SkillId);
        Assert.Equal("SA", result.QuestionType);
        Assert.Equal(2, result.Difficulty);
        Assert.NotNull(result.Id);
        Assert.NotEmpty(result.Id);
    }

    [Fact]
    public void Generate_SubstitutesVariablesInTextTemplate()
    {
        var template = MakeTemplate(
            textTemplate: "A car travels at {v} m/s for {t} seconds.",
            answerExpression: "[v] * [t]");
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(100.0));

        var result = generator.Generate();

        Assert.NotNull(result);
        // The stub random returns min values; with no variable definitions, no substitution occurs
        // for {v} and {t} since there are no VariableDefinitions.
        // Let's test with variable definitions instead.
    }

    [Fact]
    public void Generate_SubstitutesVariablesInTextTemplate_WithVariableDefinitions()
    {
        var varDefs = new List<VariableDefinition>
        {
            new("v", "int", 0, 10, null, null),
            new("t", "int", 0, 5, null, null)
        };
        var template = MakeTemplate(
            textTemplate: "A car travels at {v} m/s for {t} seconds.",
            answerExpression: "[v] * [t]",
            varDefs: varDefs);
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        // StubRandomValueGenerator.NextInt returns min, so v=0, t=0
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(0.0));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Contains("0 m/s", result!.Text);
        Assert.Contains("0 seconds", result.Text);
    }

    [Fact]
    public void Generate_EvaluatesAnswerExpressionCorrectly()
    {
        var template = MakeTemplate(questionType: "SA", answerExpression: "[mass] * [acc]");
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(42.5));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Equal("42.5", result!.Answer);
    }

    [Fact]
    public void Generate_ProducesMCChoices_WhenQuestionTypeIsMC()
    {
        var template = MakeTemplate(questionType: "MC");
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var distractors = new[] { "10", "20", "30" };
        var generator = MakeGenerator(
            repo: repo,
            evaluator: new StubExpressionEvaluator(42.0),
            distractor: new StubDistractorGenerator(distractors));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.NotNull(result!.Choices);
        // 3 distractors + 1 correct answer = 4 choices
        Assert.Equal(4, result.Choices!.Count);
        Assert.Contains("42", result.Choices);
        Assert.Contains("10", result.Choices);
        Assert.Contains("20", result.Choices);
        Assert.Contains("30", result.Choices);
    }

    [Fact]
    public void Generate_NoChoices_WhenQuestionTypeIsSA()
    {
        var template = MakeTemplate(questionType: "SA");
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var generator = MakeGenerator(repo: repo);

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Null(result!.Choices);
    }

    [Fact]
    public void GenerateBatch_ProducesRequestedNumberOfQuestions()
    {
        var template = MakeTemplate();
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        var generator = MakeGenerator(repo: repo);

        var results = generator.GenerateBatch(5);

        Assert.Equal(5, results.Count);
    }

    [Fact]
    public void Generate_HandlesIntVariableType()
    {
        var varDefs = new List<VariableDefinition>
        {
            new("n", "int", 1, 10, null, null)
        };
        var template = MakeTemplate(
            textTemplate: "Value is {n}.",
            answerExpression: "[n]",
            varDefs: varDefs);
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        // StubRandomValueGenerator.NextInt returns min = 1
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(1.0));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Contains("1", result!.Text);
    }

    [Fact]
    public void Generate_HandlesDoubleVariableType()
    {
        var varDefs = new List<VariableDefinition>
        {
            new("x", "double", 2.5, 5.0, 0.1, null)
        };
        var template = MakeTemplate(
            textTemplate: "Value is {x}.",
            answerExpression: "[x]",
            varDefs: varDefs);
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        // StubRandomValueGenerator.NextDouble returns min = 2.5
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(2.5));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Contains("2.5", result!.Text);
    }

    [Fact]
    public void Generate_HandlesEnumVariableType()
    {
        var varDefs = new List<VariableDefinition>
        {
            new("direction", "enum", null, null, null, new List<string> { "north", "south", "east", "west" })
        };
        var template = MakeTemplate(
            textTemplate: "The wind blows {direction}.",
            answerExpression: "[direction]",
            varDefs: varDefs);
        var repo = new StubTemplateRepository(new List<QuestionTemplate> { template });
        // StubRandomValueGenerator.NextFromSet returns first = "north"
        var generator = MakeGenerator(repo: repo, evaluator: new StubExpressionEvaluator(0.0));

        var result = generator.Generate();

        Assert.NotNull(result);
        Assert.Contains("north", result!.Text);
    }
}
