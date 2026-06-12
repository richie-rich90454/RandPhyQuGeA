using System.Collections.Generic;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public sealed class InMemoryTemplateRepository : ITemplateRepository
{
    private readonly List<QuestionTemplate> _templates;
    private readonly object _lock = new();

    public InMemoryTemplateRepository(IReadOnlyList<QuestionTemplate> templates)
    {
        _templates = new List<QuestionTemplate>(templates);
    }

    public void AddRange(IEnumerable<QuestionTemplate> templates)
    {
        lock (_lock) { _templates.AddRange(templates); }
    }

    public IReadOnlyList<QuestionTemplate> GetAll()
    {
        lock (_lock) { return _templates.AsReadOnly(); }
    }

    public IReadOnlyList<QuestionTemplate> GetByTopic(string topicId)
    {
        lock (_lock) { return _templates.Where(t => t.TopicId == topicId).ToList(); }
    }

    public IReadOnlyList<QuestionTemplate> GetBySkill(string skillId)
    {
        lock (_lock) { return _templates.Where(t => t.SkillId == skillId).ToList(); }
    }

    public IReadOnlyList<QuestionTemplate> GetByDifficulty(int difficulty)
    {
        lock (_lock) { return _templates.Where(t => t.Difficulty == difficulty).ToList(); }
    }

    public IReadOnlyList<QuestionTemplate> GetByDifficultyRange(int minDifficulty, int maxDifficulty)
    {
        lock (_lock) { return _templates.Where(t => t.Difficulty >= minDifficulty && t.Difficulty <= maxDifficulty).ToList(); }
    }

    public QuestionTemplate? GetRandom(Random? random = null)
    {
        lock (_lock)
        {
            if (_templates.Count == 0) return null;
            var rng = random ?? new Random();
            return _templates[rng.Next(_templates.Count)];
        }
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
