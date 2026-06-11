using System;
using System.Collections.Generic;
using System.IO;
using System.Reactive;
using System.Text;
using Core.Domain;
using Core.Exporters;
using Core.Interfaces;
using ReactiveUI;

using ReactiveUnit = System.Reactive.Unit;

namespace AvaloniaUI.ViewModels;

public class ExportViewModel : ViewModelBase
{
    private string _selectedFormat = "Markdown";
    private string _exportContent = string.Empty;
    private bool _isExporting;
    private bool _isExportPanelVisible;
    private string _exportTitle = "Export";
    private string _errorMessage = string.Empty;
    private IReadOnlyList<GeneratedQuestion> _questions = Array.Empty<GeneratedQuestion>();

    public ExportViewModel()
    {
        ExportCommand = ReactiveCommand.Create(OnExport);
        CopyToClipboardCommand = ReactiveCommand.Create(OnCopyToClipboard);
        CloseCommand = ReactiveCommand.Create(OnClose);
        SelectFormatCommand = ReactiveCommand.Create<string>(OnSelectFormat);
    }

    // ─── Properties ────────────────────────────────────────────────────

    public string SelectedFormat
    {
        get => _selectedFormat;
        set
        {
            this.RaiseAndSetIfChanged(ref _selectedFormat, value);
            this.RaisePropertyChanged(nameof(IsMarkdownSelected));
            this.RaisePropertyChanged(nameof(IsHtmlSelected));
            this.RaisePropertyChanged(nameof(IsPlainTextSelected));
        }
    }

    public bool IsMarkdownSelected
    {
        get => SelectedFormat == "Markdown";
        set { if (value) SelectedFormat = "Markdown"; }
    }

    public bool IsHtmlSelected
    {
        get => SelectedFormat == "HTML";
        set { if (value) SelectedFormat = "HTML"; }
    }

    public bool IsPlainTextSelected
    {
        get => SelectedFormat == "Plain Text";
        set { if (value) SelectedFormat = "Plain Text"; }
    }

    public string ExportContent
    {
        get => _exportContent;
        set
        {
            this.RaiseAndSetIfChanged(ref _exportContent, value);
            this.RaisePropertyChanged(nameof(HasExportContent));
        }
    }

    public bool HasExportContent => !string.IsNullOrEmpty(ExportContent);

    public bool IsExporting
    {
        get => _isExporting;
        set => this.RaiseAndSetIfChanged(ref _isExporting, value);
    }

    public bool IsExportPanelVisible
    {
        get => _isExportPanelVisible;
        set => this.RaiseAndSetIfChanged(ref _isExportPanelVisible, value);
    }

    public string ExportTitle
    {
        get => _exportTitle;
        set => this.RaiseAndSetIfChanged(ref _exportTitle, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        set => this.RaiseAndSetIfChanged(ref _errorMessage, value);
    }

    public IReadOnlyList<GeneratedQuestion> Questions
    {
        get => _questions;
        set => this.RaiseAndSetIfChanged(ref _questions, value);
    }

    // ─── Events ────────────────────────────────────────────────────────

    public event EventHandler<string>? CopyToClipboardRequested;
    public event EventHandler<ExportSaveRequestedEventArgs>? SaveRequested;

    // ─── Commands ──────────────────────────────────────────────────────

    public ReactiveCommand<ReactiveUnit, ReactiveUnit> ExportCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CopyToClipboardCommand { get; }
    public ReactiveCommand<ReactiveUnit, ReactiveUnit> CloseCommand { get; }
    public ReactiveCommand<string, ReactiveUnit> SelectFormatCommand { get; }

    // ─── Public Methods ────────────────────────────────────────────────

    public void OpenExportPanel(IReadOnlyList<GeneratedQuestion> questions, string title = "Export")
    {
        Questions = questions;
        ExportTitle = title;
        ExportContent = string.Empty;
        IsExportPanelVisible = true;
    }

    public void OpenExportPanel(string content, string title = "Export")
    {
        Questions = Array.Empty<GeneratedQuestion>();
        ExportContent = content;
        ExportTitle = title;
        IsExportPanelVisible = true;
    }

    // ─── Command Handlers ──────────────────────────────────────────────

    private void OnExport()
    {
        if (Questions.Count == 0 && string.IsNullOrEmpty(ExportContent))
            return;

        try
        {
            IsExporting = true;

            if (Questions.Count > 0)
            {
                ExportContent = GenerateExportContent(SelectedFormat, Questions);
            }

            var extension = SelectedFormat switch
            {
                "Markdown" => "md",
                "HTML" => "html",
                "Plain Text" => "txt",
                _ => "txt"
            };

            SaveRequested?.Invoke(this, new ExportSaveRequestedEventArgs(
                ExportContent, extension, $"physics_questions.{extension}"));
        }
        finally
        {
            IsExporting = false;
        }
    }

    private void OnCopyToClipboard()
    {
        if (Questions.Count > 0 && string.IsNullOrEmpty(ExportContent))
        {
            ExportContent = GenerateExportContent(SelectedFormat, Questions);
        }

        if (!string.IsNullOrEmpty(ExportContent))
        {
            CopyToClipboardRequested?.Invoke(this, ExportContent);
        }
    }

    private void OnClose()
    {
        IsExportPanelVisible = false;
    }

    private void OnSelectFormat(string format)
    {
        SelectedFormat = format;

        // Regenerate preview if we have questions
        if (Questions.Count > 0)
        {
            ExportContent = GenerateExportContent(format, Questions);
        }
    }

    // ─── Export Content Generation ─────────────────────────────────────

    private static string GenerateExportContent(string format, IReadOnlyList<GeneratedQuestion> questions)
    {
        using var stream = new MemoryStream();

        IQuestionExporter exporter = format switch
        {
            "Markdown" => new MarkdownExporter(),
            "HTML" => new HtmlExporter(),
            "Plain Text" => new TextExporter(),
            _ => new TextExporter()
        };

        exporter.Export(questions, stream);
        stream.Position = 0;

        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }
}

public class ExportSaveRequestedEventArgs : EventArgs
{
    public string Content { get; }
    public string Extension { get; }
    public string SuggestedFileName { get; }

    public ExportSaveRequestedEventArgs(string content, string extension, string suggestedFileName)
    {
        Content = content;
        Extension = extension;
        SuggestedFileName = suggestedFileName;
    }
}
