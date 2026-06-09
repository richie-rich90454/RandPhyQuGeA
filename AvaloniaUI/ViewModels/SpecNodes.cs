using System.Collections.Generic;
using System.Linq;
using Core.Domain;

namespace AvaloniaUI.ViewModels;

public sealed class UnitNode
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public List<TopicNode> Topics { get; } = new();
    public int TemplateCount { get; set; }
    public int MinDifficulty { get; set; }
    public int MaxDifficulty { get; set; }
    public double AvgDifficulty { get; set; }
    public int McCount { get; set; }
    public int SaCount { get; set; }

    public UnitNode(Unit unit)
    {
        Id = unit.Id;
        Name = unit.Name;
        Description = unit.Description;
    }
}

public sealed class TopicNode
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public string UnitId { get; }
    public List<SkillNode> Skills { get; } = new();
    public int TemplateCount { get; set; }
    public int MinDifficulty { get; set; }
    public int MaxDifficulty { get; set; }
    public double AvgDifficulty { get; set; }
    public int McCount { get; set; }
    public int SaCount { get; set; }

    public TopicNode(Topic topic)
    {
        Id = topic.Id;
        Name = topic.Name;
        Description = topic.Description;
        UnitId = topic.UnitId;
    }
}

public sealed class SkillNode
{
    public string Id { get; }
    public string Name { get; }
    public string Description { get; }
    public string TopicId { get; }
    public List<TemplateNode> Templates { get; } = new();
    public int TemplateCount { get; set; }
    public int MinDifficulty { get; set; }
    public int MaxDifficulty { get; set; }
    public double AvgDifficulty { get; set; }
    public int McCount { get; set; }
    public int SaCount { get; set; }

    public SkillNode(Skill skill)
    {
        Id = skill.Id;
        Name = skill.Name;
        Description = skill.Description;
        TopicId = skill.TopicId;
    }
}

public sealed class TemplateNode
{
    public string Id { get; }
    public string TextTemplate { get; }
    public string QuestionType { get; }
    public int Difficulty { get; }
    public string AnswerExpression { get; }

    public TemplateNode(QuestionTemplate template)
    {
        Id = template.Id;
        TextTemplate = template.TextTemplate;
        QuestionType = template.QuestionType;
        Difficulty = template.Difficulty;
        AnswerExpression = template.AnswerExpression;
    }
}
