using System;
using System.Globalization;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace AvaloniaUI.Converters;

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate brush resource key for correct/incorrect styling.
/// Returns "CorrectBackgroundBrush" for true, "IncorrectBackgroundBrush" for false.
/// </summary>
public class CorrectToBackgroundBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            return wasCorrect ? "CorrectBackgroundBrush" : "IncorrectBackgroundBrush";
        }
        return "Neutral10Brush";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate border brush resource key.
/// </summary>
public class CorrectToBorderBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            return wasCorrect ? "CorrectBorderBrush" : "IncorrectBorderBrush";
        }
        return "BorderBrush";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

/// <summary>
/// Converts a bool (WasCorrect) to the appropriate text brush resource key.
/// </summary>
public class CorrectToTextBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool wasCorrect)
        {
            return wasCorrect ? "CorrectTextBrush" : "IncorrectTextBrush";
        }
        return "TextPrimaryBrush";
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
