using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.VisualTree;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class MentalPracticeView : UserControl
{
    public MentalPracticeView()
    {
        InitializeComponent();
        KeyDown += OnKeyDown;

        var btn10 = this.FindControl<Button>("BtnCount10");
        var btn20 = this.FindControl<Button>("BtnCount20");
        var btn30 = this.FindControl<Button>("BtnCount30");
        var btnEndless = this.FindControl<Button>("BtnCountEndless");

        if (btn10 is not null) btn10.Click += SelectQuestionCount10;
        if (btn20 is not null) btn20.Click += SelectQuestionCount20;
        if (btn30 is not null) btn30.Click += SelectQuestionCount30;
        if (btnEndless is not null) btnEndless.Click += SelectEndlessMode;
    }

    private void OnKeyDown(object? sender, KeyEventArgs e)
    {
        if (DataContext is not MentalPracticeViewModel vm) return;
        if (!vm.IsInPractice) return;

        // Number keys 1-4 for MC answer selection
        if (vm.IsMultipleChoice && vm.Choices is { Count: > 0 })
        {
            var index = e.Key switch
            {
                Key.D1 or Key.NumPad1 => 0,
                Key.D2 or Key.NumPad2 => 1,
                Key.D3 or Key.NumPad3 => 2,
                Key.D4 or Key.NumPad4 => 3,
                _ => -1
            };

            if (index >= 0 && index < vm.Choices.Count)
            {
                vm.AnswerCommand.Execute(index.ToString());
                e.Handled = true;
                return;
            }
        }

        // Enter for SA answer submission
        if (e.Key == Key.Enter && !vm.IsMultipleChoice)
        {
            if (!string.IsNullOrWhiteSpace(vm.CurrentAnswer))
            {
                vm.AnswerCommand.Execute(vm.CurrentAnswer);
                e.Handled = true;
            }
        }
    }

    private void OnSaAnswerKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && DataContext is MentalPracticeViewModel vm && !vm.IsMultipleChoice)
        {
            if (!string.IsNullOrWhiteSpace(vm.CurrentAnswer))
            {
                vm.AnswerCommand.Execute(vm.CurrentAnswer);
                e.Handled = true;
            }
        }
    }

    private void OnChoiceClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is not MentalPracticeViewModel vm) return;
        if (!vm.IsInPractice || !vm.IsMultipleChoice) return;

        // Find the index of the clicked choice
        if (sender is Border border)
        {
            var itemsControl = border.FindAncestorOfType<ItemsControl>();
            if (itemsControl is not null)
            {
                var index = itemsControl.IndexFromContainer(border);
                if (index >= 0 && index < vm.Choices.Count)
                {
                    vm.AnswerCommand.Execute(index.ToString());
                }
            }
        }
    }

    // Question count selector handlers
    private void SelectQuestionCount10(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MentalPracticeViewModel vm)
        {
            vm.SelectedQuestionCount = 10;
            vm.IsEndlessMode = false;
            UpdateCountButtonStyles(10);
        }
    }

    private void SelectQuestionCount20(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MentalPracticeViewModel vm)
        {
            vm.SelectedQuestionCount = 20;
            vm.IsEndlessMode = false;
            UpdateCountButtonStyles(20);
        }
    }

    private void SelectQuestionCount30(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MentalPracticeViewModel vm)
        {
            vm.SelectedQuestionCount = 30;
            vm.IsEndlessMode = false;
            UpdateCountButtonStyles(30);
        }
    }

    private void SelectEndlessMode(object? sender, RoutedEventArgs e)
    {
        if (DataContext is MentalPracticeViewModel vm)
        {
            vm.IsEndlessMode = true;
            UpdateCountButtonStyles(-1);
        }
    }

    private void UpdateCountButtonStyles(int selected)
    {
        var app = Application.Current;
        if (app is null) return;

        var selectedBrush = app.FindResource("PrimarySubtleBrush") as Avalonia.Media.IBrush;
        var normalBrush = app.FindResource("Neutral10Brush") as Avalonia.Media.IBrush;
        var selectedForeground = app.FindResource("PrimaryBrush") as Avalonia.Media.IBrush;
        var normalForeground = app.FindResource("TextPrimaryBrush") as Avalonia.Media.IBrush;

        void Style(Button btn, bool isSelected)
        {
            if (isSelected)
            {
                btn.Background = selectedBrush as Avalonia.Media.IBrush;
                btn.Foreground = selectedForeground as Avalonia.Media.IBrush;
                btn.FontWeight = Avalonia.Media.FontWeight.SemiBold;
            }
            else
            {
                btn.Background = normalBrush as Avalonia.Media.IBrush;
                btn.Foreground = normalForeground as Avalonia.Media.IBrush;
                btn.FontWeight = Avalonia.Media.FontWeight.Normal;
            }
        }

        var btn10 = this.FindControl<Button>("BtnCount10");
        var btn20 = this.FindControl<Button>("BtnCount20");
        var btn30 = this.FindControl<Button>("BtnCount30");
        var btnEndless = this.FindControl<Button>("BtnCountEndless");

        if (btn10 is not null) Style(btn10, selected == 10);
        if (btn20 is not null) Style(btn20, selected == 20);
        if (btn30 is not null) Style(btn30, selected == 30);
        if (btnEndless is not null) Style(btnEndless, selected == -1);
    }

    protected override void OnGotFocus(GotFocusEventArgs e)
    {
        base.OnGotFocus(e);
        Focus();
    }
}
