using Avalonia.Controls;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class SettingsView : UserControl
{
    public SettingsView()
    {
        InitializeComponent();
    }

    // ─── Theme Click Handlers ──────────────────────────────────────────

    private void OnLightThemeClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.ToggleThemeCommand.Execute(AppTheme.Light);
        }
    }

    private void OnDarkThemeClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.ToggleThemeCommand.Execute(AppTheme.Dark);
        }
    }

    private void OnSystemThemeClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.ToggleThemeCommand.Execute(AppTheme.System);
        }
    }

    // ─── Question Count Click Handlers ─────────────────────────────────

    private void OnQuestionCount5Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionCount = 5;
            UpdateCountButtonStyles(5);
            vm.SaveSettings();
        }
    }

    private void OnQuestionCount10Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionCount = 10;
            UpdateCountButtonStyles(10);
            vm.SaveSettings();
        }
    }

    private void OnQuestionCount15Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionCount = 15;
            UpdateCountButtonStyles(15);
            vm.SaveSettings();
        }
    }

    private void OnQuestionCount20Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionCount = 20;
            UpdateCountButtonStyles(20);
            vm.SaveSettings();
        }
    }

    private void UpdateCountButtonStyles(int selected)
    {
        var btn5 = this.FindControl<Button>("BtnCount5");
        var btn10 = this.FindControl<Button>("BtnCount10");
        var btn15 = this.FindControl<Button>("BtnCount15");
        var btn20 = this.FindControl<Button>("BtnCount20");

        void Style(Button btn, bool isActive)
        {
            btn.Classes.Remove("selected");
            btn.Classes.Remove("secondary");
            if (isActive)
                btn.Classes.Add("selected");
            else
                btn.Classes.Add("secondary");
        }

        if (btn5 is not null) Style(btn5, selected == 5);
        if (btn10 is not null) Style(btn10, selected == 10);
        if (btn15 is not null) Style(btn15, selected == 15);
        if (btn20 is not null) Style(btn20, selected == 20);
    }

    // ─── Question Type Click Handlers ──────────────────────────────────

    private void OnTypeMCClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionType = "MC";
            UpdateQuestionTypeButtons("MC");
            vm.SaveSettings();
        }
    }

    private void OnTypeSAClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionType = "SA";
            UpdateQuestionTypeButtons("SA");
            vm.SaveSettings();
        }
    }

    private void OnTypeMixedClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.DefaultQuestionType = "Mixed";
            UpdateQuestionTypeButtons("Mixed");
            vm.SaveSettings();
        }
    }

    private void UpdateQuestionTypeButtons(string selected)
    {
        var mcBtn = this.FindControl<Button>("BtnTypeMC");
        var saBtn = this.FindControl<Button>("BtnTypeSA");
        var mixedBtn = this.FindControl<Button>("BtnTypeMixed");

        if (mcBtn is not null)
        {
            mcBtn.Classes.Remove("type-selected");
            mcBtn.Classes.Remove("secondary");
            if (selected == "MC") mcBtn.Classes.Add("type-selected");
            else mcBtn.Classes.Add("secondary");
        }
        if (saBtn is not null)
        {
            saBtn.Classes.Remove("type-selected");
            saBtn.Classes.Remove("secondary");
            if (selected == "SA") saBtn.Classes.Add("type-selected");
            else saBtn.Classes.Add("secondary");
        }
        if (mixedBtn is not null)
        {
            mixedBtn.Classes.Remove("type-selected");
            mixedBtn.Classes.Remove("secondary");
            if (selected == "Mixed") mixedBtn.Classes.Add("type-selected");
            else mixedBtn.Classes.Add("secondary");
        }
    }
}
