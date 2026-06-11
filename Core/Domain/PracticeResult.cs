namespace Core.Domain;

public sealed class PracticeResult
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string QuestionId { get; init; } = string.Empty;
    public string TopicId { get; init; } = string.Empty;
    public string SkillId { get; init; } = string.Empty;
    public bool IsCorrect { get; init; }
    public TimeSpan TimeTaken { get; init; }
    public string UserAnswer { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public PracticeMode Mode { get; init; }
    public int Difficulty { get; init; }
}

public enum PracticeMode
{
    Mental,
    Focused
}
