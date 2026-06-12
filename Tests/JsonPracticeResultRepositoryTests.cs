using Core.Domain;
using Core.Services;
using Xunit;

namespace Tests;

public class JsonPracticeResultRepositoryTests : IAsyncLifetime
{
    private readonly string _tempFilePath;
    private readonly JsonPracticeResultRepository _repository;

    public JsonPracticeResultRepositoryTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_results_{Guid.NewGuid():N}.json");
        _repository = new JsonPracticeResultRepository(_tempFilePath);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (File.Exists(_tempFilePath))
        {
            try { File.Delete(_tempFilePath); } catch { }
        }
        await Task.CompletedTask;
    }

    [Fact]
    public async Task SaveAsync_LoadAsync_RoundTrip()
    {
        var result = new PracticeResult
        {
            QuestionId = "q1",
            TopicId = "kinematics",
            SkillId = "calc_velocity",
            IsCorrect = true,
            TimeTaken = TimeSpan.FromSeconds(5.2),
            UserAnswer = "42",
            Timestamp = DateTime.UtcNow,
            Mode = PracticeMode.Focused,
            Difficulty = 3
        };

        await _repository.SaveAsync(result);
        var loaded = await _repository.LoadAsync();

        Assert.Single(loaded);
        Assert.Equal("q1", loaded[0].QuestionId);
        Assert.Equal("kinematics", loaded[0].TopicId);
        Assert.Equal("calc_velocity", loaded[0].SkillId);
        Assert.True(loaded[0].IsCorrect);
        Assert.Equal(TimeSpan.FromSeconds(5.2), loaded[0].TimeTaken);
        Assert.Equal("42", loaded[0].UserAnswer);
        Assert.Equal(PracticeMode.Focused, loaded[0].Mode);
        Assert.Equal(3, loaded[0].Difficulty);
    }

    [Fact]
    public async Task ClearAsync_RemovesAllResults()
    {
        var result = new PracticeResult
        {
            QuestionId = "q1",
            TopicId = "kinematics",
            SkillId = "calc_velocity",
            IsCorrect = true,
            TimeTaken = TimeSpan.FromSeconds(3),
            UserAnswer = "10",
            Timestamp = DateTime.UtcNow,
            Mode = PracticeMode.Mental,
            Difficulty = 5
        };

        await _repository.SaveAsync(result);
        var loaded = await _repository.LoadAsync();
        Assert.Single(loaded);

        await _repository.ClearAsync();
        loaded = await _repository.LoadAsync();
        Assert.Empty(loaded);
    }

    [Fact]
    public async Task LoadAsync_WithCorruptedJsonFile_ReturnsEmptyList()
    {
        // Write garbage to the file
        await File.WriteAllTextAsync(_tempFilePath, "{{{not valid json!!!");

        // Create a new repository instance pointing to the same corrupted file
        var repo = new JsonPracticeResultRepository(_tempFilePath);
        var loaded = await repo.LoadAsync();

        Assert.Empty(loaded);
    }

    [Fact]
    public async Task LoadAsync_WithNonExistentFile_ReturnsEmptyList()
    {
        var nonExistentPath = Path.Combine(Path.GetTempPath(), $"nonexistent_{Guid.NewGuid():N}.json");
        var repo = new JsonPracticeResultRepository(nonExistentPath);
        var loaded = await repo.LoadAsync();

        Assert.Empty(loaded);

        // Clean up (file shouldn't have been created by load)
        if (File.Exists(nonExistentPath))
            File.Delete(nonExistentPath);
    }

    [Fact]
    public async Task SaveAsync_MultipleResults_AllPersisted()
    {
        var result1 = new PracticeResult { QuestionId = "q1", TopicId = "t1", SkillId = "s1", IsCorrect = true, Mode = PracticeMode.Mental, Difficulty = 1 };
        var result2 = new PracticeResult { QuestionId = "q2", TopicId = "t2", SkillId = "s2", IsCorrect = false, Mode = PracticeMode.Focused, Difficulty = 7 };

        await _repository.SaveAsync(result1);
        await _repository.SaveAsync(result2);

        var loaded = await _repository.LoadAsync();
        Assert.Equal(2, loaded.Count);
    }
}
