using System;
using System.Globalization;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace AvaloniaUI.Converters;

public class DifficultyToBrushConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is string level)
        {
            return level switch
            {
                "Easy" => new SolidColorBrush(Color.FromRgb(0x0E, 0x7C, 0x3B)),
                "Medium" => new SolidColorBrush(Color.FromRgb(0xD4, 0x76, 0x00)),
                "Hard" => new SolidColorBrush(Color.FromRgb(0xC5, 0x22, 0x1F)),
                _ => new SolidColorBrush(Color.FromRgb(0x9A, 0xA0, 0xA6))
            };
        }
        return new SolidColorBrush(Color.FromRgb(0x9A, 0xA0, 0xA6));
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
