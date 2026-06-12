using System.Text.Json;
using Core.Interfaces;

namespace LaTeX.Services;

public class MathJaxRenderer : ILaTeXRenderer
{
    private readonly HttpClient _httpClient;
    private readonly string _serviceUrl;

    public MathJaxRenderer(HttpClient httpClient, string serviceUrl = "http://localhost:3000/render")
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
        _serviceUrl = serviceUrl;
    }

    public async Task<byte[]> RenderToImageAsync(string latex, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(latex))
            throw new ArgumentException("LaTeX input must not be null or empty.", nameof(latex));

        var payload = new { latex };
        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(_serviceUrl, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"LaTeX rendering service returned {(int)response.StatusCode}: {response.ReasonPhrase}");
            }

            return await response.Content.ReadAsByteArrayAsync(cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException($"Failed to connect to LaTeX rendering service: {ex.Message}", ex);
        }
    }

    public async Task<string> RenderToSvgAsync(string latex, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(latex))
            throw new ArgumentException("LaTeX input must not be null or empty.", nameof(latex));

        var payload = new { latex, format = "svg" };
        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(_serviceUrl, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"LaTeX rendering service returned {(int)response.StatusCode}: {response.ReasonPhrase}");
            }

            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException($"Failed to connect to LaTeX rendering service: {ex.Message}", ex);
        }
    }
}
