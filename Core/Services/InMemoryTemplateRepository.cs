using System.Collections.Generic;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public sealed class InMemoryTemplateRepository : ITemplateRepository
{
    private readonly List<QuestionTemplate> _templates;

    public InMemoryTemplateRepository(IReadOnlyList<QuestionTemplate> templates)
    {
        _templates = new List<QuestionTemplate>(templates);
    }

    public void AddRange(IEnumerable<QuestionTemplate> templates)
    {
        _templates.AddRange(templates);
    }

    public IReadOnlyList<QuestionTemplate> GetAll() => _templates;

    public IReadOnlyList<QuestionTemplate> GetByTopic(string topicId) =>
        _templates.Where(t => t.TopicId == topicId).ToList();

    public IReadOnlyList<QuestionTemplate> GetBySkill(string skillId) =>
        _templates.Where(t => t.SkillId == skillId).ToList();

    public IReadOnlyList<QuestionTemplate> GetByDifficulty(int difficulty) =>
        _templates.Where(t => t.Difficulty == difficulty).ToList();

    public QuestionTemplate? GetRandom(Random? random = null)
    {
        if (_templates.Count == 0) return null;
        var rng = random ?? new Random();
        return _templates[rng.Next(_templates.Count)];
    }

    public QuestionTemplate? GetRandomByTopic(string topicId, Random? random = null)
    {
        var matches = GetByTopic(topicId);
        if (matches.Count == 0) return null;
        var rng = random ?? new Random();
        return matches[rng.Next(matches.Count)];
    }

    public QuestionTemplate? GetRandomBySkill(string skillId, Random? random = null)
    {
        var matches = GetBySkill(skillId);
        if (matches.Count == 0) return null;
        var rng = random ?? new Random();
        return matches[rng.Next(matches.Count)];
    }
}
