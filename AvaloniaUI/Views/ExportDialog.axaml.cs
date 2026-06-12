using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
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

    private void OnMarkdownClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("Markdown");
            UpdateFormatBorders("Markdown");
        }
    }

    private void OnHtmlClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("HTML");
            UpdateFormatBorders("HTML");
        }
    }

    private void OnPlainTextClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is ExportViewModel vm)
        {
            vm.SelectFormatCommand.Execute("Plain Text");
            UpdateFormatBorders("Plain Text");
        }
    }

    private void UpdateFormatBorders(string selected)
    {
        var markdown = this.FindControl<RadioButton>("FormatMarkdown");
        var html = this.FindControl<RadioButton>("FormatHtml");
        var plainText = this.FindControl<RadioButton>("FormatPlainText");

        // RadioButton selection is handled by IsChecked binding, no manual border updates needed
    }
}
