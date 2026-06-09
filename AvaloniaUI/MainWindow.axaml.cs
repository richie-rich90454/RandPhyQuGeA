using System;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        KeyDown += OnKeyDown;

        var viewModel = DataContext as MainWindowViewModel;
        if (viewModel is not null)
        {
            viewModel.CopyToClipboardRequested += OnCopyToClipboardRequested;
        }

        DataContextChanged += OnDataContextChanged;
    }

    public MainWindow(MainWindowViewModel viewModel) : this()
    {
        DataContext = viewModel;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        if (DataContext is MainWindowViewModel vm)
        {
            vm.CopyToClipboardRequested += OnCopyToClipboardRequested;
        }
    }

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.F1)
        {
            var helpWindow = new Views.HelpWindow();
            helpWindow.Show(this);
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

    private void Help_Click(object? sender, RoutedEventArgs e)
    {
        var helpWindow = new Views.HelpWindow();
        helpWindow.Show(this);
    }

    private void About_Click(object? sender, RoutedEventArgs e)
    {
        var aboutDialog = new Views.AboutDialog();
        aboutDialog.ShowDialog(this);
    }

    private void Exit_Click(object? sender, RoutedEventArgs e)
    {
        Close();
    }
}
