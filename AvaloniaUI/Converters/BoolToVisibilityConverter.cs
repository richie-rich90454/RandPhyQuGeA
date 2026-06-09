using System;
using System.Globalization;
using Avalonia.Data.Converters;

namespace AvaloniaUI.Converters;

/// <summary>
/// Converts a boolean value for visibility bindings.
/// In Avalonia, IsVisible is a bool property, so this converter
/// passes through the boolean value directly. It exists for
/// XAML readability and potential future parameter-based inversion.
/// True → True (visible), False → False (collapsed).
/// </summary>
public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool b && b;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool b && b;
    }
}
