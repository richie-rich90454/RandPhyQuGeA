using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using AvaloniaUI.Services;
using AvaloniaUI.ViewModels;
using AvaloniaUI.Views;

namespace AvaloniaUI;

public partial class MainWindow : Window
{
    private Button[]? _navButtons;
    private ContentControl? _cachedContentArea;
    private readonly Dictionary<string, Control> _viewCache = new();
    private readonly List<string> _viewCacheInsertionOrder = new();
    private const int MaxViewCacheSize = 10;
    private MainWindowViewModel? _currentViewModel;

    // Konami code easter egg
    private static readonly Key[] KonamiSequence =
    {
        Key.Up, Key.Up, Key.Down, Key.Down,
        Key.Left, Key.Right, Key.Left, Key.Right,
        Key.B, Key.A
    };
    private int _konamiIndex;

    public MainWindow()
    {
        InitializeComponent();

        // Extend client area into title bar for seamless look
        ExtendClientAreaChromeHints = Avalonia.Platform.ExtendClientAreaChromeHints.Default;
        ExtendClientAreaTitleBarHeightHint = -1;

        KeyDown += OnKeyDown;

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

        _cachedContentArea = this.FindControl<ContentControl>("ContentArea");

        UpdateNavHighlight();
    }

    public MainWindow(MainWindowViewModel viewModel) : this()
    {
        DataContext = viewModel;
    }

    private void OnDataContextChanged(object? sender, EventArgs e)
    {
        // Unsubscribe from old
        if (_currentViewModel is not null)
        {
            _currentViewModel.CopyToClipboardRequested -= OnCopyToClipboardRequested;
            _currentViewModel.Navigation.PropertyChanged -= OnNavigationPropertyChanged;
            _currentViewModel.ExportRequested -= OnExportRequested;
        }

        // Subscribe to new
        if (DataContext is MainWindowViewModel vm)
        {
            vm.CopyToClipboardRequested += OnCopyToClipboardRequested;
            vm.Navigation.PropertyChanged += OnNavigationPropertyChanged;
            vm.ExportRequested += OnExportRequested;
        }

        _currentViewModel = DataContext as MainWindowViewModel;
    }

    private void OnNavigationPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(NavigationViewModel.SelectedItem))
        {
            UpdateNavHighlight();
        }
        else if (e.PropertyName == nameof(NavigationViewModel.CurrentView))
        {
            UpdateContentView();
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

            // Use classes for selection state instead of directly setting Background
            if (isSelected)
            {
                if (!button.Classes.Contains("selected"))
                    button.Classes.Add("selected");
            }
            else
            {
                button.Classes.Remove("selected");
            }
        }
    }

    private void UpdateContentView()
    {
        if (DataContext is not MainWindowViewModel vm) return;
        if (vm.Navigation.CurrentView is null) return;

        var currentVm = vm.Navigation.CurrentView;
        var viewKey = vm.Navigation.SelectedItem?.ViewKey ?? currentVm.GetType().Name.Replace("ViewModel", "View", System.StringComparison.Ordinal);

        // Get or create the cached view
        if (!_viewCache.TryGetValue(viewKey, out var view))
        {
            view = ViewLocator.Resolve(currentVm);
            if (view is not null)
            {
                view.DataContext = currentVm;
                AddViewToCache(viewKey, view);
            }
        }
        else
        {
            // Update DataContext only if it changed (prevents re-triggering DataContextChanged subscriptions)
            if (view.DataContext != currentVm)
                view.DataContext = currentVm;
        }

        // Set the cached view directly on the ContentControl
        if (_cachedContentArea is not null)
        {
            _cachedContentArea.Content = view;
        }
    }

    private void AddViewToCache(string viewKey, Control view)
    {
        // If key already exists, remove old entry first
        if (_viewCache.ContainsKey(viewKey))
        {
            RemoveViewFromCache(viewKey);
        }

        _viewCache[viewKey] = view;
        _viewCacheInsertionOrder.Add(viewKey);

        // Evict oldest entries if cache exceeds max size
        while (_viewCache.Count > MaxViewCacheSize && _viewCacheInsertionOrder.Count > 0)
        {
            var oldestKey = _viewCacheInsertionOrder[0];
            RemoveViewFromCache(oldestKey);
        }
    }

    private void RemoveViewFromCache(string viewKey)
    {
        if (_viewCache.Remove(viewKey, out var oldView))
        {
            _viewCacheInsertionOrder.Remove(viewKey);
            if (oldView.DataContext is IDisposable disposable)
                disposable.Dispose();
        }
    }

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        // Konami code easter egg
        if (e.Key == KonamiSequence[_konamiIndex] && !e.KeyModifiers.HasFlag(KeyModifiers.Control))
        {
            _konamiIndex++;
            if (_konamiIndex >= KonamiSequence.Length)
            {
                _konamiIndex = 0;
                ShowKonamiEasterEgg();
                e.Handled = true;
                return;
            }
        }
        else if (Array.IndexOf(KonamiSequence, e.Key) >= 0)
        {
            _konamiIndex = e.Key == KonamiSequence[0] ? 1 : 0;
        }
        else
        {
            _konamiIndex = 0;
        }

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
                return;
            }
        }

        // Escape: back/cancel
        if (e.Key == Key.Escape)
        {
            if (DataContext is MainWindowViewModel vm)
            {
                vm.Navigation.Navigate("Home");
                e.Handled = true;
            }
            return;
        }

        // ? or Ctrl+/ to show shortcuts overlay
        if (e.Key == Key.OemQuestion && !e.KeyModifiers.HasFlag(KeyModifiers.Shift))
        {
            ToggleShortcutOverlay();
            e.Handled = true;
            return;
        }

        if (e.KeyModifiers.HasFlag(KeyModifiers.Control) && e.Key == Key.OemQuestion)
        {
            ToggleShortcutOverlay();
            e.Handled = true;
            return;
        }
    }

    private void ToggleShortcutOverlay()
    {
        var overlay = this.FindControl<Border>("ShortcutOverlay");
        if (overlay is not null)
        {
            overlay.IsVisible = !overlay.IsVisible;
        }
    }

    private void OnShortcutOverlayDismiss(object? sender, PointerPressedEventArgs e)
    {
        var overlay = this.FindControl<Border>("ShortcutOverlay");
        if (overlay is not null)
        {
            overlay.IsVisible = false;
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

    private void OnCopyToClipboardRequested(object? sender, string text)
    {
        ClipboardService.CopyToClipboard(text, this);
    }

    private void OnExportRequested(object? sender, IReadOnlyList<Core.Domain.GeneratedQuestion> questions)
    {
        var exportVm = new ViewModels.ExportViewModel();
        exportVm.OpenExportPanel(questions, "Export Questions");

        var dialog = new Views.ExportDialog(exportVm);
        dialog.ShowDialog(this);
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

    private void ShowKonamiEasterEgg()
    {
        var overlay = this.FindControl<Border>("KonamiOverlay");
        if (overlay is not null)
        {
            overlay.IsVisible = true;
        }
    }

    private void KonamiOverlayDismiss(object? sender, PointerPressedEventArgs e)
    {
        var overlay = this.FindControl<Border>("KonamiOverlay");
        if (overlay is not null)
        {
            overlay.IsVisible = false;
        }
    }
}
