using Core.Domain;
using Core.Services;
using Xunit;

namespace Tests;

public class PlainTextSolutionBuilderTests
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

    private readonly PlainTextSolutionBuilder _builder = new();

    [Fact]
    public void BuildPlainText_SubstitutesVariablePlaceholders()
    {
        var template = MakeTemplate("The velocity is {v} m/s and time is {t} s.");
        var variables = new Dictionary<string, object>
        {
            { "v", 10 },
            { "t", 5 }
        };

        var result = _builder.BuildPlainText(template, variables);

        Assert.Equal("The velocity is 10 m/s and time is 5 s.", result);
    }

    [Fact]
    public void BuildPlainText_FormatsDoublesCorrectly_UpTo4DecimalPlacesNoTrailingZeros()
    {
        var template = MakeTemplate("The value is {x}.");
        var variables = new Dictionary<string, object>
        {
            { "x", 3.14159 }
        };

        var result = _builder.BuildPlainText(template, variables);

        // 3.14159 formatted with "0.####" → "3.1416" (rounded to 4 decimal places)
        Assert.Equal("The value is 3.1416.", result);
    }

    [Fact]
    public void BuildPlainText_FormatsDoubles_NoTrailingZeros()
    {
        var template = MakeTemplate("The value is {x}.");
        var variables = new Dictionary<string, object>
        {
            { "x", 5.50 }
        };

        var result = _builder.BuildPlainText(template, variables);

        // 5.50 formatted with "0.####" → "5.5" (trailing zero removed)
        Assert.Equal("The value is 5.5.", result);
    }

    [Fact]
    public void BuildPlainText_FormatsDoubles_IntegerLike()
    {
        var template = MakeTemplate("The value is {x}.");
        var variables = new Dictionary<string, object>
        {
            { "x", 7.0 }
        };

        var result = _builder.BuildPlainText(template, variables);

        // 7.0 formatted with "0.####" → "7"
        Assert.Equal("The value is 7.", result);
    }

    [Fact]
    public void BuildLaTeX_SubstitutesVariablePlaceholders()
    {
        var template = MakeTemplate("The velocity is {v} m/s.");
        var variables = new Dictionary<string, object>
        {
            { "v", 15 }
        };

        var result = _builder.BuildLaTeX(template, variables);

        Assert.Equal("The velocity is 15 m/s.", result);
    }
}
