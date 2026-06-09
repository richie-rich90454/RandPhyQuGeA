using ReactiveUI;
using System.Reactive;

namespace AvaloniaUI.ViewModels;

public class SettingsViewModel : ViewModelBase
{
    private string _title = "Settings";
    private int _selectedThemeIndex;

    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }

    public int SelectedThemeIndex
    {
        get => _selectedThemeIndex;
        set => this.RaiseAndSetIfChanged(ref _selectedThemeIndex, value);
    }

    public ReactiveCommand<int, Unit> SwitchThemeCommand { get; }

    public SettingsViewModel()
    {
        _selectedThemeIndex = (int)App.CurrentTheme;

        SwitchThemeCommand = ReactiveCommand.Create<int>(themeIndex =>
        {
            App.SwitchTheme((AppTheme)themeIndex);
        });
    }
}
