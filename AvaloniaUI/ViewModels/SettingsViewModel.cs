using System;
using System.IO;
using System.Reactive;
using System.Text.Json;
using ReactiveUI;

namespace AvaloniaUI.ViewModels;

public class SettingsViewModel : ViewModelBase
{
    private static readonly string SettingsFilePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "PhysicsQG", "settings.json");

    private AppTheme _selectedTheme = AppTheme.System;
    private int _defaultQuestionCount = 10;
    private int _defaultMinDifficulty = 1;
    private int _defaultMaxDifficulty = 10;
    private string _defaultQuestionType = "Mixed";
    private bool _isSoundEnabled = true;
    private bool _isTimerVisible = true;
    private bool _isResetConfirmationVisible;

    public SettingsViewModel()
    {
        LoadSettings();

        ToggleThemeCommand = ReactiveCommand.Create<AppTheme>(OnToggleTheme);
        ResetSettingsCommand = ReactiveCommand.Create(OnResetSettings);
        ConfirmResetCommand = ReactiveCommand.Create(OnConfirmReset);
        CancelResetCommand = ReactiveCommand.Create(OnCancelReset);
    }

    // ─── Theme Properties ──────────────────────────────────────────────

    public AppTheme SelectedTheme
    {
        get => _selectedTheme;
        set
        {
            this.RaiseAndSetIfChanged(ref _selectedTheme, value);
            this.RaisePropertyChanged(nameof(IsLightSelected));
            this.RaisePropertyChanged(nameof(IsDarkSelected));
            this.RaisePropertyChanged(nameof(IsSystemSelected));
        }
    }

    public bool IsLightSelected
    {
        get => SelectedTheme == AppTheme.Light;
        set { if (value) SelectedTheme = AppTheme.Light; }
    }

    public bool IsDarkSelected
    {
        get => SelectedTheme == AppTheme.Dark;
        set { if (value) SelectedTheme = AppTheme.Dark; }
    }

    public bool IsSystemSelected
    {
        get => SelectedTheme == AppTheme.System;
        set { if (value) SelectedTheme = AppTheme.System; }
    }

    // ─── Practice Default Properties ───────────────────────────────────

    public int DefaultQuestionCount
    {
        get => _defaultQuestionCount;
        set => this.RaiseAndSetIfChanged(ref _defaultQuestionCount, value);
    }

    public int DefaultMinDifficulty
    {
        get => _defaultMinDifficulty;
        set => this.RaiseAndSetIfChanged(ref _defaultMinDifficulty, value);
    }

    public int DefaultMaxDifficulty
    {
        get => _defaultMaxDifficulty;
        set => this.RaiseAndSetIfChanged(ref _defaultMaxDifficulty, value);
    }

    public string DefaultQuestionType
    {
        get => _defaultQuestionType;
        set
        {
            this.RaiseAndSetIfChanged(ref _defaultQuestionType, value);
            this.RaisePropertyChanged(nameof(IsMcType));
            this.RaisePropertyChanged(nameof(IsSaType));
            this.RaisePropertyChanged(nameof(IsMixedType));
        }
    }

    public bool IsMcType
    {
        get => DefaultQuestionType == "MC";
        set { if (value) DefaultQuestionType = "MC"; }
    }

    public bool IsSaType
    {
        get => DefaultQuestionType == "SA";
        set { if (value) DefaultQuestionType = "SA"; }
    }

    public bool IsMixedType
    {
        get => DefaultQuestionType == "Mixed";
        set { if (value) DefaultQuestionType = "Mixed"; }
    }

    // ─── UI Preferences ────────────────────────────────────────────────

    public bool IsSoundEnabled
    {
        get => _isSoundEnabled;
        set => this.RaiseAndSetIfChanged(ref _isSoundEnabled, value);
    }

    public bool IsTimerVisible
    {
        get => _isTimerVisible;
        set => this.RaiseAndSetIfChanged(ref _isTimerVisible, value);
    }

    // ─── Reset Confirmation ────────────────────────────────────────────

    public bool IsResetConfirmationVisible
    {
        get => _isResetConfirmationVisible;
        set => this.RaiseAndSetIfChanged(ref _isResetConfirmationVisible, value);
    }

    // ─── Commands ──────────────────────────────────────────────────────

    public ReactiveCommand<AppTheme, Unit> ToggleThemeCommand { get; }
    public ReactiveCommand<Unit, Unit> ResetSettingsCommand { get; }
    public ReactiveCommand<Unit, Unit> ConfirmResetCommand { get; }
    public ReactiveCommand<Unit, Unit> CancelResetCommand { get; }

    // ─── Command Handlers ──────────────────────────────────────────────

    private void OnToggleTheme(AppTheme theme)
    {
        SelectedTheme = theme;
        App.SwitchTheme(theme);
        SaveSettings();
    }

    private void OnResetSettings()
    {
        IsResetConfirmationVisible = true;
    }

    private void OnConfirmReset()
    {
        IsResetConfirmationVisible = false;
        SelectedTheme = AppTheme.System;
        DefaultQuestionCount = 10;
        DefaultMinDifficulty = 1;
        DefaultMaxDifficulty = 10;
        DefaultQuestionType = "Mixed";
        IsSoundEnabled = true;
        IsTimerVisible = true;

        App.SwitchTheme(AppTheme.System);
        SaveSettings();
    }

    private void OnCancelReset()
    {
        IsResetConfirmationVisible = false;
    }

    // ─── Persistence ───────────────────────────────────────────────────

    public void SaveSettings()
    {
        try
        {
            var dir = Path.GetDirectoryName(SettingsFilePath);
            if (dir is not null && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var data = new SettingsData
            {
                SelectedTheme = (int)SelectedTheme,
                DefaultQuestionCount = DefaultQuestionCount,
                DefaultMinDifficulty = DefaultMinDifficulty,
                DefaultMaxDifficulty = DefaultMaxDifficulty,
                DefaultQuestionType = DefaultQuestionType,
                IsSoundEnabled = IsSoundEnabled,
                IsTimerVisible = IsTimerVisible
            };

            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(SettingsFilePath, json);
        }
        catch
        {
            // Silently fail — settings are not critical
        }
    }

    private void LoadSettings()
    {
        try
        {
            if (!File.Exists(SettingsFilePath)) return;

            var json = File.ReadAllText(SettingsFilePath);
            var data = JsonSerializer.Deserialize<SettingsData>(json);
            if (data is null) return;

            SelectedTheme = (AppTheme)data.SelectedTheme;
            DefaultQuestionCount = data.DefaultQuestionCount;
            DefaultMinDifficulty = data.DefaultMinDifficulty;
            DefaultMaxDifficulty = data.DefaultMaxDifficulty;
            DefaultQuestionType = data.DefaultQuestionType;
            IsSoundEnabled = data.IsSoundEnabled;
            IsTimerVisible = data.IsTimerVisible;

            // Apply loaded theme
            App.SwitchTheme(SelectedTheme);
        }
        catch
        {
            // Use defaults if loading fails
        }
    }

    private class SettingsData
    {
        public int SelectedTheme { get; set; } = (int)AppTheme.System;
        public int DefaultQuestionCount { get; set; } = 10;
        public int DefaultMinDifficulty { get; set; } = 1;
        public int DefaultMaxDifficulty { get; set; } = 10;
        public string DefaultQuestionType { get; set; } = "Mixed";
        public bool IsSoundEnabled { get; set; } = true;
        public bool IsTimerVisible { get; set; } = true;
    }
}
