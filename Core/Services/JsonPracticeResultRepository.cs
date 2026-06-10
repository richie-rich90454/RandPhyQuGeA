using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Core.Domain;
using Core.Interfaces;

namespace Core.Services;

public class JsonPracticeResultRepository : IPracticeResultRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private List<PracticeResult> _cache = new();
    private bool _isLoaded;

    public JsonPracticeResultRepository()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var dir = Path.Combine(appData, "RandPhyQuGeA");
        Directory.CreateDirectory(dir);
        _filePath = Path.Combine(dir, "practice_results.json");
    }

    public JsonPracticeResultRepository(string filePath)
    {
        _filePath = filePath;
        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
    }

    public async Task SaveAsync(PracticeResult result)
    {
        await _lock.WaitAsync();
        try
        {
            await EnsureLoadedAsync();
            _cache.Add(result);
            await PersistAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> LoadAsync()
    {
        await _lock.WaitAsync();
        try
        {
            await EnsureLoadedAsync();
            return _cache.AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> GetByTopicAsync(string topicId)
    {
        await _lock.WaitAsync();
        try
        {
            await EnsureLoadedAsync();
            return _cache.Where(r => r.TopicId == topicId).ToList().AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        await _lock.WaitAsync();
        try
        {
            await EnsureLoadedAsync();
            return _cache.Where(r => r.Timestamp >= from && r.Timestamp <= to).ToList().AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task ClearAsync()
    {
        await _lock.WaitAsync();
        try
        {
            _cache.Clear();
            _isLoaded = true;
            await PersistAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task EnsureLoadedAsync()
    {
        if (_isLoaded) return;

        if (!File.Exists(_filePath))
        {
            _cache = new List<PracticeResult>();
            _isLoaded = true;
            return;
        }

        try
        {
            var json = await File.ReadAllTextAsync(_filePath);
            _cache = JsonSerializer.Deserialize<List<PracticeResult>>(json, JsonOptions) ?? new List<PracticeResult>();
        }
        catch
        {
            _cache = new List<PracticeResult>();
        }

        _isLoaded = true;
    }

    private async Task PersistAsync()
    {
        Debug.Assert(_lock.CurrentCount == 0, "PersistAsync must be called while holding the lock");
        var json = JsonSerializer.Serialize(_cache, JsonOptions);
        await File.WriteAllTextAsync(_filePath, json);
    }
}
