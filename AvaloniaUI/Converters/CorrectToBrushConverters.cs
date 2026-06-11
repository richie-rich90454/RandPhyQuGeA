using System;
using System.Globalization;
using Avalonia;
using Avalonia.Data.Converters;
using Avalonia.Media;
using Avalonia.Styling;

namespace AvaloniaUI.Converters;

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate brush for correct/incorrect styling.
/// Returns CorrectBackgroundBrush for true, IncorrectBackgroundBrush for false.
/// </summary>
public class CorrectToBackgroundBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            var key = wasCorrect ? "CorrectBackgroundBrush" : "IncorrectBackgroundBrush";
            if (Application.Current?.TryFindResource(key, ThemeVariant.Default, out var resource) == true && resource is IBrush brush)
                return brush;
        }
        return Avalonia.Application.Current?.TryFindResource("Neutral10Brush", ThemeVariant.Default, out var fallback) == true && fallback is IBrush fb ? fb : Brushes.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate border brush.
/// </summary>
public class CorrectToBorderBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            var key = wasCorrect ? "CorrectBorderBrush" : "IncorrectBorderBrush";
            if (Application.Current?.TryFindResource(key, ThemeVariant.Default, out var resource) == true && resource is IBrush brush)
                return brush;
        }
        return Avalonia.Application.Current?.TryFindResource("BorderBrush", ThemeVariant.Default, out var fallback) == true && fallback is IBrush fb ? fb : Brushes.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate text brush.
/// </summary>
public class CorrectToTextBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            var key = wasCorrect ? "CorrectTextBrush" : "IncorrectTextBrush";
            if (Application.Current?.TryFindResource(key, ThemeVariant.Default, out var resource) == true && resource is IBrush brush)
                return brush;
        }
        return Avalonia.Application.Current?.TryFindResource("TextPrimaryBrush", ThemeVariant.Default, out var fallback) == true && fallback is IBrush fb ? fb : Brushes.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate icon (checkmark or X).
/// </summary>
public class CorrectToIconConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            return wasCorrect ? "\uE73E" : "\uE711";
        }
        return "";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
