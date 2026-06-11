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

    public static readonly StyledProperty<bool> ShowAsTextProperty =
        AvaloniaProperty.Register<LaTeXImage, bool>(nameof(ShowAsText), defaultValue: true);

    private readonly Image _image;
    private readonly TextBlock _textBlock;
    private readonly Border _textBorder;

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

    public bool ShowAsText
    {
        get => GetValue(ShowAsTextProperty);
        set => SetValue(ShowAsTextProperty, value);
    }

    public LaTeXImage()
    {
        _image = new Image
        {
            Stretch = Stretch.Uniform,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };

        _textBlock = new TextBlock
        {
            FontFamily = new FontFamily("Consolas, Courier New, monospace"),
            FontStyle = FontStyle.Italic,
            FontSize = 14,
            TextWrapping = TextWrapping.Wrap,
        };

        _textBorder = new Border
        {
            Child = _textBlock,
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(12, 8),
            Background = new SolidColorBrush(Color.FromArgb(40, 128, 128, 128)),
        };

        Content = _textBorder;

        LaTeXSourceProperty.Changed.AddClassHandler<LaTeXImage>(OnLaTeXSourceChanged);
        ShowAsTextProperty.Changed.AddClassHandler<LaTeXImage>(OnShowAsTextChanged);
    }

    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);
        ApplyThemeBrushes();
    }

    public Image? GetImage() => _image;

    private void OnLaTeXSourceChanged(LaTeXImage sender, AvaloniaPropertyChangedEventArgs e)
    {
        var text = e.NewValue as string ?? string.Empty;
        _textBlock.Text = text;
    }

    private void OnShowAsTextChanged(LaTeXImage sender, AvaloniaPropertyChangedEventArgs e)
    {
        UpdateVisibility();
    }

    private void UpdateVisibility()
    {
        var showText = ShowAsText;
        Content = showText ? _textBorder : _image;
    }

    private void ApplyThemeBrushes()
    {
        if (TryGetResource("TextPrimaryBrush", ActualThemeVariant, out var fg) && fg is IBrush fgBrush)
            _textBlock.Foreground = fgBrush;

        if (TryGetResource("Neutral10Brush", ActualThemeVariant, out var bg) && bg is IBrush bgBrush)
            _textBorder.Background = bgBrush;
    }

    public static bool ContainsLaTeX(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        return text.Contains("$$") ||
               text.Contains(@"\frac") ||
               text.Contains(@"\sqrt") ||
               text.Contains(@"\int") ||
               text.Contains(@"\sum") ||
               text.Contains(@"^{") ||
               text.Contains("_{");
    }
}
