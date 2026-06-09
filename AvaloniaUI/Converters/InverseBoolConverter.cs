using System;
using System.Globalization;
using Avalonia.Data.Converters;

namespace AvaloniaUI.Converters;

/// <summary>
/// Converts a boolean value to its inverse.
/// True → False, False → True.
/// Useful for binding IsVisible to negative conditions.
/// </summary>
public class InverseBoolConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool b && !b;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value is bool b && !b;
    }
}
