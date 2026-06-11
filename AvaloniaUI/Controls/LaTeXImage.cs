using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace AvaloniaUI.Controls;

public class LaTeXImage : UserControl
{
    public static readonly StyledProperty<string> LaTeXSourceProperty =
        AvaloniaProperty.Register<LaTeXImage, string>(nameof(LaTeXSource));

    public static readonly StyledProperty<bool> IsRenderingProperty =
        AvaloniaProperty.Register<LaTeXImage, bool>(nameof(IsRendering));

    public static readonly StyledProperty<bool> HasErrorProperty =
        AvaloniaProperty.Register<LaTeXImage, bool>(nameof(HasError));

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
        var image = new Image
        {
            Stretch = Stretch.Uniform,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
        };

        Content = image;
    }

    public Image? GetImage() => Content as Image;
}
