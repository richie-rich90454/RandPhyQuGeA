using ReactiveUI;

namespace AvaloniaUI.ViewModels;

/// <summary>
/// Manages view switching and navigation state for the application.
/// </summary>
public class NavigationViewModel : ReactiveObject
{
    private ViewModelBase? _currentView;
    private bool _isPaneOpen = true;

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
}
