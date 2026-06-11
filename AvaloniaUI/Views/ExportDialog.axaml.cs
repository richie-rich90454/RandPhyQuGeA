using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using Avalonia.Platform.Storage;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class ExportDialog : Window
{
    public ExportDialog()
    {
        InitializeComponent();

        DataContextChanged += OnDataContextChanged;
    }

    public ExportDialog(ExportViewModel viewModel) : this()
    {
        DataContext = viewModel;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.CopyToClipboardRequested += OnCopyToClipboardRequested;
            vm.SaveRequested += OnSaveRequested;
        }
    }

    private async void OnCopyToClipboardRequested(object? sender, string text)
    {
        var topLevel = TopLevel.GetTopLevel(this);
        if (topLevel is not null)
        {
            var clipboard = topLevel.Clipboard;
            if (clipboard is not null)
            {
                await clipboard.SetTextAsync(text);
            }
        }
    }

    private async void OnSaveRequested(object? sender, ExportSaveRequestedEventArgs e)
    {
        var topLevel = TopLevel.GetTopLevel(this);
        if (topLevel is null) return;

        var storageProvider = topLevel.StorageProvider;

        var fileTypeChoices = new[]
        {
            new FilePickerFileType(e.Extension.ToUpperInvariant())
            {
                Patterns = new[] { $"*.{e.Extension}" }
            }
        };

        var file = await storageProvider.SaveFilePickerAsync(new FilePickerSaveOptions
        {
            Title = "Save Export",
            SuggestedFileName = e.SuggestedFileName,
            FileTypeChoices = fileTypeChoices
        });

        if (file is not null)
        {
            try
            {
                await using var stream = await file.OpenWriteAsync();
                using var writer = new StreamWriter(stream);
                await writer.WriteAsync(e.Content);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Save export failed: {ex.Message}");
                if (DataContext is ExportViewModel vm)
                {
                    vm.ErrorMessage = $"Failed to save file: {ex.Message}";
                }
            }
        }
    }

    // ─── Format Selection Click Handlers ───────────────────────────────

    private void OnMarkdownClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("Markdown");
            UpdateFormatBorders("Markdown");
        }
    }

    private void OnHtmlClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("HTML");
            UpdateFormatBorders("HTML");
        }
    }

    private void OnPlainTextClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("Plain Text");
            UpdateFormatBorders("Plain Text");
        }
    }

    private void UpdateFormatBorders(string selected)
    {
        var app = Application.Current;
        if (app is null) return;

        var primaryBrush = app.FindResource("PrimaryBrush") as IBrush;
        var borderBrush = app.FindResource("InputBorderBrush") as IBrush;

        var markdown = this.FindControl<Border>("FormatMarkdown");
        var html = this.FindControl<Border>("FormatHtml");
        var plainText = this.FindControl<Border>("FormatPlainText");

        if (markdown is not null)
            markdown.BorderBrush = selected == "Markdown" ? primaryBrush : borderBrush;
        if (html is not null)
            html.BorderBrush = selected == "HTML" ? primaryBrush : borderBrush;
        if (plainText is not null)
            plainText.BorderBrush = selected == "Plain Text" ? primaryBrush : borderBrush;
    }
}
