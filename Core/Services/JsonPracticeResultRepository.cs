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

    public async Task SaveAsync(PracticeResult result, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await EnsureLoadedAsync(cancellationToken);
            _cache.Add(result);
            await PersistAsync(cancellationToken);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> LoadAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await EnsureLoadedAsync(cancellationToken);
            return _cache.AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> GetByTopicAsync(string topicId, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await EnsureLoadedAsync(cancellationToken);
            return _cache.Where(r => r.TopicId == topicId).ToList().AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IReadOnlyList<PracticeResult>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await EnsureLoadedAsync(cancellationToken);
            return _cache.Where(r => r.Timestamp >= from && r.Timestamp <= to).ToList().AsReadOnly();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            _cache.Clear();
            _isLoaded = true;
            await PersistAsync(cancellationToken);
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task EnsureLoadedAsync(CancellationToken cancellationToken = default)
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
            var json = await File.ReadAllTextAsync(_filePath, cancellationToken);
            _cache = JsonSerializer.Deserialize<List<PracticeResult>>(json, JsonOptions) ?? new List<PracticeResult>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[JsonPracticeResultRepository] Failed to load practice results from " + _filePath + ": " + ex.Message);
            _cache = new List<PracticeResult>();
        }

        _isLoaded = true;
    }

    private async Task PersistAsync(CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(_cache, JsonOptions);
        try
        {
            await File.WriteAllTextAsync(_filePath, json, cancellationToken);
        }
        catch (Exception ex)
        {
            Debug.WriteLine("[JsonPracticeResultRepository] Failed to persist practice results to " + _filePath + ": " + ex.Message);
        }
    }
}