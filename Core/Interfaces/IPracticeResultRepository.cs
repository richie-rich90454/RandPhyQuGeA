using Core.Domain;

namespace Core.Interfaces;

public interface IPracticeResultRepository
{
    Task SaveAsync(PracticeResult result, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PracticeResult>> LoadAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PracticeResult>> GetByTopicAsync(string topicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PracticeResult>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
}