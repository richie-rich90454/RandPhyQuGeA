using Core.Domain;
using Core.Services;
using Xunit;

namespace Tests;

public class InMemoryTemplateRepositoryTests
{
    private static QuestionTemplate MakeTemplate(
        string id = "t1",
        string topicId = "kinematics",
        string skillId = "calc_velocity",
        string questionType = "MC",
        int difficulty = 1) => new(
        Id: id,
        TopicId: topicId,
        SkillId: skillId,
        QuestionType: questionType,
        Difficulty: difficulty,
        TextTemplate: "What is {v}?",
        AnswerExpression: "[v]",
        SolutionTemplate: "The answer is {v}.",
        VariableDefinitions: new List<VariableDefinition>(),
        DistractorExpressions: new List<string>()
    );

    private static List<QuestionTemplate> MakeSampleTemplates() => new()
    {
        MakeTemplate("t1", "kinematics", "calc_velocity", "MC", 1),
        MakeTemplate("t2", "kinematics", "calc_acceleration", "MC", 2),
        MakeTemplate("t3", "dynamics", "newton_second", "MC", 1),
        MakeTemplate("t4", "dynamics", "calc_velocity", "SA", 3),
    };

    [Fact]
    public void GetAll_ReturnsAllTemplates()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetAll();

        Assert.Equal(4, result.Count);
        Assert.Equal(templates, result);
    }

    [Fact]
    public void GetByTopic_ReturnsOnlyMatchingTemplates()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetByTopic("kinematics");

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("kinematics", t.TopicId));
    }

    [Fact]
    public void GetBySkill_ReturnsOnlyMatchingTemplates()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetBySkill("calc_velocity");

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("calc_velocity", t.SkillId));
    }

    [Fact]
    public void GetByDifficulty_ReturnsOnlyMatchingTemplates()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetByDifficulty(1);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal(1, t.Difficulty));
    }

    [Fact]
    public void GetByTopic_ReturnsEmptyListForNonExistentTopic()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetByTopic("thermodynamics");

        Assert.Empty(result);
    }

    [Fact]
    public void GetRandom_ReturnsTemplateFromList()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetRandom();

        Assert.NotNull(result);
        Assert.Contains(result, templates);
    }

    [Fact]
    public void GetRandom_ReturnsNullForEmptyRepository()
    {
        var repo = new InMemoryTemplateRepository(new List<QuestionTemplate>());

        var result = repo.GetRandom();

        Assert.Null(result);
    }

    [Fact]
    public void GetRandomByTopic_ReturnsTemplateFromMatchingTopic()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetRandomByTopic("kinematics");

        Assert.NotNull(result);
        Assert.Equal("kinematics", result.TopicId);
    }

    [Fact]
    public void GetRandomBySkill_ReturnsTemplateFromMatchingSkill()
    {
        var templates = MakeSampleTemplates();
        var repo = new InMemoryTemplateRepository(templates);

        var result = repo.GetRandomBySkill("calc_velocity");

        Assert.NotNull(result);
        Assert.Equal("calc_velocity", result.SkillId);
    }
}
