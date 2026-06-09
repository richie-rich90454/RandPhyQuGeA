using System.Diagnostics;
using Core.Interfaces;

namespace LaTeX.Services;

public class LocalLaTeXRenderer : ILaTeXRenderer
{
    private readonly string _latexExecutablePath;
    private readonly string _workingDirectory;

    public LocalLaTeXRenderer(string latexExecutablePath = "pdflatex", string? workingDirectory = null)
    {
        _latexExecutablePath = latexExecutablePath;
        _workingDirectory = workingDirectory ?? Path.GetTempPath();
    }

    public async Task<byte[]> RenderToImageAsync(string latex, CancellationToken cancellationToken = default)
    {
        var fileName = $"latex_{Guid.NewGuid():N}";
        var texPath = Path.Combine(_workingDirectory, $"{fileName}.tex");
        var pdfPath = Path.Combine(_workingDirectory, $"{fileName}.pdf");

        try
        {
            await File.WriteAllTextAsync(texPath, WrapLatex(latex), cancellationToken);

            var exitCode = await RunProcessAsync(_latexExecutablePath,
                $"-interaction=nonstopmode -output-directory=\"{_workingDirectory}\" \"{texPath}\"",
                cancellationToken);

            if (exitCode != 0)
                throw new InvalidOperationException($"pdflatex exited with code {exitCode}");

            if (!File.Exists(pdfPath))
                throw new InvalidOperationException("pdflatex did not produce a PDF file");

            return await File.ReadAllBytesAsync(pdfPath, cancellationToken);
        }
        finally
        {
            CleanupFile(texPath);
            CleanupFile(pdfPath);
            CleanupFile(Path.Combine(_workingDirectory, $"{fileName}.aux"));
            CleanupFile(Path.Combine(_workingDirectory, $"{fileName}.log"));
        }
    }

    public async Task<string> RenderToSvgAsync(string latex, CancellationToken cancellationToken = default)
    {
        var fileName = $"latex_{Guid.NewGuid():N}";
        var texPath = Path.Combine(_workingDirectory, $"{fileName}.tex");
        var pdfPath = Path.Combine(_workingDirectory, $"{fileName}.pdf");
        var svgPath = Path.Combine(_workingDirectory, $"{fileName}.svg");

        try
        {
            await File.WriteAllTextAsync(texPath, WrapLatex(latex), cancellationToken);

            var pdfExitCode = await RunProcessAsync(_latexExecutablePath,
                $"-interaction=nonstopmode -output-directory=\"{_workingDirectory}\" \"{texPath}\"",
                cancellationToken);

            if (pdfExitCode != 0)
                throw new InvalidOperationException($"pdflatex exited with code {pdfExitCode}");

            if (!File.Exists(pdfPath))
                throw new InvalidOperationException("pdflatex did not produce a PDF file");

            var svgExitCode = await RunProcessAsync("pdf2svg",
                $"\"{pdfPath}\" \"{svgPath}\"",
                cancellationToken);

            if (svgExitCode != 0)
                throw new InvalidOperationException($"pdf2svg exited with code {svgExitCode}");

            if (!File.Exists(svgPath))
                throw new InvalidOperationException("pdf2svg did not produce an SVG file");

            return await File.ReadAllTextAsync(svgPath, cancellationToken);
        }
        finally
        {
            CleanupFile(texPath);
            CleanupFile(pdfPath);
            CleanupFile(svgPath);
            CleanupFile(Path.Combine(_workingDirectory, $"{fileName}.aux"));
            CleanupFile(Path.Combine(_workingDirectory, $"{fileName}.log"));
        }
    }

    private static string WrapLatex(string latex)
    {
        return $"\\documentclass{{standalone}}\n\\begin{{document}}\n{latex}\n\\end{{document}}";
    }

    private static async Task<int> RunProcessAsync(string fileName, string arguments, CancellationToken cancellationToken)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();
        await process.WaitForExitAsync(cancellationToken);
        return process.ExitCode;
    }

    private static void CleanupFile(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
            // Best-effort cleanup
        }
    }
}
