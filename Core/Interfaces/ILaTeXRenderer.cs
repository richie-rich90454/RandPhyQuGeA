namespace Core.Interfaces;

public interface ILaTeXRenderer
{
    Task<byte[]> RenderToImageAsync(string latex, CancellationToken cancellationToken = default);
    Task<string> RenderToSvgAsync(string latex, CancellationToken cancellationToken = default);
}
