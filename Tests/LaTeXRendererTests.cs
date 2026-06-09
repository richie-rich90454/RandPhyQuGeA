using Core.Interfaces;
using LaTeX.Services;
using Xunit;

namespace Tests;

public class LaTeXRendererTests
{
    // ── DummyRenderer ──────────────────────────────────────────────────────

    [Fact]
    public async Task RenderToImageAsync_ReturnsNonNullByteArray()
    {
        var renderer = new DummyRenderer();
        var result = await renderer.RenderToImageAsync("x^2");
        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task RenderToSvgAsync_ReturnsSvgString()
    {
        var renderer = new DummyRenderer();
        var result = await renderer.RenderToSvgAsync("x^2");
        Assert.NotNull(result);
        Assert.Contains("svg", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RenderToImageAsync_ReturnsSameResultForSameInput()
    {
        var renderer = new DummyRenderer();
        var result1 = await renderer.RenderToImageAsync("x^2");
        var result2 = await renderer.RenderToImageAsync("x^2");
        Assert.Equal(result1, result2);
    }

    [Fact]
    public async Task RenderToSvgAsync_ReturnsSameResultForSameInput()
    {
        var renderer = new DummyRenderer();
        var result1 = await renderer.RenderToSvgAsync("x^2");
        var result2 = await renderer.RenderToSvgAsync("x^2");
        Assert.Equal(result1, result2);
    }

    // ── CachedLaTeXRenderer ───────────────────────────────────────────────

    private class CountingRenderer : ILaTeXRenderer
    {
        private readonly Dictionary<string, byte[]> _imageResults = new();
        private readonly Dictionary<string, string> _svgResults = new();

        public int ImageCallCount { get; private set; }
        public int SvgCallCount { get; private set; }

        public void SetImageResult(string latex, byte[] result) => _imageResults[latex] = result;
        public void SetSvgResult(string latex, string result) => _svgResults[latex] = result;

        public Task<byte[]> RenderToImageAsync(string latex, CancellationToken cancellationToken = default)
        {
            ImageCallCount++;
            if (_imageResults.TryGetValue(latex, out var result))
                return Task.FromResult(result);
            return Task.FromResult(Array.Empty<byte>());
        }

        public Task<string> RenderToSvgAsync(string latex, CancellationToken cancellationToken = default)
        {
            SvgCallCount++;
            if (_svgResults.TryGetValue(latex, out var result))
                return Task.FromResult(result);
            return Task.FromResult(string.Empty);
        }
    }

    [Fact]
    public async Task RenderToSvgAsync_CachesResult()
    {
        var inner = new CountingRenderer();
        inner.SetSvgResult("x^2", "<svg>x^2</svg>");
        var cached = new CachedLaTeXRenderer(inner, maxCacheSize: 10);

        await cached.RenderToSvgAsync("x^2");
        await cached.RenderToSvgAsync("x^2");

        Assert.Equal(1, inner.SvgCallCount);
    }

    [Fact]
    public async Task RenderToImageAsync_CachesResult()
    {
        var inner = new CountingRenderer();
        inner.SetImageResult("x^2", new byte[] { 1, 2, 3 });
        var cached = new CachedLaTeXRenderer(inner, maxCacheSize: 10);

        await cached.RenderToImageAsync("x^2");
        await cached.RenderToImageAsync("x^2");

        Assert.Equal(1, inner.ImageCallCount);
    }

    [Fact]
    public async Task Cache_EvictsWhenFull()
    {
        var inner = new CountingRenderer();
        inner.SetSvgResult("a", "<svg>a</svg>");
        inner.SetSvgResult("b", "<svg>b</svg>");
        inner.SetSvgResult("c", "<svg>c</svg>");
        var cached = new CachedLaTeXRenderer(inner, maxCacheSize: 2);

        // Fill cache with "a" and "b"
        await cached.RenderToSvgAsync("a");
        await cached.RenderToSvgAsync("b");
        Assert.Equal(2, inner.SvgCallCount);

        // Insert "c" — should evict the LRU entry ("a")
        await cached.RenderToSvgAsync("c");
        Assert.Equal(3, inner.SvgCallCount);

        // Accessing "a" again must call the inner renderer because it was evicted
        await cached.RenderToSvgAsync("a");
        Assert.Equal(4, inner.SvgCallCount);
    }

    [Fact]
    public async Task Cache_DifferentInputs_ProduceDifferentResults()
    {
        var inner = new CountingRenderer();
        inner.SetImageResult("x^2", new byte[] { 1 });
        inner.SetImageResult("y^3", new byte[] { 2 });
        var cached = new CachedLaTeXRenderer(inner, maxCacheSize: 10);

        var result1 = await cached.RenderToImageAsync("x^2");
        var result2 = await cached.RenderToImageAsync("y^3");

        Assert.NotEqual(result1, result2);
    }

    // ── MathJaxRenderer ────────────────────────────────────────────────────

    [Fact(Skip = "No MathJax service running")]
    public async Task MathJaxRenderer_SkipWhenNoService()
    {
        using var httpClient = new HttpClient();
        var renderer = new MathJaxRenderer(httpClient);
        var result = await renderer.RenderToSvgAsync("x^2");
        Assert.NotNull(result);
    }

    [Fact]
    public void MathJaxRenderer_CanBeCreatedWithoutError()
    {
        using var httpClient = new HttpClient();
        var renderer = new MathJaxRenderer(httpClient);
        Assert.NotNull(renderer);
    }

    // ── LocalLaTeXRenderer ─────────────────────────────────────────────────

    [Fact(Skip = "No pdflatex available")]
    public async Task LocalLaTeXRenderer_SkipWhenNoExecutable()
    {
        var renderer = new LocalLaTeXRenderer();
        var result = await renderer.RenderToImageAsync("x^2");
        Assert.NotEmpty(result);
    }

    [Fact]
    public void LocalLaTeXRenderer_CanBeCreatedWithoutError()
    {
        var renderer = new LocalLaTeXRenderer();
        Assert.NotNull(renderer);
    }
}
