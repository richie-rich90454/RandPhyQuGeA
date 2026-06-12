using System;
using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace AvaloniaUI.Converters;

public class DifficultyToBrushConverter : IValueConverter
{
    private static IBrush? _easyBrush;
    private static IBrush? _mediumBrush;
    private static IBrush? _hardBrush;
    private static IBrush? _defaultBrush;

    private static IBrush EasyBrush => _easyBrush ??= Application.Current?.FindResource("BadgeEasyBrush") as IBrush
        ?? new SolidColorBrush(Color.FromRgb(0x0E, 0x7C, 0x3B));

    private static IBrush MediumBrush => _mediumBrush ??= Application.Current?.FindResource("BadgeMediumBrush") as IBrush
        ?? new SolidColorBrush(Color.FromRgb(0xD4, 0x76, 0x00));

    private static IBrush HardBrush => _hardBrush ??= Application.Current?.FindResource("BadgeHardBrush") as IBrush
        ?? new SolidColorBrush(Color.FromRgb(0xC5, 0x22, 0x1F));

    private static IBrush DefaultBrush => _defaultBrush ??= Application.Current?.FindResource("Neutral50Brush") as IBrush
        ?? new SolidColorBrush(Color.FromRgb(0x9A, 0xA0, 0xA6));

    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is string level)
        {
            return level switch
            {
                "Easy" => EasyBrush,
                "Medium" => MediumBrush,
                "Hard" => HardBrush,
                _ => DefaultBrush
            };
        }

        if (value is int difficulty)
        {
            return difficulty switch
            {
                <= 3 => EasyBrush,
                <= 6 => MediumBrush,
                _ => HardBrush
            };
        }

        return DefaultBrush;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
