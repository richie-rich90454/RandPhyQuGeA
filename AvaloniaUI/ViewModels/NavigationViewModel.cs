using System;
using System.Collections.Generic;
using System.Linq;
using Core.Services;
using ReactiveUI;

namespace AvaloniaUI.ViewModels;

/// <summary>
/// Manages view switching and navigation state for the application.
/// Caches view models to preserve state when switching between views.
/// </summary>
public class NavigationViewModel : ViewModelBase
{
    private ViewModelBase? _currentView;
    private bool _isPaneOpen = true;
    private NavigationItem? _selectedItem;
    private string _currentViewTitle = "Home";

    private readonly Dictionary<string, ViewModelBase> _viewCache = new();
    private readonly List<NavigationItem> _navigationItems;
    private readonly SpecificationViewModel? _specificationViewModel;
    private readonly QuestionGenerator? _questionGenerator;

    public NavigationViewModel() : this(null, null) { }

    public NavigationViewModel(SpecificationViewModel? specificationViewModel, QuestionGenerator? questionGenerator)
    {
        _specificationViewModel = specificationViewModel;
        _questionGenerator = questionGenerator;

        _navigationItems = new List<NavigationItem>
        {
            new("Home", "\uE80F", "Home"),
            new("Mental Practice", "\uE945", "MentalPractice"),
            new("Focused Practice", "\uE8FD", "FocusedPractice"),
            new("Question Bank", "\uE8F1", "QuestionBank"),
            new("Progress", "\uE9D9", "Progress"),
            new("Settings", "\uE713", "Settings"),
        };

        NavigateCommand = ReactiveCommand.Create<string>(Navigate);

        // Navigate to Home by default
        Navigate("Home");
    }

    /// <summary>
    /// The currently active view model displayed in the content area.
    /// </summary>
    public ViewModelBase? CurrentView
    {
        get => _currentView;
        set => this.RaiseAndSetIfChanged(ref _currentView, value);
    }

    /// <summary>
    /// Whether the navigation pane is currently open.
    /// </summary>
    public bool IsPaneOpen
    {
        get => _isPaneOpen;
        set => this.RaiseAndSetIfChanged(ref _isPaneOpen, value);
    }

    /// <summary>
    /// The currently selected navigation item.
    /// </summary>
    public NavigationItem? SelectedItem
    {
        get => _selectedItem;
        set => this.RaiseAndSetIfChanged(ref _selectedItem, value);
    }

    /// <summary>
    /// The title of the currently displayed view.
    /// </summary>
    public string CurrentViewTitle
    {
        get => _currentViewTitle;
        set => this.RaiseAndSetIfChanged(ref _currentViewTitle, value);
    }

    /// <summary>
    /// The list of available navigation items.
    /// </summary>
    public IReadOnlyList<NavigationItem> NavigationItems => _navigationItems;

    /// <summary>
    /// Command to navigate to a view by its key.
    /// </summary>
    public ReactiveCommand<string, System.Reactive.Unit> NavigateCommand { get; }

    /// <summary>
    /// Navigates to the specified view key, creating and caching the view model if needed.
    /// </summary>
    public void Navigate(string viewKey)
    {
        if (!_viewCache.TryGetValue(viewKey, out var vm))
        {
            vm = CreateViewModel(viewKey);
            _viewCache[viewKey] = vm;
        }

        CurrentView = vm;
        SelectedItem = _navigationItems.FirstOrDefault(i => i.ViewKey == viewKey);
        CurrentViewTitle = SelectedItem?.Label ?? viewKey;
    }

    private ViewModelBase CreateViewModel(string viewKey)
    {
        return viewKey switch
        {
            "Home" => new HomeViewModel(),
            "MentalPractice" => new MentalPracticeViewModel(),
            "FocusedPractice" => new FocusedPracticeViewModel(_specificationViewModel!, _questionGenerator!),
            "QuestionBank" => new QuestionBankViewModel(_specificationViewModel!),
            "Progress" => new ProgressViewModel(),
            "Settings" => new SettingsViewModel(),
            _ => throw new ArgumentException($"Unknown view key: {viewKey}", nameof(viewKey))
        };
    }
}
