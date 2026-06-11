using Core.Domain;

namespace Core.Interfaces;

public interface ITemplateRepository
{
    IReadOnlyList<QuestionTemplate> GetAll();
    IReadOnlyList<QuestionTemplate> GetByTopic(string topicId);
    IReadOnlyList<QuestionTemplate> GetBySkill(string skillId);
    IReadOnlyList<QuestionTemplate> GetByDifficulty(int difficulty);
    IEnumerable<QuestionTemplate> GetByDifficultyRange(int minDifficulty, int maxDifficulty);
    QuestionTemplate? GetRandom(Random? random = null);
    QuestionTemplate? GetRandomByTopic(string topicId, Random? random = null);
    QuestionTemplate? GetRandomBySkill(string skillId, Random? random = null);
}
