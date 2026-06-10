using System;
using System.Linq;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using AvaloniaUI.ViewModels;

namespace AvaloniaUI.Views;

public partial class MentalPracticeView : UserControl
{
    public MentalPracticeView()
    {
        InitializeComponent();
        KeyDown += OnKeyDown;
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
                vm.AnswerCommand.Execute(index.ToString()).Subscribe(_ => { });
                e.Handled = true;
                return;
            }
        }

        // Enter for SA answer submission
        if (e.Key == Key.Enter && !vm.IsMultipleChoice)
        {
            if (!string.IsNullOrWhiteSpace(vm.CurrentAnswer))
            {
                vm.AnswerCommand.Execute(vm.CurrentAnswer).Subscribe(_ => { });
                e.Handled = true;
            }
        }
    }

    protected override void OnGotFocus(GotFocusEventArgs e)
    {
        base.OnGotFocus(e);
        Focus();
    }
}
