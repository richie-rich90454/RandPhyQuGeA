using System;
using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Data.Converters;

namespace AvaloniaUI.Converters;

/// <summary>
/// Converts a level string to visibility.
/// Parameter is the expected level string. Returns true (visible) when the value matches the parameter.
/// </summary>
public class LevelToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is string level && parameter is string expectedLevel)
        {
            return string.Equals(level, expectedLevel, StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
