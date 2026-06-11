using Core.Domain;
using Core.Parsing;
using Xunit;

namespace Tests;

public class PartOneTextLoaderTests
{
    private static string WriteTempFile(string content)
    {
        var path = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".txt");
        File.WriteAllText(path, content);
        return path;
    }

    [Fact]
    public void Load_SuccessfulParse_ReturnsSpecification()
    {
        var content = @"
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Constant acceleration problems

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
";
        var path = WriteTempFile(content);
        try
        {
            var loader = new PartOneTextLoader();
            var spec = loader.Load(path);

            Assert.NotNull(spec);
            Assert.Single(spec.Units);
            Assert.Single(spec.Topics);
            Assert.Single(spec.Skills);
            Assert.Single(spec.Templates);

            var unit = spec.Units[0];
            Assert.Equal("U1", unit.Id);
            Assert.Equal("Mechanics", unit.Name);

            var topic = spec.Topics[0];
            Assert.Equal("T1", topic.Id);
            Assert.Equal("U1", topic.UnitId);

            var skill = spec.Skills[0];
            Assert.Equal("S1", skill.Id);
            Assert.Equal("T1", skill.TopicId);

            var template = spec.Templates[0];
            Assert.Equal("Q1", template.Id);
            Assert.Equal("T1", template.TopicId);
            Assert.Equal("S1", template.SkillId);
            Assert.Equal("MC", template.QuestionType);
            Assert.Equal(2, template.Difficulty);
            Assert.Equal(3, template.VariableDefinitions.Count);
            Assert.Equal(2, template.DistractorExpressions.Count);
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void Load_InvalidCrossReference_ThrowsParseException()
    {
        var content = @"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Acceleration
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S2
QuestionType: MultipleChoice
Difficulty: 1
TextTemplate: What is the acceleration?
AnswerExpression: 1
";
        var path = WriteTempFile(content);
        try
        {
            var loader = new PartOneTextLoader();
            var ex = Assert.Throws<ParseException>(() => loader.Load(path));
            Assert.Contains(ex.Errors, e => e.Message.Contains("unknown Skill 'S2'"));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void Load_MalformedSection_ThrowsParseException()
    {
        var content = @"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Acceleration
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: not_a_number
TextTemplate: What is the acceleration?
AnswerExpression: 1
";
        var path = WriteTempFile(content);
        try
        {
            var loader = new PartOneTextLoader();
            var ex = Assert.Throws<ParseException>(() => loader.Load(path));
            Assert.Contains(ex.Errors, e => e.Message.Contains("Invalid Difficulty value"));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void Load_SampleFileFromDisk_Succeeds()
    {
        var samplePath = Path.Combine(AppContext.BaseDirectory, "SampleData", "part_one.txt");
        Assert.True(File.Exists(samplePath), "Sample file should exist in output directory.");

        var loader = new PartOneTextLoader();
        var spec = loader.Load(samplePath);

        Assert.NotNull(spec);
        Assert.Single(spec.Units);
        Assert.Single(spec.Topics);
        Assert.Single(spec.Skills);
        Assert.Single(spec.Templates);
    }
}
