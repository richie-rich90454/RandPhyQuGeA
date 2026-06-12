using Core.Interfaces;

namespace LaTeX.Services;

public class CachedLaTeXRenderer : ILaTeXRenderer
{
    private readonly ILaTeXRenderer _innerRenderer;
    private readonly int _maxCacheSize;
    private readonly Dictionary<string, (LinkedListNode<string> Key, byte[] Value)> _imageCache = new();
    private readonly Dictionary<string, (LinkedListNode<string> Key, string Value)> _svgCache = new();
    private readonly LinkedList<string> _imageLru = new();
    private readonly LinkedList<string> _svgLru = new();
    private readonly SemaphoreSlim _imageSemaphore = new(1, 1);
    private readonly SemaphoreSlim _svgSemaphore = new(1, 1);

    public CachedLaTeXRenderer(ILaTeXRenderer innerRenderer, int maxCacheSize = 100)
    {
        _innerRenderer = innerRenderer;
        _maxCacheSize = maxCacheSize;
    }

    public async Task<byte[]> RenderToImageAsync(string latex, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(latex))
            throw new ArgumentException("LaTeX input must not be null or empty.", nameof(latex));

        var key = ComputeKey(latex);

        await _imageSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (_imageCache.TryGetValue(key, out var entry))
            {
                _imageLru.Remove(entry.Key);
                _imageLru.AddFirst(entry.Key);
                return entry.Value;
            }
        }
        finally
        {
            _imageSemaphore.Release();
        }

        var result = await _innerRenderer.RenderToImageAsync(latex, cancellationToken);

        await _imageSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (_imageCache.TryGetValue(key, out var existing))
            {
                _imageLru.Remove(existing.Key);
                _imageLru.AddFirst(existing.Key);
                _imageCache[key] = (existing.Key, result);
            }
            else
            {
                if (_imageCache.Count >= _maxCacheSize)
                {
                    var lruKey = _imageLru.Last!;
                    _imageCache.Remove(lruKey.Value);
                    _imageLru.RemoveLast();
                }

                var node = _imageLru.AddFirst(key);
                _imageCache[key] = (node, result);
            }
        }
        finally
        {
            _imageSemaphore.Release();
        }

        return result;
    }

    public async Task<string> RenderToSvgAsync(string latex, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(latex))
            throw new ArgumentException("LaTeX input must not be null or empty.", nameof(latex));

        var key = ComputeKey(latex);

        await _svgSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (_svgCache.TryGetValue(key, out var entry))
            {
                _svgLru.Remove(entry.Key);
                _svgLru.AddFirst(entry.Key);
                return entry.Value;
            }
        }
        finally
        {
            _svgSemaphore.Release();
        }

        var result = await _innerRenderer.RenderToSvgAsync(latex, cancellationToken);

        await _svgSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (_svgCache.TryGetValue(key, out var existing))
            {
                _svgLru.Remove(existing.Key);
                _svgLru.AddFirst(existing.Key);
                _svgCache[key] = (existing.Key, result);
            }
            else
            {
                if (_svgCache.Count >= _maxCacheSize)
                {
                    var lruKey = _svgLru.Last!;
                    _svgCache.Remove(lruKey.Value);
                    _svgLru.RemoveLast();
                }

                var node = _svgLru.AddFirst(key);
                _svgCache[key] = (node, result);
            }
        }
        finally
        {
            _svgSemaphore.Release();
        }

        return result;
    }

    private static string ComputeKey(string latex)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var hashBytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(latex));
        return Convert.ToHexString(hashBytes);
    }
}
