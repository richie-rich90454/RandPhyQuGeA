using Avalonia;
using Avalonia.Controls;

namespace AvaloniaUI.Services;

public static class ClipboardService
{
    public static async void CopyToClipboard(string text, Visual visual)
    {
        var topLevel = TopLevel.GetTopLevel(visual);
        if (topLevel is not null)
        {
            var clipboard = topLevel.Clipboard;
            if (clipboard is not null)
            {
                await clipboard.SetTextAsync(text);
            }
        }
    }
}
