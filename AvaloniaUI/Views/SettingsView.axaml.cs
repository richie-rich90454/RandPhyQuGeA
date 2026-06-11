using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class SettingsView : UserControl
{
    public SettingsView()
    {
        InitializeComponent();
    }

    // ─── Theme Click Handlers ──────────────────────────────────────────

    private void OnLightThemeClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.ToggleThemeCommand.Execute(AppTheme.Light);
        }
    }

    private void OnDarkThemeClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm)
        {
            vm.ToggleThemeCommand.Execute(AppTheme.Dark);
        }
    }

    private void OnSystemThemeClick(object? sender, PointerPressedEventArgs e)
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
        var app = Application.Current;
        if (app is null) return;

        var selectedBrush = app.FindResource("PrimarySubtleBrush") as IBrush;
        var normalBrush = app.FindResource("Neutral10Brush") as IBrush;
        var selectedFg = app.FindResource("PrimaryBrush") as IBrush;
        var normalFg = app.FindResource("TextPrimaryBrush") as IBrush;

        void Style(Button btn, bool isActive)
        {
            if (isActive)
            {
                btn.Background = selectedBrush;
                btn.Foreground = selectedFg;
                btn.FontWeight = FontWeight.SemiBold;
            }
            else
            {
                btn.Background = normalBrush;
                btn.Foreground = normalFg;
                btn.FontWeight = FontWeight.Normal;
            }
        }

        var btn5 = this.FindControl<Button>("BtnCount5");
        var btn10 = this.FindControl<Button>("BtnCount10");
        var btn15 = this.FindControl<Button>("BtnCount15");
        var btn20 = this.FindControl<Button>("BtnCount20");

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
        var app = Application.Current;
        if (app is null) return;

        var activeBrush = app.FindResource("BadgeMCBrush") as IBrush;
        var inactiveBrush = app.FindResource("Neutral10Brush") as IBrush;
        var activeFg = app.FindResource("TextOnPrimaryBrush") as IBrush;
        var inactiveFg = app.FindResource("TextPrimaryBrush") as IBrush;

        var mcBtn = this.FindControl<Button>("BtnTypeMC");
        var saBtn = this.FindControl<Button>("BtnTypeSA");
        var mixedBtn = this.FindControl<Button>("BtnTypeMixed");

        if (mcBtn is not null)
        {
            mcBtn.Background = selected == "MC" ? activeBrush : inactiveBrush;
            mcBtn.Foreground = selected == "MC" ? activeFg : inactiveFg;
            mcBtn.FontWeight = selected == "MC" ? FontWeight.SemiBold : FontWeight.Normal;
        }
        if (saBtn is not null)
        {
            saBtn.Background = selected == "SA" ? activeBrush : inactiveBrush;
            saBtn.Foreground = selected == "SA" ? activeFg : inactiveFg;
            saBtn.FontWeight = selected == "SA" ? FontWeight.SemiBold : FontWeight.Normal;
        }
        if (mixedBtn is not null)
        {
            mixedBtn.Background = selected == "Mixed" ? activeBrush : inactiveBrush;
            mixedBtn.Foreground = selected == "Mixed" ? activeFg : inactiveFg;
            mixedBtn.FontWeight = selected == "Mixed" ? FontWeight.SemiBold : FontWeight.Normal;
        }
    }
}
