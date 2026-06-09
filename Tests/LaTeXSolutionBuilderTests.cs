using Core.Domain;
using Core.Services;
using Xunit;

namespace Tests;

public class LaTeXSolutionBuilderTests
{
    private static QuestionTemplate MakeTemplate(string solutionTemplate = "The answer is {v}.") => new(
        Id: "t1",
        TopicId: "kinematics",
        SkillId: "calc_velocity",
        QuestionType: "MC",
        Difficulty: 1,
        TextTemplate: "What is {v}?",
        AnswerExpression: "[v]",
        SolutionTemplate: solutionTemplate,
        VariableDefinitions: new List<VariableDefinition>(),
        DistractorExpressions: new List<string>()
    );

    private readonly LaTeXSolutionBuilder _latexBuilder = new();
    private readonly PlainTextSolutionBuilder _plainTextBuilder = new();

    [Fact]
    public void BuildPlainText_ProducesSameOutputAsPlainTextSolutionBuilder()
    {
        var template = MakeTemplate("The velocity is {v} m/s and time is {t} s.");
        var variables = new Dictionary<string, object>
        {
            { "v", 10 },
            { "t", 5.5 }
        };

        var latexResult = _latexBuilder.BuildPlainText(template, variables);
        var plainTextResult = _plainTextBuilder.BuildPlainText(template, variables);

        Assert.Equal(plainTextResult, latexResult);
    }

    [Fact]
    public void BuildLaTeX_PreservesExistingDollarDelimiters()
    {
        var template = MakeTemplate("The formula is $F = {m} \\times {a}$.");
        var variables = new Dictionary<string, object>
        {
            { "m", 5 },
            { "a", 9.8 }
        };

        var result = _latexBuilder.BuildLaTeX(template, variables);

        Assert.Contains("$F = 5 \\times 9.8$", result);
        // The $ delimiters should still be present
        Assert.StartsWith("The formula is $", result);
        Assert.EndsWith("$.", result);
    }

    [Fact]
    public void BuildLaTeX_SubstitutesVariablePlaceholders()
    {
        var template = MakeTemplate("The velocity is {v} m/s.");
        var variables = new Dictionary<string, object>
        {
            { "v", 25 }
        };

        var result = _latexBuilder.BuildLaTeX(template, variables);

        Assert.Equal("The velocity is 25 m/s.", result);
    }
}
