using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Styling;
using Avalonia.VisualTree;

namespace AvaloniaUI.Controls;

public class LaTeXImage : UserControl
{
    public static readonly StyledProperty<string> LaTeXSourceProperty =
        AvaloniaProperty.Register<LaTeXImage, string>(nameof(LaTeXSource));

    public static readonly StyledProperty<bool> IsRenderingProperty =
        AvaloniaProperty.Register<LaTeXImage, bool>(nameof(IsRendering));

    public static readonly StyledProperty<bool> HasErrorProperty =
        AvaloniaProperty.Register<LaTeXImage, bool>(nameof(HasError));

    private readonly TextBlock _textBlock;

    public string LaTeXSource
    {
        get => GetValue(LaTeXSourceProperty);
        set => SetValue(LaTeXSourceProperty, value);
    }

    public bool IsRendering
    {
        get => GetValue(IsRenderingProperty);
        set => SetValue(IsRenderingProperty, value);
    }

    public bool HasError
    {
        get => GetValue(HasErrorProperty);
        set => SetValue(HasErrorProperty, value);
    }

    public LaTeXImage()
    {
        _textBlock = new TextBlock
        {
            FontSize = 18,
            TextWrapping = TextWrapping.Wrap,
            LineHeight = 26,
        };

        Content = _textBlock;

        LaTeXSourceProperty.Changed.AddClassHandler<LaTeXImage>(OnLaTeXSourceChanged);
    }

    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);
        ApplyThemeBrushes();
    }

    private void OnLaTeXSourceChanged(LaTeXImage sender, AvaloniaPropertyChangedEventArgs e)
    {
        var text = e.NewValue as string ?? string.Empty;
        sender.IsRendering = true;
        try
        {
            sender._textBlock.Text = text;
            sender.HasError = false;
        }
        catch
        {
            sender.HasError = true;
        }
        finally
        {
            sender.IsRendering = false;
        }
    }

    private void ApplyThemeBrushes()
    {
        if (TryGetResource("TextPrimaryBrush", ActualThemeVariant, out var fg) && fg is IBrush fgBrush)
            _textBlock.Foreground = fgBrush;
    }

    /// <summary>
    /// Checks whether text contains LaTeX markers that would require special rendering.
    /// Only matches well-known LaTeX delimiters and commands, not variable placeholders.
    /// </summary>
    public static bool ContainsLaTeX(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;

        // $$ display math delimiter (must have closing $$)
        if (text.Contains("$$") && text.IndexOf("$$") != text.LastIndexOf("$$"))
            return true;

        // $...$ inline math - only if content between $ looks like LaTeX (contains backslash)
        // Variable placeholders like ${v}$ don't have backslashes
        var dollarIndices = new List<int>();
        for (int i = 0; i < text.Length; i++)
        {
            if (text[i] == '$')
                dollarIndices.Add(i);
        }

        // Check pairs of $ delimiters
        for (int i = 0; i + 1 < dollarIndices.Count; i += 2)
        {
            var start = dollarIndices[i];
            var end = dollarIndices[i + 1];
            if (end - start > 1)
            {
                var content = text.Substring(start + 1, end - start - 1);
                // If content contains backslash commands, it's LaTeX
                if (content.Contains('\\'))
                    return true;
            }
        }

        // Common LaTeX commands with backslash prefix (without $ delimiters)
        string[] latexCommands =
        [
            @"\frac{", @"\sqrt{", @"\int{", @"\sum{",
            @"\frac ", @"\sqrt ", @"\int ", @"\sum ",
            @"\alpha", @"\beta", @"\gamma", @"\delta", @"\pi",
            @"\cdot", @"\times", @"\div",
            @"\left", @"\right",
            @"\begin{", @"\end{",
            @"\text{", @"\mathrm{", @"\mathbf{",
            @"\overline{", @"\vec{", @"\hat{",
            @"\overrightarrow{", @"\dot{", @"\ddot{",
            @"\bar{", @"\tilde{",
            @"\sin", @"\cos", @"\tan",
            @"\log", @"\ln", @"\exp",
        ];

        foreach (var cmd in latexCommands)
        {
            if (text.Contains(cmd)) return true;
        }

        return false;
    }
}
