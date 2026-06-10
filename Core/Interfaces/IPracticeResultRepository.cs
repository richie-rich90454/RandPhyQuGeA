using Core.Domain;

namespace Core.Interfaces;

public interface IPracticeResultRepository
{
    Task SaveAsync(PracticeResult result);
    Task<IReadOnlyList<PracticeResult>> LoadAsync();
    Task<IReadOnlyList<PracticeResult>> GetByTopicAsync(string topicId);
    Task<IReadOnlyList<PracticeResult>> GetByDateRangeAsync(DateTime from, DateTime to);
    Task ClearAsync();
}
