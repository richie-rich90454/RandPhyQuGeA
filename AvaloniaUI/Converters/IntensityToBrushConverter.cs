using Avalonia;
using Avalonia.Controls;
using Avalonia.Data.Converters;
using Avalonia.Media;
using System;
using System.Globalization;

namespace AvaloniaUI.Converters;

public class IntensityToBrushConverter : FuncValueConverter<int, IBrush>
{
    private static readonly IBrush Level0 = Brushes.Transparent;
    private static readonly IBrush Level1 = new SolidColorBrush(Color.FromRgb(0xC6, 0xE4, 0x8B));
    private static readonly IBrush Level2 = new SolidColorBrush(Color.FromRgb(0x7B, 0xC9, 0x6F));
    private static readonly IBrush Level3 = new SolidColorBrush(Color.FromRgb(0x23, 0x9A, 0x3B));
    private static readonly IBrush Level4 = new SolidColorBrush(Color.FromRgb(0x19, 0x61, 0x27));

    public IntensityToBrushConverter() : base(Convert)
    {
    }

    private static IBrush Convert(int level)
    {
        return level switch
        {
            1 => Level1,
            2 => Level2,
            3 => Level3,
            4 => Level4,
            _ => Level0
        };
    }
}
