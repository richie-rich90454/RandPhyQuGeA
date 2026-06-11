using System;
using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Media;

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
            return Application.Current?.FindResource(key) as IBrush ?? Brushes.Transparent;
        }
        return Application.Current?.FindResource("Neutral10Brush") as IBrush ?? Brushes.Transparent;
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
            return Application.Current?.FindResource(key) as IBrush ?? Brushes.Transparent;
        }
        return Application.Current?.FindResource("BorderBrush") as IBrush ?? Brushes.Transparent;
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
            return Application.Current?.FindResource(key) as IBrush ?? Brushes.Transparent;
        }
        return Application.Current?.FindResource("TextPrimaryBrush") as IBrush ?? Brushes.Transparent;
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
