using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using Avalonia.VisualTree;
using AvaloniaUI.ViewModels;
using Core.Domain;

namespace AvaloniaUI.Views;

public partial class FocusedPracticeView : UserControl
{
    private static readonly string[] ChoiceLetters = { "A", "B", "C", "D", "E", "F", "G", "H" };

    public FocusedPracticeView()
    {
        InitializeComponent();

        var combo = this.FindControl<ComboBox>("QuestionCountCombo");
        if (combo is not null)
        {
            combo.SelectionChanged += OnQuestionCountChanged;
        }
    }

    private void OnQuestionCountChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && sender is ComboBox combo)
        {
            var index = combo.SelectedIndex;
            vm.QuestionCount = index switch
            {
                0 => 5,
                1 => 10,
                2 => 15,
                3 => 20,
                4 => 0, // All
                _ => 10
            };
        }
    }

    private void OnQuestionTypeMCClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "MC";
            UpdateQuestionTypeButtons("MC");
        }
    }

    private void OnQuestionTypeSAClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "SA";
            UpdateQuestionTypeButtons("SA");
        }
    }

    private void OnQuestionTypeMixedClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm)
        {
            vm.QuestionType = "Mixed";
            UpdateQuestionTypeButtons("Mixed");
        }
    }

    private void UpdateQuestionTypeButtons(string selected)
    {
        var mcBtn = this.FindControl<Button>("BtnTypeMC");
        var saBtn = this.FindControl<Button>("BtnTypeSA");
        var mixedBtn = this.FindControl<Button>("BtnTypeMixed");

        var app = Application.Current;
        if (app is null) return;

        var activeBrush = app.FindResource("BadgeMCBrush") as IBrush;
        var inactiveBrush = app.FindResource("Neutral10Brush") as IBrush;
        var activeFg = app.FindResource("TextOnPrimaryBrush") as IBrush;
        var inactiveFg = app.FindResource("TextPrimaryBrush") as IBrush;

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

    // ─── MC Answer Selection ─────────────────────────────────────────

    private void OnMcChoiceClick(object? sender, PointerPressedEventArgs e)
    {
        if (DataContext is not FocusedPracticeViewModel vm) return;
        if (vm.IsAnswerSubmitted) return;

        if (sender is Border border)
        {
            var itemsControl = border.FindAncestorOfType<ItemsControl>();
            if (itemsControl is not null)
            {
                var index = itemsControl.IndexFromContainer(border);
                if (index >= 0 && vm.CurrentQuestion?.Choices is { Count: > 0 } && index < vm.CurrentQuestion.Choices.Count)
                {
                    var choice = vm.CurrentQuestion.Choices[index];
                    vm.SelectedAnswer = choice;
                }
            }
        }
    }

    private void OnMcConfirmClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute();
        }
    }

    // ─── SA Answer Submission ─────────────────────────────────────────

    private void OnSaAnswerKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute();
            e.Handled = true;
        }
    }

    private void OnSaSubmitClick(object? sender, RoutedEventArgs e)
    {
        if (DataContext is FocusedPracticeViewModel vm && !vm.IsAnswerSubmitted)
        {
            vm.SubmitAnswerCommand.Execute();
        }
    }
}
