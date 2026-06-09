using System;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI;

public partial class MainWindow : Window
{
    private Button[]? _navButtons;

    public MainWindow()
    {
        InitializeComponent();
        KeyDown += OnKeyDown;

        var viewModel = DataContext as MainWindowViewModel;
        if (viewModel is not null)
        {
            viewModel.CopyToClipboardRequested += OnCopyToClipboardRequested;
            viewModel.Navigation.PropertyChanged += OnNavigationPropertyChanged;
        }

        DataContextChanged += OnDataContextChanged;

        // Cache nav buttons for highlighting
        _navButtons = new[]
        {
            this.FindControl<Button>("NavHome"),
            this.FindControl<Button>("NavMentalPractice"),
            this.FindControl<Button>("NavFocusedPractice"),
            this.FindControl<Button>("NavQuestionBank"),
            this.FindControl<Button>("NavProgress"),
            this.FindControl<Button>("NavSettings"),
        }!;

        UpdateNavHighlight();
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
            vm.Navigation.PropertyChanged += OnNavigationPropertyChanged;
        }
    }

    private void OnNavigationPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(NavigationViewModel.SelectedItem))
        {
            UpdateNavHighlight();
        }
    }

    private void UpdateNavHighlight()
    {
        if (_navButtons is null || DataContext is not MainWindowViewModel vm) return;

        var selectedKey = vm.Navigation.SelectedItem?.ViewKey;

        foreach (var button in _navButtons)
        {
            var tag = button.Tag as string;
            var isSelected = tag == selectedKey;

            button.Background = isSelected
                ? this.FindResourceOrDefault<IBrush>("NavItemSelectedBrush", new SolidColorBrush(Color.FromArgb(255, 232, 240, 254)))
                : Brushes.Transparent;
        }
    }

    private T FindResourceOrDefault<T>(string key, T defaultValue)
    {
        try
        {
            var resource = this.FindResource(key);
            if (resource is T typed)
                return typed;
        }
        catch { }
        return defaultValue;
    }

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.F1)
        {
            var helpWindow = new Views.HelpWindow();
            helpWindow.Show(this);
            return;
        }

        // Ctrl+1 through Ctrl+6 for quick navigation
        if (e.KeyModifiers.HasFlag(KeyModifiers.Control))
        {
            var viewKey = e.Key switch
            {
                Key.D1 => "Home",
                Key.D2 => "MentalPractice",
                Key.D3 => "FocusedPractice",
                Key.D4 => "QuestionBank",
                Key.D5 => "Progress",
                Key.D6 => "Settings",
                _ => null
            };

            if (viewKey is not null && DataContext is MainWindowViewModel vm)
            {
                vm.Navigation.Navigate(viewKey);
                e.Handled = true;
            }
        }
    }

    private void TogglePane_Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MainWindowViewModel vm)
        {
            vm.Navigation.IsPaneOpen = !vm.Navigation.IsPaneOpen;
        }
    }

    private void NavButton_Click(object? sender, RoutedEventArgs e)
    {
        if (sender is Button button && button.Tag is string viewKey)
        {
            if (DataContext is MainWindowViewModel vm)
            {
                vm.Navigation.Navigate(viewKey);
            }
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
